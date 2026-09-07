import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Edit2, Trash2, Plus, Mail, Briefcase, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/employees`);
      setEmployees(res.data.data);
    } catch (err) {
      setError('Failed to fetch employees. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/employees/${deleteTarget._id}`);
      setEmployees(prev => prev.filter(e => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError('Failed to delete employee.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = employees.filter(
    e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Employees</h2>
          <p>Manage your workforce — {employees.length} employee{employees.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link to="/employees/new" className="btn btn-primary" id="add-employee-page-btn">
          <Plus size={15} /> Add Employee
        </Link>
      </div>

      <div className="page-content fade-in">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              id="employee-search"
              type="text"
              className="search-input"
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            Loading employees...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={28} /></div>
              <h4>{search ? 'No results found' : 'No employees yet'}</h4>
              <p>
                {search
                  ? 'Try a different search term.'
                  : 'Add your first employee to get started with payroll management.'}
              </p>
              {!search && (
                <Link to="/employees/new" className="btn btn-primary btn-sm" id="empty-add-employee-btn">
                  <Plus size={14} /> Add Employee
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Basic Pay</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => {
                  const net = emp.basicPay + emp.allowances - emp.deductions;
                  return (
                    <tr key={emp._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/employees/${emp._id}`} className="td-primary" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                              {emp.name}
                            </Link>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={10} /> {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>{emp.designation}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          <Briefcase size={10} /> {emp.department}
                        </div>
                      </td>
                      <td className="td-mono">{formatCurrency(emp.basicPay)}</td>
                      <td style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>+{formatCurrency(emp.allowances)}</td>
                      <td style={{ color: '#fb7185', fontWeight: 600, fontSize: 13 }}>−{formatCurrency(emp.deductions)}</td>
                      <td className="td-mono" style={{ color: 'var(--color-primary-light) !important', fontWeight: 700 }}>
                        {formatCurrency(net)}
                      </td>
                      <td>
                        <span className={`badge badge-${emp.status}`}>
                          {emp.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link
                            to={`/employees/${emp._id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="View full profile"
                            id={`view-profile-${emp._id}`}
                            style={{ color: 'var(--color-primary-light)' }}
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/employees/edit/${emp._id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit employee"
                            id={`edit-employee-${emp._id}`}
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={() => setDeleteTarget(emp)}
                            title="Delete employee"
                            id={`delete-employee-${emp._id}`}
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ color: '#fb7185' }}>Delete Employee</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(null)} id="close-delete-modal">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>?
                This action cannot be undone and will also remove all associated payroll records.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} id="cancel-delete-btn">Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} id="confirm-delete-btn">
                {deleting ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
