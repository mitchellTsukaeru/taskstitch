import { FileUp, X } from 'lucide-react';
import { type DragEvent, type ReactNode, useRef, useState } from 'react';
import { i18n } from '#imports';
import { TASKSTITCH_MIME } from '@/core/guides/portable';

export function isTaskStitchFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.taskstitch') || file.type === TASKSTITCH_MIME;
}

export function TaskStitchDropTarget({
  children,
  className,
  onFile,
}: {
  children: ReactNode;
  className?: string;
  onFile: (file: File) => void;
}) {
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const containsFiles = (event: DragEvent<HTMLDivElement>) => Array.from(event.dataTransfer.types).includes('Files');

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length !== 1) {
      setError(i18n.t('importGuide.dropOneFile'));
      return;
    }
    if (!isTaskStitchFile(files[0])) {
      setError(i18n.t('importGuide.dropTaskStitchFile'));
      return;
    }

    setError('');
    onFile(files[0]);
  };

  return (
    <div
      className={className}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-secondary/90 p-5 backdrop-blur-sm">
          <div className="flex max-w-sm flex-col items-center rounded-2xl border-2 border-dashed border-accent bg-card px-8 py-10 text-center shadow-xl">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <FileUp size={24} />
            </span>
            <p className="text-sm font-bold text-foreground">{i18n.t('importGuide.dropTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i18n.t('importGuide.dropSubtitle')}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute left-1/2 top-3 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-lg border border-destructive/20 bg-card px-3 py-2 text-xs text-destructive shadow-lg">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="rounded p-0.5 hover:bg-destructive/10"
            aria-label={i18n.t('common.close')}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
