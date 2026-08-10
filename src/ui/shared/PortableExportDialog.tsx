import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { downloadBlob } from '@/core/export/download';
import { guideImpact } from '@/core/guides/impact';
import { exportTaskStitchGuide, taskStitchFilename } from '@/core/guides/portable';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { Button } from '@/ui/components/ui/button';
import { GuideImpactBadge } from '@/ui/shared/GuideImpact';

export function PortableExportDialog({
  guide,
  steps,
  screenshots,
  onClose,
  onRequestClassification,
}: {
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
  onClose: () => void;
  onRequestClassification?: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const impact = guideImpact(guide.impact);
  const classified = guide.impact !== undefined && guide.impact !== 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Export interactive guide</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Review the saved guide details before downloading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-foreground">Safety</span>
              <GuideImpactBadge impact={guide.impact} compact />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {guide.impactNote || impact.description}
            </p>
          </div>
          {!classified && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              Classify this guide before exporting an interactive package. Safety is part of the guide, so it can be
              reviewed anywhere the guide is used.
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            The package includes screenshots and Guide Me targeting data. Captured typed values are replaced with
            “[redacted input]”.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!classified && onRequestClassification && (
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                onRequestClassification();
              }}
            >
              Classify guide
            </Button>
          )}
          <Button
            disabled={!classified || exporting}
            onClick={async () => {
              if (!classified || !guide.impact) return;
              setExporting(true);
              try {
                const blob = await exportTaskStitchGuide(guide, steps, screenshots, guide.impact, guide.impactNote);
                downloadBlob(blob, taskStitchFilename(guide.title));
                onClose();
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download size={14} /> {exporting ? 'Preparing…' : 'Download .taskstitch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
