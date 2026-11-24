
import { Link } from 'react-router-dom';
import AuthBranding from './AuthBranding.jsx';

function AuthLayout({ children, activePage }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:min-h-dvh lg:grid-cols-2">
      {/* Kolom kiri: Branding */}
      <div className="hidden min-h-dvh lg:block">
        <AuthBranding />
      </div>

      {/* Kolom kanan: Form */}
      <section className="flex min-h-dvh flex-col bg-base-100 px-4 py-3 sm:px-8 sm:py-4 md:px-10 lg:px-10 lg:py-2 xl:px-16">
        {/* Navigasi */}
        <nav className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
          <Link
            to="/login"
            className={`flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
              activePage === 'login'
                ? 'text-primary'
                : 'text-base-content/60 hover:text-primary'
            }`}
          >
            Masuk (Login)
          </Link>

          <Link
            to="/register"
            className={`flex min-h-10 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${
              activePage === 'register'
                ? 'border-base-300 bg-base-200 text-primary'
                : 'border-transparent text-base-content/60 hover:bg-base-200'
            }`}
          >
            Daftar Akun (Registrasi)
          </Link>
        </nav>

        {/* Konten halaman */}
        <div className="flex flex-1 items-center justify-center py-5 lg:py-2">
          <div className="w-full max-w-[580px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 py-2 text-center text-xs text-base-content/60">
          © 2026 WebLab · Tempat belajarmu bertumbuh.
        </footer>
      </section>
    </main>
  );
}

export default AuthLayout;
