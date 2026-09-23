import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';

jest.mock('axios');

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Logged In Employees section and ensures old sections are absent', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: {
            data: {
              totalEmployees: 5,
              presentToday: 4,
              totalMonthlySalary: 350000,
              topDepartment: { _id: 'Engineering', count: 2 },
            },
          },
        });
      }
      if (url.includes('/payroll')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/employees/logged-in-today') || url.includes('/time-tracker')) {
        return Promise.resolve({
          data: {
            data: [
              {
                _id: '1',
                employee: {
                  _id: 'emp1',
                  name: 'Sarah Chen',
                  employeeId: 'EMP001',
                  department: 'Engineering',
                  designation: 'Senior Frontend Engineer',
                },
                loginTime: '09:05',
                logoutTime: '18:15',
                totalHours: 9.1,
                status: 'completed',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verify Logged In Employees heading is rendered
    expect(screen.getByRole('heading', { name: /Logged In Employees/i })).toBeInTheDocument();

    // Verify old sections are NOT rendered
    expect(screen.queryByText(/HR Modules & Shortcuts/i)).toBeNull();
    expect(screen.queryByText(/Attendance Overview/i)).toBeNull();

    // Wait for employee data to appear
    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('EMP001')).toBeInTheDocument();
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    });
  });
});
