import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserX,
  Calendar,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: '#34d399' },
  { value: 'late', label: 'Late Arrival', color: '#fbbf24' },
  { value: 'absent', label: 'Absent', color: '#fb7185' },
  { value: 'leave', label: 'On Leave', color: '#818cf8' },
];

export default function AttendancePage() {
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    employee: '',
    date: todayStr,
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, attRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(`${API_BASE}/attendance?date=${selectedDate}`),
      ]);
      setEmployees(empRes.data.data || []);
      setAttendanceList(attRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch attendance records. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Attendance stats for selected date
  const counts = {
    present: attendanceList.filter((a) => a.status === 'present').length,
    late: attendanceList.filter((a) => a.status === 'late').length,
    absent: attendanceList.filter((a) => a.status === 'absent').length,
    leave: attendanceList.filter((a) => a.status === 'leave').length,
  };

  const openEditModal = (rec) => {
    setModalMode('edit');
    setEditId(rec._id);
    setForm({
      employee: rec.employee?._id || rec.employee || '',
      date: rec.date,
      status: rec.status,
      checkIn: rec.checkIn || '',
      checkOut: rec.checkOut || '',
      notes: rec.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee) {
      setError('Please select an employee.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (modalMode === 'edit') {
        await axios.put(`${API_BASE}/attendance/${editId}`, form);
        setSuccess('Attendance record updated successfully.');
      } else {
        await axios.post(`${API_BASE}/attendance`, form);
        setSuccess('Attendance logged successfully.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await axios.delete(`${API_BASE}/attendance/${id}`);
      setSuccess('Record deleted.');
      fetchData();
    } catch {
      setError('Failed to delete attendance record.');
    }
  };

  const filteredAttendance = attendanceList.filter((item) => {
    const empName = item.employee?.name || '';
    const empDept = item.employee?.department || '';
    const matchesSearch =
      empName.toLowerCase().includes(search.toLowerCase()) ||
      empDept.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Attendance Management</h2>
          <p>Track daily employee presence, punch times, leaves, and work anomalies.</p>
        </div>
      </div>

      <div className="page-content fade-in">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Attendance KPI Cards for Date */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div className="stat-card-header">
              <span className="stat-label">Present</span>
              <div className="stat-icon green">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div className="stat-value">{counts.present}</div>
            <div className="stat-sub">Employees on duty</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <div className="stat-card-header">
              <span className="stat-label">Late Arrivals</span>
              <div className="stat-icon amber">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-value">{counts.late}</div>
            <div className="stat-sub">Arrived after shift time</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #fb7185' }}>
            <div className="stat-card-header">
              <span className="stat-label">Absent</span>
              <div className="stat-icon rose">
                <UserX size={19} />
              </div>
            </div>
            <div className="stat-value">{counts.absent}</div>
            <div className="stat-sub">Unexcused absence</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #818cf8' }}>
            <div className="stat-card-header">
              <span className="stat-label">On Leave</span>
              <div className="stat-icon purple">
                <CalendarCheck size={19} />
              </div>
            </div>
            <div className="stat-value">{counts.leave}</div>
            <div className="stat-sub">Approved time off</div>
          </div>
        </div>

        {/* Filter & Toolbar */}
        <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1 1 240px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by employee name or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              className="form-input"
              style={{ width: 160, padding: '8px 12px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 160, padding: '8px 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Table View */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <CalendarCheck size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Attendance Log for {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</h3>
            </div>
            <span className="badge badge-purple">{filteredAttendance.length} records</span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span>Loading attendance...</span>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CalendarCheck size={28} />
                </div>
                <h4>No attendance records for this date</h4>
                <p>Attendance is recorded automatically when employees enter the office.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((item) => {
                      const emp = item.employee;
                      return (
                        <tr key={item._id}>
                          <td>
                            <div className="table-user">
                              <div className="avatar">
                                {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="table-user-name">{emp?.name || 'Unknown Employee'}</div>
                                <div className="table-user-sub">{emp?.employeeId || emp?.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td>{emp?.department || '—'}</td>
                          <td>
                            <span className={`badge badge-${item.status}`}>
                              <span className="badge-dot" />
                              {item.status ? item.status.toUpperCase() : 'PRESENT'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {item.checkIn || '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {item.checkOut || '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12.5, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.notes || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => openEditModal(item)}
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon btn-sm"
                                onClick={() => handleDelete(item._id)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

      {/* Mark / Edit Attendance Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Edit Attendance Record' : 'Mark Employee Attendance'}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Employee *</label>
                  <select
                    className="form-select"
                    value={form.employee}
                    onChange={(e) => setForm({ ...form, employee: e.target.value })}
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.department} - {e.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    required
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Check-in Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.checkIn}
                      onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-out Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.checkOut}
                      onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Remote work, Approved half-day, Doctor appointment"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Record' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
