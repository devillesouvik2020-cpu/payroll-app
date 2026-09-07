import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Star,
  Plus,
  Search,
  Award,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Target,
  ThumbsUp,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function PerformancePage() {
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterEmp, setFilterEmp] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    employee: '',
    rating: 5,
    review: '',
    strengths: '',
    improvements: '',
    goals: '',
    status: 'reviewed',
    reviewDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/performance?`;
      if (filterEmp) url += `employeeId=${filterEmp}&`;
      if (filterRating) url += `rating=${filterRating}&`;

      const [empRes, perfRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(url),
      ]);
      setEmployees(empRes.data.data || []);
      setReviews(perfRes.data.data || []);
    } catch {
      setError('Failed to fetch performance reviews.');
    } finally {
      setLoading(false);
    }
  }, [filterEmp, filterRating]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setModalMode('add');
    setEditId(null);
    setForm({
      employee: employees[0]?._id || '',
      rating: 5,
      review: '',
      strengths: '',
      improvements: '',
      goals: '',
      status: 'reviewed',
      reviewDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEditModal = (r) => {
    setModalMode('edit');
    setEditId(r._id);
    setForm({
      employee: r.employee?._id || r.employee || '',
      rating: r.rating || 5,
      review: r.review || '',
      strengths: r.strengths || '',
      improvements: r.improvements || '',
      goals: r.goals || '',
      status: r.status || 'reviewed',
      reviewDate: r.reviewDate || new Date().toISOString().split('T')[0],
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
        await axios.put(`${API_BASE}/performance/${editId}`, form);
        setSuccess('Performance review updated.');
      } else {
        await axios.post(`${API_BASE}/performance`, form);
        setSuccess('Performance review recorded.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this performance review?')) return;
    try {
      await axios.delete(`${API_BASE}/performance/${id}`);
      setSuccess('Review deleted.');
      fetchData();
    } catch {
      setError('Failed to delete review.');
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
      : '0.0';

  const topRatings = reviews.filter((r) => r.rating >= 4).length;

  const filteredReviews = reviews.filter((r) => {
    const empName = r.employee?.name || '';
    const review = r.review || '';
    const strengths = r.strengths || '';
    return (
      empName.toLowerCase().includes(search.toLowerCase()) ||
      review.toLowerCase().includes(search.toLowerCase()) ||
      strengths.toLowerCase().includes(search.toLowerCase())
    );
  });

  const renderStars = (rating, interactive = false, onSelect = null) => {
    return (
      <div className={interactive ? 'star-rating' : 'star-display'}>
        {[1, 2, 3, 4, 5].map((val) => (
          <Star
            key={val}
            size={interactive ? 22 : 16}
            className={`star ${val <= rating ? 'filled' : 'empty'}`}
            fill={val <= rating ? '#fbbf24' : 'none'}
            stroke={val <= rating ? '#fbbf24' : 'currentColor'}
            onClick={interactive && onSelect ? () => onSelect(val) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Performance Reviews</h2>
          <p>Evaluate team achievements, key strengths, growth goals, and star appraisals.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            id="add-review-btn"
          >
            <Plus size={15} /> Add Review
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

        {/* Top KPIs */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Average Org Rating</span>
              <div className="stat-icon amber">
                <Star size={19} />
              </div>
            </div>
            <div className="stat-value">{avgRating} / 5.0</div>
            <div className="stat-sub">Based on {reviews.length} reviews</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">High Performers</span>
              <div className="stat-icon green">
                <Award size={19} />
              </div>
            </div>
            <div className="stat-value">{topRatings}</div>
            <div className="stat-sub">Rated 4 stars or higher</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Appraisals</span>
              <div className="stat-icon purple">
                <TrendingUp size={19} />
              </div>
            </div>
            <div className="stat-value">{reviews.length}</div>
            <div className="stat-sub">Evaluations recorded</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1 1 240px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by employee, review text, or strengths..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 170, padding: '8px 12px' }}
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">★★★★★ 5 Stars</option>
            <option value="4">★★★★ 4 Stars</option>
            <option value="3">★★★ 3 Stars</option>
            <option value="2">★★ 2 Stars</option>
            <option value="1">★ 1 Star</option>
          </select>

          <select
            className="form-select"
            style={{ width: 180, padding: '8px 12px' }}
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Reviews Cards List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <span>Loading reviews...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <TrendingUp size={28} />
              </div>
              <h4>No performance reviews found</h4>
              <p>Record your first performance evaluation to establish growth tracking.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openAddModal}
                style={{ marginTop: 12 }}
              >
                <Plus size={14} /> Add Performance Review
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredReviews.map((r) => {
              const emp = r.employee;
              return (
                <div key={r._id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                        {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {emp?.name || 'Unknown Employee'}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                          {emp?.designation || 'Staff'} • {emp?.department || 'General'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div>{renderStars(r.rating)}</div>
                      <span className={`badge badge-${r.status === 'reviewed' ? 'green' : 'amber'}`}>
                        {r.status === 'reviewed' ? 'Reviewed' : 'Draft'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openEditModal(r)}
                          title="Edit review"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => handleDelete(r._id)}
                          title="Delete review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {r.review && (
                    <div style={{ marginTop: 14, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                      "{r.review}"
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
                    {r.strengths && (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <ThumbsUp size={12} /> Key Strengths
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.strengths}</div>
                      </div>
                    )}

                    {r.improvements && (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Target size={12} /> Areas of Improvement
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.improvements}</div>
                      </div>
                    )}

                    {r.goals && (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Sparkles size={12} /> Next Goals
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.goals}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Review Date: {r.reviewDate || 'Recent'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Edit Review' : 'Add Performance Appraisal'}</h3>
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
                  <label className="form-label">Rating (1 to 5 Stars) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    {renderStars(form.rating, true, (rating) => setForm({ ...form, rating }))}
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                      {form.rating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Overall Evaluation Summary *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Provide a comprehensive summary of employee performance and value add..."
                    value={form.review}
                    onChange={(e) => setForm({ ...form, review: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Key Strengths</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Proactive leadership, high code quality, great mentorship"
                    value={form.strengths}
                    onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Areas for Improvement</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Documentation, cross-functional communication"
                    value={form.improvements}
                    onChange={(e) => setForm({ ...form, improvements: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Goals for Next Cycle</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lead Kubernetes migration, earn AWS architect cert"
                    value={form.goals}
                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Appraisal Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="reviewed">Reviewed & Finalized</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.reviewDate}
                      onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                    />
                  </div>
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
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Review' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
