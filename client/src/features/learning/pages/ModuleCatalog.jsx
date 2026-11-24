
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import AppNavbar from '../../../components/AppNavbar.jsx';
import { fetchModules } from '../learningSlice';

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

const filters = [
  { id: 'all', label: 'Semua' },
  { id: 'not-started', label: 'Belum mulai' },
  { id: 'ongoing', label: 'Berlangsung' },
  { id: 'completed', label: 'Selesai' },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ModuleCatalog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { accessToken } = useSelector((state) => state.auth);

  const {
    modules,
    status,
    error,
  } = useSelector((state) => state.learning);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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

        let progressStatus = 'not-started';

        if (total > 0 && completed >= total) {
          progressStatus = 'completed';
        } else if (completed > 0) {
          progressStatus = 'ongoing';
        }

        return {
          ...module,
          code: modulePresentation[module.slug]?.code || 'WEB',
          color:
            modulePresentation[module.slug]?.color ||
            'bg-slate-100 text-slate-700',
          number: `MODUL ${module.sort_order || index + 1}`,
          total,
          completed,
          isUnlocked: Boolean(module.is_unlocked),
          percentage:
            total > 0
              ? Math.min(100, Math.round((completed / total) * 100))
              : 0,
          progressStatus,
        };
      });
  }, [modules]);

  const filteredModules = normalizedModules.filter((module) => {
    const matchesSearch =
      `${module.title} ${module.description || ''} ${module.code}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      module.progressStatus === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const totalSubmodules = normalizedModules.reduce(
    (total, module) => total + module.total,
    0
  );

  const completedSubmodules = normalizedModules.reduce(
    (total, module) => total + module.completed,
    0
  );

  const openModule = (module) => {
    if (!module.isUnlocked) return;
    navigate(`/modules/${module.id}`);
  };

  const isLoading = status === 'idle' || status === 'loading';

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
        activeNav="Daftar Modul"
      />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-12 lg:py-10">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0F766E]">
            Learning Path
          </p>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Daftar Modul Pembelajaran
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Pelajari dasar-dasar pengembangan web secara bertahap melalui
            materi dan latihan interaktif yang tersedia.
          </p>
        </section>

        {/* SUMMARY */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Modul
            </p>
            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {normalizedModules.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Materi Selesai
            </p>
            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {completedSubmodules}
              <span className="ml-2 text-base font-medium text-slate-400">
                / {totalSubmodules}
              </span>
            </p>
          </article>
        </section>

        {/* MODULE LIST */}
        <section>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight">
              Semua Modul
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Pilih modul untuk mulai atau melanjutkan pembelajaran.
            </p>
          </div>

          {/* STATUS FILTER */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-5 py-2 text-xs font-medium transition sm:text-sm ${
                    isActive
                      ? 'border-[#172554] bg-[#172554] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#0F766E] hover:text-[#0F766E]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* LOADING */}
          {isLoading && (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <span className="loading loading-spinner loading-lg text-[#0F766E]" />
              <span className="ml-3 text-sm text-slate-500">
                Memuat daftar modul...
              </span>
            </div>
          )}

          {/* ERROR */}
          {status === 'failed' && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              <p>{error || 'Daftar modul gagal dimuat.'}</p>

              <button
                type="button"
                onClick={() => accessToken && dispatch(fetchModules(accessToken))}
                className="mt-3 font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* MODULE GRID */}
          {!isLoading && status === 'succeeded' && filteredModules.length > 0 && (
            <>
              <p className="mb-4 text-xs text-slate-400">
                Menampilkan {filteredModules.length} dari {normalizedModules.length} modul
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredModules.map((module) => (
                  <article
                    key={module.id}
                    className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#0F766E]/30 hover:shadow-lg sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-2 text-sm font-bold ${module.color}`}
                      >
                        {module.code}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                          module.progressStatus === 'completed'
                            ? 'bg-teal-50 text-[#0F766E]'
                            : module.progressStatus === 'ongoing'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {module.progressStatus === 'completed'
                          ? 'Selesai'
                          : module.progressStatus === 'ongoing'
                            ? 'Berlangsung'
                            : 'Belum mulai'}
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
                          {module.completed}/{module.total} materi selesai
                        </span>

                        <span className="font-bold text-[#172554]">
                          {module.percentage}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuenow={module.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`Progres ${module.title}`}
                      >
                        <div
                          className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                          style={{ width: `${module.percentage}%` }}
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
                ))}
              </div>
            </>
          )}

          {/* EMPTY STATE */}
          {status === 'succeeded' && filteredModules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <SearchIcon />
              </div>

              <p className="font-semibold text-[#172554]">
                Modul tidak ditemukan.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Tidak ada modul yang sesuai dengan pencarian atau filter ini.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveFilter('all');
                }}
                className="mt-4 text-sm font-semibold text-[#0F766E]"
              >
                Reset pencarian dan filter
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
    </div>
  );
}

export default ModuleCatalog;
