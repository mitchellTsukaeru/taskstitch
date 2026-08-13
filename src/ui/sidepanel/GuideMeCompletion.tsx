import { useEffect, useState } from 'react';
import { i18n } from '#imports';
import { getGuide } from '@/core/guides/service';
import type { Guide, Step } from '@/core/guides/types';
import MascotIcon from '@/ui/fullview/components/MascotIcon';
import { GuideMeStartDialog } from '@/ui/shared/GuideMeStartDialog';

interface GuideMeCompletionProps {
  guideId: string;
  onDone: () => void;
  onRunAgain: (guideId: string) => void;
}

function CoolMascot() {
  return <MascotIcon size={120} />;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GuideMeCompletion({ guideId, onDone, onRunAgain }: GuideMeCompletionProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [guide, setGuide] = useState<Guide>();
  const [startingAgain, setStartingAgain] = useState(false);

  useEffect(() => {
    getGuide(guideId).then((result) => {
      if (!result) return;
      setGuide(result.guide);
      setSteps(result.steps);
    });
  }, [guideId]);

  return (
    <div className="min-h-screen bg-card flex flex-col px-7">
      {startingAgain && guide && (
        <GuideMeStartDialog
          guide={guide}
          steps={steps}
          onClose={() => setStartingAgain(false)}
          onStarted={() => {
            setStartingAgain(false);
            onRunAgain(guideId);
          }}
        />
      )}
      <div className="flex flex-col items-center text-center pt-10 pb-4">
        <CoolMascot />
        <h1 className="text-[22px] font-[800] text-foreground mb-2">{i18n.t('guidemeCompletion.title')}</h1>
        <p className="text-[13px] text-muted-foreground">
          {i18n.t('guidemeCompletion.stepsCompletedPlural', [String(steps.length)])}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="flex flex-col gap-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2.5 text-left">
              <div className="w-[22px] h-[22px] rounded-full bg-success flex items-center justify-center shrink-0">
                <CheckIcon />
              </div>
              <span className="text-[13px] text-muted-foreground">{step.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 py-5">
        <button
          onClick={onDone}
          className="flex-1 py-3.5 rounded-lg font-semibold text-sm bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-colors"
        >
          {i18n.t('guidemeCompletion.allDone')}
        </button>
        <button
          onClick={() => setStartingAgain(true)}
          className="flex-1 py-3.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {i18n.t('guidemeCompletion.runAgain')}
        </button>
      </div>
    </div>
  );
}
