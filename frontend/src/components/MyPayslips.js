import React, { useState, useEffect, useCallback } from 'react';
import { FileText, DollarSign, Calendar, Printer, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' },   { value: 4, label: 'April' },
  { value: 5, label: 'May' },     { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },
  { value: 9, label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' },{ value: 12, label: 'December' },
];

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export default function MyPayslips() {
  const { user } = useAuth();
  const employeeId = user?.employee?._id;

  const [payslips, setPayslips]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);

  const fetchPayslips = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/payroll/employee/${employeeId}`);
      setPayslips(res.data.data || []);
    } catch {
      setError('Failed to load payslips.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const handlePrint = (p) => {
    const monthLabel = MONTHS.find(m => m.value === p.month)?.label || '';
    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(`
      <html><head><title>Payslip — ${p.employee?.name} — ${monthLabel} ${p.year}</title>
      <style>body{margin:0;padding:32px;font-family:Arial,sans-serif;color:#1e293b;}
      table{width:100%;border-collapse:collapse;}
      th,td{padding:9px 12px;text-align:left;}
      thead tr{background:#f1f5f9;}
      tfoot tr{background:#6366f1;color:#fff;}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #6366f1;padding-bottom:14px;margin-bottom:18px;">
        <div><div style="font-size:20px;font-weight:800;color:#6366f1;">PayrollPro Inc.</div><div style="font-size:11px;color:#64748b;">Employee Payslip</div></div>
        <div style="text-align:right;"><div style="font-size:13px;font-weight:700;">${monthLabel} ${p.year}</div>
        <div style="display:inline-block;margin-top:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${p.status==='paid'?'#d1fae5':'#fef3c7'};color:${p.status==='paid'?'#059669':'#b45309'};">${p.status==='paid'?'✓ PAID':'⏳ PENDING'}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-bottom:18px;padding:12px 14px;background:#f8fafc;border-radius:8px;">
        ${[['Employee Name',p.employee?.name],['Employee ID',p.employee?.employeeId],['Designation',p.employee?.designation],['Department',p.employee?.department],['Pay Period',`${monthLabel} ${p.year}`]].map(([k,v])=>`<div><div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;">${k}</div><div style="font-size:13px;font-weight:600;margin-top:2px;">${v||'—'}</div></div>`).join('')}
      </div>
      <table>
        <thead><tr><th>COMPONENT</th><th style="text-align:right;">AMOUNT</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9;"><td>Earned Basic Pay${p.hoursWorked?` (${p.hoursWorked}h × ₹${p.hourlyRate}/h)`:''}</td><td style="text-align:right;font-weight:600;">${formatCurrency(p.basicPay)}</td></tr>
          ${p.overtimePay>0?`<tr style="border-bottom:1px solid #f1f5f9;"><td style="color:#d97706;">Overtime Pay (${p.overtimeHours}h × ₹${p.hourlyRate}/h × 1.5)</td><td style="text-align:right;font-weight:600;color:#d97706;">+ ${formatCurrency(p.overtimePay)}</td></tr>`:''}
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="color:#059669;">Housing & Allowances</td><td style="text-align:right;font-weight:600;color:#059669;">+ ${formatCurrency(p.allowances)}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="color:#e11d48;">Deductions (PF / Tax)</td><td style="text-align:right;font-weight:600;color:#e11d48;">− ${formatCurrency(p.deductions)}</td></tr>
        </tbody>
        <tfoot><tr><td style="font-size:14px;font-weight:800;">Net Salary</td><td style="text-align:right;font-size:16px;font-weight:800;">${formatCurrency(p.netSalary)}</td></tr></tfoot>
      </table>
      <div style="font-size:10px;color:#94a3b8;margin-top:20px;text-align:center;">Computer-generated payslip — no signature required · PayrollPro Inc.</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>My Payslips</h2>
          <p>View and download your monthly salary statements.</p>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Summary */}
        {!loading && payslips.length > 0 && (
          <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Total Payslips</span>
                <div className="stat-icon purple"><FileText size={19} /></div>
              </div>
              <div className="stat-value">{payslips.length}</div>
              <div className="stat-sub">Since joining</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Latest Net Salary</span>
                <div className="stat-icon cyan"><DollarSign size={19} /></div>
              </div>
              <div className="stat-value">{formatCurrency(payslips[0]?.netSalary)}</div>
              <div className="stat-sub">{MONTHS.find(m => m.value === payslips[0]?.month)?.label} {payslips[0]?.year}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Paid</span>
                <div className="stat-icon green"><DollarSign size={19} /></div>
              </div>
              <div className="stat-value">{payslips.filter(p => p.status === 'paid').length}</div>
              <div className="stat-sub">Payslips processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Pending</span>
                <div className="stat-icon amber"><Clock size={19} /></div>
              </div>
              <div className="stat-value">{payslips.filter(p => p.status !== 'paid').length}</div>
              <div className="stat-sub">Awaiting payment</div>
            </div>
          </div>
        )}

        {/* Payslip list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <FileText size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Payslip History</h3>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container"><div className="spinner" /> Loading payslips…</div>
            ) : payslips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={28} /></div>
                <h4>No payslips yet</h4>
                <p>Your payslips will appear here once payroll is generated for your account.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Pay Period</th>
                      <th>Basic Pay</th>
                      <th>Overtime Pay</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Hours Worked</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            <strong>{MONTHS.find(m => m.value === p.month)?.label} {p.year}</strong>
                          </div>
                        </td>
                        <td className="td-mono">{formatCurrency(p.basicPay)}</td>
                        <td style={{ color: '#fb923c', fontWeight: 600 }}>
                          {p.overtimePay > 0 ? `+${formatCurrency(p.overtimePay)}` : '—'}
                        </td>
                        <td style={{ color: '#34d399', fontWeight: 600 }}>+{formatCurrency(p.allowances)}</td>
                        <td style={{ color: '#fb7185', fontWeight: 600 }}>−{formatCurrency(p.deductions)}</td>
                        <td className="td-mono" style={{ fontWeight: 700 }}>{formatCurrency(p.netSalary)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                          {p.hoursWorked ? `${p.hoursWorked}h` : '—'}
                        </td>
                        <td>
                          <span className={`badge badge-${p.status}`}>
                            {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handlePrint(p)}
                            title="Print payslip"
                          >
                            <Printer size={13} /> Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
