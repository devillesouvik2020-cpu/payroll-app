import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Shield,
  Mail,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function HRManagerProfile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: 'Admin',
    managerId: 'HR-MGR-001',
    designation: 'Head of Human Resources & People Operations',
    department: 'Human Resources',
    officeEmail: 'admin.hr@payrollpro.io',
    personalEmail: 'hr.manager.personal@gmail.com',
    phone: '+91 98765 43210',
    joiningDate: '2022-04-01',
    reportingTo: 'Chief Executive Officer (CEO)',
    bio: 'Overseeing talent acquisition, compensation & benefits, organizational development, and compliance across all company departments.',
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/hr-manager`);
      if (res.data.data) {
        setForm({
          name: res.data.data.name || 'Admin',
          managerId: res.data.data.managerId || 'HR-MGR-001',
          designation: res.data.data.designation || 'Head of Human Resources & People Operations',
          department: res.data.data.department || 'Human Resources',
          officeEmail: res.data.data.officeEmail || 'admin.hr@payrollpro.io',
          personalEmail: res.data.data.personalEmail || 'hr.manager.personal@gmail.com',
          phone: res.data.data.phone || '+91 98765 43210',
          joiningDate: res.data.data.joiningDate || '2022-04-01',
          reportingTo: res.data.data.reportingTo || 'Chief Executive Officer (CEO)',
          bio: res.data.data.bio || 'Overseeing talent acquisition, compensation & benefits, organizational development, and compliance.',
        });
      }
    } catch {
      setError('Could not load HR Manager profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${API_BASE}/hr-manager`, form);
      setIsEditing(false);
      setSuccess('HR Manager profile updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update HR Manager profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <span>Loading HR Manager profile...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>HR Manager Profile</h2>
          <p>Super Administrator identity, personnel authority credentials, and contact details.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
              id="edit-hr-manager-btn"
            >
              <Edit2 size={15} /> Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="page-content fade-in" style={{ maxWidth: 1040, margin: '0 auto' }}>
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

        {/* Hero Card */}
        <div className="card" style={{ marginBottom: 24, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
              }}
            >
              {form.name ? form.name.charAt(0).toUpperCase() : 'A'}
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {form.name}
                </h3>
                <span className="badge badge-purple" style={{ fontSize: 11.5 }}>
                  <Shield size={12} style={{ marginRight: 4 }} /> Super Administrator
                </span>
                <span className="badge badge-green">
                  <span className="badge-dot" /> Active
                </span>
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 14.5 }}>
                {form.designation} • <span style={{ color: 'var(--color-primary-light)' }}>{form.department}</span>
              </p>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <span>ID: {form.managerId}</span>
                <span>•</span>
                <span>Reports to {form.reportingTo}</span>
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border)',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                System Access Scope
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={15} /> All Modules & Payroll
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form or Read View */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="fade-in">
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <div className="card-title-group">
                  <Edit2 size={18} style={{ color: 'var(--color-primary-light)' }} />
                  <h3>Edit HR Manager Details</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      name="name"
                      type="text"
                      className="form-input"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Manager ID</label>
                    <input
                      name="managerId"
                      type="text"
                      className="form-input"
                      value={form.managerId}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official / System Email *</label>
                    <input
                      name="officeEmail"
                      type="email"
                      className="form-input"
                      value={form.officeEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Personal Email</label>
                    <input
                      name="personalEmail"
                      type="email"
                      className="form-input"
                      value={form.personalEmail}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      name="phone"
                      type="tel"
                      className="form-input"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation / Title</label>
                    <input
                      name="designation"
                      type="text"
                      className="form-input"
                      value={form.designation}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      name="department"
                      type="text"
                      className="form-input"
                      value={form.department}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reporting Authority</label>
                    <input
                      name="reportingTo"
                      type="text"
                      className="form-input"
                      value={form.reportingTo}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Executive Summary / Bio</label>
                    <textarea
                      name="bio"
                      rows="3"
                      className="form-input"
                      value={form.bio}
                      onChange={handleChange}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 16 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="fade-in">
            {/* View Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
              {/* Card 1: Official Credentials */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title-group">
                    <Shield size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Official Credentials</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="info-item">
                      <div className="info-item-label">Executive Title</div>
                      <div className="info-item-value">{form.designation}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Department</div>
                      <div className="info-item-value">{form.department}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Reporting Line</div>
                      <div className="info-item-value">{form.reportingTo}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Tenure Start</div>
                      <div className="info-item-value">{form.joiningDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact Details */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title-group">
                    <Mail size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Contact Information</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="info-item">
                      <div className="info-item-label">Work Email</div>
                      <div className="info-item-value" style={{ color: 'var(--color-primary-light)' }}>
                        {form.officeEmail}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Personal Email</div>
                      <div className="info-item-value">{form.personalEmail || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Direct Phone</div>
                      <div className="info-item-value">{form.phone || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-item-label">Office Location</div>
                      <div className="info-item-value">Executive Floor, Suite 401</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Card */}
            {form.bio && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <div className="card-title-group">
                    <User size={18} style={{ color: 'var(--color-primary-light)' }} />
                    <h3>Executive Bio</h3>
                  </div>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: 14.5 }}>
                    {form.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
