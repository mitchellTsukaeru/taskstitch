import { FileUp, Maximize2, Search, Settings, Video } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { browser, i18n } from '#imports';
import { CaptureState } from '@/core/capture/machine';
import type { GuideMeSession } from '@/core/guideme/session';
import { SESSION_KEY } from '@/core/guideme/session';
import {
  createTab,
  focusWindow,
  getActiveTab,
  getExtensionURL,
  queryTabs,
  requestHostPermissions,
  updateTab,
} from '@/lib/browser-api';
import { logger } from '@/lib/logger';
import { sendMessage } from '@/lib/messaging';
import { connectToBackground } from '@/lib/port';
import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import MascotIcon from '@/ui/fullview/components/MascotIcon';
import { ImportGuideDialog } from '@/ui/shared/ImportGuideDialog';
import SettingsView from '@/ui/shared/SettingsView';
import { TaskStitchDropTarget } from '@/ui/shared/TaskStitchDropTarget';
import GuideEditor from './GuideEditor';
import GuideMeCompletion from './GuideMeCompletion';
import GuideMeView from './GuideMeView';
import LibraryView from './LibraryView';
import RecordingView from './RecordingView';

type View =
  | { name: 'library' }
  | { name: 'editor'; guideId: string }
  | { name: 'recording'; guideId: string }
  | { name: 'settings' }
  | { name: 'guideme'; guideId: string }
  | { name: 'guideme-done'; guideId: string };

