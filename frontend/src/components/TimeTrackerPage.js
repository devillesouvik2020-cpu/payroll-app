import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Timer
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

function calculateHours(login, logout) {
  if (!login || !logout) return 0;
  const [h1, m1] = login.split(':').map(Number);
  const [h2, m2] = logout.split(':').map(Number);
  const diffMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diffMinutes <= 0) return 0;
  return Number((diffMinutes / 60).toFixed(2));
}

export default function TimeTrackerPage() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    employee: '',
    date: todayStr,
    loginTime: '09:00',
    logoutTime: '18:00',
    totalHours: 9,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/time-tracker?`;
      if (selectedDate) url += `date=${selectedDate}&`;
      if (selectedEmp) url += `employeeId=${selectedEmp}&`;

      const [empRes, timeRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(url),
      ]);
      setEmployees(empRes.data.data || []);
      setEntries(timeRes.data.data || []);
    } catch {
      setError('Failed to fetch time entries.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedEmp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTimeChange = (field, val) => {
    const updated = { ...form, [field]: val };
    const autoHours = calculateHours(
      field === 'loginTime' ? val : form.loginTime,
      field === 'logoutTime' ? val : form.logoutTime
    );
    if (autoHours > 0) {
      updated.totalHours = autoHours;
    }
    setForm(updated);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditId(null);
    setForm({
      employee: employees[0]?._id || '',
      date: selectedDate || todayStr,
      loginTime: '09:00',
      logoutTime: '18:00',
      totalHours: 9,
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setModalMode('edit');
    setEditId(entry._id);
    setForm({
      employee: entry.employee?._id || entry.employee || '',
      date: entry.date,
      loginTime: entry.loginTime || '',
      logoutTime: entry.logoutTime || '',
      totalHours: entry.totalHours || 0,
      notes: entry.notes || '',
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
      const payload = {
        ...form,
        totalHours: Number(form.totalHours) || calculateHours(form.loginTime, form.logoutTime),
      };
      if (modalMode === 'edit') {
        await axios.put(`${API_BASE}/time-tracker/${editId}`, payload);
        setSuccess('Time log updated successfully.');
      } else {
        await axios.post(`${API_BASE}/time-tracker`, payload);
        setSuccess('Time log recorded successfully.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save time entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await axios.delete(`${API_BASE}/time-tracker/${id}`);
      setSuccess('Time entry deleted.');
      fetchData();
    } catch {
      setError('Failed to delete time entry.');
    }
  };

  const totalLoggedHours = entries.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0);
  const avgHours = entries.length > 0 ? (totalLoggedHours / entries.length).toFixed(1) : 0;

  const filteredEntries = entries.filter((item) => {
    const empName = item.employee?.name || '';
    const empDept = item.employee?.department || '';
    return (
      empName.toLowerCase().includes(search.toLowerCase()) ||
      empDept.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Time Tracker</h2>
          <p>Monitor daily employee work hours, punch times, and operational productivity.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            id="log-time-btn"
          >
            <Plus size={15} /> Log Work Hours
          </button>
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

        {/* Time KPIs */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Logged Hours</span>
              <div className="stat-icon cyan">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-value">{totalLoggedHours.toFixed(1)} hrs</div>
            <div className="stat-sub">Across all entries today</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Average Session</span>
              <div className="stat-icon purple">
                <Timer size={19} />
              </div>
            </div>
            <div className="stat-value">{avgHours} hrs</div>
            <div className="stat-sub">Per employee shift</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Employees Logged</span>
              <div className="stat-icon green">
                <Users size={19} />
              </div>
            </div>
            <div className="stat-value">{entries.length}</div>
            <div className="stat-sub">Timesheets recorded</div>
          </div>
        </div>

        {/* Toolbar */}
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
            style={{ width: 180, padding: '8px 12px' }}
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Time Entries Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Clock size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Timesheet Records</h3>
            </div>
            <span className="badge badge-blue">{filteredEntries.length} logged sessions</span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span>Loading timesheet...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Clock size={28} />
                </div>
                <h4>No timesheet entries for this date</h4>
                <p>Log hours worked for employees using the button above.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddModal}
                  style={{ marginTop: 12 }}
                >
                  <Plus size={14} /> Log Work Hours
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Login Time</th>
                      <th>Logout Time</th>
                      <th>Total Hours</th>
                      <th>Activity Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((item) => {
                      const emp = item.employee;
                      const hrs = Number(item.totalHours) || 0;
                      return (
                        <tr key={item._id}>
                          <td>
                            <div className="table-user">
                              <div className="avatar">
                                {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="table-user-name">{emp?.name || 'Unknown'}</div>
                                <div className="table-user-sub">{emp?.department || emp?.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td>{item.date}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {item.loginTime || '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {item.logoutTime || '—'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                hrs >= 8 ? 'badge-green' : hrs >= 4 ? 'badge-amber' : 'badge-rose'
                              }`}
                              style={{ fontWeight: 700 }}
                            >
                              {hrs} hrs
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12.5, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.notes || 'General working shift'}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Edit Work Hours' : 'Log Employee Work Hours'}</h3>
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
                    <option value="">Select employee</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.department})
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Clock In / Login Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.loginTime}
                      onChange={(e) => handleTimeChange('loginTime', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Clock Out / Logout Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.logoutTime}
                      onChange={(e) => handleTimeChange('logoutTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Calculated Hours *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    className="form-input"
                    value={form.totalHours}
                    onChange={(e) => setForm({ ...form, totalHours: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Summary / Project Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sprint 24 deliverables, Code review, Client sync"
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
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Log' : 'Save Time Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
