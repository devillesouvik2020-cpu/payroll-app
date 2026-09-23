import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Calendar, Clock, TrendingUp, DollarSign,
  CheckCircle, AlertCircle, Briefcase, ChevronLeft,
  ChevronRight, Printer, FileText, Loader,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

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

function statusColor(status) {
  switch (status) {
    case 'present': return { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Present' };
    case 'late': return { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Late' };
    case 'absent': return { bg: 'rgba(251,113,133,0.12)', color: '#fb7185', label: 'Absent' };
    case 'leave': return { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', label: 'Leave' };
    default: return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', label: status || '—' };
  }
}

/* ── Printable Payslip ─────────────────────────────────────────────────────── */
function PrintablePayslip({ payslip, monthLabel, companyName = 'PayrollPro Inc.' }) {
  const {
    employee: emp, basicPay, allowances, deductions, netSalary,
    status, year,
    hoursWorked, standardHours, overtimeHours, overtimePay, hourlyRate,
  } = payslip;

  return (
    <div id="printable-payslip" style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: 640,
      margin: '0 auto',
      padding: 32,
      color: '#1e293b',
      background: '#fff',
    }}>
      {/* Company header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6366f1', paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>{companyName}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Employee Payslip</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{monthLabel} {year}</div>
          <div style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: status === 'paid' ? '#d1fae5' : '#fef3c7',
            color: status === 'paid' ? '#059669' : '#b45309',
          }}>
            {status === 'paid' ? '✓ PAID' : status === 'preview' ? 'PREVIEW' : 'PENDING'}
          </div>
        </div>
      </div>

      {/* Employee info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 8 }}>
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
      {hoursWorked > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16, padding: '12px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          {[
            ['Hours Worked', `${hoursWorked}h`],
            ['Standard Hours', `${standardHours}h`],
            ['Overtime Hours', `${overtimeHours || 0}h`],
            ['Hourly Rate', `₹${hourlyRate || 0}/h`],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Salary breakdown */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', marginBottom: 10 }}>Salary Breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
              <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#64748b' }}>
                {hoursWorked > 0 ? `${Math.min(hoursWorked, standardHours || hoursWorked)}h × ₹${hourlyRate || 0}/h` : ''}
              </td>
              <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(basicPay)}</td>
            </tr>
            {overtimePay > 0 && (
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, color: '#d97706' }}>Overtime Pay</td>
                <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#d97706' }}>
                  {overtimeHours}h × ₹{hourlyRate}/h × 1.5
                </td>
                <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#d97706' }}>+ {formatCurrency(overtimePay)}</td>
              </tr>
            )}
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '9px 12px', fontSize: 13, color: '#059669' }}>Housing &amp; Allowances</td>
              <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#059669' }}></td>
              <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#059669' }}>+ {formatCurrency(allowances)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '9px 12px', fontSize: 13, color: '#e11d48' }}>Deductions (PF / Tax)</td>
              <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right', color: '#e11d48' }}></td>
              <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#e11d48' }}>− {formatCurrency(deductions)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ background: '#6366f1', color: '#fff' }}>
              <td style={{ padding: '11px 12px', fontSize: 14, fontWeight: 800 }}>Net Salary</td>
              <td style={{ padding: '11px 12px', fontSize: 16, textAlign: 'right', fontWeight: 800 }}>{formatCurrency(netSalary)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 12, textAlign: 'center' }}>
        This is a computer-generated payslip and does not require a signature. · {companyName}
      </div>
    </div>
  );
}

