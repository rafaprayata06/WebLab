
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
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

function AppNavbar({
  title = '',
  subtitle = '',
  showTitle = true,
  backTo = null,
  backLabel = 'Kembali',
  showBack = true,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Cari...',
  searchLabel = 'Pencarian',
  navItems = [],
  activeNav = '',
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fullName = user?.name || 'Pengguna';

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

 
const handleNavigation = (item, event) => {
  event.preventDefault();

  if (item.href?.startsWith('#')) {
    document
      .getElementById(item.href.slice(1))
      ?.scrollIntoView({ behavior: 'smooth' });
  } else if (item.href) {
    navigate(item.href);
  }

  setMobileMenuOpen(false);
};


  const logoutButtonClass =
    'inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:gap-7 lg:px-12">

        {/* BRAND */}
        <button
          type="button"
          data-tour="navbar-brand"
          onClick={() => navigate('/dashboard')}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="WebLab Dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172554] text-lg font-bold text-white">
            {'</>'}
          </span>

          <span className="text-xl font-bold tracking-tight text-[#172554] sm:text-2xl">
            WebLab
          </span>
        </button>

        {/* PAGE TITLE */}
        {showTitle && (title || subtitle) && (
          <div className="hidden min-w-0 flex-1 text-center sm:block">
            {title && (
              <p className="truncate text-sm font-bold text-[#172554]">
                {title}
              </p>
            )}

            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* SEARCH */}
        {onSearchChange && (
          <div className="hidden min-w-[180px] max-w-[340px] flex-1 lg:block">
            <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/10">
              <span className="shrink-0 text-slate-400">
                <SearchIcon />
              </span>

              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
                className="w-full min-w-0 bg-transparent text-sm text-[#172554] outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* DESKTOP NAVIGATION */}
        {navItems.length > 0 && (
          <nav className="hidden shrink-0 items-center gap-5 xl:gap-6 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(event) => handleNavigation(item, event)}
                className={`whitespace-nowrap border-b-2 py-2 text-sm transition-colors duration-200 ${
                  activeNav === item.label
                    ? 'border-[#0F766E] font-semibold text-[#0F766E]'
                    : 'border-transparent font-medium text-slate-500 hover:text-[#172554]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* ACCOUNT AND LOGOUT */}
        <div className="ml-auto hidden shrink-0 items-center gap-3 sm:flex lg:gap-4">
          <span className="max-w-36 truncate text-sm font-semibold text-[#172554]">
            {fullName}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className={logoutButtonClass}
          >
            Logout
          </button>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#172554] transition hover:bg-slate-50 lg:hidden"
          aria-label="Buka navigasi"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE PAGE TITLE */}
      {(title || subtitle) && (
        <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
          {title && (
            <p className="text-xs font-bold text-[#172554]">
              {title}
            </p>
          )}

          {subtitle && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          {onSearchChange && (
            <div className="mb-4 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 lg:hidden">
              <span className="shrink-0 text-slate-400">
                <SearchIcon />
              </span>

              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
                className="w-full min-w-0 bg-transparent text-sm text-[#172554] outline-none placeholder:text-slate-400"
              />
            </div>
          )}

          {navItems.length > 0 && (
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => handleNavigation(item)}
                  className={`rounded-lg px-3 py-3 text-sm transition-colors duration-200 ${
                    activeNav === item.label
                      ? 'bg-teal-50 font-semibold text-[#0F766E]'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-[#172554]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:hidden">
            <span className="min-w-0 truncate text-sm font-semibold text-[#172554]">
              {fullName}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className={logoutButtonClass}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* BACK NAVIGATION */}
      {showBack && backTo && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#0F766E]"
            >
              <span aria-hidden="true">←</span>
              {backLabel}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default AppNavbar;
