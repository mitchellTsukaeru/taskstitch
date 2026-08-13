import { Check, FileText, ScanSearch, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import MascotIcon from '@/ui/fullview/components/MascotIcon';

const PHASES = [
  { label: 'Reading your steps', detail: 'Mapping the flow and its actions', icon: FileText },
  { label: 'Checking the context', detail: 'Finding clearer wording and useful detail', icon: ScanSearch },
  { label: 'Preparing suggestions', detail: 'Turning the review into changes you can approve', icon: Sparkles },
] as const;

export function GuideProgressScreen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const first = window.setTimeout(() => setPhase(1), 1_800);
    const second = window.setTimeout(() => setPhase(2), 4_800);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden bg-deep text-white"
      role="status"
      aria-live="polite"
      aria-label={PHASES[phase].label}
    >
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#818cf8_0,transparent_28%),radial-gradient(circle_at_82%_75%,#38bdf8_0,transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#c7d2fe_1px,transparent_1px),linear-gradient(90deg,#c7d2fe_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-8 sm:px-12 sm:py-12">
        <div className="flex items-center gap-3 text-lavender">
          <MascotIcon size={34} />
          <span className="text-xs font-bold uppercase tracking-[0.24em]">TaskStitch workshop</span>
        </div>

        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-violet">Guide review</p>
              <h2 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-6xl">
                Stitching together a clearer guide.
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-lavender sm:text-base">
                Your original stays untouched. You will review every suggested change before anything is applied.
              </p>
            </div>

            <div className="relative rounded-[28px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7">
              <svg
                viewBox="0 0 64 280"
                className="absolute bottom-10 left-[42px] top-10 h-[calc(100%-5rem)] w-4 overflow-visible sm:left-[50px]"
                aria-hidden="true"
              >
                <path d="M32 8 V272" className="stroke-white/15" strokeWidth="5" strokeLinecap="round" />
                <path
                  d="M32 8 V272"
                  className="taskstitch-progress-thread stroke-violet"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="8 12"
                />
              </svg>

              <ol className="relative space-y-4">
                {PHASES.map((item, index) => {
                  const Icon = item.icon;
                  const complete = index < phase;
                  const active = index === phase;
                  return (
                    <li
                      key={item.label}
                      className={`flex min-h-[76px] items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-500 sm:gap-5 sm:px-5 ${
                        active
                          ? 'translate-x-1 border-violet/70 bg-white/[0.12] shadow-lg shadow-black/15'
                          : 'border-transparent bg-transparent'
                      }`}
                    >
                      <span
                        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          complete
                            ? 'border-success bg-success text-white'
                            : active
                              ? 'border-violet bg-violet text-deep'
                              : 'border-white/15 bg-deep text-white/35'
                        }`}
                      >
                        {complete ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                      </span>
                      <span>
                        <span className={`block text-sm font-bold ${index > phase ? 'text-white/35' : 'text-white'}`}>
                          {item.label}
                        </span>
                        <span
                          className={`mt-1 block text-[11px] leading-5 ${active ? 'text-lavender' : 'text-white/30'}`}
                        >
                          {item.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
          This can take a little longer with thinking models
        </p>
      </div>
    </div>
  );
}
