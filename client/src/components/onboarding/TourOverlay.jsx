
import { useEffect, useState } from 'react';

function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  isLastStep,
  isLoading,
}) {
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    let timeoutId;

    const target = document.querySelector(step.target);

    if (!target) {
      return undefined;
    }

    const previousPosition = target.style.position;
    const previousZIndex = target.style.zIndex;

    const computedPosition = window.getComputedStyle(target).position;

    if (computedPosition === 'static') {
      target.style.position = 'relative';
    }

    target.style.zIndex = '10001';

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    timeoutId = window.setTimeout(updatePosition, 450);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.clearTimeout(timeoutId);

      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);

      target.style.position = previousPosition;
      target.style.zIndex = previousZIndex;
    };
  }, [step]);

  if (!targetRect) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#172554]/70 p-5">
        <div className="rounded-2xl bg-white p-6 text-center shadow-2xl">
          <p className="text-sm font-semibold text-[#172554]">
            Menyiapkan panduan WebLab...
          </p>
        </div>
      </div>
    );
  }

  const spotlightPadding = 8;

  const spotlight = {
    top: targetRect.top - spotlightPadding,
    left: targetRect.left - spotlightPadding,
    width: targetRect.width + spotlightPadding * 2,
    height: targetRect.height + spotlightPadding * 2,
  };

  const cardWidth = Math.min(380, window.innerWidth - 32);

  const cardLeft = Math.min(
    Math.max(
      targetRect.left + targetRect.width / 2 - cardWidth / 2,
      16
    ),
    window.innerWidth - cardWidth - 16
  );

  const estimatedCardHeight = 290;

  const cardTop =
    targetRect.top + targetRect.height + estimatedCardHeight + 20 <
    window.innerHeight
      ? targetRect.top + targetRect.height + 20
      : Math.max(16, targetRect.top - estimatedCardHeight - 20);

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-[#08132F]/75"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none fixed z-[10002] rounded-2xl border-2 border-[#2DD4BF] shadow-[0_0_0_9999px_rgba(8,19,47,0.75),0_0_25px_rgba(45,212,191,0.3)] transition-all duration-300"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="fixed z-[10003] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div className="flex items-center justify-between bg-[#172554] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
              {'</>'}
            </span>

            <span className="text-sm font-bold">
              WebLab Guided Tour
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="text-xs font-medium text-blue-100 transition hover:text-white disabled:opacity-50"
          >
            Lewati
          </button>
        </div>

        <div className="flex gap-3 px-5 pb-4 pt-5">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center">
            <img
              src="/maskot.png"
              alt="Maskot WebLab"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0F766E]">
              Panduan WebLab
            </p>

            <h2
              id="tour-title"
              className="text-base font-bold leading-snug text-[#172554]"
            >
              {step.title}
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {step.description}
            </p>
          </div>
        </div>

        <div className="px-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>
              Langkah {stepIndex + 1} dari {totalSteps}
            </span>

            <span>
              {Math.round(((stepIndex + 1) / totalSteps) * 100)}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0F766E] transition-all duration-300"
              style={{
                width: `${((stepIndex + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0 || isLoading}
            className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Sebelumnya
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading
              ? 'Menyimpan...'
              : isLastStep
                ? 'Selesai'
                : 'Selanjutnya →'}
          </button>
        </div>
      </section>
    </>
  );
}

export default TourOverlay;
