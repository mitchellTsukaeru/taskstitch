import { AlertTriangle, Eye, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';
import { guideImpact } from '@/core/guides/impact';
import type { Guide } from '@/core/guides/types';
import { sendMessage } from '@/lib/messaging';
import { Button } from '@/ui/components/ui/button';

export function GuideMeStartDialog({
  guide,
  onClose,
  onStarted,
  onBeforeStart,
  onClassify,
}: {
  guide: Guide;
  onClose: () => void;
  onStarted: () => void;
  onBeforeStart?: () => void;
  onClassify?: () => void;
}) {
  const impact = guideImpact(guide.impact);
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const Icon = impact.tone === 'danger' ? ShieldAlert : impact.tone === 'safe' ? Eye : AlertTriangle;
  const toneClass =
    impact.tone === 'danger'
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : impact.tone === 'safe'
        ? 'border-success/30 bg-success/5 text-success'
        : 'border-amber-300 bg-amber-50 text-amber-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Review before Guide Me</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Guide Me highlights actions on the live system.</p>
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
          <div className={`rounded-xl border p-4 ${toneClass}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Icon size={16} /> {impact.label}
            </div>
            <p className="mt-2 text-xs leading-relaxed">{impact.description}</p>
            {guide.impactNote && <p className="mt-2 border-t border-current/15 pt-2 text-xs">{guide.impactNote}</p>}
            {impact.value === 'unknown' && onClassify && (
              <button
                type="button"
                onClick={onClassify}
                className="mt-3 text-xs font-bold underline underline-offset-2 hover:no-underline"
              >
                Classify this guide
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            TaskStitch does not verify the effect of a website action. Check the target system, account, and values
            before continuing each step.
          </p>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 text-xs text-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 accent-accent"
            />
            I understand that following this guide may change live data.
          </label>
          {error && <div className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!confirmed || starting}
            onClick={async () => {
              onBeforeStart?.();
              setStarting(true);
              setError('');
              const result = await sendMessage('startGuideMe', { guideId: guide.id, confirmedImpact: true });
              setStarting(false);
              if (!result.started) {
                setError(result.error || 'Guide Me could not start');
                return;
              }
              onStarted();
            }}
          >
            {starting ? 'Starting…' : 'Start Guide Me'}
          </Button>
        </div>
      </div>
    </div>
  );
}
