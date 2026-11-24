








import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import AppNavbar from '../../../components/AppNavbar.jsx';

import {
  fetchModuleDetail,
  clearModuleDetail,
} from '../learningSlice';

function ModuleDetail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moduleId } = useParams();

  const { accessToken } = useSelector((state) => state.auth);

  const {
    moduleDetail,
    detailStatus,
    detailError,
  } = useSelector((state) => state.learning);

  const [quizHistory, setQuizHistory] = useState(null);
  const [quizHistoryLoading, setQuizHistoryLoading] = useState(false);

  // =====================================================
  // FETCH MODULE DETAIL
  // =====================================================

  useEffect(() => {
    if (accessToken && moduleId) {
      dispatch(fetchModuleDetail({ moduleId, token: accessToken }));
    }

    return () => {
      dispatch(clearModuleDetail());
    };
  }, [dispatch, moduleId, accessToken]);

  // =====================================================
  // FETCH QUIZ HISTORY
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const fetchQuizHistory = async () => {
      if (!accessToken || !moduleId) {
        setQuizHistory(null);
        return;
      }

      try {
        setQuizHistoryLoading(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/quiz/module/${moduleId}/status`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Gagal mengambil riwayat Quiz.'
          );
        }

        if (isMounted) {
          setQuizHistory(result.data);
        }
      } catch (error) {
        console.error('FETCH QUIZ HISTORY ERROR:', error);

        if (isMounted) {
          setQuizHistory(null);
        }
      } finally {
        if (isMounted) {
          setQuizHistoryLoading(false);
        }
      }
    };

    fetchQuizHistory();

    return () => {
      isMounted = false;
    };
  }, [accessToken, moduleId]);

  // =====================================================
  // MODULE DATA
  // =====================================================

  const moduleData =
    moduleDetail?.data?.module ??
    moduleDetail?.module ??
    moduleDetail?.data ??
    moduleDetail;

  const submodules = Array.isArray(moduleData?.submodules)
    ? [...moduleData.submodules].sort(
        (a, b) => a.sort_order - b.sort_order
      )
    : [];

  const labCheckpoints = Array.isArray(moduleData?.lab_checkpoints)
    ? [...moduleData.lab_checkpoints].sort(
        (a, b) => a.sort_order - b.sort_order
      )
    : [];

  // Quiz hanya tersedia mulai Modul 2. Modul 1 tidak menggunakan Quiz.
  const isQuizAvailable = Number(moduleData?.sort_order) > 1;

  // =====================================================
  // PROGRESS
  // =====================================================

  const totalSubmodules = submodules.length;

  const completedSubmodules = submodules.filter(
    (submodule) =>
      submodule.is_completed === true ||
      submodule.is_completed === 1
  ).length;

  const completedLabs = labCheckpoints.filter(
    (lab) =>
      lab.is_completed === true ||
      lab.is_completed === 1
  ).length;

  const progress =
    totalSubmodules > 0
      ? Math.round(
          (completedSubmodules / totalSubmodules) * 100
        )
      : 0;

  // =====================================================
  // QUIZ STATUS
  // =====================================================

  const isQuizUnlocked =
    isQuizAvailable &&
    submodules.length > 0 &&
    submodules.every(
      (submodule) =>
        submodule.is_completed === true ||
        submodule.is_completed === 1
    ) &&
    labCheckpoints.every(
      (lab) =>
        lab.is_completed === true ||
        lab.is_completed === 1
    );

  const hasBeenAttempted =
    quizHistory?.has_been_attempted === true;

  const latestAttempt = quizHistory?.latest_attempt ?? null;

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSubmoduleClick = (submodule) => {
    if (submodule.is_unlocked === false) return;

    navigate(`/modules/${moduleId}/submodules/${submodule.id}`);
  };

  const handleLabClick = (lab) => {
    if (lab.is_unlocked === false) return;

    navigate(`/modules/${moduleId}/labs/${lab.id}`);
  };

  const handleQuizClick = () => {
    if (!isQuizAvailable || !isQuizUnlocked) return;

    navigate(`/modules/${moduleId}/quiz`);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (detailStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-teal-700"></span>

          <p className="mt-4 text-sm text-slate-500">
            Memuat detail modul...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (
    detailStatus === 'failed' ||
    detailStatus === 'rejected'
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Gagal Memuat Modul
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {detailError ||
              'Terjadi kesalahan saat mengambil data modul.'}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={handleBack}
              className="btn btn-outline border-slate-300"
            >
              Kembali
            </button>

            <button
              onClick={() =>
                dispatch(
                  fetchModuleDetail({
                    moduleId,
                    token: accessToken,
                  })
                )
              }
              className="btn bg-teal-700 text-white hover:bg-teal-800"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MODULE NOT FOUND
  // =====================================================

  if (!moduleData || !moduleData.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Modul Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Data modul tidak tersedia.
          </p>

          <button
            onClick={handleBack}
            className="btn mt-5 bg-teal-700 text-white hover:bg-teal-800"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      <AppNavbar
        title={moduleData.title}
        subtitle="Detail Modul Pembelajaran"
        backTo="/dashboard"
        backLabel="Kembali ke Dashboard"
      />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={handleBack}
            className="transition hover:text-teal-700"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-slate-800">
            {moduleData.title}
          </span>
        </div>

        {/* Module Header */}
        <section className="overflow-hidden rounded-3xl bg-blue-950 text-white shadow-sm">
          <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200">
                MATERI PEMBELAJARAN
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {moduleData.title}
              </h1>

              <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">
                {moduleData.description ||
                  'Pelajari materi dan selesaikan setiap submodul untuk meningkatkan pemahamanmu.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-300">
                <span>📚 {totalSubmodules} Submodul</span>
                <span>✓ {completedSubmodules} Selesai</span>
                <span>💻 {labCheckpoints.length} Lab</span>
              </div>
            </div>

            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/10">
              <span className="text-4xl font-bold">
                {progress}%
              </span>

              <span className="mt-1 text-xs text-slate-300">
                Progres Belajar
              </span>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Progres Pembelajaran
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Selesaikan seluruh submodul untuk menuntaskan materi.
              </p>
            </div>

            <span className="text-sm font-bold text-teal-700">
              {completedSubmodules}/{totalSubmodules}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-700 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {progress === 100
              ? 'Selamat! Kamu telah menyelesaikan seluruh submodul.'
              : `Kamu telah menyelesaikan ${progress}% materi pembelajaran.`}
          </p>
        </section>

        {/* Submodule List */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Daftar Submodul
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ikuti pembelajaran secara berurutan untuk memahami materi dengan baik.
            </p>
          </div>

          {submodules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="text-4xl">📖</div>

              <h3 className="mt-4 font-bold text-slate-800">
                Belum Ada Submodul
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Submodul untuk materi ini belum tersedia.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submodules.map((submodule, index) => {
                const isCompleted =
                  submodule.is_completed === true ||
                  submodule.is_completed === 1;

                const isLocked =
                  submodule.is_unlocked === false;

                const lessons = Array.isArray(submodule.lessons)
                  ? submodule.lessons
                  : [];

                return (
                  <article
                    key={submodule.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                      isLocked
                        ? 'border-slate-200 opacity-70'
                        : 'border-slate-200 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                          isCompleted
                            ? 'bg-teal-100 text-teal-700'
                            : isLocked
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-blue-50 text-blue-950'
                        }`}
                      >
                        {isCompleted
                          ? '✓'
                          : isLocked
                            ? '🔒'
                            : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            SUBMODUL {index + 1}
                          </span>

                          {isCompleted && (
                            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                              Selesai
                            </span>
                          )}

                          {isLocked && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              Terkunci
                            </span>
                          )}

                          {!isCompleted && !isLocked && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              Belum Selesai
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {submodule.title}
                        </h3>

                        {submodule.description && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">
                            {submodule.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                          {submodule.estimated_minutes && (
                            <span>
                              ◷ {submodule.estimated_minutes} menit
                            </span>
                          )}

                          {lessons.length > 0 && (
                            <span>
                              📄 {lessons.length} Materi
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() =>
                            handleSubmoduleClick(submodule)
                          }
                          disabled={isLocked}
                          className={`btn w-full sm:w-auto ${
                            isLocked
                              ? 'btn-disabled'
                              : isCompleted
                                ? 'btn-outline border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white'
                                : 'border-none bg-teal-700 text-white hover:bg-teal-800'
                          }`}
                        >
                          {isLocked
                            ? 'Terkunci'
                            : isCompleted
                              ? 'Lihat Materi'
                              : 'Mulai Belajar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Lab Checkpoints */}
        <section className="mt-12">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💻</span>

              <h2 className="text-2xl font-bold text-slate-900">
                Praktik Lab
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Terapkan materi yang sudah kamu pelajari melalui latihan coding interaktif.
            </p>
          </div>

          {labCheckpoints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold text-slate-700">
                Belum Ada Lab
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Lab untuk modul ini belum tersedia.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {labCheckpoints.map((lab, index) => {
                const isCompleted =
                  lab.is_completed === true ||
                  lab.is_completed === 1;

                const isLocked =
                  lab.is_unlocked === false;

                const requiredSubmodules = Array.isArray(
                  lab.required_submodules
                )
                  ? lab.required_submodules
                  : [];

                const completedRequirements =
                  requiredSubmodules.filter(
                    (item) =>
                      item.is_completed === true ||
                      item.is_completed === 1
                  ).length;

                return (
                  <article
                    key={lab.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                      isLocked
                        ? 'border-slate-200 opacity-70'
                        : 'border-slate-200 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                          isCompleted
                            ? 'bg-teal-100 text-teal-700'
                            : isLocked
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        {isCompleted
                          ? '✓'
                          : isLocked
                            ? '🔒'
                            : '⌨️'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            LAB {index + 1}
                          </span>

                          {isCompleted && (
                            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                              Selesai
                            </span>
                          )}

                          {isLocked && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              Terkunci
                            </span>
                          )}

                          {!isCompleted && !isLocked && (
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                              Siap Dikerjakan
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {lab.title}
                        </h3>

                        {lab.instructions && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">
                            {lab.instructions}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                          <span>
                            Bahasa: {lab.language?.toUpperCase() || '-'}
                          </span>

                          <span>
                            Prasyarat: {completedRequirements}/
                            {requiredSubmodules.length} submodul selesai
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => handleLabClick(lab)}
                          disabled={isLocked}
                          className={`btn w-full sm:w-auto ${
                            isLocked
                              ? 'btn-disabled'
                              : isCompleted
                                ? 'btn-outline border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white'
                                : 'border-none bg-teal-700 text-white hover:bg-teal-800'
                          }`}
                        >
                          {isLocked
                            ? 'Terkunci'
                            : isCompleted
                              ? 'Lihat Kembali'
                              : 'Mulai Praktik'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quiz Akhir Modul: hanya ditampilkan mulai Modul 2 */}
        {isQuizAvailable && (
        <section className="mt-12">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>

              <h2 className="text-2xl font-bold text-slate-900">
                Quiz Akhir Modul
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Uji pemahamanmu terhadap seluruh materi sebelum melanjutkan
              ke modul berikutnya.
            </p>
          </div>

          <article
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              isQuizUnlocked
                ? 'border-teal-200'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                  isQuizUnlocked
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isQuizUnlocked ? '📝' : '🔒'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    EVALUASI AKHIR
                  </span>

                  {quizHistoryLoading ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Memuat status...
                    </span>
                  ) : hasBeenAttempted ? (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Sudah Dikerjakan
                    </span>
                  ) : isQuizUnlocked ? (
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                      Siap Dikerjakan
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Belum Tersedia
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Quiz {moduleData.title}
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Selesaikan seluruh submodul dan Praktik Lab untuk
                  membuka Quiz. Kamu perlu memperoleh nilai minimal
                  80 untuk dinyatakan lulus.
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>📝 5 Soal</span>
                  <span>🎯 Nilai kelulusan: 80</span>
                  <span>⭐ Total nilai: 100</span>
                </div>

                {hasBeenAttempted && latestAttempt && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-600">
                      Nilai terakhir: {latestAttempt.score ?? 0}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 font-semibold ${
                        latestAttempt.is_passed
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {latestAttempt.is_passed
                        ? 'Lulus'
                        : 'Belum Lulus'}
                    </span>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleQuizClick}
                  disabled={!isQuizUnlocked || quizHistoryLoading}
                  className={`btn w-full sm:w-auto ${
                    isQuizUnlocked && !quizHistoryLoading
                      ? 'border-none bg-teal-700 text-white hover:bg-teal-800'
                      : 'btn-disabled'
                  }`}
                >
                  {!isQuizUnlocked
                    ? 'Selesaikan Materi & Lab'
                    : hasBeenAttempted
                      ? 'Ulangi Quiz'
                      : 'Mulai Quiz'}
                </button>
              </div>
            </div>

            {!isQuizUnlocked && (
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                <p className="text-xs text-slate-500">
                  Syarat Quiz: {completedSubmodules}/{totalSubmodules}
                  {' '}submodul dan {completedLabs}/{labCheckpoints.length} Lab selesai.
                </p>
              </div>
            )}
          </article>
        </section>
        )}

        {/* Bottom Navigation */}
        <div className="mt-10 flex justify-start border-t border-slate-200 pt-6">
          <button
            onClick={handleBack}
            className="btn btn-outline border-slate-300 text-slate-600 hover:border-teal-700 hover:bg-teal-700 hover:text-white"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-slate-400 lg:px-8">
          © {new Date().getFullYear()} WebLab. Belajar Web Development dengan Interaktif.
        </div>
      </footer>
    </div>
  );
}

export default ModuleDetail;





