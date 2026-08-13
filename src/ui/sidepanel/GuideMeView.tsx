import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { browser, i18n } from '#imports';
import type { GuideMeSession } from '@/core/guideme/session';
import { SESSION_KEY } from '@/core/guideme/session';
import { resolveGuideMeStep } from '@/core/guideme/urls';
import { getGuide } from '@/core/guides/service';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { sendMessage } from '@/lib/messaging';
import { extractDomain } from '@/lib/utils';
import MascotIcon from '@/ui/fullview/components/MascotIcon';
import FaviconImg from '@/ui/shared/FaviconImg';
import { getGuideMeHighlightStyle } from './guide-me-highlight';

interface GuideMeViewProps {
  guideId: string;
  onExit: () => void;
  onComplete: (guideId: string) => void;
}

interface GuideData {
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

function SadMascot() {
  return <MascotIcon size={64} />;
}

function ExitConfirmation({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-card/80 backdrop-blur-[2px]">
      <div className="bg-card rounded-2xl border border-border shadow-lg p-6 w-[280px] text-center flex flex-col items-center">
        <SadMascot />
        <h3 className="text-[15px] font-bold text-foreground mt-3 mb-1">{i18n.t('guideme.exitTitle')}</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">{i18n.t('guideme.exitMessage')}</p>
        <div className="flex gap-2.5 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            {i18n.t('guideme.stay')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {i18n.t('guideme.exit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuideMeView({ guideId, onExit, onComplete }: GuideMeViewProps) {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [viewedStepIndex, setViewedStepIndex] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const loadGuide = useCallback(async () => {
    const result = await getGuide(guideId);
    if (!result) {
      setLoading(false);
      return;
    }
    setData(result);
    setLoading(false);
  }, [guideId]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  useEffect(() => {
    const handler = (changes: Record<string, { newValue?: unknown }>) => {
      if (!changes[SESSION_KEY]) return;
      const session = changes[SESSION_KEY].newValue as GuideMeSession | null;
      if (!session) return;
      if (!session.active) {
        onComplete(guideId);
        return;
      }
      setActiveStepIndex(session.activeStepIndex);
      setViewedStepIndex(session.activeStepIndex);
    };

    browser.storage.local.onChanged.addListener(handler);
    return () => browser.storage.local.onChanged.removeListener(handler);
  }, [guideId, onComplete]);

  useEffect(() => {
    browser.storage.local.get([SESSION_KEY]).then((result: Record<string, unknown>) => {
      const session = result[SESSION_KEY] as GuideMeSession | null;
      if (session?.active) {
        setActiveStepIndex(session.activeStepIndex);
        setViewedStepIndex(session.activeStepIndex);
      }
    });
  }, []);

  const getObjectUrl = useCallback((stepId: string, blob: Blob) => {
    const existing = objectUrlsRef.current.get(stepId);
    if (existing) return existing;
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.set(stepId, url);
    return url;
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const recordedStep = data?.steps[viewedStepIndex] ?? null;
  const viewedStep = recordedStep ? resolveGuideMeStep(recordedStep, data?.guide.guideMeOrigins) : null;
  const viewedScreenshot = viewedStep ? data?.screenshots.get(viewedStep.id) : undefined;

  const highlightStyle = getGuideMeHighlightStyle(viewedStep, viewedScreenshot);

  if (loading) return <p className="text-sm text-purple p-4">{i18n.t('common.loading')}</p>;
  if (!data) return <p className="text-sm text-purple p-4">{i18n.t('guideme.guideNotFound')}</p>;

  const totalSteps = data.steps.length;

  return (
    <div className="min-h-screen bg-card flex flex-col relative">
      {showExitConfirm && <ExitConfirmation onCancel={() => setShowExitConfirm(false)} onConfirm={onExit} />}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="shrink-0 p-1 rounded text-purple hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="flex-1 text-sm font-semibold text-foreground truncate">{data.guide.title}</span>
        <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {i18n.t('guideme.live')}
        </span>
      </div>

      <div className="px-4 pb-3 flex gap-1">
        {data.steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex-1 h-[3px] rounded-[1.5px] ${
              idx < activeStepIndex ? 'bg-success' : idx === activeStepIndex ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="px-4 pb-3">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 pb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-secondary text-accent px-2.5 py-1 rounded-full mb-2.5">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                {viewedStepIndex + 1}
              </span>
              {i18n.t('guideme.stepOf', [String(viewedStepIndex + 1), String(totalSteps)])}
            </span>
            <p className="text-[15px] font-semibold text-foreground leading-snug">
              {viewedStep?.description || i18n.t('guideme.noDescription')}
            </p>
            {viewedStep?.url && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5">
                <FaviconImg domain={extractDomain(viewedStep.url)} size={14} className="rounded-full" />
                {extractDomain(viewedStep.url)}
              </span>
            )}
          </div>

          {viewedScreenshot && (
            <div className="relative mx-4 mb-3 rounded-lg overflow-hidden border border-border">
              <img
                src={getObjectUrl(viewedStep!.id, viewedScreenshot.blob)}
                alt={`Step ${viewedStepIndex + 1}`}
                className="w-full block"
              />
              {highlightStyle && (
                <div
                  className="absolute border-2 border-accent rounded-sm pointer-events-none"
                  style={highlightStyle}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 pb-3">
            <button
              onClick={() => setViewedStepIndex((i) => Math.max(0, i - 1))}
              disabled={viewedStepIndex === 0}
              className="flex items-center gap-1 text-xs font-medium text-purple hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              {i18n.t('guideme.prev')}
            </button>
            <button
              onClick={async () => {
                if (viewedStepIndex !== activeStepIndex || advancing) {
                  if (viewedStepIndex < totalSteps - 1) setViewedStepIndex((i) => i + 1);
                  return;
                }

                setAdvancing(true);
                setAdvanceError('');
                try {
                  const result = await sendMessage('guideMeNext', undefined);
                  if (!result.advanced) {
                    setAdvanceError('Guide Me could not advance. Try again.');
                    return;
                  }
                  if (!result.completed && result.activeStepIndex !== undefined) {
                    setActiveStepIndex(result.activeStepIndex);
                    setViewedStepIndex(result.activeStepIndex);
                  }
                } catch {
                  setAdvanceError('Guide Me could not advance. Try again.');
                } finally {
                  setAdvancing(false);
                }
              }}
              disabled={advancing || (viewedStepIndex === totalSteps - 1 && viewedStepIndex !== activeStepIndex)}
              className="flex items-center gap-1 text-xs font-medium text-purple hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {advancing
                ? 'Moving…'
                : viewedStepIndex === totalSteps - 1 && viewedStepIndex === activeStepIndex
                  ? i18n.t('guideme.finish')
                  : i18n.t('guideme.next')}
              <ChevronRight size={14} />
            </button>
          </div>
          {advanceError && <p className="px-4 pb-3 text-[11px] text-destructive">{advanceError}</p>}
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {data.steps.map((step, idx) => {
          const isDone = idx < activeStepIndex;
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.id}
              onClick={() => setViewedStepIndex(idx)}
              className={`w-full flex items-start gap-2.5 py-2 px-2 rounded-lg text-left transition-colors ${
                viewedStepIndex === idx ? 'bg-secondary' : 'hover:bg-secondary/50'
              }`}
            >
              {isDone ? (
                <span className="shrink-0 w-5 h-5 rounded-full bg-success flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
              ) : isActive ? (
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white mt-0.5">
                  {idx + 1}
                </span>
              ) : (
                <span className="shrink-0 w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground mt-0.5">
                  {idx + 1}
                </span>
              )}
              <span
                className={`text-[13px] leading-snug ${
                  isDone
                    ? 'text-muted-foreground'
                    : isActive
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground/60'
                }`}
              >
                {step.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
