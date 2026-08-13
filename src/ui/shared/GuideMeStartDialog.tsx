import { AlertTriangle, ChevronDown, ExternalLink, Eye, Globe2, ShieldAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getGuideSiteSummaries } from '@/core/guideme/urls';
import { guideImpact } from '@/core/guides/impact';
import type { Guide, Step } from '@/core/guides/types';
import { sendMessage } from '@/lib/messaging';
import { Button } from '@/ui/components/ui/button';

function hostname(origin: string) {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

function stepRange(indices: number[]) {
  if (indices.length === 1) return `Step ${indices[0] + 1}`;
  return `Steps ${indices[0] + 1}–${indices[indices.length - 1] + 1}`;
}

export function GuideMeStartDialog({
  guide,
  steps,
  onClose,
  onStarted,
  onBeforeStart,
  onClassify,
}: {
  guide: Guide;
  steps: Step[];
  onClose: () => void;
  onStarted: () => void;
  onBeforeStart?: () => void;
  onClassify?: () => void;
}) {
  const impact = guideImpact(guide.impact);
  const sites = useMemo(() => getGuideSiteSummaries(steps, guide.guideMeOrigins), [guide, steps]);
  const requiresConfirmation = impact.value !== 'read_only';
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(true);
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
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border bg-secondary/40 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Start “{guide.title}”</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Review where this guide will take you before opening the first step.
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
          {sites[0] && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start page</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                <Globe2 size={14} className="shrink-0 text-accent" />
                <span className="min-w-0 break-all font-mono text-[10px] text-foreground">{sites[0].startUrl}</span>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              aria-expanded={sitesOpen}
              onClick={() => setSitesOpen((open) => !open)}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-xs font-bold text-foreground hover:bg-secondary/40"
            >
              <Globe2 size={14} className="text-accent" /> Sites this guide will visit
              <span className="font-normal text-muted-foreground">{sites.length} sites</span>
              <ChevronDown size={14} className={`ml-auto transition-transform ${sitesOpen ? 'rotate-180' : ''}`} />
            </button>
            {sitesOpen && (
              <div className="space-y-1 border-t border-border p-2">
                {sites.map((site, index) => (
                  <div key={site.sourceOrigin} className="rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      {index === 0 ? <Globe2 size={13} /> : <ExternalLink size={13} />}
                      <span className="truncate">{hostname(site.targetOrigin)}</span>
                      <span className={`ml-auto shrink-0 text-[9px] ${index ? 'text-amber-700' : 'text-success'}`}>
                        {site.mapped ? 'Changed from recorded site' : index ? 'External site' : 'Primary site'}
                      </span>
                    </div>
                    <p className="ml-5 mt-1 text-[9px] text-muted-foreground">
                      {stepRange(site.stepIndices)} · {site.firstPath}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
          {requiresConfirmation && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 text-xs text-foreground">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 accent-accent"
              />
              I understand that following this guide may change live data.
            </label>
          )}
          {error && <div className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={(requiresConfirmation && !confirmed) || starting}
            onClick={async () => {
              onBeforeStart?.();
              setStarting(true);
              setError('');
              const result = await sendMessage('startGuideMe', {
                guideId: guide.id,
                confirmedImpact: requiresConfirmation ? true : undefined,
              });
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
