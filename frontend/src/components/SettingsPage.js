import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Layers,
  Clock,
  Calendar,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'departments' | 'working-hours' | 'leaves' | 'notifications'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    companyName: 'PayrollPro Technologies Pvt Ltd',
    companyEmail: 'hr@payrollpro.io',
    companyAddress: 'Tech Park, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    currency: 'INR (₹)',
    fiscalYearStart: 'April',
    workStart: '09:00',
    workEnd: '18:00',
    workDays: '5',
    annualLeaves: '18',
    sickLeaves: '12',
    casualLeaves: '10',
    emailNotifications: true,
    payrollAlerts: true,
    attendanceWarnings: true,
    twoFactorAuth: false,
    departments: [
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'Finance',
      'HR',
      'Operations',
      'Legal',
      'Customer Support',
    ],
  });

  const [newDept, setNewDept] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [holidaySaving, setHolidaySaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      if (res.data.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch {
      setError('Could not load settings from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/holidays`);
      if (res.data.success && res.data.data) {
        setHolidays(res.data.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
  }, [fetchSettings, fetchHolidays]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${API_BASE}/settings`, settings);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to persist settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDept = (e) => {
    e.preventDefault();
    const clean = newDept.trim();
    if (!clean) return;
    if (settings.departments.includes(clean)) {
      setError('Department already exists.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      departments: [...prev.departments, clean],
    }));
    setNewDept('');
    setSuccess('Department added. Click Save Changes to apply.');
  };

  const handleRemoveDept = (dept) => {
    setSettings((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== dept),
    }));
    setSuccess('Department removed. Click Save Changes to apply.');
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;
    setHolidaySaving(true);
    try {
      const res = await axios.post(`${API_BASE}/holidays`, {
        date: newHolidayDate,
        name: newHolidayName.trim(),
      });
      if (res.data.success) {
        setHolidays((prev) => [...prev, res.data.data].sort((a, b) => a.date.localeCompare(b.date)));
        setNewHolidayDate('');
        setNewHolidayName('');
        setSuccess('Holiday added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holiday.');
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await axios.delete(`${API_BASE}/holidays/${id}`);
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      setSuccess('Holiday deleted successfully.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError('Could not delete holiday.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <span>Loading system settings...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Organization & System Settings</h2>
          <p>Configure company policies, shift timings, department structures, and notification triggers.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          id="save-settings-btn"
        >
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="page-content fade-in">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="settings-grid">
          {/* Settings Sidebar Nav */}
          <div className="card" style={{ padding: 10 }}>
            <div className="settings-nav">
              <button
                type="button"
                className={`settings-nav-btn${activeTab === 'general' ? ' active' : ''}`}
                onClick={() => setActiveTab('general')}
                id="settings-tab-general"
              >
                <Building size={16} /> Organization Profile
              </button>

              <button
                type="button"
                className={`settings-nav-btn${activeTab === 'departments' ? ' active' : ''}`}
                onClick={() => setActiveTab('departments')}
                id="settings-tab-departments"
              >
                <Layers size={16} /> Department Master
              </button>

              <button
                type="button"
                className={`settings-nav-btn${activeTab === 'working-hours' ? ' active' : ''}`}
                onClick={() => setActiveTab('working-hours')}
                id="settings-tab-working-hours"
              >
                <Clock size={16} /> Shift & Working Hours
              </button>

              <button
                type="button"
                className={`settings-nav-btn${activeTab === 'leaves' ? ' active' : ''}`}
                onClick={() => setActiveTab('leaves')}
                id="settings-tab-leaves"
              >
                <Calendar size={16} /> Leave & Holiday Policies
              </button>

              <button
                type="button"
                className={`settings-nav-btn${activeTab === 'notifications' ? ' active' : ''}`}
                onClick={() => setActiveTab('notifications')}
                id="settings-tab-notifications"
              >
                <Bell size={16} /> Notifications & Security
              </button>
            </div>
          </div>

          {/* Settings Main Content Pane */}
          <div className="settings-content">
            {/* 1. General Profile */}
            {activeTab === 'general' && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title-group">
                    <Building size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Company Information</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Company Legal Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Official HR Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={settings.companyEmail}
                        onChange={(e) => handleChange('companyEmail', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Operating Currency</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Headquarters Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.companyAddress}
                        onChange={(e) => handleChange('companyAddress', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Fiscal Year Start Month</label>
                      <select
                        className="form-select"
                        value={settings.fiscalYearStart}
                        onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                      >
                        <option value="January">January</option>
                        <option value="April">April</option>
                        <option value="July">July</option>
                        <option value="October">October</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Departments Master */}
            {activeTab === 'departments' && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title-group">
                    <Layers size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Department Directory ({settings.departments.length})</h3>
                  </div>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddDept} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add new department (e.g. Data Science, Quality Assurance)"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary">
                      <Plus size={15} /> Add
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {settings.departments.map((dept) => (
                      <span key={dept} className="chip">
                        <span>{dept}</span>
                        {settings.departments.length > 1 && (
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={() => handleRemoveDept(dept)}
                            title="Remove department"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Working Hours */}
            {activeTab === 'working-hours' && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title-group">
                    <Clock size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Shift & Work Schedule Configuration</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Shift Start Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={settings.workStart}
                        onChange={(e) => handleChange('workStart', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Shift End Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={settings.workEnd}
                        onChange={(e) => handleChange('workEnd', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Working Days per Week</label>
                      <select
                        className="form-select"
                        value={settings.workDays}
                        onChange={(e) => handleChange('workDays', e.target.value)}
                      >
                        <option value="5">5 Days (Monday - Friday)</option>
                        <option value="5.5">5.5 Days (Mon - Fri + Alternate Sat)</option>
                        <option value="6">6 Days (Monday - Saturday)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Leave Settings */}
            {activeTab === 'leaves' && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title-group">
                    <Calendar size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Annual Leave Quota Allotment</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Annual Paid Leaves (Days / Year)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={settings.annualLeaves}
                        onChange={(e) => handleChange('annualLeaves', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sick Leaves (Days / Year)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={settings.sickLeaves}
                        onChange={(e) => handleChange('sickLeaves', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Casual Leaves (Days / Year)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={settings.casualLeaves}
                        onChange={(e) => handleChange('casualLeaves', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Company Holidays & Working Day Rule */}
                <div className="card-header" style={{ borderTop: '1px solid var(--color-border)', marginTop: 24 }}>
                  <div className="card-title-group">
                    <Sun size={18} style={{ color: '#fbbf24' }} />
                    <h3>Company Holidays & Working Day Rule</h3>
                  </div>
                  <span className="badge badge-purple">Salary Calculation</span>
                </div>
                <div className="card-body">
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'rgba(129, 140, 248, 0.08)',
                    border: '1px solid rgba(129, 140, 248, 0.25)',
                    marginBottom: 20,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    <strong style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShieldCheck size={16} /> Official Payroll Rule:
                    </strong>
                    Holidays that fall on a weekday (Monday to Friday) are officially <strong>counted as working days</strong> with full 8 hours credited in salary calculation. Employees receive complete salary without attendance deductions on weekday holidays. Holidays on weekends (Saturday/Sunday) remain regular non-working off days.
                  </div>

                  {/* Add Holiday Form */}
                  <form onSubmit={handleAddHoliday} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      required
                      style={{ maxWidth: 170 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Holiday Name (e.g. Independence Day)"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      required
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={holidaySaving}>
                      <Plus size={15} /> Add Holiday
                    </button>
                  </form>

                  {/* Holidays Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Holiday Name</th>
                          <th>Day of Week</th>
                          <th>Salary Rule Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                              No company holidays registered yet.
                            </td>
                          </tr>
                        ) : (
                          holidays.map((h) => {
                            const dateObj = new Date(h.date + 'T00:00:00');
                            const dow = dateObj.getDay();
                            const isWeekday = dow !== 0 && dow !== 6;
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                            return (
                              <tr key={h._id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.date}</td>
                                <td>{h.name}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{dayName}</td>
                                <td>
                                  {isWeekday ? (
                                    <span className="badge badge-green" style={{ fontSize: 11 }}>
                                      <span className="badge-dot" /> Paid Working Day (Counted in Salary)
                                    </span>
                                  ) : (
                                    <span className="badge badge-gray" style={{ fontSize: 11 }}>
                                      Weekend Off (Not Counted)
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-icon btn-sm"
                                    onClick={() => handleDeleteHoliday(h._id)}
                                    title="Delete holiday"
                                    style={{ color: '#fb7185' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Notifications & System */}
            {activeTab === 'notifications' && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title-group">
                    <Bell size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Notifications & Security Triggers</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="toggle-switch">
                    <div className="toggle-switch-label">
                      <span className="title">Email Notifications</span>
                      <span className="desc">Send payroll generation summaries and status receipts via email</span>
                    </div>
                    <button
                      type="button"
                      className={`toggle${settings.emailNotifications ? ' on' : ''}`}
                      onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}
                    />
                  </div>

                  <div className="toggle-switch">
                    <div className="toggle-switch-label">
                      <span className="title">Monthly Payroll Disbursement Reminders</span>
                      <span className="desc">Automatic alerts 2 days before the end of the month</span>
                    </div>
                    <button
                      type="button"
                      className={`toggle${settings.payrollAlerts ? ' on' : ''}`}
                      onClick={() => handleChange('payrollAlerts', !settings.payrollAlerts)}
                    />
                  </div>

                  <div className="toggle-switch">
                    <div className="toggle-switch-label">
                      <span className="title">Attendance Anomaly Warnings</span>
                      <span className="desc">Alert supervisors when an employee is late or absent without notice</span>
                    </div>
                    <button
                      type="button"
                      className={`toggle${settings.attendanceWarnings ? ' on' : ''}`}
                      onClick={() => handleChange('attendanceWarnings', !settings.attendanceWarnings)}
                    />
                  </div>

                  <div className="toggle-switch">
                    <div className="toggle-switch-label">
                      <span className="title">Two-Factor Security Authentication</span>
                      <span className="desc">Enforce OTP verification for high-risk payroll approvals</span>
                    </div>
                    <button
                      type="button"
                      className={`toggle${settings.twoFactorAuth ? ' on' : ''}`}
                      onClick={() => handleChange('twoFactorAuth', !settings.twoFactorAuth)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
