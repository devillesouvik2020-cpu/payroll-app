import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  Layers,
  CalendarCheck,
  Clock,
  ListChecks,
  TrendingUp,
  Package,
  Settings,
  DollarSign,
} from 'lucide-react';

const navItems = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/employees',     icon: Users,        label: 'Employees' },
      { to: '/employees/new', icon: UserPlus,     label: 'Add Employee' },
      { to: '/payroll',       icon: DollarSign,   label: 'Payroll' },
    ],
  },
  {
    label: 'HR Tools',
    items: [
      { to: '/attendance',   icon: CalendarCheck, label: 'Attendance' },
      { to: '/time-tracker', icon: Clock,         label: 'Time Tracker' },
      { to: '/tasks',        icon: ListChecks,    label: 'Tasks' },
      { to: '/performance',  icon: TrendingUp,    label: 'Performance' },
      { to: '/assets',       icon: Package,       label: 'Assets' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'More Settings' },
    ],
  },
];

export default function Layout({ children }) {
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

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
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

        <div className="sidebar-footer">
          <Link to="/hr-manager" className="sidebar-footer-info" id="nav-hr-manager-profile">
            <div className="avatar">A</div>
            <div className="footer-user-info">
              <p>Admin</p>
              <span>HR Manager</span>
            </div>
            <Layers size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
