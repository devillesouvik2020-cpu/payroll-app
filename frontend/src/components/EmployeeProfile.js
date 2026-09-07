import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Building,
  DollarSign,
  Edit2,
  ArrowLeft,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function EmployeeProfile() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'office' | 'job' | 'payroll'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, payRes] = await Promise.all([
        axios.get(`${API_BASE}/employees/${id}`),
        axios.get(`${API_BASE}/payroll`),
      ]);
      setEmployee(empRes.data.data);
      // Filter payrolls for this employee
      const empPayrolls = (payRes.data.data || []).filter(
        (p) => (p.employee?._id || p.employee) === id
      );
      setPayrolls(empPayrolls);
    } catch (err) {
      setError('Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <span>Loading employee profile...</span>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="page-content" style={{ maxWidth: 800, margin: '40px auto' }}>
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error || 'Employee not found.'}</span>
        </div>
        <Link to="/employees" className="btn btn-ghost" style={{ marginTop: 16 }}>
          <ArrowLeft size={14} /> Back to Employee List
        </Link>
      </div>
    );
  }

  const netSalary = Math.max(
    0,
    (employee.basicPay || 0) + (employee.allowances || 0) - (employee.deductions || 0)
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <Link
            to="/employees"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              fontSize: 13,
              textDecoration: 'none',
              marginBottom: 6,
            }}
          >
            <ArrowLeft size={14} /> Back to Employee List
          </Link>
          <h2>Employee Profile</h2>
          <p>Comprehensive record of employee personal details, employment information, and compensation terms.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/employees/edit/${employee._id}`} className="btn btn-primary" id="edit-profile-btn">
            <Edit2 size={14} /> Edit Profile
          </Link>
          <Link to="/payroll" className="btn btn-ghost">
            <DollarSign size={14} /> Payroll View
          </Link>
        </div>
      </div>

      <div className="page-content fade-in" style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Top Hero Card */}
        <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
              }}
            >
              {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {employee.name}
                </h3>
                <span className={`badge badge-${employee.status || 'active'}`}>
                  <span className="badge-dot" />
                  {employee.status === 'active' ? 'Active Employee' : 'Inactive'}
                </span>
                <span className="badge badge-purple" style={{ fontSize: 11 }}>
                  {employee.employeeId || 'ID Pending'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                {employee.designation} • <span style={{ color: 'var(--color-primary-light)' }}>{employee.department}</span>
              </p>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <span>{employee.officeEmail || employee.email}</span>
                <span>•</span>
                <span>{employee.workLocation || 'Headquarters'}</span>
                <span>•</span>
                <span>Joined {new Date(employee.joiningDate || employee.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                Monthly Net Salary
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                {formatCurrency(netSalary)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`tab-btn${activeTab === 'personal' ? ' active' : ''}`}
            onClick={() => setActiveTab('personal')}
            id="tab-personal"
          >
            <User size={15} /> Personal Info
          </button>
          <button
            type="button"
            className={`tab-btn${activeTab === 'office' ? ' active' : ''}`}
            onClick={() => setActiveTab('office')}
            id="tab-office"
          >
            <Building size={15} /> Office & Employment
          </button>
          <button
            type="button"
            className={`tab-btn${activeTab === 'job' ? ' active' : ''}`}
            onClick={() => setActiveTab('job')}
            id="tab-job"
          >
            <DollarSign size={15} /> Job Info & Compensation
          </button>
          <button
            type="button"
            className={`tab-btn${activeTab === 'payroll' ? ' active' : ''}`}
            onClick={() => setActiveTab('payroll')}
            id="tab-payroll"
          >
            <CreditCard size={15} /> Payment Terms & Payroll ({payrolls.length})
          </button>
        </div>

        {/* Tab 1: Personal Info */}
        {activeTab === 'personal' && (
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title-group">
                <User size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Personal Information</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-item-label">Full Name</div>
                  <div className="info-item-value">{employee.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Personal Email</div>
                  <div className="info-item-value">{employee.personalEmail || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Contact Phone</div>
                  <div className="info-item-value">{employee.phone || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Date of Birth</div>
                  <div className="info-item-value">
                    {employee.dob ? new Date(employee.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Gender</div>
                  <div className="info-item-value" style={{ textTransform: 'capitalize' }}>
                    {employee.gender || '—'}
                  </div>
                </div>
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <div className="info-item-label">Residential Address</div>
                  <div className="info-item-value">{employee.address || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Emergency Contact Name</div>
                  <div className="info-item-value">{employee.emergencyContact || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Emergency Phone</div>
                  <div className="info-item-value" style={{ color: '#fb7185' }}>
                    {employee.emergencyPhone || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Office Info */}
        {activeTab === 'office' && (
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title-group">
                <Building size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Office & Organizational Placement</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-item-label">Employee ID</div>
                  <div className="info-item-value" style={{ color: 'var(--color-primary-light)' }}>
                    {employee.employeeId || '—'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Primary / Login Email</div>
                  <div className="info-item-value">{employee.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Official / Work Email</div>
                  <div className="info-item-value">{employee.officeEmail || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Department</div>
                  <div className="info-item-value">{employee.department}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Designation / Role</div>
                  <div className="info-item-value">{employee.designation}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Reporting Manager</div>
                  <div className="info-item-value">{employee.reportingManager || 'HR Administrator'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Work Location</div>
                  <div className="info-item-value">{employee.workLocation || 'Headquarters'}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Employment Type</div>
                  <div className="info-item-value" style={{ textTransform: 'capitalize' }}>
                    {employee.employmentType || 'Full-time'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Joining Date</div>
                  <div className="info-item-value">
                    {new Date(employee.joiningDate || employee.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Status</div>
                  <div className="info-item-value">
                    <span className={`badge badge-${employee.status || 'active'}`}>
                      {employee.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Job Information & Compensation */}
        {activeTab === 'job' && (
          <div className="fade-in">
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <div className="card-title-group">
                  <DollarSign size={18} style={{ color: 'var(--color-primary-light)' }} />
                  <h3>Monthly Compensation Structure</h3>
                </div>
                <span className="badge badge-green">Agreed Terms</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="stat-body">
                      <span className="stat-label">Basic Salary</span>
                      <span className="stat-value">{formatCurrency(employee.basicPay)}</span>
                      <span className="stat-sub">Fixed base compensation</span>
                    </div>
                  </div>

                  <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="stat-body">
                      <span className="stat-label">Allowances</span>
                      <span className="stat-value" style={{ color: '#34d399' }}>
                        +{formatCurrency(employee.allowances)}
                      </span>
                      <span className="stat-sub">HRA, travel, special</span>
                    </div>
                  </div>

                  <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="stat-body">
                      <span className="stat-label">Deductions</span>
                      <span className="stat-value" style={{ color: '#fb7185' }}>
                        -{formatCurrency(employee.deductions)}
                      </span>
                      <span className="stat-sub">PF, tax, insurance</span>
                    </div>
                  </div>

                  <div className="stat-card" style={{ background: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
                    <div className="stat-body">
                      <span className="stat-label">Net Monthly Take-Home</span>
                      <span className="stat-value" style={{ color: '#a78bfa' }}>
                        {formatCurrency(netSalary)}
                      </span>
                      <span className="stat-sub">Payable amount each month</span>
                    </div>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-item-label">Annual CTC (Estimate)</div>
                    <div className="info-item-value" style={{ fontSize: 16 }}>
                      {formatCurrency(netSalary * 12)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">Payment Frequency</div>
                    <div className="info-item-value">Monthly (Last working day)</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">Payment Method</div>
                    <div className="info-item-value">Direct Bank Transfer</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">Tax Deduction Scheme</div>
                    <div className="info-item-value">Standard Deduction Applied</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payment Terms & Payroll Records */}
        {activeTab === 'payroll' && (
          <div className="card fade-in">
            <div className="card-header">
              <div className="card-title-group">
                <CreditCard size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Payroll Disbursement History</h3>
              </div>
              <Link to="/payroll" className="btn btn-ghost" style={{ fontSize: 12 }}>
                Run New Payroll
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {payrolls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <CreditCard size={28} />
                  </div>
                  <h4>No payroll records found</h4>
                  <p>No pay cycles have been generated for {employee.name} yet.</p>
                  <Link to="/payroll" className="btn btn-primary" style={{ marginTop: 12 }}>
                    Go to Payroll Module
                  </Link>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Pay Period</th>
                        <th>Basic Pay</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Generated On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map((p) => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>
                            {MONTH_NAMES[p.month]} {p.year}
                          </td>
                          <td>{formatCurrency(p.basicPay)}</td>
                          <td style={{ color: '#34d399' }}>+{formatCurrency(p.allowances)}</td>
                          <td style={{ color: '#fb7185' }}>-{formatCurrency(p.deductions)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(p.netSalary)}
                          </td>
                          <td>
                            <span className={`badge badge-${p.status}`}>
                              <span className="badge-dot" />
                              {p.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
