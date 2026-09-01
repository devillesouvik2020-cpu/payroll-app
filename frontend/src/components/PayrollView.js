import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Search, FileText, CheckCircle, Calendar,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const MONTHS = [
  { value: 1,  label: 'January'   },
  { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       },
  { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      },
  { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October'   },
  { value: 11, label: 'November'  },
  { value: 12, label: 'December'  },
];

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function getYears() {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

/* ── Payslip Modal ─────────────────────────────────────────────────────────── */
function PayslipModal({ payroll, onClose, onMarkPaid }) {
  if (!payroll) return null;
  const { employee: emp, basicPay, allowances, deductions, netSalary, month, year, status } = payroll;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 520 }}
        onClick={e => e.stopPropagation()}
        id="payslip-modal"
      >
        <div className="modal-header">
          <h3>Payslip</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="close-payslip-btn">✕</button>
        </div>

        <div style={{ padding: '0 0 0 0' }}>
          <div className="payslip">
            {/* Header */}
            <div className="payslip-header">
              <div>
                <div className="payslip-title">{emp?.name || 'N/A'}</div>
                <div className="payslip-subtitle">
                  {emp?.designation} · {emp?.department}
                </div>
              </div>
              <span className={`badge badge-${status}`} style={{ fontSize: 12, padding: '5px 12px' }}>
                {status === 'paid' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>

            <div className="payslip-body">
              {/* Info Grid */}
              <div className="payslip-info-grid">
                <div className="payslip-info-item">
                  <div className="payslip-info-label">Employee ID</div>
                  <div className="payslip-info-value">{emp?.employeeId || '—'}</div>
                </div>
                <div className="payslip-info-item">
                  <div className="payslip-info-label">Pay Period</div>
                  <div className="payslip-info-value">
                    {MONTHS.find(m => m.value === month)?.label} {year}
                  </div>
                </div>
                <div className="payslip-info-item">
                  <div className="payslip-info-label">Email</div>
                  <div className="payslip-info-value" style={{ fontSize: 12 }}>{emp?.email || '—'}</div>
                </div>
                <div className="payslip-info-item">
                  <div className="payslip-info-label">Department</div>
                  <div className="payslip-info-value">{emp?.department || '—'}</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="payslip-breakdown">
                <div className="payslip-breakdown-title">Salary Breakdown</div>
                <div className="payslip-row">
                  <span className="payslip-row-label">Basic Pay</span>
                  <span className="payslip-row-value">{formatCurrency(basicPay)}</span>
                </div>
                <div className="payslip-row">
                  <span className="payslip-row-label">Allowances</span>
                  <span className="payslip-row-value credit">+{formatCurrency(allowances)}</span>
                </div>
                <div className="payslip-row">
                  <span className="payslip-row-label">Deductions</span>
                  <span className="payslip-row-value debit">−{formatCurrency(deductions)}</span>
                </div>
              </div>

              {/* Net Total */}
              <div className="payslip-total" style={{ marginTop: 16 }}>
                <span className="payslip-total-label">Net Salary</span>
                <span className="payslip-total-value">{formatCurrency(netSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {status === 'generated' && (
            <button className="btn btn-success" onClick={() => onMarkPaid(payroll._id)} id="mark-paid-btn">
              <CheckCircle size={14} /> Mark as Paid
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} id="close-payslip-footer-btn">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function PayrollView() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear]   = useState(now.getFullYear());
  const [search, setSearch]           = useState('');

  // Generate form
  const [selEmployee, setSelEmployee] = useState('');
  const [genMonth, setGenMonth]       = useState(now.getMonth() + 1);
  const [genYear, setGenYear]         = useState(now.getFullYear());

  // Payslip modal
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees`);
      setEmployees(res.data.data.filter(e => e.status === 'active'));
    } catch {
      setError('Failed to load employees.');
    }
  }, []);

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear)  params.year  = filterYear;
      const res = await axios.get(`${API_BASE}/payroll`, { params });
      setPayrolls(res.data.data);
    } catch {
      setError('Failed to load payroll records.');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selEmployee) { setError('Please select an employee.'); return; }
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE}/payroll/generate`, {
        employeeId: selEmployee,
        month: Number(genMonth),
        year: Number(genYear),
      });
      setSuccess('Payroll generated successfully!');
      fetchPayrolls();
      setSelEmployee('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      const res = await axios.patch(`${API_BASE}/payroll/${payrollId}/pay`);
      setPayrolls(prev => prev.map(p => p._id === payrollId ? res.data.data : p));
      setSelectedPayroll(prev => prev?._id === payrollId ? res.data.data : prev);
      setSuccess('Payroll marked as paid!');
    } catch {
      setError('Failed to mark as paid.');
    }
  };

  const filtered = payrolls.filter(p => {
    const name = p.employee?.name?.toLowerCase() || '';
    const dept = p.employee?.department?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Payroll Management</h2>
          <p>Generate, review, and process employee payslips.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchPayrolls} id="refresh-payroll-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="page-content fade-in">
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Left: Records Table */}
          <div>
            {/* Filters */}
            <div className="toolbar">
              <div className="search-box" style={{ minWidth: 180 }}>
                <Search size={15} className="search-icon" />
                <input
                  id="payroll-search"
                  type="text"
                  className="search-input"
                  placeholder="Search employee..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                id="filter-month"
                className="form-select"
                style={{ width: 'auto', flex: 'none' }}
                value={filterMonth}
                onChange={e => setFilterMonth(Number(e.target.value))}
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>

              <select
                id="filter-year"
                className="form-select"
                style={{ width: 'auto', flex: 'none' }}
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
              >
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                Loading payroll records...
              </div>
            ) : filtered.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><FileText size={28} /></div>
                  <h4>No payroll records</h4>
                  <p>No records found for{' '}
                    {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}.
                    Generate payroll using the panel on the right.</p>
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Basic Pay</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {p.employee?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="td-primary">{p.employee?.name || 'Unknown'}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                                {p.employee?.designation}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            {MONTHS.find(m => m.value === p.month)?.label} {p.year}
                          </div>
                        </td>
                        <td className="td-mono">{formatCurrency(p.basicPay)}</td>
                        <td style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>+{formatCurrency(p.allowances)}</td>
                        <td style={{ color: '#fb7185', fontWeight: 600, fontSize: 13 }}>−{formatCurrency(p.deductions)}</td>
                        <td className="td-mono" style={{ fontWeight: 700 }}>{formatCurrency(p.netSalary)}</td>
                        <td>
                          <span className={`badge badge-${p.status}`}>
                            {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedPayroll(p)}
                            id={`view-payslip-${p._id}`}
                          >
                            <FileText size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: Generate Payroll Panel */}
          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="section-title" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={15} style={{ color: 'var(--color-primary-light)' }} />
              Generate Payroll
            </div>
            <div className="section-subtitle" style={{ marginBottom: 20 }}>
              Create a payslip for an employee
            </div>

            <form onSubmit={handleGenerate} id="generate-payroll-form">
              <div className="form-group">
                <label className="form-label" htmlFor="gen-employee">Employee *</label>
                <select
                  id="gen-employee"
                  className="form-select"
                  value={selEmployee}
                  onChange={e => { setSelEmployee(e.target.value); setError(''); setSuccess(''); }}
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.name} — {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="gen-month">Month *</label>
                  <select
                    id="gen-month"
                    className="form-select"
                    value={genMonth}
                    onChange={e => setGenMonth(Number(e.target.value))}
                  >
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="gen-year">Year *</label>
                  <select
                    id="gen-year"
                    className="form-select"
                    value={genYear}
                    onChange={e => setGenYear(Number(e.target.value))}
                  >
                    {getYears().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {selEmployee && (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                }}>
                  {(() => {
                    const emp = employees.find(e => e._id === selEmployee);
                    if (!emp) return null;
                    const net = emp.basicPay + emp.allowances - emp.deductions;
                    return (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 8 }}>
                          Salary Preview
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Basic</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(emp.basicPay)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>+ Allowances</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>{formatCurrency(emp.allowances)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>− Deductions</span>
                          <span style={{ color: '#fb7185', fontWeight: 600 }}>{formatCurrency(emp.deductions)}</span>
                        </div>
                        <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 10 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>Net Pay</span>
                          <span style={{
                            fontWeight: 800, fontSize: 16,
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}>
                            {formatCurrency(net)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={generating || !selEmployee}
                id="generate-payroll-submit-btn"
              >
                <DollarSign size={15} />
                {generating ? 'Generating…' : 'Generate Payslip'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayroll && (
        <PayslipModal
          payroll={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </>
  );
}
