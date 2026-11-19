
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

  // Menangani perubahan input
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

  // Validasi form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
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

  // Menangani submit registrasi
  const handleSubmit = async (event) => {
    event.preventDefault();

    setServerMessage('');
    setServerError('');

    // Periksa validasi sebelum mengirim request
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Mengirim data ke backend
      const result = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Menampilkan pesan dari backend
      setServerMessage(
        result.message ||
        'Registrasi berhasil. Silakan periksa email kamu.'
      );

      // Kosongkan form setelah berhasil
      setFormData({
        name: '',
        email: '',
        password: '',
      });

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
      <div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-base-content">
            Mulai perjalanan belajarmu
          </h1>

          <p className="mt-3 text-base text-base-content/65">
            Buat akun gratis dan mulai dari langkah pertama.
          </p>
        </div>

        {/* Pesan sukses */}
        {serverMessage && (
          <div
            role="status"
            className="alert alert-success text-white mb-5 text-sm"
          >
            <span>{serverMessage}</span>
          </div>
        )}

        {/* Pesan error backend */}
        {serverError && (
          <div
            role="alert"
            className="alert alert-error mb-5 text-sm"
          >
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >

          {/* Nama lengkap */}
          <div className="form-control">
            <label htmlFor="name" className="label mb-1">
              <span className="label-text font-semibold">
                Nama Lengkap
              </span>
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
              className={`input input-bordered h-12 w-full bg-base-100 ${
                errors.name ? 'input-error' : ''
              }`}
            />

            {errors.name && (
              <p className="mt-1 text-sm text-error">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-control">
            <label htmlFor="email" className="label mb-1">
              <span className="label-text font-semibold">
                Email
              </span>
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
              className={`input input-bordered h-12 w-full bg-base-100 ${
                errors.email ? 'input-error' : ''
              }`}
            />

            {errors.email && (
              <p className="mt-1 text-sm text-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-control">
            <label htmlFor="password" className="label mb-1">
              <span className="label-text font-semibold">
                Password
              </span>
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
                className={`input input-bordered h-12 w-full bg-base-100 pr-16 ${
                  errors.password ? 'input-error' : ''
                }`}
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="btn btn-ghost btn-sm absolute top-1/2 right-2 -translate-y-1/2"
                aria-label={
                  showPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <p className={`mt-2 text-xs ${
              errors.password
                ? 'text-error'
                : 'text-base-content/60'
            }`}>
              {errors.password || 'Password minimal 8 karakter.'}
            </p>
          </div>

          {/* Persetujuan */}
          <p className="pt-1 text-xs leading-relaxed text-base-content/65">
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
            className="btn btn-secondary h-12 w-full text-sm font-semibold"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
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
        <p className="mt-6 text-center text-sm text-base-content/65">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Masuk di sini
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}

export default Register;
