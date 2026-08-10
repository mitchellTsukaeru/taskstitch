import type { JSONContent } from '@tiptap/core';
import { Languages, Play, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { i18n } from '#imports';
import {
  deleteStep,
  getGuide,
  insertManualStep,
  onGuidesChanged,
  updateGuideTitle,
  updateScreenshotBlob,
  updateStepDescription,
  updateStepRichDescription,
} from '@/core/guides/service';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { openSidebar } from '@/lib/browser-api';
import { sendMessage } from '@/lib/messaging';
import { formatDate, getMostCommonDomain } from '@/lib/utils';
import { useFullview } from '@/stores/fullview';
import FaviconImg from '@/ui/shared/FaviconImg';
import { GuideImpactBadge, GuideImpactDialog } from '@/ui/shared/GuideImpact';
import { GuideMeStartDialog } from '@/ui/shared/GuideMeStartDialog';
import { ImproveGuideDialog } from '@/ui/shared/ImproveGuideDialog';
import { ManualStepDialog } from '@/ui/shared/ManualStepDialog';
import { TranslateGuideDialog } from '@/ui/shared/TranslateGuideDialog';
import BlurCanvas from '@/ui/sidepanel/BlurCanvas';
import GuideStepList from './components/GuideStepList';

interface GuideContentProps {
  guideId: string;
}

interface GuideData {
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

export default function GuideContent({ guideId }: GuideContentProps) {
  const { setGuideTitle, setGuideStepCount, setGuideExportData, guideImpactOpen, setGuideImpactOpen } = useFullview(
    (s) => ({
      setGuideTitle: s.setGuideTitle,
      setGuideStepCount: s.setGuideStepCount,
      setGuideExportData: s.setGuideExportData,
      guideImpactOpen: s.guideImpactOpen,
      setGuideImpactOpen: s.setGuideImpactOpen,
    }),
  );

  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [typingTitle, setTypingTitle] = useState<string | null>(null);
  const [blurringStepId, setBlurringStepId] = useState<string | null>(null);
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [improving, setImproving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [guideMeWarning, setGuideMeWarning] = useState(false);
  const titleRef = useRef('');

  const loadGuide = useCallback(async () => {
    const result = await getGuide(guideId);
    if (result) {
      setData(result);
      const newTitle = result.guide.title;
      const prev = titleRef.current;
      if (
        prev === i18n.t('fullview_untitledGuide') &&
        newTitle !== i18n.t('fullview_untitledGuide') &&
        result.steps.length > 0
      ) {
        setTypingTitle(newTitle);
      } else {
        titleRef.current = newTitle;
        setTitle(newTitle);
      }
      document.title = `${newTitle} — ${i18n.t('app_name')}`;
      setGuideTitle(newTitle);
      setGuideStepCount(result.steps.length);
      setGuideExportData({ guideId, ...result });
    }
    setLoading(false);
  }, [guideId, setGuideTitle, setGuideStepCount, setGuideExportData]);

  useEffect(() => {
    loadGuide();
    return onGuidesChanged(() => loadGuide());
  }, [loadGuide]);

  useEffect(() => () => setGuideImpactOpen(false), [setGuideImpactOpen]);

  const handleTitleBlur = useCallback(async () => {
    if (!data || title === data.guide.title) return;
    await updateGuideTitle(guideId, title);
    setData((prev) => (prev ? { ...prev, guide: { ...prev.guide, title } } : prev));
    document.title = `${title} — ${i18n.t('app_name')}`;
  }, [data, guideId, title]);

  const handleDescriptionChange = useCallback(async (stepId: string, description: string) => {
    await updateStepDescription(stepId, description);
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.map((s) => (s.id === stepId ? { ...s, description } : s)) };
    });
  }, []);

  const handleRichDescriptionChange = useCallback(async (stepId: string, content: JSONContent, plainText: string) => {
    await updateStepRichDescription(stepId, content);
    setData((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((step) =>
              step.id === stepId ? { ...step, description: plainText, richDescription: content } : step,
            ),
          }
        : prev,
    );
  }, []);

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      await deleteStep(guideId, stepId);
      await loadGuide();
    },
    [guideId, loadGuide],
  );

  const handleBlurSave = useCallback(
    async (blob: Blob) => {
      if (!blurringStepId || !data) return;
      const screenshot = data.screenshots.get(blurringStepId);
      if (!screenshot) return;
      const updatedScreenshot = await updateScreenshotBlob(screenshot.id, blob, blurringStepId);
      if (!updatedScreenshot) return;
      setData((prev) => {
        if (!prev) return prev;
        const newScreenshots = new Map(prev.screenshots);
        newScreenshots.set(blurringStepId, updatedScreenshot);
        return {
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === blurringStepId ? { ...step, screenshotId: updatedScreenshot.id } : step,
          ),
          screenshots: newScreenshots,
        };
      });
      setBlurringStepId(null);
    },
    [blurringStepId, data],
  );

  if (loading)
    return (
      <div>
        <div className="h-10 w-2/3 rounded-lg bg-border/50 animate-pulse" />
        <div className="h-4 w-48 rounded bg-border/30 animate-pulse mt-3 mb-8" />
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4">
              <div
                className="aspect-video rounded-lg bg-[#f2f4fa] animate-pulse mb-3"
                style={{ animationDelay: `${i * 150}ms` }}
              />
              <div
                className="h-4 w-3/4 rounded bg-border/40 animate-pulse"
                style={{ animationDelay: `${i * 150 + 50}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  if (!data) return <p className="text-sm py-12 text-center text-purple">{i18n.t('fullview_guideNotFound')}</p>;

  const domain = getMostCommonDomain(data.steps);
  const blurScreenshot = blurringStepId ? data.screenshots.get(blurringStepId) : undefined;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {blurringStepId && blurScreenshot && (
        <BlurCanvas screenshot={blurScreenshot} onSave={handleBlurSave} onCancel={() => setBlurringStepId(null)} />
      )}
      {addingAt !== null && (
        <ManualStepDialog
          onCancel={() => setAddingAt(null)}
          onAdd={async (content, screenshot) => {
            await insertManualStep(guideId, addingAt, content, screenshot);
            setAddingAt(null);
            await loadGuide();
          }}
        />
      )}
      {improving && <ImproveGuideDialog guideId={guideId} onClose={() => setImproving(false)} onApplied={loadGuide} />}
      {translating && <TranslateGuideDialog guideId={guideId} onClose={() => setTranslating(false)} />}
      {guideMeWarning && (
        <GuideMeStartDialog
          guide={data.guide}
          onClose={() => setGuideMeWarning(false)}
          onClassify={() => {
            setGuideMeWarning(false);
            setGuideImpactOpen(true);
          }}
          onBeforeStart={openSidebar}
          onStarted={() => {
            setGuideMeWarning(false);
          }}
        />
      )}
      {guideImpactOpen && (
        <GuideImpactDialog
          guide={data.guide}
          onClose={() => setGuideImpactOpen(false)}
          onSaved={(impact, impactNote) =>
            setData((prev) =>
              prev ? { ...prev, guide: { ...prev.guide, impact, impactNote, updatedAt: Date.now() } } : prev,
            )
          }
        />
      )}

      <div
        className={
          title === i18n.t('fullview_untitledGuide') && !typingTitle && data.steps.length > 0 ? 'min-h-[88px]' : ''
        }
      >
        {title === i18n.t('fullview_untitledGuide') && !typingTitle && data.steps.length > 0 ? (
          <div className="text-[32px] font-extrabold leading-tight animate-gradient-text bg-[length:300%_100%] bg-clip-text text-transparent bg-gradient-to-r from-muted-foreground via-violet to-muted-foreground max-w-[480px]">
            {i18n.t('fullview_writingTitle')}
          </div>
        ) : typingTitle ? (
          <div className="relative text-[32px] font-extrabold leading-tight">
            <div className="invisible" aria-hidden="true">
              {typingTitle}
            </div>
            <div className="absolute inset-0 text-foreground">
              <TypeAnimation
                sequence={[
                  typingTitle,
                  () => {
                    titleRef.current = typingTitle;
                    setTitle(typingTitle);
                    setTypingTitle(null);
                  },
                ]}
                speed={70}
                cursor={false}
              />
              <span className="inline-block w-[3px] h-[30px] bg-violet ml-0.5 align-text-bottom animate-blink" />
            </div>
          </div>
        ) : (
          <textarea
            ref={(el) => {
              if (el) {
                el.style.height = '0';
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            value={title}
            rows={1}
            onChange={(e) => {
              setTitle(e.target.value);
              setGuideTitle(e.target.value);
              const el = e.target;
              el.style.height = '0';
              el.style.height = `${el.scrollHeight}px`;
            }}
            onBlur={handleTitleBlur}
            className="text-[32px] font-extrabold bg-transparent border-b-2 border-transparent hover:border-border focus:outline-none focus:border-accent w-full p-0 text-foreground resize-none leading-tight overflow-hidden"
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 mb-4 flex-wrap">
        <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground bg-card border border-border px-2.5 py-0.5 rounded-full">
          {formatDate(data.guide.createdAt)}
        </span>
        <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground bg-card border border-border px-2.5 py-0.5 rounded-full">
          {data.steps.length !== 1
            ? i18n.t('fullview_stepCountPlural', [String(data.steps.length)])
            : i18n.t('fullview_stepCount', [String(data.steps.length)])}
        </span>
        {domain && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-card border border-border pl-1.5 pr-2.5 py-0.5 rounded-full">
            <FaviconImg domain={domain} size={14} className="rounded-full" />
            {domain}
          </span>
        )}
        <GuideImpactBadge impact={data.guide.impact} onClick={() => setGuideImpactOpen(true)} />
        {data.steps.length > 0 && (
          <button
            onClick={() => setTranslating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-0.5 text-[11px] font-semibold text-accent transition-colors hover:bg-border/60"
          >
            <Languages size={11} /> Translate
          </button>
        )}
        {data.steps.length > 0 && (
          <button
            onClick={() => setImproving(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-0.5 text-[11px] font-semibold text-accent transition-colors hover:bg-border/60"
          >
            <Sparkles size={11} /> Improve guide
          </button>
        )}
        {data.steps.length > 0 && (
          <button
            onClick={() => {
              if ((data.guide.impact ?? 'unknown') !== 'read_only') {
                setGuideMeWarning(true);
                return;
              }
              openSidebar();
              void sendMessage('startGuideMe', { guideId }).then((result) => {
                if (!result.started && result.confirmationRequired) setGuideMeWarning(true);
              });
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-0.5 rounded-full transition-colors"
          >
            <Play size={11} />
            {i18n.t('fullview_guideMe')}
          </button>
        )}
      </div>

      <GuideStepList
        guideId={guideId}
        steps={data.steps}
        screenshots={data.screenshots}
        onDescriptionChange={handleDescriptionChange}
        onRichDescriptionChange={handleRichDescriptionChange}
        onDelete={handleDeleteStep}
        onBlur={(stepId) => setBlurringStepId(stepId)}
        onReorder={(newSteps) => setData((prev) => (prev ? { ...prev, steps: newSteps } : prev))}
        onAdd={setAddingAt}
      />
    </div>
  );
}
