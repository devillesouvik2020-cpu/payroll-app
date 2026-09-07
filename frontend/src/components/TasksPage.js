import React, { useState, useEffect, useCallback } from 'react';
import {
  ListChecks,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  X,
  CheckSquare
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const PRIORITIES = [
  { value: 'low', label: 'Low', badgeClass: 'badge-low' },
  { value: 'medium', label: 'Medium', badgeClass: 'badge-medium' },
  { value: 'high', label: 'High', badgeClass: 'badge-high' },
];

const STATUSES = [
  { value: 'pending', label: 'Pending', badgeClass: 'badge-pending' },
  { value: 'in-progress', label: 'In Progress', badgeClass: 'badge-in-progress' },
  { value: 'completed', label: 'Completed', badgeClass: 'badge-completed' },
];

export default function TasksPage() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    status: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/tasks?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;
      if (filterEmp) url += `assignedTo=${filterEmp}&`;

      const [empRes, taskRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(url),
      ]);
      setEmployees(empRes.data.data || []);
      setTasks(taskRes.data.data || []);
    } catch {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterEmp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setModalMode('add');
    setEditId(null);
    setForm({
      title: '',
      description: '',
      assignedTo: employees[0]?._id || '',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending',
    });
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setModalMode('edit');
    setEditId(t._id);
    setForm({
      title: t.title || '',
      description: t.description || '',
      assignedTo: t.assignedTo?._id || t.assignedTo || '',
      priority: t.priority || 'medium',
      dueDate: t.dueDate || '',
      status: t.status || 'pending',
    });
    setShowModal(true);
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      setSuccess(`Task marked as ${newStatus}`);
    } catch {
      setError('Failed to update task status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (modalMode === 'edit') {
        await axios.put(`${API_BASE}/tasks/${editId}`, form);
        setSuccess('Task updated.');
      } else {
        await axios.post(`${API_BASE}/tasks`, form);
        setSuccess('Task created.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${id}`);
      setSuccess('Task deleted.');
      fetchData();
    } catch {
      setError('Failed to delete task.');
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const filteredTasks = tasks.filter((t) => {
    const title = t.title || '';
    const desc = t.description || '';
    const assignee = t.assignedTo?.name || '';
    return (
      title.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase()) ||
      assignee.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Task Management</h2>
          <p>Assign deliverables, manage team milestones, and track deadline progress.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            id="create-task-btn"
          >
            <Plus size={15} /> Create Task
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

        {/* Task Metrics */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <div className="stat-card-header">
              <span className="stat-label">Pending</span>
              <div className="stat-icon amber">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-sub">Waiting to be picked up</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div className="stat-card-header">
              <span className="stat-label">In Progress</span>
              <div className="stat-icon cyan">
                <ListChecks size={19} />
              </div>
            </div>
            <div className="stat-value">{inProgressCount}</div>
            <div className="stat-sub">Actively being worked on</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div className="stat-card-header">
              <span className="stat-label">Completed</span>
              <div className="stat-icon green">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-sub">Successfully resolved</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Completion Rate</span>
              <div className="stat-icon purple">
                <CheckSquare size={19} />
              </div>
            </div>
            <div className="stat-value">
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </div>
            <div className="stat-sub">Total {tasks.length} tasks</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1 1 240px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks, descriptions, assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 150, padding: '8px 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 140, padding: '8px 12px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 170, padding: '8px 12px' }}
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
          >
            <option value="">All Assignees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Tasks Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <ListChecks size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Task Items ({filteredTasks.length})</h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span>Loading tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <ListChecks size={28} />
                </div>
                <h4>No tasks matching your filters</h4>
                <p>Create a task to assign work items and track team progress.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddModal}
                  style={{ marginTop: 12 }}
                >
                  <Plus size={14} /> Create Task
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assignee</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => {
                      const emp = t.assignedTo;
                      return (
                        <tr key={t._id}>
                          <td style={{ maxWidth: 280 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                              {t.title}
                            </div>
                            {t.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                {t.description}
                              </div>
                            )}
                          </td>
                          <td>
                            {emp ? (
                              <div className="table-user">
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="table-user-name" style={{ fontSize: 13 }}>{emp.name}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-${t.priority || 'medium'}`}>
                              {t.priority ? t.priority.toUpperCase() : 'MEDIUM'}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {t.dueDate ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                                {new Date(t.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{
                                width: 130,
                                padding: '4px 8px',
                                fontSize: 12,
                                height: 32,
                                borderColor:
                                  t.status === 'completed' ? '#34d399' : t.status === 'in-progress' ? '#38bdf8' : '#fbbf24',
                              }}
                              value={t.status || 'pending'}
                              onChange={(e) => handleQuickStatusChange(t._id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => openEditModal(t)}
                                title="Edit task"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon btn-sm"
                                onClick={() => handleDelete(t._id)}
                                title="Delete task"
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

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Edit Task' : 'Create New Task'}</h3>
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
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Conduct annual security compliance audit"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Provide context, acceptance criteria, or links..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.department} - {e.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
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
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
