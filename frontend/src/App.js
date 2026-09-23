import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import EmployeeProfile from './components/EmployeeProfile';
import PayrollView from './components/PayrollView';
import AttendancePage from './components/AttendancePage';
import TimeTrackerPage from './components/TimeTrackerPage';
import TasksPage from './components/TasksPage';
import PerformancePage from './components/PerformancePage';
import AssetsPage from './components/AssetsPage';
import SettingsPage from './components/SettingsPage';
import HRManagerProfile from './components/HRManagerProfile';
import MyPayslips from './components/MyPayslips';
import MyAttendance from './components/MyAttendance';

// Redirect to / if authenticated, else show login
function PublicLoginRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
}

// Wrap with Layout + optional permission check
function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Always accessible when logged in */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* admin + hr */}
      <Route path="/employees"        element={<ProtectedRoute permission="employees"><EmployeeList /></ProtectedRoute>} />
      <Route path="/employees/new"    element={<ProtectedRoute permission="employees"><EmployeeForm /></ProtectedRoute>} />
      <Route path="/employees/edit/:id" element={<ProtectedRoute permission="employees"><EmployeeForm /></ProtectedRoute>} />
      <Route path="/employees/:id"    element={<ProtectedRoute permission="employees"><EmployeeProfile /></ProtectedRoute>} />
      <Route path="/payroll"          element={<ProtectedRoute permission="payroll"><PayrollView /></ProtectedRoute>} />
      <Route path="/performance"      element={<ProtectedRoute permission="performance"><PerformancePage /></ProtectedRoute>} />

      {/* admin + hr — attendance (all employees) */}
      <Route path="/attendance"       element={<ProtectedRoute permission="attendance"><AttendancePage /></ProtectedRoute>} />

      {/* admin only */}
      <Route path="/time-tracker"     element={<ProtectedRoute permission="timeTracker"><TimeTrackerPage /></ProtectedRoute>} />
      <Route path="/settings"         element={<ProtectedRoute permission="settings"><SettingsPage /></ProtectedRoute>} />
      <Route path="/hr-manager"       element={<ProtectedRoute permission="hrManager"><HRManagerProfile /></ProtectedRoute>} />

      {/* it + admin */}
      <Route path="/assets"           element={<ProtectedRoute permission="assets"><AssetsPage /></ProtectedRoute>} />

      {/* employee + admin */}
      <Route path="/tasks"            element={<ProtectedRoute permission="tasks"><TasksPage /></ProtectedRoute>} />
      <Route path="/my-payslips"      element={<ProtectedRoute permission="myPayslips"><MyPayslips /></ProtectedRoute>} />
      <Route path="/my-attendance"    element={<ProtectedRoute permission="myAttendance"><MyAttendance /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
