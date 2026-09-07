import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  User,
  DollarSign,
  ArrowLeft,
  Save,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing',
  'Sales', 'Finance', 'HR', 'Operations', 'Legal', 'Customer Support',
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const initialForm = {
  // Core / Personal
  name: '',
  email: '',
  personalEmail: '',
  phone: '',
  dob: '',
  gender: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  // Office Info
  officeEmail: '',
  designation: '',
  department: '',
  reportingManager: '',
  workLocation: 'Headquarters',
  employmentType: 'full-time',
  status: 'active',
  // Compensation
  basicPay: '',
  allowances: '',
  deductions: '',
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
        personalEmail: emp.personalEmail || '',
        phone: emp.phone || '',
        dob: emp.dob || '',
        gender: emp.gender || '',
        address: emp.address || '',
        emergencyContact: emp.emergencyContact || '',
        emergencyPhone: emp.emergencyPhone || '',
        officeEmail: emp.officeEmail || '',
        designation: emp.designation || '',
        department: emp.department || '',
        reportingManager: emp.reportingManager || '',
        workLocation: emp.workLocation || 'Headquarters',
        employmentType: emp.employmentType || 'full-time',
        status: emp.status || 'active',
        basicPay: emp.basicPay ?? '',
        allowances: emp.allowances ?? '',
        deductions: emp.deductions ?? '',
      });
    } catch {
      setError('Could not load employee details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) fetchEmployee();
  }, [isEdit, fetchEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Employee Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'A valid Primary Email is required.';
    if (!form.designation.trim()) return 'Designation is required.';
    if (!form.department) return 'Department selection is required.';
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
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        basicPay: Number(form.basicPay),
        allowances: form.allowances !== '' ? Number(form.allowances) : 0,
        deductions: form.deductions !== '' ? Number(form.deductions) : 0,
      };

      if (isEdit) {
        await axios.put(`${API_BASE}/employees/${id}`, payload);
        setSuccess('Employee record updated successfully!');
      } else {
        await axios.post(`${API_BASE}/employees`, payload);
        setSuccess('Employee created successfully! Redirecting...');
      }

      setTimeout(() => {
        navigate('/employees');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee. Check if email is already in use.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const basic = Number(form.basicPay) || 0;
  const allow = Number(form.allowances) || 0;
  const deduct = Number(form.deductions) || 0;
  const net = Math.max(0, basic + allow - deduct);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <span>Loading employee details...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <Link to="/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Employees
          </Link>
          <h2>{isEdit ? 'Edit Employee Profile' : 'Add New Employee'}</h2>
          <p>{isEdit ? 'Update comprehensive personal, office, and payroll details.' : 'Register a new team member with complete personal and HR profile information.'}</p>
        </div>
      </div>

      <div className="page-content fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
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

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Details */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title-group">
                <User size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Personal Information</h3>
              </div>
              <span className="badge badge-purple">Profile Info</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Primary / Login Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="jane.doe@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="personalEmail">Personal Email</label>
                  <input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    className="form-input"
                    placeholder="jane.personal@gmail.com"
                    value={form.personalEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dob">Date of Birth</label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    className="form-input"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    className="form-select"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" htmlFor="address">Residential Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="form-input"
                    placeholder="Flat No., Street, City, State, ZIP"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emergencyContact">Emergency Contact Person</label>
                  <input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe (Spouse/Parent)"
                    value={form.emergencyContact}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emergencyPhone">Emergency Contact Phone</label>
                  <input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 00000"
                    value={form.emergencyPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Office & Employment Details */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title-group">
                <Building size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Office & Job Details</h3>
              </div>
              <span className="badge badge-blue">Organization</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="designation">Job Title / Designation *</label>
                  <input
                    id="designation"
                    name="designation"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Software Engineer"
                    value={form.designation}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    className="form-select"
                    value={form.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="officeEmail">Official Email</label>
                  <input
                    id="officeEmail"
                    name="officeEmail"
                    type="email"
                    className="form-input"
                    placeholder="jane@corp.domain.com"
                    value={form.officeEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reportingManager">Reporting Manager</label>
                  <input
                    id="reportingManager"
                    name="reportingManager"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Henderson (VP Eng)"
                    value={form.reportingManager}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workLocation">Work Location</label>
                  <input
                    id="workLocation"
                    name="workLocation"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bangalore Campus / Remote"
                    value={form.workLocation}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="employmentType">Employment Type</label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    className="form-select"
                    value={form.employmentType}
                    onChange={handleChange}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="status">Employee Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Compensation & Payment Terms */}
          <div className="card" style={{ marginBottom: 28 }}>
            <div className="card-header">
              <div className="card-title-group">
                <DollarSign size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Job Information & Payment Terms</h3>
              </div>
              <span className="badge badge-green">Payroll Terms</span>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="basicPay">Basic Pay (₹/mo) *</label>
                  <input
                    id="basicPay"
                    name="basicPay"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    placeholder="50000"
                    value={form.basicPay}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="allowances">Allowances (₹/mo)</label>
                  <input
                    id="allowances"
                    name="allowances"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    placeholder="5000"
                    value={form.allowances}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="deductions">Deductions (₹/mo)</label>
                  <input
                    id="deductions"
                    name="deductions"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    placeholder="2000"
                    value={form.deductions}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Live Salary Calculation Preview */}
              <div
                style={{
                  marginTop: 20,
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                    Calculated Monthly Take-Home
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                    ₹{net.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div>Basic: <strong style={{ color: 'var(--text-primary)' }}>₹{basic.toLocaleString('en-IN')}</strong></div>
                  <div>+ Allowances: <strong style={{ color: '#34d399' }}>₹{allow.toLocaleString('en-IN')}</strong></div>
                  <div>- Deductions: <strong style={{ color: '#fb7185' }}>₹{deduct.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
            <Link to="/employees" className="btn btn-ghost" id="employee-cancel-btn">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              id="employee-submit-btn"
              disabled={submitting}
            >
              <Save size={16} />
              {submitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
