import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Megaphone, 
  Pin, 
  PlusCircle, 
  Trash2, 
  Clock, 
  User, 
  CheckCircle2, 
  X, 
  Send, 
  RefreshCw, 
  Building, 
  AlertCircle 
} from 'lucide-react';
import { playHapticTick, playAppleChime } from '../utils/audio';

export default function NoticeBoardPage() {
  const { isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Notice Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadNotices = async () => {
    try {
      setRefreshing(true);
      const res = await api.getNotices();
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.createNotice({
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant
      });

      playAppleChime();
      setSuccessMsg(res.message || 'Notice published successfully!');
      setTitle('');
      setContent('');
      setIsImportant(false);
      setShowAddModal(false);
      loadNotices();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to post notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice circular?')) return;
    try {
      playHapticTick();
      await api.deleteNotice(id);
      loadNotices();
    } catch (err) {
      alert(err.message || 'Failed to delete notice.');
    }
  };

  const pinnedNotices = notices.filter(n => n.is_important === 1);
  const regularNotices = notices.filter(n => n.is_important !== 1);

  return (
    <div>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', padding: '2px 10px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
            <span>OFFICIAL COMMUNICATIONS</span>
            <span>•</span>
            <span>Estate Circulars</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            Digital Notice Board
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button className="btn btn-amber btn-sm" onClick={() => setShowAddModal(true)}>
              <PlusCircle size={14} />
              <span>Publish New Notice</span>
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={loadNotices} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', borderRadius: 'var(--radius-squircle-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading official society notices...
        </div>
      ) : notices.length === 0 ? (
        <div className="squircle-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Megaphone size={36} color="#D97706" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>No active circulars</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>There are currently no official announcements from the RWA management committee.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Pinned Circulars Group */}
          {pinnedNotices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Pin size={14} />
                <span>Pinned Important Circulars</span>
              </div>

              {pinnedNotices.map(notice => (
                <div 
                  key={notice.id} 
                  className="squircle-card"
                  style={{ borderLeft: '5px solid #D97706', background: 'var(--bg-surface)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="pill-badge pill-open" style={{ fontSize: '10px' }}>
                        PINNED CIRCULAR
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        {notice.title}
                      </h3>
                    </div>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{ background: 'var(--bg-subtle)', border: 'none', color: '#EF4444', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Delete Notice"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-sub)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {notice.content}
                  </p>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Published by {notice.author_name}</span>
                    <span>{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular Circulars */}
          {regularNotices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pinnedNotices.length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '8px' }}>
                  General Circulars & Announcements
                </div>
              )}

              {regularNotices.map(notice => (
                <div key={notice.id} className="squircle-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      {notice.title}
                    </h3>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{ background: 'var(--bg-subtle)', border: 'none', color: '#EF4444', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Delete Notice"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-sub)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {notice.content}
                  </p>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Published by {notice.author_name}</span>
                    <span>{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Create Notice Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-squircle" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span className="pill-badge pill-open" style={{ marginBottom: '4px' }}>RWA BROADCAST</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Publish Official Notice Circular</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Circular Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Annual Water Tank Cleaning Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Circular Content & Instructions *</label>
                <textarea 
                  className="form-textarea" 
                  rows={5}
                  placeholder="Enter the official details for society residents..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)' }}>
                <input 
                  type="checkbox"
                  id="important-check"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#D97706' }}
                />
                <label htmlFor="important-check" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Pin to top as an Important Notice & Broadcast Email
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber" style={{ flex: 2 }} disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
