
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AppNavbar from '../../../components/AppNavbar.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QUIZ_DURATION = 15 * 60;
const MAX_TAB_WARNINGS = 3;

// Hilangkan soal dengan ID yang sama agar payload tidak mengirim
// question_id duplikat ke backend. Urutan soal tetap dipertahankan.
const getUniqueQuestions = (items = []) => {
  const seen = new Set();
  return [...items]
    .filter((question) => {
      const id = String(question?.id ?? '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
};

function ModuleQuiz() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);

  const [screen, setScreen] = useState('intro');
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [remainingSeconds, setRemainingSeconds] =
    useState(QUIZ_DURATION);

  const [tabWarnings, setTabWarnings] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] =
    useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  const deadlineRef = useRef(null);
  const submittingRef = useRef(false);
  const leavingRef = useRef(false);
  const tabWarningsRef = useRef(0);
  const disqualifiedRef = useRef(false);
  const screenRef = useRef('intro');
  const answersRef = useRef({});
  const questionsRef = useRef([]);

  const currentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === questions.length;

  const isPassed = result?.is_passed === true;
  const score = Number(result?.score ?? 0);

  const getResponseData = (response) => {
    return response?.data?.data ?? response?.data ?? response;
  };

  const request = useCallback(
    async (endpoint, options = {}) => {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok || responseData.success === false) {
        throw new Error(
          responseData.message || 'Terjadi kesalahan pada server.'
        );
      }

      return getResponseData(responseData);
    },
    [accessToken]
  );

  // Menjaga ref agar event browser selalu membaca data terbaru.
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remaining
    ).padStart(2, '0')}`;
  };

  const formatAnswer = (answer) => {
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer ?? '');
  };

  const getOptionLabel = (option) => {
    if (typeof option === 'string') return option;
    return option?.label ?? option?.value ?? '';
  };

  const getOptionValue = (option) => {
    if (typeof option === 'string') return option;
    return option?.value ?? option?.label ?? '';
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div
        role="alert"
        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </div>
    );
  };

  // Mengambil informasi Quiz.
  useEffect(() => {
    let cancelled = false;

    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await request(`/api/quiz/module/${moduleId}`);

        if (cancelled) return;

        const quizData = data.quiz ?? data;
        const questionData = data.questions ?? quizData.questions ?? [];
        const uniqueQuestions = getUniqueQuestions(questionData);

        if (uniqueQuestions.length !== questionData.length) {
          console.warn(
            'WebLab Quiz: ditemukan ID soal duplikat dari API. Soal duplikat diabaikan.',
            questionData
          );
        }

        setQuiz(quizData);
        setQuestions(uniqueQuestions);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (accessToken && moduleId) loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [moduleId, accessToken, request]);

  // Memulai attempt Quiz.
  const handleStartQuiz = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await request(
        `/api/quiz/module/${moduleId}/start`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const attempt = data.attempt ?? data;
      const quizData = data.quiz ?? quiz;
      const questionData = data.questions ?? questions;
      const sortedQuestions = getUniqueQuestions(questionData);
      const newAttemptId = attempt?.id ?? data.attempt_id;

      if (!newAttemptId) {
        throw new Error('ID pengerjaan Quiz tidak ditemukan dari server.');
      }

      if (sortedQuestions.length !== questionData.length) {
        console.warn(
          'WebLab Quiz: ID soal duplikat diabaikan sebelum pengerjaan.',
          questionData
        );
      }

      setAttemptId(newAttemptId);
      setQuiz(quizData);
      setQuestions(sortedQuestions);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setTabWarnings(0);
      tabWarningsRef.current = 0;
      disqualifiedRef.current = false;
      setIsDisqualified(false);
      setTimeExpired(false);

      submittingRef.current = false;
      leavingRef.current = false;

      const serverRemaining = Number(
        data.remaining_seconds ?? quizData.duration_seconds ?? QUIZ_DURATION
      );
      const safeRemaining = Math.max(0, Math.min(QUIZ_DURATION, serverRemaining));
      deadlineRef.current = Date.now() + safeRemaining * 1000;
      setRemainingSeconds(safeRemaining);

      setScreen('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Menyimpan jawaban.
  const handleAnswerChange = (questionId, value) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  const handlePrevious = () => {
    setCurrentIndex((previous) => Math.max(0, previous - 1));
  };

  const handleNext = () => {
    setCurrentIndex((previous) =>
      Math.min(questions.length - 1, previous + 1)
    );
  };

  // Diskualifikasi: tutup attempt di backend dengan seluruh jawaban kosong.
  const handleDisqualification = useCallback(async () => {
    if (!attemptId || submittingRef.current || disqualifiedRef.current) return;

    submittingRef.current = true;
    disqualifiedRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const uniqueQuestions = getUniqueQuestions(questionsRef.current);
      const emptyAnswers = uniqueQuestions.map((question) => ({
        question_id: question.id,
        selected_answer: null,
      }));

      const data = await request(`/api/quiz/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: emptyAnswers }),
      });

      setResult(data);
      setIsDisqualified(true);
      setTimeExpired(false);
      setShowTabWarning(false);
      setShowExitWarning(false);
      setShowSubmitConfirmation(false);
      setScreen('result');
    } catch (err) {
      disqualifiedRef.current = false;
      setError(
        `${err.message} Diskualifikasi belum berhasil disimpan. Jangan mulai attempt baru; coba muat ulang hasil atau periksa server.`
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, request]);

  // Mengirim jawaban ke backend.
  const handleSubmitQuiz = useCallback(
    async (automatic = false) => {
      if (!attemptId || submittingRef.current) return;

      const currentQuestions = getUniqueQuestions(questionsRef.current);
      const currentAnswers = answersRef.current;

      const unanswered = currentQuestions.filter(
        (question) =>
          currentAnswers[question.id] === undefined
      );

      if (unanswered.length > 0 && !automatic) {
        setError(
          `Masih ada ${unanswered.length} soal yang belum dijawab.`
        );
        setShowSubmitConfirmation(false);
        return;
      }

      try {
        submittingRef.current = true;
        setSubmitting(true);
        setError('');

        // Satu question_id hanya boleh dikirim satu kali.
        const answerByQuestionId = new Map();
        currentQuestions.forEach((question) => {
          answerByQuestionId.set(String(question.id), {
            question_id: question.id,
            selected_answer: currentAnswers[question.id] ?? null,
          });
        });
        const formattedAnswers = [...answerByQuestionId.values()];

        const data = await request(
          `/api/quiz/${attemptId}/submit`,
          {
            method: 'POST',
            body: JSON.stringify({
              answers: formattedAnswers,
            }),
          }
        );

        setResult(data);
        setTimeExpired(automatic);
        setShowSubmitConfirmation(false);
        setShowTabWarning(false);
        setShowExitWarning(false);
        setScreen('result');
      } catch (err) {
        setError(err.message);
        setShowSubmitConfirmation(false);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, request]
  );

  // Timer Quiz.
  useEffect(() => {
    if (screen !== 'quiz' || !deadlineRef.current) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );

      setRemainingSeconds(remaining);

      if (remaining <= 0 && !submittingRef.current) {
        handleSubmitQuiz(true);
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [screen, handleSubmitQuiz]);

  // Deteksi perpindahan tab atau browser diminimalkan.
  // Tiga kali peringatan; pelanggaran keempat menghentikan Quiz.
  useEffect(() => {
    if (screen !== 'quiz') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        leavingRef.current = true;
        return;
      }

      if (document.visibilityState === 'visible' && leavingRef.current) {
        leavingRef.current = false;

        const nextWarning = tabWarningsRef.current + 1;
        tabWarningsRef.current = nextWarning;
        setTabWarnings(nextWarning);

        if (nextWarning > MAX_TAB_WARNINGS) {
          handleDisqualification();
          return;
        }

        setShowTabWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [screen, handleDisqualification]);

  // Peringatan bawaan browser ketika menutup atau me-refresh halaman.
  useEffect(() => {
    if (screen !== 'quiz') return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };
  }, [screen]);

  // Menangkap tombol Back browser ketika Quiz sedang berlangsung.
  useEffect(() => {
    if (screen !== 'quiz') return;

    const pushGuardState = () => {
      window.history.pushState(
        { quizGuard: true },
        '',
        window.location.href
      );
    };

    pushGuardState();

    const handlePopState = () => {
      setShowExitWarning(true);
      pushGuardState();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [screen]);

  // Mencegah navigasi melalui link internal saat Quiz berlangsung.
  useEffect(() => {
    if (screen !== 'quiz') return;

    const handleDocumentClick = (event) => {
      const link = event.target.closest('a');

      if (!link) return;

      const target = link.getAttribute('target');

      if (target === '_blank') return;

      const href = link.getAttribute('href');

      if (!href || href.startsWith('#')) return;

      const destination = new URL(href, window.location.origin);

      if (destination.origin !== window.location.origin) return;

      if (
        destination.pathname === window.location.pathname
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setShowExitWarning(true);
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener(
        'click',
        handleDocumentClick,
        true
      );
    };
  }, [screen]);

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    navigate(`/modules/${moduleId}`);
  };

  const handleStayInQuiz = () => {
    setShowExitWarning(false);
    setShowTabWarning(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setAttemptId(null);
    setError('');
    setTabWarnings(0);
    tabWarningsRef.current = 0;
    disqualifiedRef.current = false;
    setIsDisqualified(false);
    setTimeExpired(false);
    setRemainingSeconds(QUIZ_DURATION);
    deadlineRef.current = null;
    submittingRef.current = false;
    setScreen('intro');
  };

  const handleBackToModule = () => {
    navigate(`/modules/${moduleId}`);
  };

  const correctCount = useMemo(() => {
    return (
      result?.answers?.filter(
        (answer) => answer.is_correct === true
      ).length ?? 0
    );
  }, [result]);

  const incorrectCount = useMemo(() => {
    return (
      result?.answers?.filter(
        (answer) => answer.is_correct === false
      ).length ?? 0
    );
  }, [result]);

  // Loading.
  if (loading && screen === 'intro' && !quiz) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AppNavbar
          title="Quiz Akhir Modul"
          subtitle={`Modul ${moduleId} / Evaluasi Pembelajaran`}
          backTo={`/modules/${moduleId}`}
          backLabel="Kembali ke Modul"
        />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-teal-700" />
            <p className="mt-4 text-sm text-slate-500">
              Memuat Quiz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Intro Quiz.
  if (screen === 'intro') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172554]">
        <AppNavbar
          title="Module Quiz"
          subtitle={`Modul ${moduleId} / Evaluasi Pembelajaran`}
          backTo={`/modules/${moduleId}`}
          backLabel="Kembali ke Modul"
        />

        <main className="mx-auto flex min-h-[75vh] max-w-[1200px] items-center justify-center px-4 py-12 sm:px-6">
          <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-[#172554] to-[#1E3A5F] px-6 py-9 text-center text-white sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
                📝
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                Module Assessment
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Quiz Akhir Modul
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-blue-100">
                Uji pemahamanmu terhadap materi yang sudah dipelajari.
              </p>
            </div>

            <div className="p-6 sm:p-9">
              {renderError()}

              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-medium text-slate-500">
                  Quiz yang akan dikerjakan
                </p>

                <p className="mt-1 text-lg font-bold text-[#172554]">
                  {quiz?.title ?? `Quiz Modul ${moduleId}`}
                </p>

                {quiz?.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {quiz.description}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-700">
                    ✓
                  </span>
                  <p className="text-sm text-slate-600">
                    {quiz?.question_count ?? questions.length} soal pilihan ganda.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-700">
                    ✓
                  </span>
                  <p className="text-sm text-slate-600">
                    Nilai minimal kelulusan {quiz?.passing_score ?? 80}.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-700">
                    ✓
                  </span>
                  <p className="text-sm text-slate-600">
                    Waktu pengerjaan 15 menit.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-700">
                    ✓
                  </span>
                  <p className="text-sm text-slate-600">
                    Perpindahan tab akan terdeteksi dan mendapat peringatan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={loading || questions.length === 0}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Memulai Quiz...' : 'Mulai Mengerjakan →'}
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Halaman pengerjaan Quiz.
  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172554]">
        <AppNavbar
          title="Quiz Akhir Modul"
          subtitle={quiz?.title ?? `Modul ${moduleId}`}
          backTo={`/modules/${moduleId}`}
          backLabel="Keluar dari Quiz"
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {renderError()}

          <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Evaluasi Pembelajaran
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#172554]">
                {quiz?.title ?? 'Quiz Akhir Modul'}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Soal {currentIndex + 1} dari {questions.length}
                {' · '}
                {answeredCount} dari {questions.length} soal dijawab
              </p>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border px-5 py-3 ${
                remainingSeconds <= 60
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-[#172554]'
              }`}
            >
              <span className="text-xl">⏱️</span>
              <div>
                <p className="text-xs font-medium opacity-70">
                  Sisa waktu
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatTime(remainingSeconds)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              {currentQuestion && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
                      Soal {currentIndex + 1}
                    </span>

                    <span className="text-xs font-medium text-slate-400">
                      {Number(currentQuestion.points ?? 20)} Poin
                    </span>
                  </div>

                  <h2 className="text-lg font-bold leading-relaxed text-[#172554] sm:text-xl">
                    {currentQuestion.question}
                  </h2>

                  <div className="mt-8">
                    <p className="mb-4 text-sm font-semibold text-slate-700">
                      Pilih satu jawaban yang paling tepat.
                    </p>

                    <div className="space-y-3">
                      {(currentQuestion.options ?? []).map(
                        (option, index) => {
                          const value = getOptionValue(option);
                          const label = getOptionLabel(option);
                          const selected =
                            answers[currentQuestion.id] === value;

                          const letter =
                            typeof option === 'object' && option?.value
                              ? option.value
                              : String.fromCharCode(65 + index);

                          return (
                            <button
                              type="button"
                              key={`${currentQuestion.id}-${index}`}
                              onClick={() =>
                                handleAnswerChange(
                                  currentQuestion.id,
                                  value
                                )
                              }
                              className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                                selected
                                  ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                                  : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                  selected
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {letter}
                              </span>

                              <span className="flex-1 pt-1 text-sm leading-relaxed text-slate-700">
                                {label}
                              </span>

                              <span
                                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  selected
                                    ? 'border-teal-700 bg-teal-700'
                                    : 'border-slate-300'
                                }`}
                              >
                                {selected && (
                                  <span className="h-2 w-2 rounded-full bg-white" />
                                )}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="min-h-11 rounded-xl bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-blue-900"
                  >
                    Selanjutnya →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmation(true)}
                    className="min-h-11 rounded-xl bg-[#0F766E] px-6 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Kumpulkan Jawaban
                  </button>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#172554]">
                Navigasi Soal
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Pilih nomor untuk berpindah soal.
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const answered = answers[question.id] !== undefined;
                  const active = currentIndex === index;

                  return (
                    <button
                      type="button"
                      key={question.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold ${
                        active
                          ? 'bg-[#172554] text-white'
                          : answered
                            ? 'border border-teal-200 bg-teal-50 text-teal-700'
                            : 'border border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <p>■ Soal aktif</p>
                <p className="text-teal-700">■ Sudah dijawab</p>
                <p>□ Belum dijawab</p>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Progres pengerjaan
                </p>

                <p className="mt-1 text-xl font-bold text-[#172554]">
                  {Math.round(
                    (answeredCount / Math.max(questions.length, 1)) * 100
                  )}%
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-700 transition-all"
                    style={{
                      width: `${
                        (answeredCount / Math.max(questions.length, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitConfirmation(true)}
                className="mt-5 min-h-11 w-full rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Kumpulkan Quiz
              </button>
            </aside>
          </div>
        </main>

        {/* Konfirmasi kumpulkan jawaban */}
        {showSubmitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
                ⚠️
              </div>

              <h2 className="mt-4 text-center text-xl font-bold text-[#172554]">
                Kumpulkan Jawaban?
              </h2>

              <p className="mt-2 text-center text-sm text-slate-500">
                Kamu sudah menjawab {answeredCount} dari {questions.length} soal.
                {isAllAnswered
                  ? ' Setelah dikumpulkan, jawaban tidak dapat diubah.'
                  : ' Soal yang belum dijawab akan dianggap kosong.'}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmation(false)}
                  className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
                >
                  Periksa Kembali
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(false)}
                  disabled={submitting}
                  className="min-h-11 flex-1 rounded-xl bg-[#0F766E] text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? 'Mengumpulkan...' : 'Ya, Kumpulkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maskot peringatan pindah tab */}
        {showTabWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <img
                src="/maskot.png"
                alt="Maskot WebLab"
                className="mx-auto h-36 w-36 object-contain"
              />

              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-600">
                WebLab Quiz Protection
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#172554]">
                Hei, jangan meninggalkan Quiz!
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Kamu terdeteksi berpindah tab atau meninggalkan halaman
                pengerjaan. Tetap fokus dan kerjakan Quiz secara mandiri, ya!
              </p>

              <div className="mt-5 rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Peringatan {tabWarnings} dari {MAX_TAB_WARNINGS}
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  {tabWarnings >= MAX_TAB_WARNINGS
                    ? 'Ini peringatan terakhir! Jika kamu meninggalkan halaman Quiz sekali lagi, pengerjaan akan dihentikan dan kamu harus mengulang dari awal.'
                    : 'Tetap berada di halaman Quiz. Perpindahan tab berikutnya akan menambah jumlah peringatan.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStayInQuiz}
                className="mt-6 min-h-12 w-full rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Saya Mengerti, Lanjutkan Quiz
              </button>
            </div>
          </div>
        )}

        {/* Maskot konfirmasi keluar */}
        {showExitWarning && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <img
                src="/maskot.png"
                alt="Maskot WebLab"
                className="mx-auto h-36 w-36 object-contain"
              />

              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-red-600">
                Quiz Protection
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#172554]">
                Mau meninggalkan Quiz?
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Pengerjaan Quiz sedang berlangsung. Jika kamu keluar,
                waktu pengerjaan tetap berjalan dan jawaban yang belum
                dikumpulkan berisiko tidak tersimpan.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleStayInQuiz}
                  className="min-h-12 rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Tetap Mengerjakan
                </button>

                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="min-h-12 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Ya, Keluar dari Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Hasil Quiz.
  if (screen === 'result') {
    const reviewAnswers = result?.answers ?? [];

    if (isDisqualified) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172554]">
          <AppNavbar
            title="Quiz Dihentikan"
            subtitle={quiz?.title ?? `Modul ${moduleId}`}
            backTo={`/modules/${moduleId}`}
            backLabel="Kembali ke Modul"
          />

          <main className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center px-4 py-10">
            <section className="w-full rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm sm:p-10">
              <img
                src="/maskot.png"
                alt="Maskot WebLab"
                className="mx-auto h-40 w-40 object-contain"
              />

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-red-600">
                WebLab Quiz Protection
              </p>

              <h1 className="mt-2 text-2xl font-bold text-[#172554]">
                Quiz Dihentikan!
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Kamu telah melewati batas tiga kali peringatan. Karena terlalu
                sering meninggalkan halaman Quiz, percobaan ini dinyatakan gagal.
              </p>

              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-700">
                Jawaban pada percobaan ini tidak dinilai. Silakan kembali ke
                modul dan mulai Quiz dari awal dengan percobaan baru.
              </div>

              <button
                type="button"
                onClick={() => navigate(`/modules/${moduleId}`)}
                className="mt-7 min-h-12 w-full rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Kembali ke Modul
              </button>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172554]">
        <AppNavbar
          title="Hasil Quiz"
          subtitle={quiz?.title ?? `Modul ${moduleId}`}
          backTo={`/modules/${moduleId}`}
          backLabel="Kembali ke Modul"
        />

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {timeExpired && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Waktu pengerjaan telah habis. Quiz dikumpulkan secara otomatis.
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-7 text-center sm:p-10">
              <img
                src="/maskot.png"
                alt="Maskot WebLab"
                className="mx-auto h-40 w-40 object-contain"
              />

              <div
                className={`mx-auto mt-2 flex h-32 w-32 flex-col items-center justify-center rounded-full border-[7px] ${
                  isPassed
                    ? 'border-teal-100 bg-teal-50 text-teal-700'
                    : 'border-amber-100 bg-amber-50 text-amber-700'
                }`}
              >
                <span className="text-4xl font-bold">{score}</span>
                <span className="text-xs font-semibold">/ 100</span>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-teal-700">
                Hasil Evaluasi
              </p>

              <h1 className="mt-2 text-2xl font-bold text-[#172554] sm:text-3xl">
                {isPassed
                  ? 'Kerja Bagus! Kamu Lulus! 🎉'
                  : 'Jangan Menyerah!'}
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                {isPassed
                  ? 'Yeay! Kamu berhasil menyelesaikan Quiz modul ini. Terus pertahankan semangat belajarmu dan lanjutkan ke modul berikutnya!'
                  : 'Belum berhasil kali ini, tetapi tidak apa-apa. Pelajari kembali pembahasan soal dan coba lagi. Kamu pasti bisa!'}
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <div className="rounded-xl bg-teal-50 px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-teal-700">
                    {correctCount}
                  </p>
                  <p className="text-xs text-teal-700">Jawaban Benar</p>
                </div>

                <div className="rounded-xl bg-red-50 px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {incorrectCount}
                  </p>
                  <p className="text-xs text-red-600">Jawaban Salah</p>
                </div>

                <div className="rounded-xl bg-slate-100 px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-[#172554]">
                    {reviewAnswers.length}
                  </p>
                  <p className="text-xs text-slate-600">Total Soal</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {!isPassed && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="min-h-12 rounded-xl bg-[#0F766E] px-6 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Ulangi Quiz
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBackToModule}
                  className="min-h-12 rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Kembali ke Modul
                </button>
              </div>
            </div>
          </section>

          {/* Review jawaban */}
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#172554]">
                Tinjau Jawaban
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pelajari pembahasan setiap soal untuk memperkuat pemahamanmu.
              </p>
            </div>

            <div className="space-y-4">
              {reviewAnswers.map((answer, index) => {
                const correct = answer.is_correct === true;

                const questionText =
                  answer.question ??
                  questions.find(
                    (question) =>
                      question.id === answer.question_id
                  )?.question ??
                  `Soal ${index + 1}`;

                return (
                  <article
                    key={answer.question_id ?? index}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        SOAL {index + 1}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          correct
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {correct ? '✓ Benar' : '✕ Salah'}
                      </span>
                    </div>

                    <h3 className="font-semibold leading-relaxed text-[#172554]">
                      {questionText}
                    </h3>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          Jawaban kamu
                        </p>

                        <p className="mt-2 break-words text-sm font-medium text-slate-700">
                          {formatAnswer(answer.selected_answer) || 'Tidak dijawab'}
                        </p>
                      </div>

                      {!correct && (
                        <div className="rounded-xl bg-teal-50 p-4">
                          <p className="text-xs font-semibold text-teal-700">
                            Jawaban benar
                          </p>

                          <p className="mt-2 break-words text-sm font-medium text-teal-800">
                            {formatAnswer(answer.correct_answer) || '-'}
                          </p>
                        </div>
                      )}
                    </div>

                    {answer.explanation && (
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-semibold text-blue-900">
                          Pembahasan
                        </p>

                        <p className="mt-2 text-sm leading-relaxed text-blue-800">
                          {answer.explanation}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return null;
}

export default ModuleQuiz;