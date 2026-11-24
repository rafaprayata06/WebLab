
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import AppNavbar from '../components/AppNavbar.jsx';
import GuidedTour from '../components/onboarding/GuidedTour.jsx';
import { fetchModules } from '../features/learning/learningSlice';
import { markOnboardingCompleted } from '../features/auth/authSlice';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13M3 18a3 3 0 0 0 3 3h15M8 7h8" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18M7 14l4-4 4 4 6-7" />
    </svg>
  );
}

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, accessToken } = useSelector((state) => state.auth);

  const {
    modules,
    status: modulesStatus,
    error: modulesError,
  } = useSelector((state) => state.learning);

  const [search, setSearch] = useState('');
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchModules(accessToken));
    }
  }, [dispatch, accessToken]);

  const modulePresentation = {
    'pengenalan-pemrograman-web': {
      code: '</>',
      color: 'bg-blue-50 text-blue-700',
    },
    html: {
      code: 'HTML',
      color: 'bg-orange-50 text-orange-600',
    },
    css: {
      code: 'CSS',
      color: 'bg-sky-50 text-sky-600',
    },
    javascript: {
      code: 'JS',
      color: 'bg-yellow-50 text-yellow-700',
    },
    php: {
      code: 'PHP',
      color: 'bg-indigo-50 text-indigo-700',
    },
    'database-dasar': {
      code: 'SQL',
      color: 'bg-teal-50 text-teal-700',
    },
  };

  const normalizedModules = [...modules]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((module, index) => ({
      ...module,
      code: modulePresentation[module.slug]?.code || 'WEB',
      color:
        modulePresentation[module.slug]?.color ||
        'bg-slate-100 text-slate-700',
      number: `MODUL ${module.sort_order || index + 1}`,
      total: Number(module.total_submodules || 0),
      completed: Number(module.completed_submodules || 0),
      isUnlocked: Boolean(module.is_unlocked),
    }));

  const filteredModules = normalizedModules.filter((module) =>
    `${module.title} ${module.description || ''} ${module.code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalSubmodules = normalizedModules.reduce(
    (total, module) => total + module.total,
    0
  );

  const completedSubmodules = normalizedModules.reduce(
    (total, module) => total + module.completed,
    0
  );

  const completedModules = normalizedModules.filter(
    (module) =>
      module.total > 0 && module.completed >= module.total
  ).length;

  const nextModule =
    normalizedModules.find(
      (module) =>
        module.isUnlocked && module.completed < module.total
    ) || normalizedModules.find((module) => module.isUnlocked);

  const nextPercentage =
    nextModule && nextModule.total > 0
      ? Math.round((nextModule.completed / nextModule.total) * 100)
      : 100;

  const openModule = (module) => {
    if (!module?.isUnlocked) return;
    navigate(`/modules/${module.id}`);
  };

  const statistics = [
    {
      label: 'Submodul Selesai',
      value: completedSubmodules,
      total: `/ ${totalSubmodules}`,
      icon: <BookIcon />,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Modul Tuntas',
      value: completedModules,
      total: `/ ${normalizedModules.length}`,
      icon: <LayersIcon />,
      iconClass: 'bg-teal-50 text-[#0F766E]',
    },
    {
      label: 'Rata-rata Nilai Kuis',
      value: '—',
      total: '/ 100',
      icon: <ChartIcon />,
      iconClass: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] text-[#172554]">
      {/* NAVBAR */}
      <AppNavbar
        showBack={false}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari modul atau topik..."
        searchLabel="Cari modul"
        navItems={[
          { label: 'Beranda', href: '/dashboard' },
          { label: 'Daftar Modul', href: '/modules' },
          { label: 'Progres Saya', href: '/progress' },
        ]}
        activeNav="Beranda"
      />

      {/* MAIN CONTENT */}
      <main
        id="beranda"
        className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-12 lg:py-10"
      >
        {/* WELCOME */}
        <section
          data-tour="welcome"
          className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8"
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0F766E]">
              Dashboard Pembelajaran
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
              Selamat datang kembali, {user?.name || 'Pengguna'} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Satu langkah kecil hari ini, satu kemampuan baru untuk masa depan.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#0F766E]/20 bg-teal-50 px-4 py-2 text-xs font-semibold text-[#0F766E]">
            <span className="h-2 w-2 rounded-full bg-[#0F766E]" />
            Jalur belajar pemula
          </span>
        </section>

        {/* CONTINUE LEARNING */}
        <section
          data-tour="continue-learning"
          className="relative mb-7 overflow-hidden rounded-2xl bg-[#172554] p-5 text-white shadow-lg shadow-[#172554]/10 sm:p-7 lg:p-9"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#0F766E]/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-teal-100">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                LANJUTKAN PERJALANANMU
              </div>

              <h2 className="max-w-2xl text-xl font-bold leading-snug sm:text-2xl lg:text-[28px]">
                {nextModule
                  ? `Mulai belajar: ${nextModule.title}`
                  : 'Semua modul telah diselesaikan!'}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                {nextModule
                  ? nextModule.description
                  : 'Kamu telah menyelesaikan semua modul yang tersedia.'}
              </p>

              <div className="mt-6 flex max-w-[520px] items-center gap-4">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-valuenow={nextPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Progres modul"
                >
                  <div
                    className="h-full rounded-full bg-[#2DD4BF] transition-all duration-500"
                    style={{ width: `${nextPercentage}%` }}
                  />
                </div>

                <span className="text-sm font-bold text-teal-200">
                  {nextPercentage}%
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!nextModule}
              onClick={() => nextModule && openModule(nextModule)}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mulai Belajar
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        {/* STATISTICS */}
        <section
          id="statistik"
          data-tour="statistics"
          className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {statistics.map((stat) => (
            <article
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                {stat.icon}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  {stat.label}
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight text-[#172554]">
                  {stat.value}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    {stat.total}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* MODULE CATALOG */}
        <section
          id="modul"
          data-tour="module-catalog"
          className="scroll-mt-24"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0F766E]">
                Learning Path
              </p>

              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Mulai dari dasar, kuasai langkah demi langkah
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {normalizedModules.length} modul terarah · {totalSubmodules} submodul · Latihan langsung di browser
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/progress')}
              className="text-sm font-semibold text-[#0F766E] transition hover:text-[#172554]"
            >
              Lihat progres saya →
            </button>
          </div>

          {/* LOADING */}
          {modulesStatus === 'loading' && (
            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <span className="loading loading-spinner loading-lg text-[#0F766E]" />
              <span className="ml-3 text-sm text-slate-500">
                Memuat modul...
              </span>
            </div>
          )}

          {/* ERROR */}
          {modulesStatus === 'failed' && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {modulesError || 'Daftar modul gagal dimuat.'}

              <button
                type="button"
                onClick={() => accessToken && dispatch(fetchModules(accessToken))}
                className="ml-2 font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* MODULE GRID */}
          {modulesStatus !== 'loading' && modulesStatus !== 'failed' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredModules.map((module) => {
                const percentage =
                  module.total > 0
                    ? Math.round((module.completed / module.total) * 100)
                    : 0;

                return (
                  <article
                    key={module.id}
                    className="group flex min-h-[310px] flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#0F766E]/30 hover:shadow-lg hover:shadow-slate-200/60 sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-2 text-sm font-bold ${module.color}`}
                      >
                        {module.code}
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500">
                        {module.total} submodul
                      </span>
                    </div>

                    <div className="mt-6 flex-1">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-[#0F766E]">
                        {module.number}
                      </p>

                      <h3 className="mt-2 text-lg font-bold leading-snug text-[#172554]">
                        {module.title}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-7">
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500">
                          {module.completed}/{module.total} submodul selesai
                        </span>

                        <span className="font-bold text-[#172554]">
                          {percentage}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`Progres ${module.title}`}
                      >
                        <div
                          className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openModule(module)}
                      disabled={!module.isUnlocked}
                      className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#172554] transition hover:border-[#0F766E] hover:bg-[#0F766E] hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"
                    >
                      {module.isUnlocked ? 'Buka Modul' : 'Terkunci'}
                      {module.isUnlocked && <span aria-hidden="true">→</span>}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {/* EMPTY STATE */}
          {modulesStatus === 'succeeded' && filteredModules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <SearchIcon />
              </div>

              <p className="font-semibold text-[#172554]">
                Modul tidak ditemukan.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Coba gunakan kata kunci pencarian yang lain.
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-semibold text-[#0F766E]"
              >
                Hapus pencarian
              </button>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              © 2026 WebLab · Belajar sedikit, berkembang setiap hari.
            </p>

            <p className="text-xs text-slate-400">
              Learn. Practice. Build.
            </p>
          </div>
        </div>
      </footer>

      {/* GUIDED TOUR */}
      {user &&
        accessToken &&
        user.onboarding_completed === false &&
        !tourCompleted && (
          <GuidedTour
            accessToken={accessToken}
            onComplete={() => {
              dispatch(markOnboardingCompleted());
              setTourCompleted(true);
            }}
          />
        )}
    </div>
  );
}

export default Dashboard;
