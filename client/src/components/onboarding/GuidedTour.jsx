import { useState } from 'react';
import TourOverlay from './TourOverlay.jsx';
import { tourSteps } from './tourSteps.js';

function GuidedTour({ accessToken, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const completeTour = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${apiUrl}/api/onboarding/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Gagal menyimpan status Guided Tour.'
        );
      }

      onComplete();
    } catch (err) {
      console.error('Guided Tour error:', err);
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);
      setError('');
      return;
    }

    completeTour();
  };

  const handleBack = () => {
    setCurrentStep((previous) => Math.max(0, previous - 1));
    setError('');
  };

  const handleSkip = () => {
    completeTour();
  };

  return (
    <>
      <TourOverlay
        step={tourSteps[currentStep]}
        stepIndex={currentStep}
        totalSteps={tourSteps.length}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        isLastStep={currentStep === tourSteps.length - 1}
        isLoading={isLoading}
      />

      {error && (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-[10010] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 text-center text-xs font-medium text-red-600 shadow-xl"
        >
          {error}
          <p className="mt-1 text-[11px] text-slate-500">
            Periksa koneksi server, lalu coba lagi.
          </p>
        </div>
      )}
    </>
  );
}

export default GuidedTour;