export default function App() {
  const [isAlive, setIsAlive] = useState(false);
  const [_isRecording, setIsRecording] = useState(false);
  const [captureState, setCaptureState] = useState<(typeof CaptureState)[keyof typeof CaptureState]>(CaptureState.IDLE);
  const [view, setView] = useState<View>({ name: 'library' });
  const [search, setSearch] = useState('');
  const [startError, setStartError] = useState('');
  const [importFile, setImportFile] = useState<File>();
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const disconnect = connectToBackground({
      onConnect: () => setIsAlive(true),
      onDisconnect: () => setIsAlive(false),
      onStateUpdate: (update) => {
        setCaptureState(update.state);
        if (update.state === CaptureState.RECORDING || update.state === CaptureState.PAUSED) {
          setIsRecording(true);
          if (update.currentGuideId) setView({ name: 'recording', guideId: update.currentGuideId });
        } else {
          setIsRecording(false);
        }
      },
    });

    return disconnect;
  }, []);

  useEffect(() => {
    browser.storage.local.get([SESSION_KEY]).then((data: Record<string, unknown>) => {
      const session = data[SESSION_KEY] as GuideMeSession | null;
      if (session?.active) {
        setView({ name: 'guideme', guideId: session.guideId });
      }
    });

    const handler = (changes: Record<string, { newValue?: unknown }>) => {
      if (!changes[SESSION_KEY]) return;
      const session = changes[SESSION_KEY].newValue as GuideMeSession | null;
      if (session?.active) {
        setView({ name: 'guideme', guideId: session.guideId });
      }
    };

    browser.storage.local.onChanged.addListener(handler);
    return () => browser.storage.local.onChanged.removeListener(handler);
  }, []);

  const handleStartRecording = useCallback(async () => {
    setStartError('');
    const tab = await getActiveTab();
    const url = tab?.url || '';
    if (!/^https?:\/\//.test(url)) {
      setStartError(i18n.t('recording.unsupportedPage'));
      return;
    }
    const permissionsPromise = requestHostPermissions();
    const granted = await permissionsPromise;
    if (!granted) {
      logger.warn('Host permissions not granted, cannot start recording');
      return;
    }
    try {
      const res = await sendMessage('startRecording', { url });
      if (res.guideId) {
        setIsRecording(true);
        setView({ name: 'recording', guideId: res.guideId });
      }
    } catch (err) {
      logger.error(' START_RECORDING error', err);
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      const res = await sendMessage('stopRecording', undefined);
      if (res.success) {
        setIsRecording(false);
        setView({ name: 'library' });
        if (res.guideId) {
          const url = getExtensionURL(`/fullview.html?guideId=${res.guideId}`);
          const tabs = await queryTabs({ url: getExtensionURL('/fullview.html') });
          if (tabs.length > 0 && tabs[0].id) {
            await updateTab(tabs[0].id, { active: true, url });
            if (tabs[0].windowId) await focusWindow(tabs[0].windowId);
          } else {
            await createTab({ url });
          }
        }
      }
    } catch (err) {
      logger.error(' STOP_RECORDING error', err);
    }
  }, []);

  const handleOpenTaskStitch = useCallback(async () => {
    const url = getExtensionURL('/fullview.html');
    const tabs = await queryTabs({ url });
    if (tabs.length > 0 && tabs[0].id) {
      await updateTab(tabs[0].id, { active: true, url });
      if (tabs[0].windowId) await focusWindow(tabs[0].windowId);
    } else {
      await createTab({ url });
    }
  }, []);

  if (view.name === 'recording') {
    return (
      <RecordingView
        guideId={view.guideId}
        paused={captureState === CaptureState.PAUSED}
        onPause={() => sendMessage('pauseRecording', undefined)}
        onResume={() => sendMessage('resumeRecording', undefined)}
        onStop={handleStopRecording}
      />
    );
  }

  if (view.name === 'guideme') {
    return (
      <GuideMeView
        guideId={view.guideId}
        onExit={() => {
          sendMessage('guideMeCancel', undefined).catch(() => {});
          setView({ name: 'library' });
        }}
        onComplete={(id) => setView({ name: 'guideme-done', guideId: id })}
      />
    );
  }

  if (view.name === 'guideme-done') {
    return (
      <GuideMeCompletion
        guideId={view.guideId}
        onDone={() => setView({ name: 'library' })}
        onRunAgain={(id) => setView({ name: 'guideme', guideId: id })}
      />
    );
  }

  if (view.name === 'editor') {
    return (
      <GuideEditor
        guideId={view.guideId}
        onBack={() => setView({ name: 'library' })}
        onGuideMe={(id) => setView({ name: 'guideme', guideId: id })}
      />
    );
  }

  if (view.name === 'settings') {
    return <SettingsView onBack={() => setView({ name: 'library' })} />;
  }

  return (
    <TaskStitchDropTarget className="relative min-h-screen bg-card flex flex-col" onFile={setImportFile}>
      {importFile && (
        <ImportGuideDialog
          file={importFile}
          onClose={() => setImportFile(undefined)}
          onImported={(guideId, started) => {
            setImportFile(undefined);
            setView({ name: started ? 'guideme' : 'editor', guideId });
          }}
        />
      )}
      {/* Header */}
      <div className="relative overflow-hidden px-6 pt-6 pb-7 bg-gradient-to-br from-violet to-violet-light">
        <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full opacity-15 blur-[40px] bg-gradient-to-br from-lavender to-white" />

        <div className="relative flex items-center justify-between mb-6">
          <span className="text-[17px] font-bold tracking-tight text-foreground">{i18n.t('app.name')}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${isAlive ? 'text-foreground bg-white/30' : 'text-deep/50 bg-white/15'}`}
            >
              {isAlive ? i18n.t('sidepanel.connected') : i18n.t('sidepanel.connecting')}
            </span>
            <button
              onClick={() => setView({ name: 'settings' })}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-white/20 transition-colors"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        <div className="relative text-center mb-5">
          <div className="flex justify-center mb-2">
            <MascotIcon size={44} />
          </div>
          <h3 className="text-base font-medium text-foreground">{i18n.t('sidepanel.heroTitle')}</h3>
          <p className="text-xs mt-1 text-violet-dark">{i18n.t('sidepanel.heroSubtitle')}</p>
        </div>

        <Button
          onClick={handleStartRecording}
          disabled={!isAlive}
          className="w-full py-3 px-4 h-auto rounded-lg font-semibold text-sm hover:-translate-y-px shadow-lg"
        >
          <Video size={18} />
          {i18n.t('sidepanel.startCapture')}
        </Button>
        {startError && <p className="mt-2 text-center text-[11px] font-medium text-destructive">{startError}</p>}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pt-5">
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple" />
          <Input
            type="text"
            placeholder={i18n.t('sidepanel.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 rounded-xl border-border bg-card !text-[13px]"
          />
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {i18n.t('sidepanel.recentLabel')}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-purple transition-colors hover:bg-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Import <FileUp size={12} />
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".taskstitch,application/vnd.taskstitch.guide+json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) setImportFile(file);
              }}
            />
            <button
              type="button"
              onClick={handleOpenTaskStitch}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-purple transition-colors hover:bg-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              title={i18n.t('library.openInFullView')}
            >
              {i18n.t('sidepanel.openTaskStitch')}
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        <LibraryView
          onOpen={(guideId) => setView({ name: 'editor', guideId })}
          isAlive={isAlive}
          searchQuery={search}
        />
      </div>
    </TaskStitchDropTarget>
  );
}
