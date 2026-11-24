
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AuthLayout from '../components/AuthLayout';
import { login } from '../authSlice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loginStatus } = useSelector((state) => state.auth);
  const isLoading = loginStatus === 'loading';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
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

    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = 'Format email tidak valid.';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setServerError('');

    if (!validateForm()) return;

    try {
      await dispatch(
        login({
          email: formData.email.trim(),
          password: formData.password,
        })
      ).unwrap();

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(
        error || 'Terjadi kesalahan. Silakan coba kembali.'
      );
    }
  };

  return (
    <AuthLayout activePage="login">
      <div className="w-full">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Senang bertemu lagi!
          </h1>

          <p className="mt-3 text-base text-slate-500">
            Masuk untuk melanjutkan progres dan latihanmu.
          </p>
        </div>

        {/* Error dari Backend */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600"
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Email */}
          <div className="form-control">
            <label
              htmlFor="email"
              className="mb-2 text-sm font-semibold text-primary"
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
              <p id="email-error" className="mt-2 text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-control">
            <label
              htmlFor="password"
              className="mb-2 text-sm font-semibold text-primary"
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
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                className={`input input-bordered h-[50px] w-full rounded-lg bg-white pr-12 text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-secondary focus:ring-secondary/20'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={
                  showPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
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

            {errors.password && (
              <p id="password-error" className="mt-2 text-sm text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-secondary h-[44px] min-h-[44px] w-full rounded-lg border-none text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Sedang masuk...
              </>
            ) : (
              <>
                Masuk dan Lanjutkan Belajar
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 flex items-center justify-center gap-1 text-sm">
          <span className="text-slate-500">
            Belum punya akun?
          </span>

          <Link
            to="/register"
            className="font-semibold text-secondary transition-colors hover:text-primary"
          >
            Daftar sekarang
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