/* ── Main Popup ────────────────────────────────────────────────────────────── */
export default function EmployeePayrollPopup({ employee, initialMonth, initialYear, onClose, onPayrollGenerated }) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth || now.getMonth() + 1);
  const [year, setYear] = useState(initialYear || now.getFullYear());

  const [attendanceData, setAttendanceData] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab: 'attendance' | 'payslip'
  const [activeTab, setActiveTab] = useState('attendance');
  const printRef = useRef(null);

  const empId = employee?._id;

  const fetchAttendance = useCallback(async () => {
    if (!empId) return;
    setLoadingAtt(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/employees/${empId}/monthly-attendance`, {
        params: { month, year },
      });
      setAttendanceData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance.');
    } finally {
      setLoadingAtt(false);
    }
  }, [empId, month, year]);

  const fetchPayslip = useCallback(async () => {
    if (!empId) return;
    setLoadingPay(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/payroll/payslip/${empId}/${year}/${month}`);
      setPayslipData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payslip.');
    } finally {
      setLoadingPay(false);
    }
  }, [empId, month, year]);

  useEffect(() => {
    fetchAttendance();
    fetchPayslip();
  }, [fetchAttendance, fetchPayslip]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/payroll/generate-attendance-based`, {
        employeeId: empId,
        month,
        year,
      });
      setPayslipData(res.data.data);
      setSuccess('Payroll generated successfully!');
      setActiveTab('payslip');
      if (onPayrollGenerated) onPayrollGenerated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payslipData?._id) return;
    setMarkingPaid(true);
    setError('');
    try {
      const res = await axios.patch(`${API_BASE}/payroll/${payslipData._id}/pay`);
      setPayslipData(res.data.data);
      setSuccess('Payroll marked as paid!');
      if (onPayrollGenerated) onPayrollGenerated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('printable-payslip');
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(`
      <html><head><title>Payslip — ${employee?.name} — ${MONTHS.find(m => m.value === month)?.label} ${year}</title>
      <style>body{margin:0;padding:0;font-family:Arial,sans-serif;}</style>
      </head><body>${content.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  };

  const monthLabel = MONTHS.find(m => m.value === month)?.label || '';
  const summary = attendanceData?.summary;
  const days = attendanceData?.days || [];
  const emp = attendanceData?.employee || employee;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1200, alignItems: 'flex-start', paddingTop: 40 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: 880,
          maxHeight: '90vh',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(168,85,247,.3))',
            border: '1px solid rgba(99,102,241,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#a78bfa', flexShrink: 0,
          }}>
            {emp?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{emp?.name || 'Employee'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {emp?.designation} &nbsp;·&nbsp; {emp?.department} &nbsp;·&nbsp; {emp?.employeeId}
            </div>
          </div>

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth} title="Previous month">
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 13, minWidth: 120, textAlign: 'center' }}>
              {monthLabel} {year}
            </span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth} title="Next month">
              <ChevronRight size={15} />
            </button>
          </div>

          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--color-border)',
          padding: '0 24px',
          flexShrink: 0,
          background: 'var(--color-surface)',
        }}>
          {[
            { id: 'attendance', icon: <Calendar size={14} />, label: 'Attendance' },
            { id: 'payslip', icon: <FileText size={14} />, label: 'Payslip' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 18px',
                fontSize: 13, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--color-primary-light)'
                  : '2px solid transparent',
                color: activeTab === tab.id
                  ? 'var(--color-primary-light)'
                  : 'var(--text-muted)',
                transition: 'all .15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Alerts ── */}
        {(error || success) && (
          <div style={{ padding: '10px 24px', flexShrink: 0 }}>
            {error && <div className="alert alert-error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 0 }}><CheckCircle size={14} /> {success}</div>}
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ══ ATTENDANCE TAB ══ */}
          {activeTab === 'attendance' && (
            <div style={{ padding: 24 }}>
              {loadingAtt ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: 'var(--text-muted)' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading attendance…
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Present', value: summary?.presentDays ?? '—', color: '#34d399', icon: <CheckCircle size={16} /> },
                      { label: 'Absent', value: summary?.absentDays ?? '—', color: '#fb7185', icon: <X size={16} /> },
                      { label: 'Leave', value: summary?.leaveDays ?? '—', color: '#818cf8', icon: <Calendar size={16} /> },
                      { label: 'Total Hours', value: summary ? `${summary.totalWorkingHours}h` : '—', color: '#38bdf8', icon: <Clock size={16} /> },
                      { label: 'Extra Hours', value: summary ? `${summary.totalExtraHours}h` : '—', color: '#fb923c', icon: <TrendingUp size={16} /> },
                      { label: 'Working Days', value: summary ? `${summary.presentDays}/${summary.workingDaysInMonth}` : '—', color: '#a78bfa', icon: <Briefcase size={16} /> },
                    ].map(c => (
                      <div key={c.label} style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.color, marginBottom: 6 }}>
                          {c.icon}
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Day-by-day table */}
                  {days.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>No attendance records</div>
                      <div style={{ fontSize: 13 }}>No data found for {monthLabel} {year}.</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: 'var(--color-surface)' }}>
                            {['Date', 'Day', 'Status', 'Login', 'Logout', 'Total Hrs', 'Extra Hrs', 'Notes'].map(h => (
                              <th key={h} style={{
                                padding: '9px 12px', textAlign: 'left',
                                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                borderBottom: '1px solid var(--color-border)',
                                whiteSpace: 'nowrap',
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {days.map((d, idx) => {
                            const sc = statusColor(d.status);
                            const dateObj = new Date(d.date + 'T00:00:00');
                            const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                            const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                            return (
                              <tr key={d.date} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '9px 12px', fontWeight: 600 }}>{dateStr}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{dayName}</td>
                                <td style={{ padding: '9px 12px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 9px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: sc.bg,
                                    color: sc.color,
                                  }}>{sc.label}</span>
                                </td>
                                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: d.loginTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {d.loginTime || '—'}
                                </td>
                                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: d.logoutTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {d.logoutTime || '—'}
                                </td>
                                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                  {d.totalHours > 0 ? `${d.totalHours}h` : '—'}
                                </td>
                                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: d.extraHours > 0 ? '#fb923c' : 'var(--text-muted)', fontWeight: d.extraHours > 0 ? 700 : 400 }}>
                                  {d.extraHours > 0 ? `+${d.extraHours}h` : '—'}
                                </td>
                                <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {d.notes || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ PAYSLIP TAB ══ */}
          {activeTab === 'payslip' && (
            <div style={{ padding: 24 }}>
              {loadingPay ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 48, color: 'var(--text-muted)' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading payslip…
                </div>
              ) : payslipData ? (
                <>
                  {/* Salary summary bar */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
                    gap: 12,
                    marginBottom: 24,
                  }}>
                    {[
                      { label: 'Hours Worked', value: payslipData.hoursWorked ? `${payslipData.hoursWorked}h` : '—', color: '#38bdf8' },
                      { label: 'Std. Hours', value: payslipData.standardHours ? `${payslipData.standardHours}h` : '—', color: '#818cf8' },
                      { label: 'Overtime Hrs', value: payslipData.overtimeHours ? `${payslipData.overtimeHours}h` : '0h', color: '#fb923c' },
                      { label: 'Hourly Rate', value: payslipData.hourlyRate ? `₹${payslipData.hourlyRate}/h` : '—', color: '#a78bfa' },
                      { label: 'Earned Basic', value: formatCurrency(payslipData.basicPay), color: '#a78bfa' },
                      { label: 'Overtime Pay', value: formatCurrency(payslipData.overtimePay || 0), color: '#fb923c' },
                      { label: 'Allowances', value: formatCurrency(payslipData.allowances), color: '#34d399' },
                      { label: 'Net Salary', value: formatCurrency(payslipData.netSalary), color: '#38bdf8', big: true },
                    ].map(c => (
                      <div key={c.label} style={{
                        background: 'var(--color-surface)',
                        border: `1px solid ${c.big ? c.color + '44' : 'var(--color-border)'}`,
                        borderRadius: 10, padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{c.label}</div>
                        <div style={{ fontSize: c.big ? 18 : 14, fontWeight: 800, color: c.color }}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status badge + attendance ratio info */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10, marginBottom: 20, flexWrap: 'wrap',
                  }}>
                    <span className={`badge badge-${payslipData.status}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                      {payslipData.status === 'paid' ? '✓ Paid' : payslipData.status === 'preview' ? '👁 Preview' : '⏳ Pending'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {monthLabel} {year} &nbsp;·&nbsp; Salary calculated based on attendance
                    </span>
                    {summary && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        <strong style={{ color: '#34d399' }}>{summary.presentDays}</strong> / {summary.workingDaysInMonth} working days
                      </span>
                    )}
                  </div>

                  {/* Printable payslip preview */}
                  <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#fff',
                  }}>
                    <PrintablePayslip
                      ref={printRef}
                      payslip={payslipData}
                      monthLabel={monthLabel}
                    />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No payslip generated</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Generate payroll for {monthLabel} {year} to view the payslip.
                  </div>
                  <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
                    <DollarSign size={14} />
                    {generating ? 'Generating…' : `Generate Payslip for ${monthLabel} ${year}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap',
          background: 'var(--color-surface)', flexShrink: 0,
        }}>
          {activeTab === 'attendance' && (
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('payslip')}
              style={{ marginRight: 'auto' }}
            >
              <FileText size={14} /> View Payslip
            </button>
          )}

          {activeTab === 'payslip' && payslipData && (
            <>
              {payslipData.status === 'generated' && (
                <button className="btn btn-success" onClick={handleMarkPaid} disabled={markingPaid}>
                  <CheckCircle size={14} />
                  {markingPaid ? 'Updating…' : 'Mark as Paid'}
                </button>
              )}
              {payslipData.status !== 'preview' && !payslipData._id && (
                <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
                  <DollarSign size={14} />
                  {generating ? 'Generating…' : 'Generate & Save'}
                </button>
              )}
              <button className="btn btn-ghost" onClick={handlePrint}>
                <Printer size={14} /> Print Payslip
              </button>
            </>
          )}

          {activeTab === 'payslip' && !payslipData && (
            <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
              <DollarSign size={14} />
              {generating ? 'Generating…' : `Generate for ${monthLabel} ${year}`}
            </button>
          )}

          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
