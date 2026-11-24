
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useSelector(
    (state) => state.auth
  );

  // Tunggu sampai proses pengecekan autentikasi selesai.
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // Jika belum login, arahkan ke halaman login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login, tampilkan halaman yang dilindungi.
  return <Outlet />;
}

export default ProtectedRoute;
