import type { JSONContent } from '@tiptap/core';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { reorderSteps } from '@/core/guides/service';
import type { Screenshot, Step } from '@/core/guides/types';
import { useFullview } from '@/stores/fullview';
import EmptyGuideState from '@/ui/shared/EmptyGuideState';
import StepCard from '@/ui/sidepanel/StepCard';

interface GuideStepListProps {
  guideId: string;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
  onDescriptionChange: (stepId: string, description: string) => void;
  onRichDescriptionChange: (stepId: string, content: JSONContent, plainText: string) => void;
  onDraftChange: (stepId: string, content: JSONContent, plainText: string) => void;
  onDelete: (stepId: string) => void;
  onBlur: (stepId: string) => void;
  onReorder: (newSteps: Step[]) => void;
  onAdd: (index: number) => void;
}

export default function GuideStepList({
  guideId,
  steps,
  screenshots,
  onDescriptionChange,
  onRichDescriptionChange,
  onDraftChange,
  onDelete,
  onBlur,
  onReorder,
  onAdd,
}: GuideStepListProps) {
  const { scrollToStepId, setActiveStepId } = useFullview((s) => ({
    scrollToStepId: s.scrollToStepId,
    setActiveStepId: s.setActiveStepId,
  }));

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (scrollToStepId) {
      stepRefs.current.get(scrollToStepId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToStepId]);

  useEffect(() => {
    if (steps.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveStepId(entry.target.getAttribute('data-step-id'));
          }
        }
      },
      { threshold: 0.5 },
    );
    for (const el of stepRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [steps, setActiveStepId]);

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newSteps = [...steps];
      const [moved] = newSteps.splice(dragIndex, 1);
      newSteps.splice(dragOverIndex, 0, moved);
      reorderSteps(
        guideId,
        newSteps.map((s) => s.id),
      );
      onReorder(newSteps);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (steps.length === 0) return <EmptyGuideState onAdd={() => onAdd(0)} />;

  return (
    <div className="space-y-6">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          ref={(el) => {
            if (el) stepRefs.current.set(step.id, el);
            else stepRefs.current.delete(step.id);
          }}
          data-step-id={step.id}
        >
          {dragOverIndex === idx && dragIndex !== null && dragIndex !== idx && (
            <div className="h-1 bg-accent rounded-full mx-4 mb-2" />
          )}
          <StepCard
            step={step}
            screenshot={screenshots.get(step.id)}
            onDescriptionChange={onDescriptionChange}
            onRichDescriptionChange={onRichDescriptionChange}
            onDraftChange={onDraftChange}
            onDelete={onDelete}
            onBlur={onBlur}
            dragHandleProps={{
              onDragStart: (e: React.DragEvent) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = 'move';
              },
              onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                setDragOverIndex(idx);
              },
              onDragEnd: handleDragEnd,
            }}
          />
          <button
            type="button"
            onClick={() => onAdd(idx + 1)}
            className="group/add mx-auto mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-accent focus-visible:text-accent"
          >
            <span className="h-px w-16 bg-border group-hover/add:bg-accent/50" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card group-hover/add:border-accent group-hover/add:bg-secondary">
              <Plus size={11} />
            </span>
            <span className="h-px w-16 bg-border group-hover/add:bg-accent/50" />
            <span className="sr-only">Add step after step {idx + 1}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
