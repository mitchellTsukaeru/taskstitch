import type { JSONContent } from '@tiptap/core';
import { ArrowLeft, Languages, Layers, Maximize2, Play, Plus, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { i18n } from '#imports';
import {
  deleteStep,
  getGuide,
  insertManualStep,
  reorderSteps,
  updateGuideTitle,
  updateScreenshotBlob,
  updateStepDescription,
  updateStepRichDescription,
} from '@/core/guides/service';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { createTab, focusWindow, getExtensionURL, queryTabs, updateTab } from '@/lib/browser-api';
import { sendMessage } from '@/lib/messaging';
import { getMostCommonDomain } from '@/lib/utils';
import { Input } from '@/ui/components/ui/input';
import EmptyGuideState from '@/ui/shared/EmptyGuideState';
import FaviconImg from '@/ui/shared/FaviconImg';
import { GuideImpactBadge, GuideImpactDialog } from '@/ui/shared/GuideImpact';
import { GuideMeStartDialog } from '@/ui/shared/GuideMeStartDialog';
import { ImproveGuideDialog } from '@/ui/shared/ImproveGuideDialog';
import { ManualStepDialog } from '@/ui/shared/ManualStepDialog';
import { TranslateGuideDialog } from '@/ui/shared/TranslateGuideDialog';
import BlurCanvas from './BlurCanvas';
import ExportMenu from './ExportMenu';
import StepCard from './StepCard';

interface GuideEditorProps {
  guideId: string;
  onBack: () => void;
  onGuideMe?: (guideId: string) => void;
}

interface GuideData {
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

export default function GuideEditor({ guideId, onBack, onGuideMe }: GuideEditorProps) {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [blurringStepId, setBlurringStepId] = useState<string | null>(null);
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [improving, setImproving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [guideMeWarning, setGuideMeWarning] = useState(false);
  const [impactEditing, setImpactEditing] = useState(false);

  const loadGuide = useCallback(async () => {
    const result = await getGuide(guideId);
    if (!result) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setData(result);
    setTitle(result.guide.title);
    setLoading(false);
  }, [guideId]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  const handleTitleBlur = useCallback(async () => {
    if (!data || title === data.guide.title) return;
    await updateGuideTitle(guideId, title);
    setData((prev) => (prev ? { ...prev, guide: { ...prev.guide, title } } : prev));
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
      const result = await getGuide(guideId);
      if (result) {
        setData(result);
        setTitle(result.guide.title);
      } else {
        setData(null);
        setLoading(true);
        await loadGuide();
      }
    },
    [guideId, loadGuide],
  );

  const handleBlurSave = useCallback(
    async (blob: Blob) => {
      if (!blurringStepId || !data) return;
      const blurScreenshot = data.screenshots.get(blurringStepId);
      if (!blurScreenshot) return;
      const updatedScreenshot = await updateScreenshotBlob(blurScreenshot.id, blob, blurringStepId);
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

  if (loading) return <p className="text-sm text-purple p-4">{i18n.t('common.loading')}</p>;

  if (notFound || !data) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-purple hover:text-foreground mb-4">
          <ArrowLeft size={18} />
          {i18n.t('common.back')}
        </button>
        <p className="text-sm text-destructive">{i18n.t('fullview.guideNotFound')}</p>
      </div>
    );
  }

  const blurScreenshot = blurringStepId ? data.screenshots.get(blurringStepId) : undefined;

  return (
    <div className="min-h-screen bg-card flex flex-col">
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
            setImpactEditing(true);
          }}
          onStarted={() => {
            setGuideMeWarning(false);
            onGuideMe?.(guideId);
          }}
        />
      )}
      {impactEditing && (
        <GuideImpactDialog
          guide={data.guide}
          onClose={() => setImpactEditing(false)}
          onSaved={(impact, impactNote) =>
            setData((prev) =>
              prev ? { ...prev, guide: { ...prev.guide, impact, impactNote, updatedAt: Date.now() } } : prev,
            )
          }
        />
      )}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="shrink-0 p-1 rounded text-purple hover:text-foreground"
            title={i18n.t('editor.backToLibrary')}
          >
            <ArrowLeft size={18} />
          </button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-bold bg-transparent border-0 border-b border-transparent hover:border-border focus-visible:ring-0 focus-visible:border-accent shadow-none p-0 h-auto text-foreground"
          />
          <button
            onClick={() => {
              const url = getExtensionURL(`/fullview.html?guideId=${guideId}`);
              queryTabs({ url: getExtensionURL('/fullview.html') }).then((tabs) => {
                if (tabs.length > 0 && tabs[0].id) {
                  updateTab(tabs[0].id, { active: true, url: getExtensionURL(`/fullview.html?guideId=${guideId}`) });
                  if (tabs[0].windowId) focusWindow(tabs[0].windowId);
                } else {
                  createTab({ url });
                }
              });
            }}
            className="shrink-0 p-1.5 rounded-md transition-colors text-purple hover:text-accent hover:bg-secondary"
            title={i18n.t('library.openInFullView')}
          >
            <Maximize2 size={15} />
          </button>
          {data.steps.length > 0 && (
            <button
              onClick={() => setTranslating(true)}
              className="shrink-0 rounded-md p-1.5 text-purple transition-colors hover:bg-secondary hover:text-accent"
              title="Create translated copy"
            >
              <Languages size={15} />
            </button>
          )}
          {data.steps.length > 0 && (
            <button
              onClick={() => setImproving(true)}
              className="shrink-0 p-1.5 rounded-md transition-colors text-purple hover:text-accent hover:bg-secondary"
              title="Improve guide"
            >
              <Sparkles size={15} />
            </button>
          )}
          {data.steps.length > 0 && (
            <button
              onClick={async () => {
                if ((data.guide.impact ?? 'unknown') !== 'read_only') {
                  setGuideMeWarning(true);
                  return;
                }
                const result = await sendMessage('startGuideMe', { guideId });
                if (result.started) onGuideMe?.(guideId);
              }}
              className="shrink-0 p-1.5 rounded-md transition-colors text-purple hover:text-accent hover:bg-secondary"
              title={i18n.t('editor.guideMe')}
            >
              <Play size={15} />
            </button>
          )}
          <div className="ml-auto shrink-0">
            <ExportMenu
              guideId={guideId}
              guide={data.guide}
              steps={data.steps}
              screenshots={data.screenshots}
              onRequestClassification={() => setImpactEditing(true)}
            />
          </div>
        </div>
        <div className="text-[11px] flex items-center gap-2 text-muted-foreground" style={{ marginLeft: '34px' }}>
          <span className="flex items-center gap-1">
            <Layers size={11} />
            {data.steps.length !== 1
              ? i18n.t('fullview.stepCountPlural', [String(data.steps.length)])
              : i18n.t('fullview.stepCount', [String(data.steps.length)])}
          </span>
          {(() => {
            const d = getMostCommonDomain(data.steps);
            if (!d) return null;
            return (
              <span className="flex items-center gap-1">
                <span className="text-border">·</span>
                <FaviconImg domain={d} size={12} className="rounded-full" />
                {d}
              </span>
            );
          })()}
          <GuideImpactBadge impact={data.guide.impact} onClick={() => setImpactEditing(true)} compact />
        </div>
      </div>
      <div className="px-4 pt-1 pb-4 flex-1 flex flex-col">
        {data.steps.length === 0 ? (
          <EmptyGuideState onAdd={() => setAddingAt(0)} />
        ) : (
          data.steps.map((step, idx) => (
            <div key={step.id}>
              {dragOverIndex === idx && dragIndex !== null && dragIndex !== idx && (
                <div className="h-1 bg-accent rounded-full mx-4 mb-1" />
              )}
              <StepCard
                step={step}
                screenshot={data.screenshots.get(step.id)}
                onDescriptionChange={handleDescriptionChange}
                onRichDescriptionChange={handleRichDescriptionChange}
                onDelete={handleDeleteStep}
                onBlur={(stepId) => setBlurringStepId(stepId)}
                dragHandleProps={{
                  onDragStart: (e: React.DragEvent) => {
                    setDragIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  },
                  onDragOver: (e: React.DragEvent) => {
                    e.preventDefault();
                    setDragOverIndex(idx);
                  },
                  onDragEnd: () => {
                    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
                      setData((prev) => {
                        if (!prev) return prev;
                        const newSteps = [...prev.steps];
                        const [moved] = newSteps.splice(dragIndex, 1);
                        newSteps.splice(dragOverIndex, 0, moved);
                        reorderSteps(
                          guideId,
                          newSteps.map((s) => s.id),
                        );
                        return { ...prev, steps: newSteps };
                      });
                    }
                    setDragIndex(null);
                    setDragOverIndex(null);
                  },
                }}
              />
              <button
                type="button"
                onClick={() => setAddingAt(idx + 1)}
                className="group/add mx-auto mt-2 mb-3 flex items-center gap-1 text-muted-foreground hover:text-accent"
              >
                <span className="h-px w-8 bg-border group-hover/add:bg-accent/50" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card group-hover/add:border-accent group-hover/add:bg-secondary">
                  <Plus size={10} />
                </span>
                <span className="h-px w-8 bg-border group-hover/add:bg-accent/50" />
                <span className="sr-only">Add step after step {idx + 1}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
