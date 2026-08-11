import type { JSONContent } from '@tiptap/core';
import { Check, Copy, EyeOff, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { i18n } from '#imports';
import { stepRichText } from '@/core/guides/rich-text';
import type { Screenshot, Step } from '@/core/guides/types';
import { logger } from '@/lib/logger';
import { RichTextEditor } from '@/ui/shared/RichTextEditor';
import ZoomScreenshot from './ZoomScreenshot';

interface DragHandleProps {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

interface StepCardProps {
  step: Step;
  screenshot: Screenshot | undefined;
  onDescriptionChange: (stepId: string, description: string) => void;
  onRichDescriptionChange?: (stepId: string, content: JSONContent, plainText: string) => void;
  onDraftChange?: (stepId: string, content: JSONContent, plainText: string) => void;
  onDelete: (stepId: string) => void;
  dragHandleProps?: DragHandleProps;
  onBlur?: (stepId: string) => void;
  onCopy?: (stepId: string) => void;
}

export default function StepCard({
  step,
  screenshot,
  onDescriptionChange,
  onDelete,
  dragHandleProps,
  onBlur,
  onRichDescriptionChange,
  onDraftChange,
}: StepCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const [content, setContent] = useState(() => stepRichText(step.description, step.richDescription));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ content: JSONContent; plainText: string } | null>(null);

  useEffect(
    () => setContent(stepRichText(step.description, step.richDescription)),
    [step.description, step.richDescription],
  );
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const pending = pendingSave.current;
      if (!pending) return;
      if (onRichDescriptionChange) onRichDescriptionChange(step.id, pending.content, pending.plainText);
      else onDescriptionChange(step.id, pending.plainText);
    },
    [onDescriptionChange, onRichDescriptionChange, step.id],
  );

  const handleDelete = () => {
    if (window.confirm(i18n.t('editor.deleteThisStep'))) onDelete(step.id);
  };

  const handleCopy = async () => {
    if (!screenshot) return;
    try {
      const item = new ClipboardItem({ [screenshot.mimeType]: screenshot.blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      logger.error(' Copy to clipboard failed', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
    dragHandleProps?.onDragOver(e);
  };

  return (
    <div
      draggable={!!dragHandleProps}
      onDragStart={dragHandleProps?.onDragStart}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDragEnd={() => {
        setDragOver(false);
        dragHandleProps?.onDragEnd();
      }}
      className={`rounded-xl mb-3 overflow-hidden transition-shadow border border-border bg-card ${dragOver ? 'ring-2 ring-accent' : ''}`}
    >
      {screenshot ? (
        <ZoomScreenshot
          screenshot={screenshot}
          alt={`Step ${step.index + 1} screenshot`}
          className="!rounded-none !border-0"
          crop
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-sm bg-secondary text-purple">
          {i18n.t('editor.noScreenshot')}
        </div>
      )}

      <div className="px-3 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-bold shrink-0 bg-primary text-primary-foreground">
            {step.index + 1}
          </span>
          <div
            className="min-w-0 flex-1"
            onBlur={() => {
              if (saveTimer.current) clearTimeout(saveTimer.current);
              const pending = pendingSave.current;
              if (!pending) return;
              pendingSave.current = null;
              if (onRichDescriptionChange) onRichDescriptionChange(step.id, pending.content, pending.plainText);
              else onDescriptionChange(step.id, pending.plainText);
            }}
          >
            {step.kind === 'manual' && (
              <span className="inline-flex mb-1 text-[9px] font-semibold uppercase tracking-wide text-accent">
                Manual note
              </span>
            )}
            <RichTextEditor
              compact
              content={content}
              onChange={(next, plainText) => {
                setContent(next);
                onDraftChange?.(step.id, next, plainText);
                pendingSave.current = { content: next, plainText };
                if (saveTimer.current) clearTimeout(saveTimer.current);
                saveTimer.current = setTimeout(() => {
                  pendingSave.current = null;
                  if (onRichDescriptionChange) onRichDescriptionChange(step.id, next, plainText);
                  else onDescriptionChange(step.id, plainText);
                }, 350);
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-1">
          <div className="flex items-center gap-0.5">
            {screenshot && (
              <>
                <button
                  onClick={() => onBlur?.(step.id)}
                  className="p-1 rounded-md transition-colors text-border hover:text-accent"
                  title={i18n.t('editor.blurSensitiveArea')}
                >
                  <EyeOff size={13} />
                </button>
                <button
                  onClick={handleCopy}
                  className={`p-1 rounded-md transition-colors ${copied ? 'text-success' : 'text-border hover:text-success'}`}
                  title={i18n.t('editor.copyScreenshot')}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="p-1 rounded-md transition-colors text-border hover:text-destructive"
              title={i18n.t('recording.deleteStep')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
