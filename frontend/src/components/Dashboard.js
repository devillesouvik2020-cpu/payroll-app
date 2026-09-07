import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  ListChecks,
  Package,
  Award,
  ChevronRight,
  Building2,
  AlertCircle
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
  const currentMonthName = MONTH_NAMES[now.getMonth() + 1];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, payrollRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/payroll`),
      ]);
      setStats(statsRes.data.data);
      setRecentPayrolls((payrollRes.data.data || []).slice(0, 5));
    } catch (err) {
      setError('Failed to load dashboard data. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEmployees = stats?.totalEmployees || 0;
  const presentToday = stats?.presentToday ?? 0;
  const attendanceOverview = stats?.attendanceOverview || { present: 0, absent: 0, late: 0, leave: 0 };
  const topDept = stats?.topDepartment?._id && stats.topDepartment._id !== 'N/A' 
    ? `${stats.topDepartment._id} (${stats.topDepartment.count})` 
    : 'All Active';

  // Calculate attendance percentages for donut/bars
  const totalAttendanceRecords = (attendanceOverview.present + attendanceOverview.absent + attendanceOverview.late + attendanceOverview.leave) || 1;
  const presentPct = Math.round((attendanceOverview.present / totalAttendanceRecords) * 100);
  const latePct = Math.round((attendanceOverview.late / totalAttendanceRecords) * 100);
  const absentPct = Math.round((attendanceOverview.absent / totalAttendanceRecords) * 100);
  const leavePct = Math.round((attendanceOverview.leave / totalAttendanceRecords) * 100);

  // Donut chart conical gradient
  const pDeg = (attendanceOverview.present / totalAttendanceRecords) * 360;
  const lDeg = pDeg + (attendanceOverview.late / totalAttendanceRecords) * 360;
  const aDeg = lDeg + (attendanceOverview.absent / totalAttendanceRecords) * 360;
  const donutGradient = totalAttendanceRecords > 1 || attendanceOverview.present > 0
    ? `conic-gradient(#34d399 0deg ${pDeg}deg, #fbbf24 ${pDeg}deg ${lDeg}deg, #fb7185 ${lDeg}deg ${aDeg}deg, #818cf8 ${aDeg}deg 360deg)`
    : `conic-gradient(#34d399 0deg 270deg, rgba(255,255,255,0.08) 270deg 360deg)`;

  const statCards = [
    {
      id: 'stat-total-employees',
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      iconClass: 'purple',
      sub: 'Active personnel in organization',
      link: '/employees',
    },
    {
      id: 'stat-present-today',
      label: 'Present Today',
      value: presentToday,
      icon: UserCheck,
      iconClass: 'green',
      sub: `${totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0}% workforce present`,
      link: '/attendance',
    },
    {
      id: 'stat-monthly-salary',
      label: 'Monthly Payroll',
      value: formatCurrency(stats?.totalMonthlySalary),
      icon: DollarSign,
      iconClass: 'cyan',
      sub: `${currentMonthName} ${now.getFullYear()}`,
      link: '/payroll',
    },
    {
      id: 'stat-top-department',
      label: 'Top Department',
      value: stats?.topDepartment?._id || 'Engineering',
      icon: Building2,
      iconClass: 'amber',
      sub: topDept,
      link: '/employees',
    },
  ];

  const quickActions = [
    { label: 'Add Employee', icon: Users, to: '/employees/new', color: 'var(--color-primary)' },
    { label: 'Mark Attendance', icon: CalendarCheck, to: '/attendance', color: '#34d399' },
    { label: 'Time Tracker', icon: Clock, to: '/time-tracker', color: '#38bdf8' },
    { label: 'Manage Tasks', icon: ListChecks, to: '/tasks', color: '#fbbf24' },
    { label: 'Performance', icon: Award, to: '/performance', color: '#a78bfa' },
    { label: 'Company Assets', icon: Package, to: '/assets', color: '#f43f5e' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>HR & Payroll Dashboard</h2>
          <p>Real-time workforce intelligence, employee attendance, and payroll status.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/employees/new" className="btn btn-primary" id="dashboard-add-employee-btn">
            <Users size={15} /> Add Employee
          </Link>
          <Link to="/payroll" className="btn btn-ghost" id="dashboard-view-payroll-btn">
            <DollarSign size={15} /> Run Payroll
          </Link>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Top 4 Stat Cards */}
        <div className="stat-cards-grid">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link to={c.link} key={c.id}>
                <div className="stat-card" id={c.id} style={{ cursor: 'pointer' }}>
                  <div className="stat-card-header">
                    <span className="stat-label">{c.label}</span>
                    <div className={`stat-icon ${c.iconClass}`}>
                      <Icon size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{loading ? '—' : c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 2-Column Section: Attendance Overview + Quick Actions */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          {/* Attendance Overview Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <CalendarCheck size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>Attendance Overview</h3>
              </div>
              <Link to="/attendance" className="card-action">
                View All Attendance <ArrowRight size={13} />
              </Link>
            </div>

            <div className="card-body">
              <div className="attendance-chart">
                {/* CSS Donut Chart */}
                <div
                  className="donut-chart"
                  style={{
                    background: donutGradient,
                    boxShadow: '0 0 20px rgba(0,0,0,0.4)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 18,
                      borderRadius: '50%',
                      background: 'var(--color-surface)',
                    }}
                  />
                  <div className="donut-chart-center">
                    <div className="value">
                      {loading ? '...' : (attendanceOverview.present || presentToday)}
                    </div>
                    <div className="label">Present</div>
                  </div>
                </div>

                {/* Chart Legend */}
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot present" />
                    <span className="legend-label">Present</span>
                    <span className="legend-value">
                      {attendanceOverview.present || presentToday} ({presentPct}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot late" />
                    <span className="legend-label">Late Arrival</span>
                    <span className="legend-value">
                      {attendanceOverview.late} ({latePct}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot absent" />
                    <span className="legend-label">Absent</span>
                    <span className="legend-value">
                      {attendanceOverview.absent} ({absentPct}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot leave" />
                    <span className="legend-label">On Leave</span>
                    <span className="legend-value">
                      {attendanceOverview.leave} ({leavePct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress visual bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                  <div style={{ width: `${presentPct}%`, background: '#34d399' }} title="Present" />
                  <div style={{ width: `${latePct}%`, background: '#fbbf24' }} title="Late" />
                  <div style={{ width: `${absentPct}%`, background: '#fb7185' }} title="Absent" />
                  <div style={{ width: `${leavePct}%`, background: '#818cf8' }} title="Leave" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Department Breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Briefcase size={18} style={{ color: 'var(--color-primary-light)' }} />
                <h3>HR Modules & Shortcuts</h3>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {quickActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <Link
                      key={qa.to}
                      to={qa.to}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-surface-hover)';
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${qa.color}20`,
                          color: qa.color,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{qa.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manage & track</div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                  );
                })}
              </div>

              {/* Department Distribution Preview */}
              {stats?.departmentCounts && stats.departmentCounts.length > 0 && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Department Distribution
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {stats.departmentCounts.map((dept) => (
                      <span key={dept._id} className="badge badge-purple" style={{ fontSize: 11.5 }}>
                        {dept._id}: {dept.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payrolls Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <DollarSign size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Recent Payroll Records</h3>
            </div>
            <Link to="/payroll" className="card-action" id="dashboard-all-payrolls-link">
              View All Payrolls <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span>Loading recent payrolls...</span>
              </div>
            ) : recentPayrolls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <DollarSign size={28} />
                </div>
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
                          <td style={{ fontWeight: 500 }}>
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
                        </tr>
                      );
                    })}
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
