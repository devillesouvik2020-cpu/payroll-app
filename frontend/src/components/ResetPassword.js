import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const getStrength = () => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2) return { label: 'Weak', cls: 'strength-weak', pct: 30 };
    if (score <= 3) return { label: 'Good', cls: 'strength-medium', pct: 60 };
    return { label: 'Strong', cls: 'strength-strong', pct: 100 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/change-password`, {
        email: email.trim(),
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        setSuccess('Password changed successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(res.data.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Network error. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getStrength();

  return (
    <div className="login-page-container">
      {/* Background ambient lighting */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />
      <div className="login-ambient-orb orb-3" />

      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
            <KeyRound size={28} color="#fff" />
          </div>
          <h1 className="login-brand-title">Change Password</h1>
          <p className="login-brand-subtitle">
            Enter your current password and choose a new one
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="login-success-banner">
            <CheckCircle2 size={18} className="success-icon" />
            <div className="success-text">{success}</div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="login-error-banner">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-text">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="login-field-group">
            <label htmlFor="reset-email" className="login-label">
              Work Email Address
            </label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="reset-email"
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

          {/* Current Password */}
          <div className="login-field-group">
            <label htmlFor="reset-current-password" className="login-label">
              Current Password
            </label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reset-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="login-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="password-toggle-btn"
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="login-field-group">
            <label htmlFor="reset-new-password" className="login-label">
              New Password
            </label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <ShieldCheck size={18} />
              </span>
              <input
                id="reset-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="login-input"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="password-toggle-btn"
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="login-field-group">
            <label htmlFor="reset-confirm-password" className="login-label">
              Confirm New Password
            </label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <ShieldCheck size={18} />
              </span>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="login-input"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-btn"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {strength && (
            <div className="password-strength-section">
              <div className="password-strength-bar">
                <div
                  className={`password-strength-fill ${strength.cls}`}
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
              <span className={`password-strength-label ${strength.cls}`}>
                {strength.label}
              </span>
            </div>
          )}

          {/* Validation hints */}
          <div className="password-requirements">
            <div className={`req-item ${newPassword.length >= 8 ? 'met' : ''}`}>
              <CheckCircle2 size={12} /> At least 8 characters
            </div>
            <div className={`req-item ${/[A-Z]/.test(newPassword) ? 'met' : ''}`}>
              <CheckCircle2 size={12} /> One uppercase letter
            </div>
            <div className={`req-item ${/[0-9]/.test(newPassword) ? 'met' : ''}`}>
              <CheckCircle2 size={12} /> One number
            </div>
            <div className={`req-item ${newPassword && confirmPassword && newPassword === confirmPassword ? 'met' : ''}`}>
              <CheckCircle2 size={12} /> Passwords match
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="login-submit-btn"
            id="btn-reset-submit"
          >
            {submitting ? (
              <span className="login-loading-content">
                <span className="spinner-dots" /> Updating Password…
              </span>
            ) : (
              <span className="login-btn-content">
                <KeyRound size={17} /> Change Password
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-card-footer">
          <Link to="/login" className="reset-back-link">
            <ArrowLeft size={15} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
