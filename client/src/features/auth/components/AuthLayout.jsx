
import { Link } from 'react-router-dom';
import AuthBranding from './AuthBranding.jsx';

function AuthLayout({ children, activePage }) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">

      {/* Kolom kiri */}
      <div className="hidden lg:block">
        <AuthBranding />
      </div>

      {/* Kolom kanan */}
      <section className="flex min-h-screen flex-col bg-base-100 px-6 py-5 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">

        {/* Navigasi */}
        <nav className="flex items-center justify-end gap-4 sm:gap-6">
          <Link
            to="/login"
            className={`flex min-h-11 items-center px-4 text-sm font-medium transition ${
              activePage === 'login'
                ? 'text-primary'
                : 'text-base-content/60 hover:text-primary'
            }`}
          >
            Masuk (Login)
          </Link>

          <Link
            to="/register"
            className={`flex min-h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium transition ${
              activePage === 'register'
                ? 'border-base-300 bg-base-200 text-primary'
                : 'border-transparent text-base-content/60 hover:bg-base-200'
            }`}
          >
            Daftar Akun (Registrasi)
          </Link>
        </nav>

        {/* Konten halaman */}
        <div className="flex flex-1 items-center justify-center py-6 lg:py-3">
          <div className="w-full max-w-[580px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-3 text-center text-xs text-base-content/60">
          © 2026 WebLab · Tempat belajarmu bertumbuh.
        </footer>
      </section>
    </main>
  );
}

export default AuthLayout;
