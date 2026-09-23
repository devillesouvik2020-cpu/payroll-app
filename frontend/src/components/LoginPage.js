import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    badge: 'Full Access',
    email: 'admin.hr@payrollpro.io',
    password: 'Demo@12345',
    icon: Shield,
    color: '#8b5cf6',
  },
  {
    role: 'HR Manager',
    badge: 'HR & Staff',
    email: 'priya.sharma@payrollpro.io',
    password: 'Demo@12345',
    icon: Users,
    color: '#06b6d4',
  },
  {
    role: 'Employee',
    badge: 'Self-Service',
    email: 'sarah.chen@payrollpro.io',
    password: 'Demo@12345',
    icon: Sparkles,
    color: '#10b981',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both work email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="login-page-container">
      {/* Background ambient lighting */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />
      <div className="login-ambient-orb orb-3" />

      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Briefcase size={28} color="#fff" />
          </div>
          <h1 className="login-brand-title">PayrollPro</h1>
          <p className="login-brand-subtitle">
            Enterprise Workforce & Payroll Management
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="login-demo-section">
          <span className="login-demo-label">Quick Demo Access</span>
          <div className="login-demo-grid">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`login-demo-btn ${isSelected ? 'selected' : ''}`}
                  title={`Click to fill ${acc.role} credentials`}
                >
                  <div className="demo-btn-header">
                    <Icon size={12} style={{ color: acc.color, flexShrink: 0 }} />
                    <span className="demo-role-name">{acc.role}</span>
                  </div>
                  <span className="demo-badge">{acc.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="login-error-banner">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-text">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="login-field-group">
            <label htmlFor="login-email" className="login-label">
              Work Email Address
            </label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="login-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field-group">
            <div className="password-label-row">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <span className="login-hint-text">Default demo: Demo@12345</span>
            </div>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="login-options-row">
            <label className="remember-me-toggle">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember this device</span>
            </label>
            <span className="secure-badge">
              <CheckCircle2 size={13} color="#10b981" /> 256-bit Encrypted
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="login-submit-btn"
            id="btn-login-submit"
          >
            {submitting ? (
              <span className="login-loading-content">
                <span className="spinner-dots" /> Authenticating...
              </span>
            ) : (
              <span className="login-btn-content">
                Sign In to Dashboard <ArrowRight size={17} />
              </span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-card-footer">
          <p>
            Newly added employee? Use the auto-generated password provided during
            onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
