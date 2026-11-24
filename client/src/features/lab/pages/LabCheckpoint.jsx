
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AppNavbar from '../../../components/AppNavbar.jsx';
import LabWorkspace from '../components/LabWorkspace.jsx';

import {
  getLabExercise,
  startLab,
  submitLab,
} from '../labService.js';

function LabCheckpoint() {
  const navigate = useNavigate();
  const { moduleId, labId } = useParams();

  const accessToken = useSelector(
    (state) => state.auth.accessToken
  );

  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Teman';

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Companion
  const [companionOpen, setCompanionOpen] = useState(false);
  const [visibleHintCount, setVisibleHintCount] = useState(0);

  // Success celebration
  const [showCelebration, setShowCelebration] = useState(false);

  // ==========================================
  // LOAD LAB
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadLab = async () => {
      if (!accessToken) {
        setError('Sesi login tidak ditemukan. Silakan login kembali.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setExercise(null);
        setSubmitResult(null);
        setVisibleHintCount(0);
        setShowCelebration(false);

        const labData = await getLabExercise({
          labId,
          token: accessToken,
        });

        const started = await startLab({
          labId,
          token: accessToken,
        });

        if (!isMounted) return;

        setExercise({
          ...labData,
          progress_status:
            started.progress?.status ?? labData.progress_status,
          completed_at:
            started.progress?.completed_at ?? labData.completed_at,
        });
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat Lab.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLab();

    return () => {
      isMounted = false;
    };
  }, [labId, accessToken]);

  // ==========================================
  // SUBMIT LAB
  // ==========================================

  const handleSubmit = useCallback(
    async (code) => {
      if (!accessToken || !exercise || isSubmitting) return;

      try {
        setIsSubmitting(true);
        setSubmitResult(null);
        setShowCelebration(false);

        const result = await submitLab({
          labId,
          token: accessToken,
          code,
        });

        setSubmitResult(result);

        if (result.passed) {
          setExercise((current) => ({
            ...current,
            progress_status: 'completed',
          }));

          // Tampilkan ucapan selamat dari maskot.
          setShowCelebration(true);
        }
      } catch (err) {
        setSubmitResult({
          passed: false,
          message: err.message || 'Gagal mengirim kode Lab.',
          missing_elements: [],
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken, exercise, isSubmitting, labId]
  );

  // ==========================================
  // COMPANION HINT
  // ==========================================

  const requiredElements =
    exercise?.configuration?.validation?.requiredElements || [];

  const hints = [
    {
      title: 'Mulai dari struktur halaman',
      message:
        'Coba bagi halaman HTML kamu menjadi tiga bagian utama. Bagian atas untuk header, bagian tengah untuk konten, dan bagian bawah untuk footer.',
      code: '<header>...</header>\n<main>...</main>\n<footer>...</footer>',
    },
    {
      title: 'Gunakan elemen semantik',
      message:
        'Di dalam main, kamu bisa menggunakan section untuk mengelompokkan informasi profil, hobi, jadwal kuliah, dan formulir kontak.',
      code: '<main>\n  <section>\n    <h1>Profil Mahasiswa</h1>\n    <p>Informasi mahasiswa</p>\n  </section>\n</main>',
    },
    {
      title: 'Periksa kriteria latihan',
      message:
        'Jangan lupa periksa kembali semua elemen wajib. Pastikan setiap elemen benar-benar ditulis di dalam dokumen HTML kamu.',
      code: requiredElements.join(', '),
    },
  ];

  const handleGetHint = () => {
    setVisibleHintCount((current) =>
      Math.min(current + 1, hints.length)
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#0F766E]" />
          <p className="mt-4 text-sm text-slate-500">
            Menyiapkan Interactive Lab...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AppNavbar
          title="Interactive Lab"
          subtitle="WebLab Learning Environment"
          backTo={`/modules/${moduleId}`}
          backLabel="Kembali ke Modul"
        />

        <div className="flex min-h-[65vh] items-center justify-center p-5">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold text-[#172554]">
              Lab tidak dapat dibuka
            </h2>

            <p className="mt-3 text-sm text-red-600">
              {error || 'Data Lab tidak ditemukan.'}
            </p>

            <button
              type="button"
              onClick={() => navigate(`/modules/${moduleId}`)}
              className="mt-6 rounded-xl bg-[#172554] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0F766E]"
            >
              Kembali ke Modul
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172554]">

      <AppNavbar
        title="Interactive Lab"
        subtitle={`Modul ${moduleId} / Latihan Praktik`}
        backTo={`/modules/${moduleId}`}
        backLabel="Kembali ke Modul"
      />

      <main className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* PAGE TITLE */}
        <section className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                  Interactive Lab
                </span>

                <span className="text-xs text-slate-400">
                  Modul {moduleId}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {exercise.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Selesaikan latihan dengan mengikuti instruksi dan menjalankan kode.
              </p>

              {exercise.progress_status === 'completed' && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-semibold text-[#0F766E]">
                  <span>✓</span>
                  Lab ini sudah pernah kamu selesaikan.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* LAB WORKSPACE */}
        <LabWorkspace
          key={labId}
          exercise={exercise}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitResult={submitResult}
        />
      </main>

      {/* FLOATING MASCOT BUTTON */}
      <button
        type="button"
        onClick={() => setCompanionOpen((current) => !current)}
        className="fixed bottom-5 right-4 z-40 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/15 transition duration-200 hover:-translate-y-1 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F766E] sm:bottom-7 sm:right-7 sm:h-[88px] sm:w-[88px]"
        aria-label="Buka teman belajar WebLab"
        aria-expanded={companionOpen}
      >
        <img
          src="/maskot.png"
          alt="Maskot WebLab"
          className="h-full w-full object-contain"
        />

        <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0F766E]" />
      </button>

      {/* MASCOT COMPANION PANEL */}
      {companionOpen && (
        <section
          className="fixed bottom-[108px] right-4 z-50 flex max-h-[min(580px,75vh)] w-[calc(100vw-32px)] max-w-[370px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:bottom-[130px] sm:right-7"
          aria-label="Teman belajar WebLab"
        >
          <div className="flex items-center justify-between bg-[#172554] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <img
                src="/maskot.png"
                alt=""
                className="h-11 w-11 object-contain"
              />

              <div>
                <p className="text-sm font-bold">
                  Teman Belajar WebLab
                </p>
                <p className="text-[10px] text-teal-200">
                  Siap membantu kamu belajar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompanionOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Tutup bantuan"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-start gap-2">
              <img
                src="/maskot.png"
                alt="Maskot WebLab"
                className="h-12 w-12 shrink-0 object-contain"
              />

              <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3">
                <p className="text-xs font-bold text-[#172554]">
                  Hai, {firstName}! 👋
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Lagi mengerjakan {exercise.title}, ya? Kalau kamu
                  mengalami kesulitan, aku bisa memberikan petunjuk
                  supaya kamu bisa menemukan jawabannya sendiri!
                </p>
              </div>
            </div>

            {hints.slice(0, visibleHintCount).map((hint) => (
              <div key={hint.title} className="flex items-start gap-2">
                <img
                  src="/maskot.png"
                  alt=""
                  className="h-9 w-9 shrink-0 object-contain"
                />

                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-teal-100 bg-teal-50 p-3">
                  <p className="text-xs font-bold text-[#0F766E]">
                    {hint.title}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {hint.message}
                  </p>

                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-relaxed text-[#172554]">
                    <code>{hint.code}</code>
                  </pre>
                </div>
              </div>
            ))}

            {visibleHintCount >= hints.length && (
              <p className="pl-11 text-[11px] text-slate-400">
                Semua petunjuk sudah dibuka. Semangat menyelesaikan Lab!
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <button
              type="button"
              onClick={handleGetHint}
              disabled={visibleHintCount >= hints.length}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <span>💡</span>

              {visibleHintCount >= hints.length
                ? 'Semua Petunjuk Sudah Dibuka'
                : visibleHintCount === 0
                  ? 'Berikan Saya Petunjuk'
                  : 'Petunjuk Berikutnya'}
            </button>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Belajar sedikit demi sedikit bersama WebLab.
            </p>
          </div>
        </section>
      )}

      {/* =====================================
          SUCCESS CELEBRATION
      ===================================== */}

      {showCelebration && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172554]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white p-7 text-center shadow-2xl sm:p-9">

            {/* DECORATION */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-teal-50" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-purple-50" />

            {/* MASCOT */}
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
              <div className="absolute inset-3 rounded-full bg-teal-50" />

              <img
                src="/maskot.png"
                alt="Maskot WebLab merayakan keberhasilan"
                className="relative h-full w-full animate-bounce object-contain"
              />

              <span className="absolute right-3 top-3 text-2xl">
                ✨
              </span>

              <span className="absolute bottom-4 left-2 text-xl">
                🎉
              </span>
            </div>

            {/* SUCCESS MESSAGE */}
            <div className="relative">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                <span>✓</span>
                Lab Completed
              </span>

              <h2
                id="success-title"
                className="mt-4 text-2xl font-extrabold tracking-tight text-[#172554] sm:text-3xl"
              >
                Kerja Bagus, {firstName}! 🎉
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Yeay! Kamu berhasil menyelesaikan
                <span className="font-semibold text-[#172554]">
                  {' '}{exercise.title}
                </span>.
                Aku bangga dengan pencapaianmu. Terus semangat belajar
                dan tantang dirimu untuk hal baru!
              </p>

              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-teal-700"
              >
                Keren! Lanjutkan
                <span aria-hidden="true">→</span>
              </button>

              <p className="mt-3 text-[10px] text-slate-400">
                WebLab · Learn. Practice. Build.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LabCheckpoint;
