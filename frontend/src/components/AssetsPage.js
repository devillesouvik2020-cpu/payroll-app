import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const CATEGORIES = [
  'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Mobile', 'ID Card', 'Other'
];

const CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs Repair' },
];

export default function AssetsPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    assetName: '',
    category: 'Laptop',
    serialNumber: '',
    purchaseDate: '',
    status: 'available',
    assignedTo: '',
    assignmentDate: '',
    condition: 'good',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/assets?`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterStatus) url += `status=${filterStatus}&`;

      const [empRes, assetRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(url),
      ]);
      setEmployees(empRes.data.data || []);
      setAssets(assetRes.data.data || []);
    } catch {
      setError('Failed to load asset inventory.');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setModalMode('add');
    setEditId(null);
    setForm({
      assetName: '',
      category: 'Laptop',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'available',
      assignedTo: '',
      assignmentDate: '',
      condition: 'new',
    });
    setShowModal(true);
  };

  const openEditModal = (a) => {
    setModalMode('edit');
    setEditId(a._id);
    setForm({
      assetName: a.assetName || '',
      category: a.category || 'Laptop',
      serialNumber: a.serialNumber || '',
      purchaseDate: a.purchaseDate || '',
      status: a.status || 'available',
      assignedTo: a.assignedTo?._id || a.assignedTo || '',
      assignmentDate: a.assignmentDate || '',
      condition: a.condition || 'good',
    });
    setShowModal(true);
  };

  const handleReturnAsset = async (asset) => {
    if (!window.confirm(`Mark ${asset.assetName} as returned and available?`)) return;
    try {
      await axios.put(`${API_BASE}/assets/${asset._id}`, {
        status: 'available',
        assignedTo: null,
        returnDate: new Date().toISOString().split('T')[0],
      });
      setSuccess(`${asset.assetName} returned and marked available.`);
      fetchData();
    } catch {
      setError('Failed to return asset.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetName.trim()) {
      setError('Asset name is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo ? form.assignedTo : null,
      };

      if (modalMode === 'edit') {
        await axios.put(`${API_BASE}/assets/${editId}`, payload);
        setSuccess('Asset updated.');
      } else {
        await axios.post(`${API_BASE}/assets`, payload);
        setSuccess('Asset added to inventory.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset from inventory?')) return;
    try {
      await axios.delete(`${API_BASE}/assets/${id}`);
      setSuccess('Asset deleted.');
      fetchData();
    } catch {
      setError('Failed to delete asset.');
    }
  };

  const totalAvailable = assets.filter((a) => a.status === 'available').length;
  const totalAssigned = assets.filter((a) => a.status === 'assigned').length;

  const filteredAssets = assets.filter((a) => {
    const name = a.assetName || '';
    const serial = a.serialNumber || '';
    const assignee = a.assignedTo?.name || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      serial.toLowerCase().includes(search.toLowerCase()) ||
      assignee.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Asset Management</h2>
          <p>Track enterprise hardware, serial allocations, and employee asset custody.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            id="add-asset-btn"
          >
            <Plus size={15} /> Add Asset
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

        {/* Asset KPIs */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Inventory</span>
              <div className="stat-icon purple">
                <Package size={19} />
              </div>
            </div>
            <div className="stat-value">{assets.length}</div>
            <div className="stat-sub">Hardware & equipment assets</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div className="stat-card-header">
              <span className="stat-label">Available in Stock</span>
              <div className="stat-icon green">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div className="stat-value">{totalAvailable}</div>
            <div className="stat-sub">Ready to be assigned</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div className="stat-card-header">
              <span className="stat-label">Currently Assigned</span>
              <div className="stat-icon cyan">
                <Users size={19} />
              </div>
            </div>
            <div className="stat-value">{totalAssigned}</div>
            <div className="stat-sub">In employee possession</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1 1 240px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by asset name, serial, or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 160, padding: '8px 12px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 160, padding: '8px 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        {/* Assets Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Package size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3>Equipment Inventory ({filteredAssets.length})</h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span>Loading assets...</span>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package size={28} />
                </div>
                <h4>No assets in this category</h4>
                <p>Add company computers, monitors, and equipment to track distribution.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddModal}
                  style={{ marginTop: 12 }}
                >
                  <Plus size={14} /> Add Asset
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asset Details</th>
                      <th>Category</th>
                      <th>Serial Number</th>
                      <th>Assigned To</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((a) => {
                      const emp = a.assignedTo;
                      return (
                        <tr key={a._id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                              {a.assetName}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              {a.assetId || 'AST-ID'}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-purple">{a.category}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                            {a.serialNumber || '—'}
                          </td>
                          <td>
                            {emp ? (
                              <div className="table-user">
                                <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <div className="table-user-name" style={{ fontSize: 13 }}>{emp.name}</div>
                                  <div className="table-user-sub">{emp.department}</div>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                a.condition === 'new'
                                  ? 'badge-green'
                                  : a.condition === 'good'
                                  ? 'badge-blue'
                                  : a.condition === 'fair'
                                  ? 'badge-amber'
                                  : 'badge-rose'
                              }`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {a.condition}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                a.status === 'available'
                                  ? 'badge-green'
                                  : a.status === 'assigned'
                                  ? 'badge-blue'
                                  : 'badge-amber'
                              }`}
                            >
                              <span className="badge-dot" />
                              {a.status ? a.status.toUpperCase() : 'AVAILABLE'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {a.status === 'assigned' && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm"
                                  onClick={() => handleReturnAsset(a)}
                                  title="Return Asset"
                                  style={{ color: '#fbbf24' }}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => openEditModal(a)}
                                title="Edit Asset"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon btn-sm"
                                onClick={() => handleDelete(a._id)}
                                title="Delete Asset"
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

      {/* Asset Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Edit Asset Record' : 'Register New Asset'}</h3>
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
                  <label className="form-label">Asset Name / Model *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MacBook Pro 16' M3 Max"
                    value={form.assetName}
                    onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Physical Condition</label>
                    <select
                      className="form-select"
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. C02GL40GMD6T"
                      value={form.serialNumber}
                      onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Assign To Employee</label>
                  <select
                    className="form-select"
                    value={form.assignedTo}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setForm({
                        ...form,
                        assignedTo: empId,
                        status: empId ? 'assigned' : 'available',
                        assignmentDate: empId
                          ? new Date().toISOString().split('T')[0]
                          : '',
                      });
                    }}
                  >
                    <option value="">Keep in inventory (Available)</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.department} - {e.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Asset Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="available">Available in Stock</option>
                    <option value="assigned">Assigned to Employee</option>
                    <option value="returned">Returned / In Storage</option>
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
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
