import { Check, Eye, EyeOff, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { browser } from '#imports';
import { type GuideImprovementProposal, selectRepresentativeSteps } from '@/core/capture/ai/improve';
import { applyGuideImprovements, getGuide } from '@/core/guides/service';
import { localStorage } from '@/lib/browser-api';
import { sendMessage } from '@/lib/messaging';
import { Button } from '@/ui/components/ui/button';
import { GuideProgressScreen } from './GuideProgressScreen';

export function ImproveGuideDialog({
  guideId,
  onClose,
  onApplied,
}: {
  guideId: string;
  onClose: () => void;
  onApplied: () => Promise<void> | void;
}) {
  const [includeScreenshots, setIncludeScreenshots] = useState(false);
  const [providerLabel, setProviderLabel] = useState('your configured provider');
  const [proposal, setProposal] = useState<GuideImprovementProposal>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [useTitle, setUseTitle] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUnsupported, setImageUnsupported] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);

  useEffect(() => {
    localStorage.get(['aiIncludeScreenshots', 'aiProvider', 'aiModel']).then((settings) => {
      setIncludeScreenshots(settings.aiIncludeScreenshots === true);
      setProviderLabel(`${String(settings.aiProvider || 'OpenAI')} · ${String(settings.aiModel || 'default model')}`);
    });
    getGuide(guideId).then((data) => {
      if (data) setScreenshotCount(selectRepresentativeSteps(data.steps, data.screenshots).length);
    });
  }, [guideId]);

  async function requestProposal(withImages: boolean) {
    setLoading(true);
    setError('');
    setImageUnsupported(false);
    await localStorage.set({ aiIncludeScreenshots: withImages });
    try {
      const result = await sendMessage('improveGuide', { guideId, includeScreenshots: withImages });
      if (!result.success) {
        setError(result.error);
        setImageUnsupported(Boolean(result.imageUnsupported));
        if (result.needsConfiguration) void browser.runtime.openOptionsPage();
        return;
      }
      setProposal(result.proposal);
      setUseTitle(Boolean(result.proposal.proposedTitle));
      setSelected(new Set(result.proposal.descriptions.map((item) => item.stepId)));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <GuideProgressScreen />;

  return (
    <div className="fixed inset-0 z-50 bg-deep/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/40">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles size={17} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">Improve guide</h2>
              <p className="text-[11px] text-muted-foreground">Review every suggestion before it changes your guide.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {!proposal ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/25 p-4 text-xs leading-relaxed text-foreground">
                TaskStitch sends step order, action types, descriptions, safe target labels, and hostnames to{' '}
                {providerLabel}. It never sends typed values, API credentials, or rich-text JSON.
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-accent/60">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-accent"
                  checked={includeScreenshots}
                  onChange={(event) => setIncludeScreenshots(event.target.checked)}
                />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    {includeScreenshots ? <Eye size={13} /> : <EyeOff size={13} />} Include representative screenshots
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-1">
                    {screenshotCount} saved, blurred-as-shown representative{' '}
                    {screenshotCount === 1 ? 'frame is' : 'frames are'} downscaled and sent for visual context. Confirm
                    this choice for each request.
                  </span>
                </span>
              </label>
              {error && <div className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
              <div className="flex justify-end gap-2">
                {imageUnsupported && (
                  <Button variant="secondary" onClick={() => requestProposal(false)}>
                    Retry text only
                  </Button>
                )}
                <Button onClick={() => requestProposal(includeScreenshots)}>Generate suggestions</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {proposal.screenshotsSent > 0 && (
                <p className="text-[10px] font-medium text-muted-foreground">
                  Analysed {proposal.screenshotsSent} representative screenshots
                </p>
              )}
              {proposal.proposedTitle && (
                <label className="block rounded-xl border border-border p-4 cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <input
                      type="checkbox"
                      checked={useTitle}
                      onChange={(event) => setUseTitle(event.target.checked)}
                      className="accent-accent"
                    />{' '}
                    Suggested title
                  </span>
                  <span className="mt-3 grid grid-cols-[72px_1fr] gap-2 text-xs">
                    <span className="text-muted-foreground">Current</span>
                    <span>{proposal.baselineTitle}</span>
                    <span className="text-muted-foreground">Proposed</span>
                    <span className="font-semibold text-accent">{proposal.proposedTitle}</span>
                  </span>
                </label>
              )}
              {proposal.descriptions.map((item) => (
                <label
                  key={item.stepId}
                  className="block rounded-xl border border-border p-4 cursor-pointer hover:border-accent/50"
                >
                  <span className="flex gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-accent"
                      checked={selected.has(item.stepId)}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(item.stepId);
                          else next.delete(item.stepId);
                          return next;
                        })
                      }
                    />
                    <span className="grid flex-1 grid-cols-[64px_1fr] gap-x-2 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Current</span>
                      <span>{item.original}</span>
                      <span className="text-muted-foreground">Proposed</span>
                      <span className="font-medium text-accent">{item.proposed}</span>
                    </span>
                  </span>
                </label>
              ))}
              {proposal.descriptions.length === 0 && !proposal.proposedTitle && (
                <p className="text-xs text-muted-foreground">No changes were proposed.</p>
              )}
            </div>
          )}
        </div>

        {proposal && (
          <div className="border-t border-border px-5 py-3 flex justify-end gap-2 bg-secondary/20">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await applyGuideImprovements(
                  guideId,
                  proposal.baselineTitle,
                  useTitle ? proposal.proposedTitle : undefined,
                  proposal.descriptions.filter((item) => selected.has(item.stepId)),
                );
                await onApplied();
                onClose();
              }}
            >
              <Check size={15} /> Apply selected
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
