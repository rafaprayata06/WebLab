
import { useState } from 'react';
import { Link } from 'react-router-dom';

import AuthLayout from '../components/AuthLayout.jsx';
import { registerUser } from '../authService.js';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));

    setServerMessage('');
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = 'Format email tidak valid.';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter.';
    } else if (formData.password.length > 72) {
      newErrors.password = 'Password maksimal 72 karakter.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setServerMessage('');
    setServerError('');

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const result = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setServerMessage(
        result.message ||
          'Registrasi berhasil. Silakan periksa email kamu.'
      );

      setFormData({
        name: '',
        email: '',
        password: '',
      });

      setShowPassword(false);
    } catch (error) {
      console.error('Register error:', error);

      setServerError(
        error.message || 'Terjadi kesalahan saat registrasi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout activePage="register">
      <div className="w-full">
        {/* Heading */}
        <div className="mb-5 lg:mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Mulai perjalanan belajarmu
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:mt-3 sm:text-base">
            Buat akun gratis dan mulai dari langkah pertama.
          </p>
        </div>

        {/* Pesan sukses */}
        {serverMessage && (
          <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
            <p>{serverMessage}</p>
          </div>
        )}

        {/* Pesan error backend */}
        {serverError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <p>{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 lg:space-y-3"
        >
          {/* Nama lengkap */}
          <div className="form-control">
            <label
              htmlFor="name"
              className="mb-1.5 text-sm font-semibold text-primary"
            >
              Nama Lengkap
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Andi"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`input input-bordered h-[50px] w-full rounded-lg bg-white text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-secondary focus:ring-secondary/20'
              }`}
            />

            {errors.name && (
              <p id="name-error" className="mt-1.5 text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-control">
            <label
              htmlFor="email"
              className="mb-1.5 text-sm font-semibold text-primary"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="andi@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`input input-bordered h-[50px] w-full rounded-lg bg-white text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-secondary focus:ring-secondary/20'
              }`}
            />

            {errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-control">
            <label
              htmlFor="password"
              className="mb-1.5 text-sm font-semibold text-primary"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby="password-help"
                className={`input input-bordered h-[50px] w-full rounded-lg bg-white pr-12 text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-secondary focus:ring-secondary/20'
                }`}
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={
                  showPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
                aria-pressed={showPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary disabled:opacity-50"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c5 0 8.27 4.11 9 7-.23.92-.75 1.94-1.53 2.87" />
                    <path d="M6.61 6.61C4.62 7.91 3.45 9.77 3 12c.73 2.89 4 7 9 7 1.5 0 2.84-.39 4-1.05" />
                    <path d="m3 3 18 18" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <p
              id="password-help"
              className={`mt-1.5 text-sm ${
                errors.password ? 'text-red-500' : 'text-slate-500'
              }`}
            >
              {errors.password || 'Password minimal 8 karakter.'}
            </p>
          </div>

          {/* Persetujuan */}
          <p className="pt-0.5 text-xs leading-relaxed text-slate-500">
            Dengan mendaftar, kamu menyetujui{' '}
            <a
              href="#"
              className="font-medium underline underline-offset-2"
            >
              Ketentuan Layanan
            </a>{' '}
            dan{' '}
            <a
              href="#"
              className="font-medium underline underline-offset-2"
            >
              Kebijakan Privasi
            </a>{' '}
            WebLab.
          </p>

          {/* Tombol daftar */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-secondary h-[44px] min-h-[44px] w-full rounded-lg border-none text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Memproses...
              </>
            ) : (
              <>
                Daftar Akun Gratis
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* Link login */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1 text-center text-sm lg:mt-4">
          <span className="text-slate-500">
            Sudah punya akun?
          </span>

          <Link
            to="/login"
            className="font-semibold text-secondary transition-colors hover:text-primary"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Register;
