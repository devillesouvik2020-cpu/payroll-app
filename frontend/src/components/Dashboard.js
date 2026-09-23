import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
  ArrowRight,
  Building2,
  AlertCircle,
  Search,
  LogIn,
  LogOut,
  ExternalLink,
  RefreshCw,
  Timer,
  ListChecks,
  Package,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTime12(timeStr) {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

// Badge colour per attendance status
function attBadge(status) {
  switch (status) {
    case 'present': return { bg: 'rgba(52,211,153,.15)', color: '#34d399', label: 'Present' };
    case 'late': return { bg: 'rgba(251,191,36,.15)', color: '#fbbf24', label: 'Late Arrival' };
    default: return { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: status || '—' };
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [workedEmployees, setWorkedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth() + 1];
  const todayFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const curToday = new Date().toISOString().split('T')[0];
      const userRole = user?.role || 'employee';

      const promises = [axios.get(`${API_BASE}/stats`)];

      // Payroll list — admin and hr only
      if (userRole === 'admin' || userRole === 'hr') {
        promises.push(axios.get(`${API_BASE}/payroll`));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      // Office-entered employees — admin and hr only
      if (userRole === 'admin' || userRole === 'hr') {
        promises.push(axios.get(`${API_BASE}/employees/logged-in-today?date=${curToday}`));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      const [statsRes, payrollRes, workedRes] = await Promise.all(promises);
      setStats(statsRes.data.data);
      setRecentPayrolls((payrollRes.data.data || []).slice(0, 5));
      setWorkedEmployees(workedRes.data.data || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalEmployees = stats?.totalEmployees || 0;
  const presentToday = stats?.presentToday ?? 0;
  const topDept = stats?.topDepartment?._id && stats.topDepartment._id !== 'N/A'
    ? `${stats.topDepartment._id} (${stats.topDepartment.count})`
    : 'All Active';

  const activeNow = workedEmployees.filter(e => e.isActive).length;
  const completedShift = workedEmployees.filter(e => !e.isActive && e.logoutTime).length;
  const totalHrsToday = workedEmployees.reduce((s, e) => s + (e.workedHours || 0), 0);
  const avgHours = workedEmployees.length ? (totalHrsToday / workedEmployees.length).toFixed(1) : '0.0';

  const allStatCards = [
    {
      id: 'stat-total-employees',
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      iconClass: 'purple',
      sub: 'Active personnel in organization',
      link: '/employees',
      roles: ['admin', 'hr'],
    },
    {
      id: 'stat-present-today',
      label: 'Present Today',
      value: presentToday,
      icon: UserCheck,
      iconClass: 'green',
      sub: `${totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0}% workforce present`,
      link: '/attendance',
      roles: ['admin', 'hr'],
    },
    {
      id: 'stat-monthly-salary',
      label: 'Monthly Payroll',
      value: formatCurrency(stats?.totalMonthlySalary),
      icon: DollarSign,
      iconClass: 'cyan',
      sub: `${currentMonthName} ${now.getFullYear()}`,
      link: '/payroll',
      roles: ['admin', 'hr'],
    },
    {
      id: 'stat-top-department',
      label: 'Top Department',
      value: stats?.topDepartment?._id || 'Engineering',
      icon: Building2,
      iconClass: 'amber',
      sub: topDept,
      link: '/employees',
      roles: ['admin', 'hr'],
    },
  ];
  const statCards = allStatCards.filter(c => c.roles.includes(role));

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = workedEmployees.filter((item) => {
    const emp = item.employee || {};
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q) ||
      (emp.designation || '').toLowerCase().includes(q) ||
      (emp.employeeId || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>HR & Payroll Dashboard</h2>
          <p>Real-time workforce intelligence, employee attendance, and payroll status.</p>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="stat-cards-grid">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link to={c.link} key={c.id}>
                <div className="stat-card" id={c.id} style={{ cursor: 'pointer' }}>
                  <div className="stat-card-header">
                    <span className="stat-label">{c.label}</span>
                    <div className={`stat-icon ${c.iconClass}`}><Icon size={19} /></div>
                  </div>
                  <div className="stat-value">{loading ? '—' : c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Employees in Office Today — admin/hr only ── */}
        {(role === 'admin' || role === 'hr') && (
          <div className="card" style={{ marginBottom: 24 }} id="dashboard-worked-today-section">
            {/* Card Header */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 14 }}>
              <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(16,185,129,.25),rgba(6,182,212,.25))',
                  border: '1px solid rgba(16,185,129,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#34d399', boxShadow: '0 0 16px rgba(16,185,129,.2)',
                }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700 }}>
                      Employees in Office Today
                    </h3>
                    <span className="badge badge-present" style={{ fontSize: 11.5 }}>
                      <span className="badge-dot pulse-dot" />
                      {workedEmployees.length} Entered Today
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} />
                    <span><strong style={{ color: 'var(--text-secondary)' }}>{todayFormatted}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 210 }}>
                  <Search size={14} style={{
                    position: 'absolute', left: 11, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  }} />
                  <input
                    type="text"
                    placeholder="Search employee…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 34, paddingTop: 7, paddingBottom: 7, fontSize: 12.5, height: 34, borderRadius: 20 }}
                  />
                </div>
                {/* Refresh */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={fetchData}
                  title="Refresh"
                  style={{ height: 34 }}
                >
                  <RefreshCw size={13} />
                </button>
                <Link to="/attendance" className="card-action" style={{ fontSize: 12.5 }}>
                  Attendance <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Quick metrics strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: 12,
              padding: '14px 20px',
              background: 'rgba(255,255,255,.02)',
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              {[
                { label: 'Worked Today', value: `${workedEmployees.length} Staff`, color: 'var(--text-primary)' },
                { label: 'Still in Office', value: `${activeNow} Active`, color: '#34d399' },
                { label: 'Shift Completed', value: `${completedShift} Left`, color: 'var(--text-secondary)' },
                { label: 'Avg. Hours', value: `${avgHours} hrs`, color: '#60a5fa' },
                { label: 'Total Hrs Today', value: `${totalHrsToday.toFixed(1)} hrs`, color: '#a78bfa' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: m.color }}>
                    {loading ? '—' : m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="loading-container" style={{ padding: 30 }}>
                  <div className="spinner" />
                  <span>Loading today's work records…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '36px 20px' }}>
                  <div className="empty-state-icon"><Clock size={28} /></div>
                  <h4>
                    {searchTerm ? `No results for "${searchTerm}"` : 'No employees have entered the office today'}
                  </h4>
                  <p>
                    {searchTerm
                      ? 'Try a different name, department, or employee ID.'
                      : 'Employees who click "Enter Office" from the sidebar will appear here.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
                    {searchTerm ? (
                      <button className="btn btn-ghost" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </button>
                    ) : (
                      <>
                        <Link to="/time-tracker" className="btn btn-primary" style={{ fontSize: 12.5 }}>
                          <Clock size={14} /> Log Hours
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Hours Worked</th>
                        <th>Attendance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const emp = item.employee || {};
                        const ab = attBadge(item.attendanceStatus);
                        return (
                          <tr key={item._id || emp._id}>
                            {/* Employee */}
                            <td>
                              <div className="table-user">
                                <div style={{ position: 'relative' }}>
                                  <div className="avatar">
                                    {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  {/* Online dot */}
                                  <span style={{
                                    position: 'absolute', bottom: -1, right: -1,
                                    width: 9, height: 9, borderRadius: '50%',
                                    background: item.isActive ? '#10b981' : '#94a3b8',
                                    border: '2px solid var(--color-surface)',
                                    boxShadow: item.isActive ? '0 0 6px #10b981' : 'none',
                                  }} />
                                </div>
                                <div>
                                  <div className="table-user-name">{emp.name || 'Unknown'}</div>
                                  <div className="table-user-sub">{emp.designation || '—'}</div>
                                </div>
                              </div>
                            </td>

                            {/* ID */}
                            <td><span className="td-mono">{emp.employeeId || '—'}</span></td>

                            {/* Department */}
                            <td>
                              <span className="badge badge-purple" style={{ fontSize: 11 }}>
                                {emp.department || 'General'}
                              </span>
                            </td>

                            {/* Check-In */}
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 600 }}>
                                <LogIn size={13} />
                                {formatTime12(item.loginTime)}
                              </div>
                            </td>

                            {/* Check-Out */}
                            <td>
                              {item.logoutTime ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                                  <LogOut size={13} style={{ color: 'var(--text-muted)' }} />
                                  {formatTime12(item.logoutTime)}
                                </div>
                              ) : (
                                <span className="badge badge-present" style={{ background: 'rgba(16,185,129,.15)', color: '#34d399', fontSize: 11 }}>
                                  <span className="badge-dot pulse-dot" /> Active Now
                                </span>
                              )}
                            </td>

                            {/* Hours Worked */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Timer size={13} style={{ color: item.isActive ? '#60a5fa' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 700, color: item.isActive ? '#60a5fa' : 'var(--text-primary)' }}>
                                  {item.workedHours != null ? `${item.workedHours} hrs` : '—'}
                                </span>
                                {item.isActive && (
                                  <span style={{ fontSize: 10, color: '#60a5fa', fontStyle: 'italic' }}>live</span>
                                )}
                              </div>
                            </td>

                            {/* Attendance status */}
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 9px', borderRadius: 20,
                                fontSize: 11, fontWeight: 700,
                                background: ab.bg, color: ab.color,
                              }}>
                                {ab.label}
                              </span>
                            </td>

                            {/* Session status */}
                            <td>
                              {item.isActive ? (
                                <span className="badge badge-present">
                                  <span className="badge-dot pulse-dot" /> In Office
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(148,163,184,.12)', color: '#94a3b8' }}>
                                  <span className="badge-dot" /> Left Office
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td>
                              <Link
                                to={emp._id ? `/employees/${emp._id}` : '/employees'}
                                className="btn btn-ghost"
                                style={{ padding: '4px 10px', fontSize: 11.5, height: 28 }}
                              >
                                Profile <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Recent Payrolls — admin/hr only ── */}
        {(role === 'admin' || role === 'hr') && (
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <DollarSign size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Recent Payroll Records</h3>
              </div>
              <Link to="/payroll" className="card-action" id="dashboard-all-payrolls-link">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="loading-container">
                  <div className="spinner" /><span>Loading recent payrolls…</span>
                </div>
              ) : recentPayrolls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><DollarSign size={28} /></div>
                  <h4>No payrolls generated yet</h4>
                  <p>Generate your first payroll from the Payroll view to see records here.</p>
                  <Link to="/payroll" className="btn btn-primary" style={{ marginTop: 12 }}>
                    Generate Payroll
                  </Link>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Period</th>
                        <th>Basic Pay</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayrolls.map((p) => {
                        const emp = p.employee;
                        return (
                          <tr key={p._id}>
                            <td>
                              <div className="table-user">
                                <div className="avatar">
                                  {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <div className="table-user-name">{emp?.name || 'Unknown'}</div>
                                  <div className="table-user-sub">{emp?.designation || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{MONTH_NAMES[p.month]} {p.year}</td>
                            <td>{formatCurrency(p.basicPay)}</td>
                            <td style={{ color: '#34d399' }}>+{formatCurrency(p.allowances)}</td>
                            <td style={{ color: '#fb7185' }}>−{formatCurrency(p.deductions)}</td>
                            <td style={{ fontWeight: 700 }}>{formatCurrency(p.netSalary)}</td>
                            <td>
                              <span className={`badge badge-${p.status}`}>
                                <span className="badge-dot" />
                                {p.status === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Employee self-service dashboard ── */}
        {role === 'employee' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <Link to="/my-attendance" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform .15s', padding: 24 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(16,185,129,.25),rgba(6,182,212,.25))', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>My Attendance</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>View your monthly attendance log</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Check-in times, check-out times, working hours and extra hours month by month.</div>
              </div>
            </Link>
            <Link to="/my-payslips" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform .15s', padding: 24 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(168,85,247,.25))', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>My Payslips</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download your salary statements</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View and print payslips for every month from when your payroll was first generated.</div>
              </div>
            </Link>
            <Link to="/tasks" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform .15s', padding: 24 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(251,191,36,.25),rgba(245,158,11,.25))', border: '1px solid rgba(251,191,36,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                    <ListChecks size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>My Tasks</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Track your assigned tasks</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View pending, in-progress, and completed tasks assigned to you.</div>
              </div>
            </Link>
          </div>
        )}

        {/* ── IT dashboard ── */}
        {role === 'it' && (
          <Link to="/assets" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'transform .15s', padding: 24, maxWidth: 400 }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(6,182,212,.25),rgba(59,130,246,.25))', border: '1px solid rgba(6,182,212,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Package size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Asset Management</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage company assets</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Add new assets, assign them to employees, and track asset status and condition.</div>
            </div>
          </Link>
        )}
      </div>
    </>
  );
}
