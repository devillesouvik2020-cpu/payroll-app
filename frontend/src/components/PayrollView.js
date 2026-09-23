import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Search, FileText, CheckCircle, Calendar,
  RefreshCw, Plus, X, Eye, Users, Printer, AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';
import EmployeePayrollPopup from './EmployeePayrollPopup';

/* ── Constants ─────────────────────────────────────────────────────────────── */
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function getYears() {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

/* ── Payslip Print Modal (from existing payroll record) ────────────────────── */
function PayslipModal({ payroll, onClose, onMarkPaid }) {
  if (!payroll) return null;
  const { employee: emp, basicPay, allowances, deductions, netSalary, month, year, status } = payroll;
  const monthLabel = MONTHS.find(m => m.value === month)?.label || '';

  const handlePrint = () => {
    const content = document.getElementById('payslip-print-area');
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(`
      <html><head><title>Payslip — ${emp?.name} — ${monthLabel} ${year}</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        * { box-sizing: border-box; }
      </style>
      </head><body>${content.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 560 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} style={{ color: 'var(--color-primary-light)' }} />
            <h3 style={{ margin: 0 }}>Payslip</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Printable area */}
        <div id="payslip-print-area" style={{ padding: '24px 28px', background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif' }}>
          {/* Company header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6366f1', paddingBottom: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>PayrollPro Inc.</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Employee Payslip</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{monthLabel} {year}</div>
              <div style={{
                display: 'inline-block', marginTop: 4, padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: status === 'paid' ? '#d1fae5' : '#fef3c7',
                color: status === 'paid' ? '#059669' : '#b45309',
              }}>
                {status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
              </div>
            </div>
          </div>

          {/* Employee info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 18, padding: '12px 14px', background: '#f8fafc', borderRadius: 8 }}>
            {[
              ['Employee Name', emp?.name],
              ['Employee ID', emp?.employeeId],
              ['Designation', emp?.designation],
              ['Department', emp?.department],
              ['Email', emp?.email],
              ['Pay Period', `${monthLabel} ${year}`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
          </div>

          {/* Hours summary */}
          {payroll.hoursWorked > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
              {[
                ['Hours Worked', `${payroll.hoursWorked}h`],
                ['Standard Hours', `${payroll.standardHours}h`],
                ['Overtime Hrs', `${payroll.overtimeHours || 0}h`],
                ['Hourly Rate', `₹${payroll.hourlyRate || 0}/h`],
              ].map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#64748b', fontWeight: 700 }}>COMPONENT</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#64748b', fontWeight: 700 }}>DETAILS</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#64748b', fontWeight: 700 }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 12px', fontSize: 13 }}>Earned Basic Pay</td>
                <td style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right', color: '#64748b' }}>
                  {payroll.hoursWorked > 0 ? `${Math.min(payroll.hoursWorked, payroll.standardHours || payroll.hoursWorked)}h × ₹${payroll.hourlyRate}/h` : ''}
                </td>
                <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(basicPay)}</td>
              </tr>
              {payroll.overtimePay > 0 && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 12px', fontSize: 13, color: '#d97706' }}>Overtime Pay</td>
                  <td style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right', color: '#d97706' }}>
                    {payroll.overtimeHours}h × ₹{payroll.hourlyRate}/h × 1.5
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#d97706' }}>+ {formatCurrency(payroll.overtimePay)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, color: '#059669' }}>Housing &amp; Allowances</td>
                <td style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right' }}></td>
                <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#059669' }}>+ {formatCurrency(allowances)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, color: '#e11d48' }}>Deductions (PF / Tax)</td>
                <td style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right' }}></td>
                <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#e11d48' }}>− {formatCurrency(deductions)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#6366f1', color: '#fff' }}>
                <td style={{ padding: '11px 12px', fontSize: 14, fontWeight: 800 }}>Net Salary</td>
                <td style={{ padding: '11px 12px' }}></td>
                <td style={{ padding: '11px 12px', fontSize: 16, textAlign: 'right', fontWeight: 800 }}>{formatCurrency(netSalary)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 16, textAlign: 'center' }}>
            Computer-generated payslip — no signature required · PayrollPro Inc.
          </div>
        </div>

        <div className="modal-footer">
          {status === 'generated' && (
            <button className="btn btn-success" onClick={() => onMarkPaid(payroll._id)}>
              <CheckCircle size={14} /> Mark as Paid
            </button>
          )}
          <button className="btn btn-ghost" onClick={handlePrint}>
            <Printer size={14} /> Print
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Generate Payroll Modal ────────────────────────────────────────────────── */
function GeneratePayrollModal({ employees, onClose, onGenerated, defaultMonth, defaultYear }) {
  const now = new Date();
  const [selEmployee, setSelEmployee] = useState('');
  const [genMonth, setGenMonth] = useState(defaultMonth || now.getMonth() + 1);
  const [genYear, setGenYear] = useState(defaultYear || now.getFullYear());
  const [useAttendance, setUseAttendance] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [attendancePreview, setAttendancePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const selectedEmp = employees.find(e => e._id === selEmployee);

  /* Load attendance-based preview whenever employee / month / year changes */
  useEffect(() => {
    if (!selEmployee || !useAttendance) {
      setAttendancePreview(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    axios.get(`${API_BASE}/payroll/payslip/${selEmployee}/${genYear}/${genMonth}`)
      .then(res => { if (!cancelled) setAttendancePreview(res.data.data); })
      .catch(() => { if (!cancelled) setAttendancePreview(null); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [selEmployee, genMonth, genYear, useAttendance]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selEmployee) { setError('Please select an employee.'); return; }
    setGenerating(true);
    setError('');
    try {
      if (useAttendance) {
        await axios.post(`${API_BASE}/payroll/generate-attendance-based`, {
          employeeId: selEmployee,
          month: Number(genMonth),
          year: Number(genYear),
        });
      } else {
        await axios.post(`${API_BASE}/payroll/generate`, {
          employeeId: selEmployee,
          month: Number(genMonth),
          year: Number(genYear),
        });
      }
      onGenerated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  /* Fixed salary preview (no attendance) */
  const fixedNet = selectedEmp
    ? selectedEmp.basicPay + selectedEmp.allowances - selectedEmp.deductions
    : null;

  const previewBasic = useAttendance && attendancePreview ? attendancePreview.basicPay : selectedEmp?.basicPay;
  const previewAllow = useAttendance && attendancePreview ? attendancePreview.allowances : selectedEmp?.allowances;
  const previewDeduct = selectedEmp?.deductions;
  const previewNet = useAttendance && attendancePreview ? attendancePreview.netSalary : fixedNet;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,rgba(124,58,237,.25),rgba(168,85,247,.25))',
              border: '1px solid rgba(124,58,237,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary-light)',
            }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, lineHeight: 1.2 }}>Generate Payroll</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Create a payslip for an employee</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Employee picker */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="gen-employee">Employee *</label>
              <select
                id="gen-employee"
                className="form-select"
                value={selEmployee}
                onChange={e => { setSelEmployee(e.target.value); setError(''); }}
                required
              >
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>{e.name} — {e.designation}</option>
                ))}
              </select>
            </div>

            {/* Month / Year */}
            <div className="form-grid" style={{ marginBottom: 16 }}>
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

            {/* Attendance-based toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, marginBottom: 16, cursor: 'pointer',
            }} onClick={() => setUseAttendance(v => !v)}>
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: useAttendance ? '#6366f1' : 'var(--color-border)',
                position: 'relative', transition: 'background .2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: useAttendance ? 19 : 3,
                  transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Attendance-based salary</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {useAttendance
                    ? 'Salary will be prorated based on days present this month'
                    : 'Full fixed salary will be used regardless of attendance'}
                </div>
              </div>
            </div>

            {/* Salary Preview */}
            {selectedEmp && (
              <div style={{
                padding: '16px 18px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.8px', fontWeight: 700, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <DollarSign size={12} />
                  {useAttendance ? 'Attendance-based Preview' : 'Salary Preview'}
                  {loadingPreview && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}> (loading…)</span>}
                </div>

                {[
                  { label: 'Basic Pay', val: previewBasic, color: null },
                  { label: '+ Allowances', val: previewAllow, color: '#34d399' },
                  { label: '− Deductions', val: previewDeduct, color: '#fb7185' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color || 'inherit' }}>{formatCurrency(r.val)}</span>
                  </div>
                ))}

                <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Net Pay</span>
                  <span style={{
                    fontWeight: 800, fontSize: 18,
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {formatCurrency(previewNet)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating || !selEmployee}
            >
              <DollarSign size={15} />
              {generating ? 'Generating…' : 'Generate Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Attendance Summary Badge ──────────────────────────────────────────────── */
function AttendanceBadge({ employeeId, month, year }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE}/employees/${employeeId}/monthly-attendance`, { params: { month, year } })
      .then(res => { if (!cancelled) setData(res.data.data?.summary); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [employeeId, month, year]);

  if (!data) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>
        {data.presentDays}/{data.workingDaysInMonth} days
      </span>
      {data.totalExtraHours > 0 && (
        <span style={{ fontSize: 11, color: '#fb923c' }}>+{data.totalExtraHours}h extra</span>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function PayrollView() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');

  // Modals
  const [selectedPayroll, setSelectedPayroll] = useState(null);   // PayslipModal
  const [showGenerateModal, setShowGenerateModal] = useState(false);  // GeneratePayrollModal
  const [popupEmployee, setPopupEmployee] = useState(null);   // EmployeePayrollPopup

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
      if (filterYear) params.year = filterYear;
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

  // Auto-clear alerts
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleGenerated = () => {
    setSuccess('Payroll generated successfully!');
    fetchPayrolls();
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

  // Summary stats
  const totalPaid = filtered.filter(p => p.status === 'paid').length;
  const totalPending = filtered.filter(p => p.status === 'generated').length;
  const totalNetSalary = filtered.reduce((s, p) => s + (p.netSalary || 0), 0);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Payroll Management</h2>
          <p>Generate, review, and process employee payslips with attendance-based salary calculation.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowGenerateModal(true)}
            id="open-generate-payroll-btn"
          >
            <Plus size={15} /> Generate Payroll
          </button>
          <button className="btn btn-ghost btn-sm" onClick={fetchPayrolls} id="refresh-payroll-btn">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={14} /> {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={14} /> {success}</div>}

        {/* ── Summary Stats ── */}
        <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Records</span>
              <div className="stat-icon purple"><FileText size={19} /></div>
            </div>
            <div className="stat-value">{loading ? '—' : filtered.length}</div>
            <div className="stat-sub">
              {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Paid</span>
              <div className="stat-icon green"><CheckCircle size={19} /></div>
            </div>
            <div className="stat-value">{loading ? '—' : totalPaid}</div>
            <div className="stat-sub">Payslips processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Pending</span>
              <div className="stat-icon amber"><Calendar size={19} /></div>
            </div>
            <div className="stat-value">{loading ? '—' : totalPending}</div>
            <div className="stat-sub">Awaiting payment</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Disbursed</span>
              <div className="stat-icon cyan"><DollarSign size={19} /></div>
            </div>
            <div className="stat-value">{loading ? '—' : formatCurrency(totalNetSalary)}</div>
            <div className="stat-sub">Net salary total</div>
          </div>
        </div>

        {/* ── Filters Toolbar ── */}
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <div className="search-box" style={{ minWidth: 200 }}>
            <Search size={15} className="search-icon" />
            <input
              id="payroll-search"
              type="text"
              className="search-input"
              placeholder="Search employee…"
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

        {/* ── Records Table ── */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            Loading payroll records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={28} /></div>
              <h4>No payroll records</h4>
              <p>
                No records found for {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus size={14} /> Generate Payroll
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Attendance</th>
                  <th>Basic Pay</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id}>
                    {/* Employee */}
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

                    {/* Period */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        {MONTHS.find(m => m.value === p.month)?.label} {p.year}
                      </div>
                    </td>

                    {/* Attendance summary — fetched live */}
                    <td>
                      {p.employee?._id && (
                        <AttendanceBadge
                          employeeId={p.employee._id}
                          month={p.month}
                          year={p.year}
                        />
                      )}
                    </td>

                    {/* Salary columns */}
                    <td className="td-mono">{formatCurrency(p.basicPay)}</td>
                    <td style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>
                      +{formatCurrency(p.allowances)}
                    </td>
                    <td style={{ color: '#fb7185', fontWeight: 600, fontSize: 13 }}>
                      −{formatCurrency(p.deductions)}
                    </td>
                    <td className="td-mono" style={{ fontWeight: 700 }}>
                      {formatCurrency(p.netSalary)}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge badge-${p.status}`}>
                        {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* View — opens EmployeePayrollPopup */}
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ gap: 5 }}
                          onClick={() => {
                            const emp = employees.find(e => e._id === p.employee?._id) || p.employee;
                            setPopupEmployee({ ...emp, _id: p.employee?._id });
                          }}
                          id={`view-employee-popup-${p._id}`}
                          title="View attendance & payslip details"
                        >
                          <Eye size={13} /> View
                        </button>

                        {/* Payslip — opens quick PayslipModal */}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedPayroll(p)}
                          id={`view-payslip-${p._id}`}
                          title="Quick payslip view"
                        >
                          <FileText size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Employees without payroll this month ── */}
        {!loading && (() => {
          const payrolledIds = new Set(payrolls.map(p => p.employee?._id?.toString()));
          const missing = employees.filter(e => !payrolledIds.has(e._id?.toString()));
          if (missing.length === 0) return null;
          return (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <div className="card-title-group">
                  <Users size={16} style={{ color: 'var(--color-primary-light)' }} />
                  <h3 style={{ margin: 0 }}>
                    Employees without payroll — {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}
                  </h3>
                </div>
                <span className="badge badge-amber">{missing.length} pending</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Attendance</th>
                      <th>Fixed Salary</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missing.map(emp => (
                      <tr key={emp._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                              {emp.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="td-primary">{emp.name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{emp.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td>{emp.department}</td>
                        <td>
                          <AttendanceBadge
                            employeeId={emp._id}
                            month={filterMonth}
                            year={filterYear}
                          />
                        </td>
                        <td className="td-mono">
                          {formatCurrency(emp.basicPay + emp.allowances - emp.deductions)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* View popup */}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setPopupEmployee(emp)}
                              title="View attendance & payslip"
                            >
                              <Eye size={13} /> View
                            </button>
                            {/* Quick generate */}
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={async () => {
                                try {
                                  await axios.post(`${API_BASE}/payroll/generate-attendance-based`, {
                                    employeeId: emp._id,
                                    month: filterMonth,
                                    year: filterYear,
                                  });
                                  setSuccess(`Payroll generated for ${emp.name}!`);
                                  fetchPayrolls();
                                } catch (err) {
                                  setError(err.response?.data?.message || 'Generation failed.');
                                }
                              }}
                            >
                              <DollarSign size={13} /> Generate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Payslip quick-view modal ── */}
      {selectedPayroll && (
        <PayslipModal
          payroll={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* ── Generate Payroll Modal ── */}
      {showGenerateModal && (
        <GeneratePayrollModal
          employees={employees}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={handleGenerated}
          defaultMonth={filterMonth}
          defaultYear={filterYear}
        />
      )}

      {/* ── Employee Payroll Popup (attendance + full payslip) ── */}
      {popupEmployee && (
        <EmployeePayrollPopup
          employee={popupEmployee}
          initialMonth={filterMonth}
          initialYear={filterYear}
          onClose={() => setPopupEmployee(null)}
          onPayrollGenerated={() => {
            handleGenerated();
          }}
        />
      )}
    </>
  );
}
