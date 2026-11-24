
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth
import Login from './features/auth/pages/Login.jsx';
import Register from './features/auth/pages/Register.jsx';
import VerifyEmail from './features/auth/pages/VerifyEmail.jsx';
import ProtectedRoute from './features/auth/components/ProtectedRoute.jsx';

// Main Pages
import Dashboard from './pages/dashboard.jsx';
import UserProgress from './pages/UserProgress.jsx';

// Learning
import ModuleCatalog from './features/learning/pages/ModuleCatalog.jsx';
import ModuleDetail from './features/learning/pages/ModuleDetail.jsx';
import SubmoduleLearning from './features/learning/pages/SubmoduleLearning.jsx';

// Lab
import LabCheckpoint from './features/lab/pages/LabCheckpoint.jsx';

// Quiz
import ModuleQuiz from './features/quiz/pages/ModuleQuiz.jsx';

function App() {
  return (
    <Routes>
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Main Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modules" element={<ModuleCatalog />} />
        <Route path="/progress" element={<UserProgress />} />

        {/* Learning */}
        <Route
          path="/modules/:moduleId"
          element={<ModuleDetail />}
        />

        <Route
          path="/modules/:moduleId/submodules/:submoduleId"
          element={<SubmoduleLearning />}
        />

        {/* Interactive Lab */}
        <Route
          path="/modules/:moduleId/labs/:labId"
          element={<LabCheckpoint />}
        />

        {/* Module Quiz */}
        <Route
          path="/modules/:moduleId/quiz"
          element={<ModuleQuiz />}
        />
      </Route>

      {/* Not Found */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;
