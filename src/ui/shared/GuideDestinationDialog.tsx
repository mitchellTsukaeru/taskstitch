import { ArrowRight, CheckCircle2, ChevronDown, ExternalLink, Globe2, Replace, Route, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getGuideSiteSummaries, normalizeHttpOrigin, resolveGuideMeUrl } from '@/core/guideme/urls';
import { updateGuideOriginMapping } from '@/core/guides/service';
import type { Guide, Step } from '@/core/guides/types';
import { Button } from '@/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/ui/dialog';

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

export function GuideDestinationDialog({
  guide,
  steps,
  onClose,
  onSaved,
}: {
  guide: Guide;
  steps: Step[];
  onClose: () => void;
  onSaved: (guideMeOrigins: Guide['guideMeOrigins']) => void;
}) {
  const sites = useMemo(() => getGuideSiteSummaries(steps, guide.guideMeOrigins), [guide, steps]);
  const [selectedOrigin, setSelectedOrigin] = useState(sites[0]?.sourceOrigin ?? '');
  const selected = sites.find((site) => site.sourceOrigin === selectedOrigin) ?? sites[0];
  const [target, setTarget] = useState(selected?.targetOrigin ?? '');
  const [sitesOpen, setSitesOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const normalizedTarget = normalizeHttpOrigin(target);
  const validTargetOrigin =
    normalizedTarget && (!selected?.sourceOrigin.startsWith('https://') || normalizedTarget.startsWith('https://'))
      ? normalizedTarget
      : null;
  const resultingUrl =
    selected && validTargetOrigin
      ? resolveGuideMeUrl(selected.startUrl, { [selected.targetOrigin]: validTargetOrigin })
      : '';

  const selectSite = (sourceOrigin: string) => {
    const site = sites.find((item) => item.sourceOrigin === sourceOrigin);
    if (!site) return;
    setSelectedOrigin(sourceOrigin);
    setTarget(site.targetOrigin);
    setError('');
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-secondary/40 px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-violet">
              <Route size={18} />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">Edit Guide Me destination</DialogTitle>
              <DialogDescription className="mt-1 text-[11px] leading-relaxed">
                Choose where matching guide links should open when someone runs this guide.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-foreground">Primary site mapping</p>
                <p className="text-[10px] text-muted-foreground">
                  Applies to {selected.stepIndices.length} {selected.stepIndices.length === 1 ? 'step' : 'steps'}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <div className="block min-w-0">
                  <label
                    htmlFor="guide-destination-recorded-origin"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Recorded site
                  </label>
                  <input
                    id="guide-destination-recorded-origin"
                    readOnly
                    value={selected.sourceOrigin}
                    className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-xs text-muted-foreground outline-none"
                  />
                </div>
                <ArrowRight size={15} className="mb-3 hidden text-accent sm:block" />
                <div className="block min-w-0">
                  <label
                    htmlFor="guide-destination-target-origin"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Run Guide Me on
                  </label>
                  <input
                    id="guide-destination-target-origin"
                    value={target}
                    onChange={(event) => {
                      setTarget(event.target.value);
                      setError('');
                    }}
                    spellCheck={false}
                    inputMode="url"
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                  <button
                    type="button"
                    onClick={() => setTarget(selected.sourceOrigin)}
                    className="mt-1.5 text-[10px] font-bold text-accent hover:underline"
                  >
                    Use recorded site
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2.5 text-[11px] leading-relaxed">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
                <span className="min-w-0 text-muted-foreground">
                  <strong className="text-foreground">Resulting start page:</strong>{' '}
                  <span className="break-all font-mono text-[10px] text-foreground">
                    {resultingUrl ||
                      (normalizedTarget
                        ? 'HTTPS guides cannot be mapped to an HTTP site'
                        : 'Enter a valid HTTP or HTTPS site')}
                  </span>
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  aria-expanded={sitesOpen}
                  onClick={() => setSitesOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-xs font-bold text-foreground hover:bg-secondary/40"
                >
                  <Globe2 size={14} className="text-accent" /> Sites used by this guide
                  <span className="font-normal text-muted-foreground">{sites.length} sites</span>
                  <ChevronDown size={14} className={`ml-auto transition-transform ${sitesOpen ? 'rotate-180' : ''}`} />
                </button>
                {sitesOpen && (
                  <div className="space-y-1 border-t border-border p-2">
                    {sites.map((site, index) => (
                      <button
                        key={site.sourceOrigin}
                        type="button"
                        onClick={() => selectSite(site.sourceOrigin)}
                        className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                          selected.sourceOrigin === site.sourceOrigin ? 'bg-secondary' : 'hover:bg-secondary/50'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                          {index === 0 ? <Replace size={13} /> : <ExternalLink size={13} />}
                          <span className="truncate">{hostname(site.sourceOrigin)}</span>
                          <span
                            className={`ml-auto shrink-0 text-[9px] ${site.mapped ? 'text-success' : index ? 'text-amber-700' : 'text-muted-foreground'}`}
                          >
                            {site.mapped
                              ? `Mapped to ${hostname(site.targetOrigin)}`
                              : index
                                ? 'Uses recorded site'
                                : 'Unchanged'}
                          </span>
                        </span>
                        <span className="ml-5 mt-1 block text-[9px] text-muted-foreground">
                          {stepRange(site.stepIndices)} · {site.firstPath}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-accent" />
                Only the selected site origin changes. TaskStitch preserves each path and shows all final destinations
                to the runner before starting.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">This guide has no web destinations to edit.</p>
          )}
          {error && <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="border-t border-border bg-secondary/20 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected || !validTargetOrigin || saving}
            onClick={async () => {
              if (!selected || !validTargetOrigin) return;
              setSaving(true);
              setError('');
              try {
                await updateGuideOriginMapping(guide.id, selected.sourceOrigin, validTargetOrigin);
                const guideMeOrigins = { ...(guide.guideMeOrigins ?? {}) };
                if (selected.sourceOrigin === validTargetOrigin) delete guideMeOrigins[selected.sourceOrigin];
                else guideMeOrigins[selected.sourceOrigin] = validTargetOrigin;
                onSaved(Object.keys(guideMeOrigins).length ? guideMeOrigins : undefined);
                onClose();
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : 'The destination could not be saved');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Save destination'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
