
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import AppNavbar from '../components/AppNavbar.jsx';
import { fetchModules } from '../features/learning/learningSlice';

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

function UserProgress() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { accessToken, user } = useSelector((state) => state.auth);

  const {
    modules,
    status,
    error,
  } = useSelector((state) => state.learning);

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (accessToken && status === 'idle') {
      dispatch(fetchModules(accessToken));
    }
  }, [dispatch, accessToken, status]);

  const normalizedModules = useMemo(() => {
    return [...modules]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((module, index) => {
        const total = Number(module.total_submodules || 0);
        const completed = Number(module.completed_submodules || 0);

        return {
          ...module,
          number: `MODUL ${module.sort_order || index + 1}`,
          total,
          completed,
          isUnlocked: Boolean(module.is_unlocked),
          percentage:
            total > 0
              ? Math.min(100, Math.round((completed / total) * 100))
              : 0,
        };
      });
  }, [modules]);

  const filteredModules = normalizedModules.filter((module) =>
    `${module.title} ${module.description || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalModules = normalizedModules.length;

  const totalSubmodules = normalizedModules.reduce(
    (total, module) => total + module.total,
    0
  );

  const completedSubmodules = normalizedModules.reduce(
    (total, module) => total + module.completed,
    0
  );

  const completedModules = normalizedModules.filter(
    (module) => module.total > 0 && module.completed >= module.total
  ).length;

  const overallPercentage =
    totalSubmodules > 0
      ? Math.min(100, Math.round((completedSubmodules / totalSubmodules) * 100))
      : 0;

  const statistics = [
    {
      label: 'Progres Keseluruhan',
      value: `${overallPercentage}%`,
      description: 'Dari seluruh materi',
      icon: <ChartIcon />,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Materi Selesai',
      value: completedSubmodules,
      description: `Dari ${totalSubmodules} submodul`,
      icon: <BookIcon />,
      iconClass: 'bg-teal-50 text-[#0F766E]',
    },
    {
      label: 'Modul Tuntas',
      value: completedModules,
      description: `Dari ${totalModules} modul`,
      icon: <LayersIcon />,
      iconClass: 'bg-orange-50 text-orange-600',
    },
  ];

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] text-[#172554]">
      {/* NAVBAR - SAMA DENGAN HALAMAN LAIN */}
      <AppNavbar
        showBack={false}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari progres modul..."
        searchLabel="Cari progres modul"
        navItems={[
          { label: 'Beranda', href: '/dashboard' },
          { label: 'Daftar Modul', href: '/modules' },
          { label: 'Progres Saya', href: '/progress' },
        ]}
        activeNav="Progres Saya"
      />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-12 lg:py-10">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0F766E]">
            Learning Analytics
          </p>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Progres Belajar Saya
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Hai, {user?.name || 'Pengguna'}! Pantau perkembangan belajarmu
            dan lihat materi yang sudah berhasil kamu selesaikan.
          </p>
        </section>

        {/* LOADING */}
        {isLoading && (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <span className="loading loading-spinner loading-lg text-[#0F766E]" />
            <span className="ml-3 text-sm text-slate-500">
              Memuat progres belajar...
            </span>
          </div>
        )}

        {/* ERROR */}
        {status === 'failed' && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p>{error || 'Progres belajar gagal dimuat.'}</p>

            <button
              type="button"
              onClick={() => accessToken && dispatch(fetchModules(accessToken))}
              className="mt-3 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* PROGRESS CONTENT */}
        {!isLoading && status === 'succeeded' && (
          <>
            {/* OVERALL PROGRESS */}
            <section className="mb-7 rounded-2xl bg-[#172554] p-6 text-white shadow-lg shadow-[#172554]/10 sm:p-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">
                    Perjalanan Belajarmu
                  </p>

                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                    {overallPercentage}%
                  </h2>

                  <p className="mt-2 text-sm text-blue-100">
                    {completedSubmodules} dari {totalSubmodules} materi telah
                    diselesaikan.
                  </p>
                </div>

                <div className="flex h-28 w-28 shrink-0 items-center justify-center self-center rounded-full border-[8px] border-white/15 sm:self-auto">
                  <div className="flex h-full w-full items-center justify-center rounded-full border-[5px] border-[#2DD4BF]">
                    <span className="text-xl font-bold">
                      {overallPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#2DD4BF] transition-all duration-700"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </section>

            {/* STATISTICS */}
            <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statistics.map((stat) => (
                <article
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
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
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {stat.description}
                    </p>
                  </div>
                </article>
              ))}
            </section>

            {/* MODULE PROGRESS */}
            <section>
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0F766E]">
                  Detail Pembelajaran
                </p>

                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Progres Setiap Modul
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Lihat perkembangan materi pada setiap modul pembelajaran.
                </p>
              </div>

              {filteredModules.length > 0 ? (
                <div className="space-y-4">
                  {filteredModules.map((module) => (
                    <article
                      key={module.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold tracking-[0.14em] text-[#0F766E]">
                            {module.number}
                          </p>

                          <h3 className="mt-1 text-lg font-bold text-[#172554]">
                            {module.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {module.completed} dari {module.total} materi selesai
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[#172554]">
                            {module.percentage}%
                          </span>

                          {module.total > 0 && module.completed >= module.total && (
                            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">
                              Selesai
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuenow={module.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`Progres ${module.title}`}
                      >
                        <div
                          className="h-full rounded-full bg-[#0F766E] transition-all duration-700"
                          style={{ width: `${module.percentage}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          {module.isUnlocked
                            ? 'Modul tersedia'
                            : 'Modul terkunci'}
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/modules/${module.id}`)}
                          disabled={!module.isUnlocked}
                          className="text-sm font-semibold text-[#0F766E] transition hover:text-[#172554] disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {module.isUnlocked
                            ? 'Lihat Modul →'
                            : 'Belum tersedia'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
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
          </>
        )}
      </main>

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
    </div>
  );
}

export default UserProgress;
