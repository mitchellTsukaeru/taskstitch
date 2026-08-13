import { browser, defineBackground, i18n } from '#imports';
import { improveGuide } from '@/core/capture/ai/improve';
import { CaptureState } from '@/core/capture/machine';
import {
  advanceSession,
  cancelSession,
  completeSession,
  type GuideMeSession,
  getSession,
  startSession,
} from '@/core/guideme/session';
import { resolveGuideMeStep } from '@/core/guideme/urls';
import { createGuide, getGuide, getStepsForGuide, updateGuideDefaultTitle } from '@/core/guides/service';
import { registerTranslationRunner, retryTranslation, startTranslation } from '@/core/translation/runner';
import { getActiveTab, localStorage, sendMessageToTab, setSidePanelBehavior, updateTab } from '@/lib/browser-api';
import { logger } from '@/lib/logger';
import { onMessage } from '@/lib/messaging';
import { broadcastStateToPanel, setupPortListener } from '@/lib/port';
import { getActor, getStateUpdate, initActor, initActorFallback, waitUntilReady } from './actor';
import { registerNavigationListeners } from './navigation';
import { createRecordingControls } from './recording-controls';
import { handleCaptureStep, handleFinalizeInputStep, handleUpdateInputStep, prepareCapture } from './step-pipeline';
import {
  injectContentScript,
  isInjectableTab,
  showNotificationOnTab,
  startCaptureOnTab,
  stopCaptureOnTab,
} from './tab-manager';

async function generateTitleInBackground(guideId: string) {
  try {
    const steps = await getStepsForGuide(guideId);
    const domains = new Set<string>();
    for (const step of steps) {
      try {
        if (step.url) domains.add(new URL(step.url).hostname);
      } catch {}
    }
    const title =
      domains.size === 1
        ? i18n.t('background.guideOnDomain', [[...domains][0]])
        : domains.size > 1
          ? i18n.t('background.multiSiteGuide')
          : i18n.t('background.newGuide');
    await updateGuideDefaultTitle(guideId, title);
  } catch (err) {
    logger.error('Default guide title generation failed', err);
  }
}

const recordingControls = createRecordingControls({
  waitUntilReady,
  getActor,
  getActiveTab,
  createGuide,
  showNotificationOnTab,
  startCaptureOnTab,
  stopCaptureOnTab,
  generateTitle: generateTitleInBackground,
});

