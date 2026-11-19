
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../features/auth/authService';

const modules = [
  {
    id: 1,
    code: '</>',
    number: 'MODUL 1',
    title: 'Pengenalan Pemrograman Web',
    description:
      'Kenali cara kerja web, browser, dan perjalanan menjadi web developer.',
    total: 4,
    completed: 4,
    color: 'bg-blue-50 text-blue-700',
    status: 'Selesai',
  },
  {
    id: 2,
    code: 'HTML',
    number: 'MODUL 2',
    title: 'HTML',
    description:
      'Bangun struktur halaman pertamamu dengan elemen HTML.',
    total: 7,
    completed: 7,
    color: 'bg-orange-50 text-orange-600',
    status: 'Selesai',
  },
  {
    id: 3,
    code: 'CSS',
    number: 'MODUL 3',
    title: 'CSS',
    description:
      'Ubah halaman sederhana menjadi tampilan yang menarik dan responsif.',
    total: 9,
    completed: 6,
    color: 'bg-sky-50 text-sky-600',
    status: 'Sedang dipelajari',
  },
  {
    id: 4,
    code: 'JS',
    number: 'MODUL 4',
    title: 'JavaScript',
    description:
      'Hidupkan halaman web dengan logika dan interaksi yang seru.',
    total: 11,
    completed: 11,
    color: 'bg-yellow-50 text-yellow-700',
    status: 'Selesai',
  },
  {
    id: 5,
    code: 'PHP',
    number: 'MODUL 5',
    title: 'PHP',
    description:
      'Pelajari pemrosesan data dan logika di sisi server.',
    total: 11,
    completed: 0,
    color: 'bg-indigo-50 text-indigo-700',
    status: 'Belum dimulai',
  },
  {
    id: 6,
    code: 'SQL',
    number: 'MODUL 6',
    title: 'Database Dasar',
    description:
      'Simpan, kelola, dan temukan data menggunakan SQL.',
    total: 12,
    completed: 0,
    color: 'bg-teal-50 text-teal-700',
    status: 'Belum dimulai',
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Mengambil informasi pengguna dari hasil login
  const user = useMemo(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }, []);

  const fullName = user?.name || 'Pengguna';
  const firstName = fullName.trim().split(/\s+/)[0];

  const initial = fullName.trim().charAt(0).toUpperCase();

  // Filter modul berdasarkan pencarian
  const filteredModules = modules.filter((module) =>
    `${module.title} ${module.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-primary">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-12">

          {/* Logo */}
          <div
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
              {'</>'}
            </div>

            <span className="text-2xl font-bold tracking-tight text-primary">
              WebLab
            </span>
          </div>

          {/* Search */}
          <div className="hidden w-full max-w-[424px] lg:block">
            <div className="flex h-[42px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 transition-colors focus-within:border-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-slate-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                type="text"
                placeholder="Cari modul atau topik: HTML, Flexbox, SQL..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-xs text-primary outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#beranda"
              className="relative py-3 text-sm font-semibold text-secondary after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-6 after:rounded-full after:bg-secondary"
            >
              Beranda
            </a>

            <a
              href="#modul"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary"
            >
              Daftar Modul
            </a>

            <a
              href="#statistik"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary"
            >
              Progres Saya
            </a>
          </nav>

          {/* User Profile */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initial}
            </div>

            <span className="hidden max-w-24 truncate text-sm font-semibold text-primary sm:block">
              {fullName}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main id="beranda" className="mx-auto max-w-[1440px] px-6 py-10 lg:px-16">

        {/* Greeting */}
        <section className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Selamat datang kembali, {firstName} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Satu langkah kecil hari ini, satu kemampuan baru untuk masa depan.
            </p>
          </div>

          <div className="rounded-full border border-secondary/20 bg-teal-50 px-4 py-2 text-xs font-semibold text-secondary">
            Jalur belajar pemula
          </div>
        </section>

        {/* Continue Learning */}
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div className="flex-1">
              <p className="text-[11px] font-bold tracking-[0.12em] text-secondary">
                LANJUTKAN PERJALANANMU
              </p>

              <h2 className="mt-3 text-xl font-bold text-primary sm:text-2xl">
                Terakhir dipelajari: CSS — Flexbox (6 dari 9)
              </h2>

              <div className="mt-5 flex max-w-[520px] items-center gap-4">
                <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[67%] rounded-full bg-secondary" />
                </div>

                <span className="text-sm font-semibold text-primary">
                  67%
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Pelajari cara menyusun elemen dengan lebih mudah dan fleksibel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary min-h-[44px] rounded-lg border-none px-6 text-sm font-semibold text-white"
            >
              Lanjutkan Belajar →
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section
          id="statistik"
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {/* Submodules */}
          <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 7v14" />
                <path d="M3 18V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13" />
                <path d="M3 18a3 3 0 0 0 3 3h15" />
                <path d="M8 7h8" />
              </svg>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Submodul Selesai (28/54)
              </p>
              <p className="mt-1 text-3xl font-bold text-primary">
                28 <span className="text-sm font-medium text-slate-400">/ 54</span>
              </p>
            </div>
          </div>

          {/* Modules */}
          <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
              </svg>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Modul Tuntas (3/6)
              </p>
              <p className="mt-1 text-3xl font-bold text-primary">
                3 <span className="text-sm font-medium text-slate-400">/ 6</span>
              </p>
            </div>
          </div>

          {/* Quiz Score */}
          <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-4 4" />
              </svg>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Rata-rata Nilai Kuis (93/100)
              </p>
              <p className="mt-1 text-3xl font-bold text-primary">
                93 <span className="text-sm font-medium text-slate-400">/ 100</span>
              </p>
            </div>
          </div>
        </section>

        {/* Module Catalog Heading */}
        <section id="modul">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-primary sm:text-2xl">
                Mulai dari dasar, kuasai langkah demi langkah
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                6 modul terarah · 54 submodul · Latihan langsung di browser
              </p>
            </div>

            <a
              href="#statistik"
              className="text-sm font-semibold text-secondary hover:text-primary"
            >
              Lihat progres saya →
            </a>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module) => {
              const percentage = Math.round(
                (module.completed / module.total) * 100
              );

              return (
                <article
                  key={module.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Module Identity */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-2 text-sm font-bold ${module.color}`}
                    >
                      {module.code}
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                      {module.total} submodul
                    </span>
                  </div>

                  {/* Module Description */}
                  <div className="mt-6 flex-1">
                    <p className="text-[11px] font-bold tracking-wider text-secondary">
                      {module.number}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-primary">
                      {module.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {module.description}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mt-7">
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">
                        {module.completed}/{module.total} submodul selesai
                      </span>

                      <span className="font-semibold text-primary">
                        {percentage}%
                      </span>
                    </div>

                    <div className="h-[7px] overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-secondary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-outline mt-6 min-h-[44px] rounded-lg border-slate-200 text-sm font-semibold text-primary hover:border-secondary hover:bg-secondary hover:text-white"
                  >
                    Buka Modul →
                  </button>
                </article>
              );
            })}
          </div>

          {filteredModules.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="font-semibold text-primary">
                Modul tidak ditemukan.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Coba gunakan kata kunci pencarian yang lain.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-16">
          <p className="text-xs text-slate-500">
            © 2026 WebLab · Belajar sedikit, berkembang setiap hari.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
