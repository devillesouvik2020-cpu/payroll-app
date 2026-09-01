import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, payrollRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/payroll`),
      ]);
      setStats(statsRes.data.data);
      setRecentPayrolls(payrollRes.data.data.slice(0, 5));
    } catch (err) {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = stats
    ? [
        {
          label: 'Total Employees',
          value: stats.totalEmployees,
          icon: Users,
          iconClass: 'purple',
          sub: 'Active this month',
        },
        {
          label: 'Monthly Salary',
          value: formatCurrency(stats.totalMonthlySalary),
          icon: DollarSign,
          iconClass: 'cyan',
          sub: `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`,
        },
        {
          label: 'Paid Payrolls',
          value: stats.paidPayrolls,
          icon: TrendingUp,
          iconClass: 'green',
          sub: 'Processed & disbursed',
        },
        {
          label: 'Pending Payrolls',
          value: stats.pendingPayrolls,
          icon: Clock,
          iconClass: 'amber',
          sub: 'Awaiting payment',
        },
      ]
    : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Dashboard</h2>
          <p>Welcome back! Here's what's happening with your payroll.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/employees/new" className="btn btn-primary" id="dashboard-add-employee-btn">
            <Users size={15} /> Add Employee
          </Link>
          <Link to="/payroll" className="btn btn-ghost" id="dashboard-view-payroll-btn">
            <DollarSign size={15} /> Run Payroll
          </Link>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="stats-grid">
              {statCards.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card-header">
                    <span className="stat-label">{s.label}</span>
                    <div className={`stat-icon ${s.iconClass}`}>
                      <s.icon size={17} />
                    </div>
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-change">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent Payrolls */}
            <div className="dashboard-grid">
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">Recent Payroll Records</div>
                    <div className="section-subtitle">Latest payroll processing activity</div>
                  </div>
                  <Link to="/payroll" className="btn btn-ghost btn-sm" id="dashboard-all-payrolls-link">
                    View All <ArrowRight size={13} />
                  </Link>
                </div>

                {recentPayrolls.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><DollarSign size={28} /></div>
                    <h4>No payroll records yet</h4>
                    <p>Generate payroll for your employees to see records here.</p>
                    <Link to="/payroll" className="btn btn-primary btn-sm">Run Payroll</Link>
                  </div>
                ) : (
                  <div className="table-container" style={{ marginTop: 0, border: 'none', background: 'transparent' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Period</th>
                          <th>Net Salary</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayrolls.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <div className="td-primary">{p.employee?.name || 'N/A'}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                                {p.employee?.designation}
                              </div>
                            </td>
                            <td>{MONTH_NAMES[p.month]} {p.year}</td>
                            <td className="td-mono">{formatCurrency(p.netSalary)}</td>
                            <td>
                              <span className={`badge badge-${p.status}`}>
                                {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to="/employees/new"
                    id="quick-add-employee"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
                      e.currentTarget.style.background = 'rgba(124,58,237,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }}
                  >
                    <div className="stat-icon purple"><Users size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Add New Employee</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Register a new team member
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                  </Link>

                  <Link
                    to="/payroll"
                    id="quick-run-payroll"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)';
                      e.currentTarget.style.background = 'rgba(6,182,212,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }}
                  >
                    <div className="stat-icon cyan"><DollarSign size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Process Payroll</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Generate salary payslips
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                  </Link>

                  <Link
                    to="/employees"
                    id="quick-view-employees"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
                      e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }}
                  >
                    <div className="stat-icon green"><Briefcase size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>View All Employees</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Browse the employee directory
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