export default defineBackground(() => {
  logger.info('Background service worker started');

  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== 'install') return;
    if (import.meta.env.BROWSER === 'firefox') {
      // Firefox MV3 bug 1758306: the <all_urls> grant lands in the origin
      // store but is missed by _setupStartupPermissions when populating the
      // API-permission resolution table that captureVisibleTab consults.
      // Result: permissions.contains() returns true but captureVisibleTab
      // silently rejects. Removing the permission here forces a clean state
      // so the user-gesture permissions.request() in onboarding's "Get
      // Started" / sidepanel's "Start Recording" goes through the working
      // re-grant code path. Remove this when Mozilla ships:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1758306
      try {
        await browser.permissions.remove({ origins: ['<all_urls>'] });
      } catch (err) {
        logger.warn('Failed to clear stale host permission on install', err);
      }
    }
    browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
  });

  setSidePanelBehavior(true);
  if (import.meta.env.BROWSER === 'firefox') {
    browser.action.onClicked.addListener(() => {
      browser.sidebarAction.toggle();
    });
  }
  browser.commands.onCommand.addListener((command) => {
    recordingControls.handleCommand(command).catch((err) => {
      logger.error('Toggle recording shortcut failed', err);
    });
  });
  initActor().catch(initActorFallback);
  registerNavigationListeners();
  registerTranslationRunner();

  setupPortListener((port) => {
    logger.debug('Panel connected via port');
    waitUntilReady().then(() => {
      try {
        port.postMessage(getStateUpdate());
      } catch {}
    });

    port.onDisconnect.addListener(() => {
      getSession().then((session) => {
        if (session?.active) {
          cancelSession();
          logger.debug('Guide Me cancelled: sidepanel closed');
        }
      });
    });
  });

  waitUntilReady().then(async () => {
    getActor().subscribe(() => broadcastStateToPanel(getStateUpdate()));
    const restored = getActor().getSnapshot();
    if (restored.value !== CaptureState.RECORDING || !restored.context.currentGuideId) return;
    const activeTab = await getActiveTab();
    if (!activeTab?.id || !isInjectableTab(activeTab)) {
      getActor().send({ type: 'PAUSE_RECORDING' });
      return;
    }
    const captureToken = crypto.randomUUID();
    getActor().send({
      type: 'HANDOFF_TAB',
      url: activeTab.url,
      tabId: activeTab.id,
      captureToken,
    });
    const attached = await startCaptureOnTab(activeTab.id, restored.context.currentGuideId, captureToken);
    if (!attached) getActor().send({ type: 'PAUSE_RECORDING' });
  });

  onMessage('getState', async () => {
    await waitUntilReady();
    return getStateUpdate();
  });

  onMessage('startRecording', async ({ data }) => {
    const guideId = await recordingControls.start(data.url);
    return { guideId };
  });

  onMessage('stopRecording', async () => {
    const guideId = await recordingControls.stop();
    return { success: true, guideId };
  });

  onMessage('pauseRecording', async () => ({ paused: await recordingControls.pause() }));

  onMessage('resumeRecording', async () => recordingControls.resume());

  onMessage('improveGuide', async ({ data }) => {
    const settings = await localStorage.get(['aiApiKey', 'aiProvider', 'aiModel', 'aiBaseUrl', 'aiLanguage']);
    if (!settings.aiApiKey) {
      return { success: false, error: 'Configure an AI provider first', needsConfiguration: true };
    }
    const guideData = await getGuide(data.guideId);
    if (!guideData) return { success: false, error: 'Guide not found' };
    try {
      const proposal = await improveGuide(
        guideData.guide,
        guideData.steps,
        guideData.screenshots,
        {
          apiKey: settings.aiApiKey as string,
          provider: (settings.aiProvider as string) || 'openai',
          model: settings.aiModel as string | undefined,
          baseUrl: settings.aiBaseUrl as string | undefined,
          language: settings.aiLanguage as string | undefined,
        },
        data.includeScreenshots,
      );
      return { success: true, proposal };
    } catch (err) {
      logger.error('Improve guide failed', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'AI improvement failed',
        imageUnsupported: data.includeScreenshots,
      };
    }
  });

  onMessage('startTranslation', async ({ data }) => {
    const settings = await localStorage.get(['aiApiKey']);
    if (!settings.aiApiKey) {
      return { success: false, error: 'Configure an AI provider first', needsConfiguration: true };
    }
    try {
      const job = await startTranslation(data.guideId, data.targetLanguage);
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Starting guide translation failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Translation could not start' };
    }
  });

  onMessage('retryTranslation', async ({ data }) => {
    try {
      await retryTranslation(data.jobId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Translation could not resume' };
    }
  });

  onMessage('enterBlurMode', async () => {
    await waitUntilReady();
    const snapshot = getActor().getSnapshot();
    if (snapshot.context.activeTabId) await stopCaptureOnTab(snapshot.context.activeTabId);
    const activeTab = await getActiveTab();
    if (activeTab?.id) {
      sendMessageToTab(activeTab.id, { type: 'START_BLUR' }).catch(() => {});
    }
    return { entered: true };
  });

  onMessage('exitBlurMode', async () => {
    await waitUntilReady();
    await localStorage.set({ mimikBlurMode: false });
    const actor = getActor();
    const snapshot = actor.getSnapshot();
    if (snapshot.context.currentGuideId && snapshot.context.activeTabId && snapshot.context.captureToken) {
      await startCaptureOnTab(
        snapshot.context.activeTabId,
        snapshot.context.currentGuideId,
        snapshot.context.captureToken,
      );
    }
    return { exited: true };
  });

  onMessage('captureStep', async ({ data, sender }) => {
    await waitUntilReady();
    return handleCaptureStep(data, sender.tab?.id);
  });

  onMessage('prepareCapture', async ({ data }) => {
    await waitUntilReady();
    return { prepared: await prepareCapture(data.captureId) };
  });

  onMessage('updateInputStep', async ({ data }) => {
    await waitUntilReady();
    const snapshot = getActor().getSnapshot();
    if (snapshot.context.currentGuideId !== data.guideId || snapshot.context.captureToken !== data.captureToken) {
      return { updated: false };
    }
    await handleUpdateInputStep(data.stepId, data.description, data.inputValue);
    return { updated: true };
  });

  onMessage('finalizeInputStep', async ({ data }) => {
    await waitUntilReady();
    const snapshot = getActor().getSnapshot();
    if (snapshot.context.currentGuideId !== data.guideId || snapshot.context.captureToken !== data.captureToken) {
      return { updated: false };
    }
    await handleFinalizeInputStep(data.stepId, data.elementMeta, data.domContext);
    return { updated: true };
  });

  onMessage('startGuideMe', async ({ data }) => {
    const guideData = await getGuide(data.guideId);
    if (!guideData) return { started: false, error: 'Guide not found' };
    const impact = guideData.guide.impact ?? 'unknown';
    if (impact !== 'read_only' && !data.confirmedImpact) {
      return {
        started: false,
        error: 'Review this guide before starting',
        confirmationRequired: true,
        impact,
      };
    }
    const steps = guideData.steps;
    if (steps.length === 0) return { started: false, error: 'No steps' };

    const firstStep = resolveGuideMeStep(steps[0], guideData.guide.guideMeOrigins);

    const activeTab = await getActiveTab();
    await startSession(data.guideId, steps.length, firstStep);

    if (activeTab?.id && firstStep.url && firstStep.url !== activeTab.url) {
      await updateTab(activeTab.id, { url: firstStep.url });
    } else if (activeTab?.id && isInjectableTab(activeTab)) {
      // A tab opened before the extension was loaded may not have the content
      // script. Inject it when Guide Me starts on the current URL so the live
      // target can be found and highlighted immediately.
      await injectContentScript(activeTab.id);
    }

    return { started: true };
  });

  const advanceGuideMe = async (expectedStepIndex?: number) => {
    const sessionData = await localStorage.get(['guideMeSession']);
    const session = sessionData.guideMeSession as GuideMeSession | undefined;
    if (!session?.active) return { advanced: false };
    if (expectedStepIndex !== undefined && expectedStepIndex !== session.activeStepIndex) {
      return { advanced: false };
    }

    const guideData = await getGuide(session.guideId);
    if (!guideData) return { advanced: false };
    const steps = guideData.steps;
    const nextIndex = session.activeStepIndex + 1;

    if (nextIndex >= steps.length) {
      await completeSession();
      return { advanced: true, completed: true, activeStepIndex: nextIndex };
    }

    const nextStep = steps[nextIndex]
      ? resolveGuideMeStep(steps[nextIndex], guideData.guide.guideMeOrigins)
      : undefined;
    if (!nextStep) {
      await completeSession();
      return { advanced: true, completed: true, activeStepIndex: nextIndex };
    }
    await advanceSession(nextStep, nextIndex);

    const currentTab = await getActiveTab();
    if (currentTab?.id && nextStep.url && nextStep.url !== currentTab.url) {
      await updateTab(currentTab.id, { url: nextStep.url });
    }

    return { advanced: true, activeStepIndex: nextIndex };
  };

  onMessage('guideMeStepCompleted', async ({ data }) => {
    return advanceGuideMe(data.stepIndex);
  });

  onMessage('guideMeNext', async () => {
    return advanceGuideMe();
  });

  onMessage('guideMeCancel', async () => {
    await cancelSession();
    return { cancelled: true };
  });

  onMessage('guideMePrev', async ({ data }) => {
    if (data.stepIndex <= 0) return { moved: false };

    const sessionData = await localStorage.get(['guideMeSession']);
    const session = sessionData.guideMeSession as { guideId: string } | undefined;
    if (!session) return { moved: false };

    const guideData = await getGuide(session.guideId);
    if (!guideData) return { moved: false };
    const steps = guideData.steps;
    const prevIndex = data.stepIndex - 1;
    const prevStep = steps[prevIndex]
      ? resolveGuideMeStep(steps[prevIndex], guideData.guide.guideMeOrigins)
      : undefined;
    if (!prevStep) return { moved: false };
    await advanceSession(prevStep, prevIndex);

    const currentTab = await getActiveTab();
    if (currentTab?.id && prevStep.url && prevStep.url !== currentTab.url) {
      await updateTab(currentTab.id, { url: prevStep.url });
    }

    return { moved: true };
  });
});
