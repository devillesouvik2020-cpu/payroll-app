import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
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

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Employee Management */}
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/new" element={<EmployeeForm />} />
          <Route path="/employees/edit/:id" element={<EmployeeForm />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />

          {/* Payroll */}
          <Route path="/payroll" element={<PayrollView />} />

          {/* HR Tools */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/time-tracker" element={<TimeTrackerPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/assets" element={<AssetsPage />} />

          {/* HR Manager & Settings */}
          <Route path="/hr-manager" element={<HRManagerProfile />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
