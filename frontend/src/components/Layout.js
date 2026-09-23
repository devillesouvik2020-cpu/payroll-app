import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  ListChecks,
  TrendingUp,
  Package,
  Settings,
  DollarSign,
  LogOut,
  LogIn,
  LogOut as LogOutIcon,
  CheckCircle,
  Loader,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

function getNavItems(role) {
  const all = [
    // Dashboard — always shown
    { section: 'Overview', to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','hr','it','employee'] },
    // Management
    { section: 'Management', to: '/employees',  icon: Users,       label: 'Employees',    roles: ['admin','hr'] },
    { section: 'Management', to: '/payroll',    icon: DollarSign,  label: 'Payroll',       roles: ['admin','hr'] },
    // HR Tools
    { section: 'HR Tools', to: '/attendance',   icon: CalendarCheck, label: 'Attendance',  roles: ['admin','hr'] },
    { section: 'HR Tools', to: '/time-tracker', icon: Clock,         label: 'Time Tracker',roles: ['admin'] },
    { section: 'HR Tools', to: '/tasks',        icon: ListChecks,    label: 'Tasks',       roles: ['admin','employee'] },
    { section: 'HR Tools', to: '/performance',  icon: TrendingUp,    label: 'Performance', roles: ['admin','hr'] },
    { section: 'HR Tools', to: '/assets',       icon: Package,       label: 'Assets',      roles: ['admin','it'] },
    // Employee self-service
    { section: 'My Space', to: '/my-attendance', icon: CalendarCheck, label: 'My Attendance', roles: ['employee'] },
    { section: 'My Space', to: '/my-payslips',   icon: DollarSign,    label: 'My Payslips',   roles: ['employee'] },
    // System
    { section: 'System', to: '/settings',       icon: Settings,      label: 'More Settings', roles: ['admin'] },
  ];

  const filtered = all.filter(item => item.roles.includes(role));

  // Group by section
  const sections = [];
  const seen = new Map();
  filtered.forEach(item => {
    if (!seen.has(item.section)) {
      seen.set(item.section, { label: item.section, items: [] });
      sections.push(seen.get(item.section));
    }
    seen.get(item.section).items.push({ to: item.to, icon: item.icon, label: item.label });
  });
  return sections;
}

/* ── Office Entry/Exit Button ─────────────────────────────────────────────── */
function OfficeButton({ employeeId }) {
  const [status,     setStatus]     = useState('loading');
  const [loginTime,  setLoginTime]  = useState(null);
  const [logoutTime, setLogoutTime] = useState(null);
  const [busy,       setBusy]       = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/office/status/${employeeId}`);
      const d = res.data.data;
      setStatus(d.status);
      setLoginTime(d.loginTime);
      setLogoutTime(d.logoutTime);
    } catch {
      setStatus('not_entered');
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) fetchStatus();
  }, [employeeId, fetchStatus]);

  const handleEnter = async () => {
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/office/enter`, { employeeId });
      const d = res.data.data;
      setStatus(d.status); setLoginTime(d.loginTime); setLogoutTime(d.logoutTime);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to enter office.', 'error');
    } finally { setBusy(false); }
  };

  const handleExit = async () => {
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/office/exit`, { employeeId });
      const d = res.data.data;
      setStatus(d.status); setLoginTime(d.loginTime); setLogoutTime(d.logoutTime);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to exit office.', 'error');
    } finally { setBusy(false); }
  };

  // Status meta
  const statusMeta = {
    loading:     { dot: '#94a3b8', glow: false, label: 'Checking…'   },
    not_entered: { dot: '#fb7185', glow: false, label: 'Not Entered'  },
    inside:      { dot: '#34d399', glow: true,  label: 'In Office'    },
    exited:      { dot: '#818cf8', glow: false, label: 'Left Office'  },
  }[status] || { dot: '#94a3b8', glow: false, label: '—' };

  const timeLabel = loginTime
    ? logoutTime ? `${loginTime} – ${logoutTime}` : `In since ${loginTime}`
    : null;

  return (
    <>
      {/* ── Card sits right below the logo, above the nav ── */}
      <div style={{
        margin: '0 14px 4px',
        borderRadius: 12,
        border: '1px solid var(--color-border-light)',
        background: 'rgba(255,255,255,0.035)',
        overflow: 'hidden',
      }}>
        {/* Top row — status indicator + time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 6px',
        }}>
          {/* Pulsing dot */}
          <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: statusMeta.dot,
              boxShadow: statusMeta.glow ? `0 0 7px ${statusMeta.dot}` : 'none',
            }} />
            {status === 'inside' && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: statusMeta.dot, opacity: 0.4,
                animation: 'ping 1.4s cubic-bezier(0,0,.2,1) infinite',
              }} />
            )}
          </div>

          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flex: 1 }}>
            {statusMeta.label}
          </span>

          {timeLabel && (
            <span style={{
              fontSize: 10.5, color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
              whiteSpace: 'nowrap',
            }}>
              {timeLabel}
            </span>
          )}
        </div>

        {/* Action button */}
        <div style={{ padding: '4px 10px 10px' }}>
          {status === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', fontSize: 12, color: 'var(--text-muted)' }}>
              <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>

          ) : status === 'not_entered' ? (
            <button onClick={handleEnter} disabled={busy} style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', fontWeight: 700, fontSize: 12.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: busy ? 0.7 : 1, transition: 'opacity .15s, transform .1s',
            }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {busy
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Entering…</>
                : <><LogIn size={14} /> Enter Office</>}
            </button>

          ) : status === 'inside' ? (
            <button onClick={handleExit} disabled={busy} style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
              color: '#fff', fontWeight: 700, fontSize: 12.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: busy ? 0.7 : 1, transition: 'opacity .15s, transform .1s',
            }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {busy
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Exiting…</>
                : <><LogOutIcon size={14} /> Exit Office</>}
            </button>

          ) : (
            /* exited */
            <div style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
              color: '#818cf8', fontWeight: 700, fontSize: 12.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <CheckCircle size={14} /> Done for Today
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '12px 22px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, color: '#fff',
          background: toast.type === 'success' ? 'rgba(16,185,129,0.96)' : 'rgba(244,63,94,0.96)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)', maxWidth: 360,
          textAlign: 'center', backdropFilter: 'blur(10px)',
          animation: 'fadeInUp .2s ease',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

/* ── Main Layout ──────────────────────────────────────────────────────────── */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName =
    user?.employee?.name ||
    (user?.role === 'admin' ? 'System Admin' : user?.email?.split('@')[0] || 'User');

  const displayRole =
    user?.role === 'admin'  ? 'Administrator'
    : user?.role === 'hr'   ? 'HR Manager'
    : user?.employee?.designation || 'Employee';

  const avatarLetter = (
    user?.employee?.name?.[0] || user?.email?.[0] || 'U'
  ).toUpperCase();

  const profileLink =
    user?.employee?._id ? `/employees/${user.employee._id}` : '/hr-manager';

  // Show office button for any logged-in employee (not admin)
  const navItems = getNavItems(user?.role || 'employee');
  const showOfficeButton = user?.role !== 'admin' && user?.employee?._id;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="logo-icon">
              <Briefcase size={20} color="white" />
            </div>
            <div className="logo-text">
              <h1>PayrollPro</h1>
              <span>HR Management</span>
            </div>
          </div>
        </div>

        {/* Office Entry/Exit — sits right below logo, only for employees */}
        {showOfficeButton && (
          <OfficeButton employeeId={user.employee._id} />
        )}

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="nav-link-icon">
                    <Icon size={16} />
                  </span>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <Link
              to={profileLink}
              className="sidebar-footer-info"
              id="nav-user-profile"
              title={`View ${displayName}'s profile`}
            >
              <div className="avatar">{avatarLetter}</div>
              <div className="footer-user-info">
                <p className="footer-user-name" title={displayName}>{displayName}</p>
                <span className="footer-user-role" title={displayRole}>{displayRole}</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-logout-btn"
              id="btn-sidebar-logout"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
