
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './features/auth/pages/Login.jsx';
import Register from './features/auth/pages/Register.jsx';
import VerifyEmail from './features/auth/pages/VerifyEmail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './features/auth/components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
