import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const AuthContext = createContext(null);

// Permission definitions per role
export const PERMISSIONS = {
  admin: {
    dashboard:   true,
    employees:   true,
    payroll:     true,
    attendance:  true, // all employees
    timeTracker: true,
    tasks:       true,
    performance: true,
    assets:      true,
    settings:    true,
    hrManager:   true,
    myPayslips:  false,
    myAttendance:false,
  },
  hr: {
    dashboard:   true,
    employees:   true,
    payroll:     true,
    attendance:  true, // all employees, can edit time
    timeTracker: false,
    tasks:       false,
    performance: true,
    assets:      false,
    settings:    false,
    hrManager:   true,
    myPayslips:  false,
    myAttendance:false,
  },
  it: {
    dashboard:   true,
    employees:   false,
    payroll:     false,
    attendance:  false,
    timeTracker: false,
    tasks:       false,
    performance: false,
    assets:      true,
    settings:    false,
    hrManager:   false,
    myPayslips:  false,
    myAttendance:false,
  },
  employee: {
    dashboard:    true,
    employees:    false,
    payroll:      false,
    attendance:   false,
    timeTracker:  false,
    tasks:        true,
    performance:  false,
    assets:       false,
    settings:     false,
    hrManager:    false,
    myPayslips:   true,
    myAttendance: true,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('payroll_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('payroll_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('payroll_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: email.trim(),
        password,
      });
      if (res.data.success && res.data.data) {
        const userData = res.data.data;
        setUser(userData);
        return userData;
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('payroll_user');
  };

  // Helper: check if current user has a permission
  const can = (permission) => {
    const role = user?.role || 'employee';
    const perms = PERMISSIONS[role] || PERMISSIONS.employee;
    return perms[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
