import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Briefcase, DollarSign, TrendingDown, TrendingUp, ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing',
  'Sales', 'Finance', 'HR', 'Operations', 'Legal', 'Customer Support',
];

const initialForm = {
  name: '',
  email: '',
  designation: '',
  department: '',
  basicPay: '',
  allowances: '',
  deductions: '',
  status: 'active',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees/${id}`);
      const emp = res.data.data;
      setForm({
        name: emp.name || '',
        email: emp.email || '',
        designation: emp.designation || '',
        department: emp.department || '',
        basicPay: emp.basicPay || '',
        allowances: emp.allowances || '',
        deductions: emp.deductions || '',
        status: emp.status || 'active',
      });
    } catch {
      setError('Could not load employee data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) fetchEmployee();
  }, [isEdit, fetchEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.';
    if (!form.designation.trim()) return 'Designation is required.';
    if (!form.department) return 'Department is required.';
    if (!form.basicPay || isNaN(form.basicPay) || Number(form.basicPay) <= 0)
      return 'Basic Pay must be a positive number.';
    if (form.allowances !== '' && (isNaN(form.allowances) || Number(form.allowances) < 0))
      return 'Allowances must be a non-negative number.';
    if (form.deductions !== '' && (isNaN(form.deductions) || Number(form.deductions) < 0))
      return 'Deductions must be a non-negative number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        basicPay: Number(form.basicPay),
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
      };

      if (isEdit) {
        await axios.put(`${API_BASE}/employees/${id}`, payload);
        setSuccess('Employee updated successfully!');
      } else {
        await axios.post(`${API_BASE}/employees`, payload);
        setSuccess('Employee added successfully! Redirecting…');
      }

      setTimeout(() => navigate('/employees'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const netPreview =
    (Number(form.basicPay) || 0) +
    (Number(form.allowances) || 0) -
    (Number(form.deductions) || 0);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        Loading employee data…
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
          <p>{isEdit ? 'Update employee details and compensation' : 'Register a new team member in the system'}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/employees')} id="back-to-employees-btn">
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="page-content fade-in">
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Form */}
          <div className="card">
            <form onSubmit={handleSubmit} id="employee-form" noValidate>
              {/* Personal Info */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={15} style={{ color: 'var(--color-primary-light)' }} />
                  Personal Information
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-name">Full Name *</label>
                    <input
                      id="emp-name"
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Arjun Sharma"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-email">Email Address *</label>
                    <input
                      id="emp-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. arjun@company.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Job Info */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={15} style={{ color: 'var(--color-primary-light)' }} />
                  Job Information
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-designation">Designation *</label>
                    <input
                      id="emp-designation"
                      name="designation"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Developer"
                      value={form.designation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-department">Department *</label>
                    <select
                      id="emp-department"
                      name="department"
                      className="form-select"
                      value={form.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {isEdit && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-status">Status</label>
                    <select id="emp-status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="divider" />

              {/* Compensation */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={15} style={{ color: 'var(--color-primary-light)' }} />
                  Compensation (₹ per month)
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-basic">Basic Pay *</label>
                    <input
                      id="emp-basic"
                      name="basicPay"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 50000"
                      value={form.basicPay}
                      onChange={handleChange}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-allowances">Allowances</label>
                    <input
                      id="emp-allowances"
                      name="allowances"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 10000"
                      value={form.allowances}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-deductions">Deductions</label>
                    <input
                      id="emp-deductions"
                      name="deductions"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={form.deductions}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/employees')} id="cancel-employee-form-btn">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="submit-employee-form-btn">
                  <Save size={14} />
                  {submitting ? 'Saving…' : isEdit ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>

          {/* Salary Preview */}
          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={15} style={{ color: 'var(--color-primary-light)' }} />
              Salary Preview
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="payslip-row">
                <span className="payslip-row-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={13} /> Basic Pay
                </span>
                <span className="payslip-row-value">
                  ₹{(Number(form.basicPay) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="payslip-row">
                <span className="payslip-row-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={13} style={{ color: '#34d399' }} /> Allowances
                </span>
                <span className="payslip-row-value credit">
                  +₹{(Number(form.allowances) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="payslip-row">
                <span className="payslip-row-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingDown size={13} style={{ color: '#fb7185' }} /> Deductions
                </span>
                <span className="payslip-row-value debit">
                  −₹{(Number(form.deductions) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="payslip-total" style={{ padding: '14px 16px' }}>
              <span className="payslip-total-label">Net Monthly Pay</span>
              <span className="payslip-total-value">₹{netPreview.toLocaleString('en-IN')}</span>
            </div>

            {form.name && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 6 }}>Employee</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{form.name}</div>
                {form.designation && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{form.designation}</div>}
                {form.department && <span className="badge badge-purple" style={{ marginTop: 6 }}>{form.department}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
