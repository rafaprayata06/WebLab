
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';

import AppNavbar from '../../../components/AppNavbar.jsx';

import {
  fetchModuleDetail,
  fetchModules,
  clearModuleDetail,
  beginSubmodule,
  saveReadingProgress,
  finishLesson,
} from '../learningSlice';

// ======================================================
// RENDERER KONTEN MATERI
// ======================================================

function ContentBlock({ block }) {
  if (!block) return null;

  switch (block.type) {
    case 'heading':
      return (
        <h2 className="mb-4 mt-9 text-xl font-bold text-[#172554]">
          {block.content || block.text || block.title}
        </h2>
      );

    case 'paragraph':
      return (
        <p className="mb-5 whitespace-pre-line text-[15px] leading-8 text-slate-600">
          {block.content || block.text}
        </p>
      );

    case 'list':
      return block.ordered ? (
        <ol className="mb-6 ml-6 list-decimal space-y-3 text-[15px] leading-7 text-slate-600">
          {(block.items || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="mb-6 ml-6 list-disc space-y-3 text-[15px] leading-7 text-slate-600">
          {(block.items || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );

    case 'code':
      return (
        <div className="my-7 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between bg-slate-800 px-5 py-3 text-xs text-slate-300">
            <span>{block.filename || 'Contoh kode'}</span>
            <span>{block.language || 'Code'}</span>
          </div>

          <pre className="overflow-x-auto bg-[#0F172A] p-5 text-sm leading-7 text-green-300">
            <code>{block.content || ''}</code>
          </pre>
        </div>
      );

    case 'callout': {
      const variants = {
        info: 'border-blue-300 bg-blue-50 text-blue-900',
        warning: 'border-amber-300 bg-amber-50 text-amber-900',
        success: 'border-teal-300 bg-teal-50 text-teal-900',
        danger: 'border-red-300 bg-red-50 text-red-900',
      };

      return (
        <div
          className={`my-6 rounded-xl border-l-4 p-5 ${
            variants[block.variant] || variants.info
          }`}
        >
          {block.title && (
            <h3 className="mb-2 font-bold">{block.title}</h3>
          )}

          <p className="whitespace-pre-line text-sm leading-7">
            {block.content}
          </p>
        </div>
      );
    }

    case 'table':
      return (
        <div className="my-7 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                {(block.headers || []).map((header, index) => (
                  <th
                    key={index}
                    className="border-b border-slate-200 p-4 font-bold text-slate-800"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(block.rows || []).map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-100 last:border-0"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="p-4 text-slate-600"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'diagram':
      return (
        <div className="my-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
          {block.title && (
            <h3 className="mb-5 text-center font-bold text-slate-800">
              {block.title}
            </h3>
          )}

          <div className="flex flex-col items-center gap-2">
            {(block.steps || []).map((step, index) => (
              <div key={index} className="w-full max-w-md">
                <div className="rounded-xl border border-teal-200 bg-white p-4 text-center text-sm font-medium text-slate-700 shadow-sm">
                  {typeof step === 'string'
                    ? step
                    : step.label || step.title || step.content}
                </div>

                {index !== block.steps.length - 1 && (
                  <div className="py-1 text-center text-xl text-teal-700">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ======================================================
// HALAMAN PEMBELAJARAN
// ======================================================

function SubmoduleLearningContent({ moduleId, submoduleId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken } = useSelector(
    (state) => state.auth
  );

  const {
    moduleDetail,
    detailStatus,
    detailError,
    modules,
    status: modulesStatus,
  } = useSelector((state) => state.learning);

  const [activeLessonIndex, setActiveLessonIndex] = useState(
    () => location.state?.initialLessonIndex ?? 0
  );

  const lastSavedProgress = useRef(-1);
  const completionRequested = useRef(false);

  // ======================================================
  // FETCH DETAIL MODUL
  // ======================================================

  useEffect(() => {
    if (accessToken && moduleId) {
      dispatch(fetchModuleDetail({ moduleId, token: accessToken }));
    }

    return () => {
      dispatch(clearModuleDetail());
    };
  }, [dispatch, moduleId, accessToken]);

  // Catat bahwa user mulai membuka submodul.
  useEffect(() => {
    if (!accessToken || !submoduleId) return;

    dispatch(
      beginSubmodule({
        submoduleId,
        token: accessToken,
      })
    );
  }, [dispatch, accessToken, submoduleId]);

  // ======================================================
  // FETCH DAFTAR MODUL
  // ======================================================

  useEffect(() => {
    if (
      accessToken &&
      modules.length === 0 &&
      modulesStatus !== 'loading'
    ) {
      dispatch(fetchModules(accessToken));
    }
  }, [dispatch, accessToken, modules.length, modulesStatus]);

  // ======================================================
  // NORMALISASI DATA
  // ======================================================

  const moduleData =
    moduleDetail?.data?.module ??
    moduleDetail?.module ??
    moduleDetail?.data ??
    moduleDetail;

  const submodules = useMemo(() => {
    if (!Array.isArray(moduleData?.submodules)) {
      return [];
    }

    return [...moduleData.submodules].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [moduleData]);

  const currentSubmoduleIndex = submodules.findIndex(
    (item) => String(item.id) === String(submoduleId)
  );

  const currentSubmodule =
    currentSubmoduleIndex >= 0
      ? submodules[currentSubmoduleIndex]
      : null;

  const lessons = useMemo(() => {
    if (!Array.isArray(currentSubmodule?.lessons)) {
      return [];
    }

    return [...currentSubmodule.lessons].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [currentSubmodule]);

  const activeLesson = lessons[activeLessonIndex];

  const lessonContent =
    activeLesson?.content || activeLesson || {};

  const blocks = Array.isArray(lessonContent.blocks)
    ? lessonContent.blocks
    : [];

  // ======================================================
  // SIMPAN PROGRES MEMBACA DAN SELESAIKAN MATERI
  // ======================================================
const moduleSortOrder = moduleData?.sort_order;
  const saveProgress = useCallback(
    async (progress) => {
      if (!accessToken || !submoduleId) return;
      if (progress <= lastSavedProgress.current) return;

      lastSavedProgress.current = progress;

      try {
        await dispatch(
          saveReadingProgress({
            submoduleId,
            token: accessToken,
            readingProgress: progress,
          })
        ).unwrap();

        if (progress >= 100 && !completionRequested.current) {
          completionRequested.current = true;

          // Modul pertama selesai otomatis saat reading progress 100%.
          // Modul berikutnya memerlukan pemanggilan completeLesson.
        if (Number(moduleSortOrder) !== 1)  {
            await dispatch(
              finishLesson({
                submoduleId,
                token: accessToken,
              })
            ).unwrap();
          }

          // Sinkronkan status submodul dan status buka modul dari server.
          await Promise.all([
            dispatch(
              fetchModuleDetail({
                moduleId,
                token: accessToken,
              })
            ).unwrap(),
            dispatch(fetchModules(accessToken)).unwrap(),
          ]);
        }
      } catch (error) {
        console.error('Gagal menyimpan progres pembelajaran:', error);
        lastSavedProgress.current = -1;
        completionRequested.current = false;
      }
    },
    [accessToken, submoduleId, moduleData?.sort_order, dispatch, moduleId]
  );

  useEffect(() => {
    if (!currentSubmodule || !accessToken) return;

    const calculateAndSaveProgress = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const maxScroll = documentHeight - viewportHeight;

      const progress =
        maxScroll <= 0
          ? 100
          : Math.min(
              100,
              Math.floor(
                ((scrollPosition + viewportHeight) / documentHeight) * 100
              )
            );

      void saveProgress(progress);
    };

    calculateAndSaveProgress();

    window.addEventListener('scroll', calculateAndSaveProgress, {
      passive: true,
    });

    window.addEventListener('resize', calculateAndSaveProgress);

    return () => {
      window.removeEventListener('scroll', calculateAndSaveProgress);
      window.removeEventListener('resize', calculateAndSaveProgress);
    };
  }, [currentSubmodule, accessToken, saveProgress]);

  // ======================================================
  // SUBMODUL SEBELUMNYA DAN BERIKUTNYA
  // ======================================================

  const previousSubmodule =
    currentSubmoduleIndex > 0
      ? submodules[currentSubmoduleIndex - 1]
      : null;

  const nextSubmodule =
    currentSubmoduleIndex >= 0
      ? submodules[currentSubmoduleIndex + 1]
      : null;

  // ======================================================
  // MODUL BERIKUTNYA
  // ======================================================

  const currentModuleIndex = modules.findIndex(
    (module) => String(module.id) === String(moduleId)
  );

  const nextModule =
    currentModuleIndex >= 0
      ? modules[currentModuleIndex + 1]
      : null;

  // ======================================================
  // NAVIGASI LESSON
  // ======================================================

  const goToLesson = (index) => {
    if (index < 0 || index >= lessons.length) {
      return;
    }

    setActiveLessonIndex(index);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const goToPreviousLesson = () => {
    if (activeLessonIndex > 0) {
      goToLesson(activeLessonIndex - 1);
      return;
    }

    if (previousSubmodule) {
      const previousLessons = Array.isArray(previousSubmodule.lessons)
        ? [...previousSubmodule.lessons].sort(
            (a, b) => a.sort_order - b.sort_order
          )
        : [];

      const lastLessonIndex = Math.max(
        previousLessons.length - 1,
        0
      );

      navigate(
        `/modules/${moduleId}/submodules/${previousSubmodule.id}`,
        {
          state: {
            initialLessonIndex: lastLessonIndex,
          },
        }
      );
    }
  };

  const goToNextLesson = () => {
    if (activeLessonIndex < lessons.length - 1) {
      goToLesson(activeLessonIndex + 1);
    }
  };

  // ======================================================
  // NAVIGASI SIDEBAR
  // ======================================================

  const goToSubmodule = (submodule) => {
    if (
      submodule.is_unlocked === false ||
      String(submodule.id) === String(submoduleId)
    ) {
      return;
    }

    navigate(
      `/modules/${moduleId}/submodules/${submodule.id}`
    );
  };

  // ======================================================
  // NAVIGASI BERIKUTNYA
  // ======================================================

  const goToNext = () => {
    if (nextSubmodule) {
      if (nextSubmodule.is_unlocked === false) {
        return;
      }

      navigate(
        `/modules/${moduleId}/submodules/${nextSubmodule.id}`
      );

      return;
    }

    if (nextModule) {
      if (nextModule.is_unlocked === false) {
        return;
      }

      navigate(`/modules/${nextModule.id}`);
    }
  };

  const goBackToModule = () => {
    navigate(`/modules/${moduleId}`);
  };

  const isPreviousDisabled =
    activeLessonIndex === 0 && !previousSubmodule;

  // ======================================================
  // LOADING
  // ======================================================

  // ======================================================
  // LOADING
  // ======================================================

  // Tampilkan loading hanya ketika data modul memang belum tersedia.
  // Jika sedang refresh progres, pertahankan halaman yang sudah tampil.
  if (
    !moduleData?.id &&
    (detailStatus === 'loading' || detailStatus === 'idle')
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-teal-700" />
          <p className="mt-4 text-sm text-slate-500">
            Menyiapkan materi pembelajaran...
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (
    detailStatus === 'failed' ||
    detailStatus === 'rejected'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Materi Gagal Dimuat
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {detailError || 'Terjadi kesalahan saat mengambil materi.'}
          </p>

          <button
            onClick={goBackToModule}
            className="btn mt-5 bg-teal-700 text-white"
          >
            Kembali ke Modul
          </button>
        </div>
      </div>
    );
  }

  if (!currentSubmodule) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Submodul Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submodul yang kamu cari tidak tersedia.
          </p>

          <button
            onClick={goBackToModule}
            className="btn mt-5 bg-teal-700 text-white"
          >
            Kembali ke Modul
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // TAMPILAN UTAMA
  // ======================================================

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <AppNavbar
        title={currentSubmodule.title}
        subtitle={moduleData?.title || 'Materi Pembelajaran'}
        backTo={`/modules/${moduleId}`}
        backLabel="Kembali ke Modul"
      />

      {/* MAIN */}

      <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">

        {/* SIDEBAR FIXED DI KIRI */}

        <aside
          className="
            mb-6 h-fit self-start rounded-2xl border border-slate-200 bg-white p-5
            lg:fixed
            lg:left-[max(32px,calc((100vw-1440px)/2+32px))]
            lg:top-[88px]
            lg:z-30
            lg:mb-0
            lg:w-[290px]
            lg:max-h-[calc(100vh-104px)]
            lg:overflow-y-auto
          "
        >
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              MATERI PEMBELAJARAN
            </p>

            <h2 className="mt-2 text-lg font-bold leading-snug text-[#172554]">
              {moduleData?.title || 'Daftar Submodul'}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              {submodules.length} submodul pembelajaran
            </p>
          </div>

          <div className="mb-4 border-t border-slate-100" />

          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            DAFTAR SUBMODUL
          </p>

          <nav className="space-y-2">
            {submodules.map((submodule, index) => {
              const isActive =
                String(submodule.id) === String(submoduleId);

              const isCompleted =
                submodule.is_completed === true ||
                submodule.is_completed === 1;

              const isLocked =
                submodule.is_unlocked === false;

              return (
                <button
                  key={submodule.id}
                  onClick={() => goToSubmodule(submodule)}
                  disabled={isLocked}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                    isActive
                      ? 'border border-teal-200 bg-teal-50'
                      : isLocked
                        ? 'cursor-not-allowed opacity-50'
                        : 'border border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-teal-700 text-white'
                        : isCompleted
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted
                      ? '✓'
                      : isLocked
                        ? '🔒'
                        : index + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold leading-5 ${
                        isActive
                          ? 'text-teal-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {submodule.title}
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      {isCompleted
                        ? 'Selesai'
                        : isLocked
                          ? 'Terkunci'
                          : isActive
                            ? 'Sedang dipelajari'
                            : 'Belum selesai'}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={goBackToModule}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
            >
              ← Detail Modul
            </button>
          </div>
        </aside>

        {/* KONTEN KANAN */}
        {/* Breadcrumb dan materi sama-sama digeser agar tidak tertutup sidebar. */}

        <div className="min-w-0 lg:ml-[314px]">

          {/* BREADCRUMB */}

          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <button
              onClick={goBackToModule}
              className="transition hover:text-teal-700"
            >
              {moduleData?.title || 'Modul'}
            </button>

            <span>/</span>

            <span className="font-medium text-slate-800">
              {currentSubmodule.title}
            </span>
          </div>

          {/* AREA MATERI */}

          <section className="min-w-0">

            {!activeLesson ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="text-4xl">📚</div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Materi Belum Tersedia
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Belum ada lesson yang dapat ditampilkan pada submodul ini.
                </p>
              </div>
            ) : (
              <>
                {/* HEADER LESSON */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                      SUBMODUL {currentSubmoduleIndex + 1}
                    </span>

                    {/* Jumlah lesson hanya ditampilkan jika lebih dari satu. */}
                    {lessons.length > 1 && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                        MATERI {activeLessonIndex + 1} DARI {lessons.length}
                      </span>
                    )}

                  </div>

                  <h1 className="mt-5 text-2xl font-extrabold leading-tight text-[#172554] md:text-3xl">
                    {activeLesson.title || `Materi ${activeLessonIndex + 1}`}
                  </h1>

                  {lessonContent.estimated_minutes && (
                    <p className="mt-3 text-sm text-slate-400">
                      ◷ Estimasi {lessonContent.estimated_minutes} menit membaca
                    </p>
                  )}
                </div>

                {/* INTRODUCTION */}

                {lessonContent.introduction && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                    <h2 className="mb-3 text-lg font-bold text-[#172554]">
                      Pengantar
                    </h2>

                    <p className="whitespace-pre-line text-[15px] leading-8 text-slate-600">
                      {lessonContent.introduction}
                    </p>
                  </div>
                )}

                {/* TUJUAN PEMBELAJARAN */}

                {Array.isArray(lessonContent.learning_objectives) &&
                  lessonContent.learning_objectives.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-6 md:p-8">
                      <h2 className="mb-4 font-bold text-teal-900">
                        Tujuan Pembelajaran
                      </h2>

                      <ul className="space-y-3">
                        {lessonContent.learning_objectives.map(
                          (objective, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm leading-7 text-teal-900"
                            >
                              <span className="font-bold">✓</span>
                              <span>{objective}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* ISI MATERI */}

                {blocks.length > 0 && (
                  <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-9">
                    {blocks.map((block, index) => (
                      <ContentBlock key={index} block={block} />
                    ))}
                  </article>
                )}

                {/* RINGKASAN */}

                {lessonContent.summary && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-6 md:p-8">
                    <h2 className="mb-3 font-bold text-[#172554]">
                      Ringkasan Materi
                    </h2>

                    <p className="whitespace-pre-line text-[15px] leading-8 text-blue-900">
                      {lessonContent.summary}
                    </p>
                  </div>
                )}

                {/* NAVIGASI */}

                <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={goToPreviousLesson}
                    disabled={isPreviousDisabled}
                    className={`btn ${
                      isPreviousDisabled
                        ? 'btn-disabled'
                        : 'btn-outline border-slate-300 text-slate-600 hover:border-teal-700 hover:bg-teal-700 hover:text-white'
                    }`}
                  >
                    ← Materi Sebelumnya
                  </button>

                  {activeLessonIndex < lessons.length - 1 ? (
                    <button
                      type="button"
                      onClick={goToNextLesson}
                      className="btn border-none bg-teal-700 text-white hover:bg-teal-800"
                    >
                      Materi Berikutnya →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNext}
                      disabled={
                        nextSubmodule
                          ? nextSubmodule.is_unlocked === false
                          : nextModule
                            ? nextModule.is_unlocked === false
                            : true
                      }
                      className="btn border-none bg-teal-700 text-white hover:bg-teal-800"
                    >
                      {nextSubmodule
                        ? 'Lanjut ke Submodul Berikutnya →'
                        : nextModule
                          ? 'Lanjut ke Modul Berikutnya →'
                          : 'Seluruh Modul Selesai'}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER */}

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} WebLab. Belajar Web Development dengan Interaktif.
        </div>
      </footer>
    </div>
  );
}

// ======================================================
// WRAPPER
// Reset state saat berpindah submodul.
// ======================================================

function SubmoduleLearning() {
  const { moduleId, submoduleId } = useParams();

  return (
    <SubmoduleLearningContent
      key={`${moduleId}-${submoduleId}`}
      moduleId={moduleId}
      submoduleId={submoduleId}
    />
  );
}

export default SubmoduleLearning;