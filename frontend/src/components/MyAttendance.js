import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Clock, CheckCircle2, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
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

function statusStyle(status) {
  switch (status) {
    case 'present': return { bg: 'rgba(52,211,153,.12)', color: '#34d399', label: 'Present' };
    case 'late':    return { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24', label: 'Late'    };
    case 'absent':  return { bg: 'rgba(251,113,133,.12)', color: '#fb7185', label: 'Absent'  };
    case 'leave':   return { bg: 'rgba(129,140,248,.12)', color: '#818cf8', label: 'Leave'   };
    default:        return { bg: 'rgba(148,163,184,.1)',  color: '#94a3b8', label: status||'—'};
  }
}

export default function MyAttendance() {
  const { user } = useAuth();
  const employeeId = user?.employee?._id;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/employees/${employeeId}/monthly-attendance`, {
        params: { month, year },
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, year]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else              { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else               { setMonth(m => m + 1); }
  };

  const monthLabel = MONTHS.find(m => m.value === month)?.label || '';
  const summary = data?.summary;
  const days    = data?.days || [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>My Attendance</h2>
          <p>Your monthly attendance log with check-in, check-out, and working hours.</p>
        </div>
        {/* Month navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>{monthLabel} {year}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Summary cards */}
        <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
          {[
            { label: 'Present',       value: summary?.presentDays   ?? '—', icon: CheckCircle2, cls: 'green'  },
            { label: 'Absent',        value: summary?.absentDays    ?? '—', icon: UserX,        cls: 'rose'   },
            { label: 'Leave',         value: summary?.leaveDays     ?? '—', icon: CalendarCheck,cls: 'purple' },
            { label: 'Total Hours',   value: summary ? `${summary.totalWorkingHours}h` : '—', icon: Clock, cls: 'cyan'  },
            { label: 'Extra Hours',   value: summary ? `${summary.totalExtraHours}h`   : '—', icon: Clock, cls: 'amber' },
            { label: 'Working Days',  value: summary ? `${summary.presentDays}/${summary.workingDaysInMonth}` : '—', icon: CalendarCheck, cls: 'purple' },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div className="stat-card" key={c.label}>
                <div className="stat-card-header">
                  <span className="stat-label">{c.label}</span>
                  <div className={`stat-icon ${c.cls}`}><Icon size={19} /></div>
                </div>
                <div className="stat-value">{loading ? '—' : c.value}</div>
              </div>
            );
          })}
        </div>

        {/* Day table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <CalendarCheck size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Attendance Log — {monthLabel} {year}</h3>
            </div>
            <span className="badge badge-purple">{days.length} records</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container"><div className="spinner" /> Loading…</div>
            ) : days.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><CalendarCheck size={28} /></div>
                <h4>No records for {monthLabel} {year}</h4>
                <p>Enter the office to start recording attendance.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)' }}>
                      {['Date','Day','Status','Check-In','Check-Out','Total Hrs','Extra Hrs','Notes'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d, i) => {
                      const ss = statusStyle(d.status);
                      const dateObj = new Date(d.date + 'T00:00:00');
                      return (
                        <tr key={d.date} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                          <td style={{ padding: '9px 14px', fontWeight: 600 }}>{dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                          <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{dateObj.toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>{ss.label}</span>
                          </td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: d.loginTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.loginTime || '—'}</td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: d.logoutTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.logoutTime || '—'}</td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{d.totalHours > 0 ? `${d.totalHours}h` : '—'}</td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: d.extraHours > 0 ? '#fb923c' : 'var(--text-muted)', fontWeight: d.extraHours > 0 ? 700 : 400 }}>{d.extraHours > 0 ? `+${d.extraHours}h` : '—'}</td>
                          <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.notes || '—'}</td>
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
