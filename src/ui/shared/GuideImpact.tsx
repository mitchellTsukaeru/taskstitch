import { AlertTriangle, CircleHelp, Eye, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { GUIDE_IMPACTS, guideImpact } from '@/core/guides/impact';
import { updateGuideImpact } from '@/core/guides/service';
import type { Guide, GuideImpact } from '@/core/guides/types';
import { Button } from '@/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/ui/dialog';

const toneClasses = {
  safe: 'border-success/30 bg-success/5 text-success',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  neutral: 'border-amber-300 bg-amber-50 text-amber-800',
} as const;

function ImpactIcon({ tone, size = 13 }: { tone: keyof typeof toneClasses; size?: number }) {
  if (tone === 'safe') return <Eye size={size} />;
  if (tone === 'danger') return <ShieldAlert size={size} />;
  if (tone === 'warning') return <AlertTriangle size={size} />;
  return <CircleHelp size={size} />;
}

export function GuideImpactBadge({
  impact,
  onClick,
  compact = false,
}: {
  impact: GuideImpact | undefined;
  onClick?: () => void;
  compact?: boolean;
}) {
  const details = guideImpact(impact);
  const className = `inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors ${
    compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
  } ${toneClasses[details.tone]} ${onClick ? 'cursor-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30' : ''}`;
  const content = (
    <>
      <ImpactIcon tone={details.tone} size={compact ? 11 : 12} />
      {compact ? details.shortLabel : `Safety: ${details.shortLabel}`}
    </>
  );

  if (!onClick) return <span className={className}>{content}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={`Safety: ${details.label}. Edit classification`}
      title="Edit safety classification"
    >
      {content}
    </button>
  );
}

export function GuideImpactDialog({
  guide,
  onClose,
  onSaved,
}: {
  guide: Guide;
  onClose: () => void;
  onSaved: (impact: GuideImpact, impactNote?: string) => void;
}) {
  const [impact, setImpact] = useState<GuideImpact | ''>(
    guide.impact && guide.impact !== 'unknown' ? guide.impact : '',
  );
  const [impactNote, setImpactNote] = useState(guide.impactNote ?? '');
  const [saving, setSaving] = useState(false);
  const choices = GUIDE_IMPACTS.filter((item) => item.value !== 'unknown');

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-secondary/40 px-5 py-4 pr-12">
          <DialogTitle className="text-sm font-bold text-foreground">Safety classification</DialogTitle>
          <DialogDescription className="text-[11px]">
            Set what following this guide can do on a live system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div className="space-y-2" role="radiogroup" aria-label="Safety classification">
            {choices.map((choice) => {
              const selected = impact === choice.value;
              return (
                <label
                  key={choice.value}
                  className={`relative flex cursor-pointer gap-3 overflow-hidden rounded-xl border p-3.5 pl-5 transition-colors ${
                    selected
                      ? 'border-accent bg-secondary/35 ring-2 ring-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${
                      choice.tone === 'safe'
                        ? 'bg-success'
                        : choice.tone === 'danger'
                          ? 'bg-destructive'
                          : 'bg-amber-500'
                    }`}
                  />
                  <input
                    type="radio"
                    name="guide-impact"
                    value={choice.value}
                    checked={selected}
                    onChange={() => setImpact(choice.value)}
                    className="mt-0.5 accent-accent"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <ImpactIcon tone={choice.tone} size={14} /> {choice.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      {choice.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Safety note (optional)</span>
            <textarea
              value={impactNote}
              maxLength={500}
              rows={3}
              onChange={(event) => setImpactNote(event.target.value)}
              placeholder="Example: Creates a test customer in the AU sandbox."
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
        </div>

        <DialogFooter className="border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!impact || saving}
            onClick={async () => {
              if (!impact) return;
              setSaving(true);
              try {
                await updateGuideImpact(guide.id, impact, impactNote);
                onSaved(impact, impactNote.trim().slice(0, 500) || undefined);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Save classification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
