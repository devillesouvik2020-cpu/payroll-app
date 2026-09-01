import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import PayrollView from './components/PayrollView';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/employees"           element={<EmployeeList />} />
          <Route path="/employees/new"       element={<EmployeeForm />} />
          <Route path="/employees/edit/:id"  element={<EmployeeForm />} />
          <Route path="/payroll"             element={<PayrollView />} />
          {/* Fallback */}
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
