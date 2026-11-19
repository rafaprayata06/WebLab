
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../authService';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const verificationRequest = useRef(null);

  const [result, setResult] = useState({
    status: 'loading',
    message: '',
  });

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    // Gunakan kembali request yang sama jika effect dijalankan ulang.
    if (
      !verificationRequest.current ||
      verificationRequest.current.token !== token
    ) {
      verificationRequest.current = {
        token,
        promise: verifyEmail(token),
      };
    }

    verificationRequest.current.promise
      .then((response) => {
        if (isMounted) {
          setResult({
            status: 'success',
            message:
              response.message ||
              'Email berhasil diverifikasi. Akun WebLab kamu sudah aktif.',
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setResult({
            status: 'error',
            message: error.message || 'Verifikasi email gagal.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const status = !token ? 'error' : result.status;

  const message = !token
    ? 'Token verifikasi tidak ditemukan.'
    : result.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body items-center text-center p-8">

          {status === 'loading' && (
            <>
              <span className="loading loading-spinner loading-lg text-secondary" />

              <h1 className="text-2xl font-bold text-primary mt-4">
                Memverifikasi Email
              </h1>

              <p className="text-base-content/70">
                Mohon tunggu sebentar, kami sedang memverifikasi alamat email kamu.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-9 h-9 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-primary mt-4">
                Email Berhasil Diverifikasi!
              </h1>

              <p className="text-base-content/70">{message}</p>

              <Link to="/login" className="btn btn-secondary w-full mt-4">
                Masuk ke WebLab
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-9 h-9 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-primary mt-4">
                Verifikasi Gagal
              </h1>

              <p className="text-base-content/70">{message}</p>

              <Link to="/register" className="btn btn-secondary w-full mt-4">
                Kembali ke Registrasi
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
