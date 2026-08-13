import { AlertTriangle, ChevronDown, ExternalLink, Eye, FileUp, Globe2, ShieldAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getGuideSiteSummaries } from '@/core/guideme/urls';
import { guideImpact } from '@/core/guides/impact';
import { importTaskStitchPackage, readTaskStitchFile, type TaskStitchPackage } from '@/core/guides/portable';
import type { Step } from '@/core/guides/types';
import { sendMessage } from '@/lib/messaging';
import { Button } from '@/ui/components/ui/button';

export function ImportGuideDialog({
  file,
  onClose,
  onImported,
  onBeforeStart,
}: {
  file: File;
  onClose: () => void;
  onImported: (guideId: string, started: boolean) => void;
  onBeforeStart?: () => void;
}) {
  const [portable, setPortable] = useState<TaskStitchPackage>();
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(true);

  useEffect(() => {
    readTaskStitchFile(file)
      .then(setPortable)
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : 'The guide could not be read');
      });
  }, [file]);

  const impact = guideImpact(portable?.guide.impact);
  const sites = useMemo(
    () =>
      portable
        ? getGuideSiteSummaries(
            portable.steps.map(
              (step, index) =>
                ({
                  id: `preview-${index}`,
                  guideId: 'preview',
                  index,
                  description: step.description,
                  action: step.action,
                  url: step.url,
                  timestamp: 0,
                }) satisfies Step,
            ),
            portable.guide.guideMeOrigins,
          )
        : [],
    [portable],
  );
  const requiresConfirmation = portable?.guide.impact !== 'read_only';
  const Icon = impact.tone === 'danger' ? ShieldAlert : impact.tone === 'safe' ? Eye : AlertTriangle;
  const toneClass =
    impact.tone === 'danger'
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : impact.tone === 'safe'
        ? 'border-success/30 bg-success/5 text-success'
        : 'border-amber-300 bg-amber-50 text-amber-800';

  async function importGuide(start: boolean) {
    if (!portable || !confirmed) return;
    if (start) onBeforeStart?.();
    setImporting(true);
    setError('');
    try {
      const guideId = await importTaskStitchPackage(portable);
      if (!start) {
        onImported(guideId, false);
        return;
      }
      const result = await sendMessage('startGuideMe', {
        guideId,
        confirmedImpact: requiresConfirmation,
      });
      if (!result.started) {
        setError(result.error || 'The guide was imported, but Guide Me could not start');
        onImported(guideId, false);
        return;
      }
      onImported(guideId, true);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Import interactive guide</h2>
            <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground">{file.name}</p>
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
          {!portable && !error && <p className="text-xs text-muted-foreground">Checking guide package…</p>}
          {portable && (
            <>
              <div>
                <p className="text-sm font-bold text-foreground">{portable.guide.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {portable.steps.length} steps · Package version {portable.version}
                </p>
              </div>
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
                          <span className="truncate">{new URL(site.targetOrigin).hostname}</span>
                          <span className={`ml-auto shrink-0 text-[9px] ${index ? 'text-amber-700' : 'text-success'}`}>
                            {site.mapped ? 'Changed from recorded site' : index ? 'External site' : 'Primary site'}
                          </span>
                        </div>
                        <p className="ml-5 mt-1 break-all font-mono text-[9px] text-muted-foreground">
                          {site.startUrl}
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
                {portable.guide.impactNote && (
                  <p className="mt-2 border-t border-current/15 pt-2 text-xs">{portable.guide.impactNote}</p>
                )}
              </div>
              {portable && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-0.5 accent-accent"
                  />
                  {requiresConfirmation
                    ? 'I reviewed this classification and understand that following the guide may change live data.'
                    : 'I reviewed this guide and confirm it is intended to be view-only.'}
                </label>
              )}
            </>
          )}
          {error && <div className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {portable && (
            <>
              <Button variant="secondary" disabled={importing || !confirmed} onClick={() => importGuide(false)}>
                Import only
              </Button>
              <Button disabled={importing || !confirmed} onClick={() => importGuide(true)}>
                <FileUp size={14} /> {importing ? 'Importing…' : 'Import and start'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
