import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Flame, 
  User, 
  Calendar,
  Image as ImageIcon,
  Shield,
  Layers,
  FileText
} from 'lucide-react';
import { playAppleChime, playHapticTick } from '../utils/audio';

export default function ComplaintHistoryModal({ complaintId, onClose, onOpenUpdate, isAdmin }) {
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaintById(complaintId);
      setComplaint(res.data.complaint);
      setHistory(res.data.history || []);
      playAppleChime();
    } catch (err) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      fetchDetails();
    }
  }, [complaintId]);

  if (!complaintId) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-squircle modal-squircle-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', padding: '2px 10px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Complaint Timeline</span>
              <span>•</span>
              <span>#{complaintId.replace('cmp_', 'CMP-')}</span>
            </div>
            
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {complaint ? complaint.title : 'Loading complaint details...'}
            </h2>
          </div>

          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving complaint audit timeline...
          </div>
        ) : error ? (
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)' }}>
            {error}
          </div>
        ) : (
          <div>
            
            {/* Status Summary Bar */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-squircle-sm)', padding: '14px 18px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  {complaint.status === 'Open' && <span className="pill-badge pill-open">Open</span>}
                  {complaint.status === 'In Progress' && <span className="pill-badge pill-progress">In Progress</span>}
                  {complaint.status === 'Resolved' && <span className="pill-badge pill-resolved"><CheckCircle2 size={12} /> Resolved</span>}
                  {complaint.is_overdue && <span className="pill-badge pill-overdue"><Flame size={12} /> Overdue ({complaint.days_open}d)</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>REPORTED BY</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{complaint.resident_name} ({complaint.resident_flat})</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CATEGORY</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{complaint.category}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PRIORITY</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: complaint.priority === 'High' ? '#EF4444' : 'var(--text-main)', marginTop: '2px' }}>{complaint.priority}</div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '6px' }}>Reported Problem Details</div>
              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)' }}>
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo with Lightbox Zoom */}
            {complaint.photo_url && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '6px' }}>Photo Evidence Attachment</div>
                <div 
                  style={{ 
                    borderRadius: 'var(--radius-squircle-md)', 
                    overflow: 'hidden', 
                    height: zoomPhoto ? 'auto' : '150px', 
                    background: '#0F172A', 
                    position: 'relative', 
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)'
                  }}
                  onClick={() => setZoomPhoto(!zoomPhoto)}
                >
                  <img src={complaint.photo_url} alt="Evidence" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ImageIcon size={12} /> {zoomPhoto ? 'Click to collapse' : 'Click to zoom photo'}
                  </div>
                </div>
              </div>
            )}

            {/* Chronological Audit Trail Timeline */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '14px' }}>
                Full Lifecycle History & Audit Trail
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {history.map((event, idx) => (
                  <div 
                    key={event.id || idx}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      paddingLeft: '8px',
                      position: 'relative'
                    }}
                  >
                    {/* Vertical Connector Line */}
                    {idx < history.length - 1 && (
                      <div style={{ position: 'absolute', left: '15px', top: '24px', bottom: '-14px', width: '2px', background: 'var(--border-color)' }} />
                    )}

                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: event.new_status === 'Resolved' ? '#16A34A' : (event.new_status === 'In Progress' ? '#2563EB' : '#D97706'), marginTop: '4px', zIndex: 1, boxShadow: '0 0 0 4px var(--bg-surface)' }} />

                    <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-squircle-sm)', padding: '12px 16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                          {event.previous_status ? `${event.previous_status} → ${event.new_status}` : `Ticket Lodged (${event.new_status})`}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDate(event.created_at)}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Action by: <strong>{event.actor_name}</strong> ({event.actor_role === 'admin' ? 'Estate Committee' : 'Resident'})
                      </div>

                      {event.note && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-sub)', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          "{event.note}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              {isAdmin && (
                <button 
                  className="btn btn-amber btn-sm"
                  onClick={() => { onClose(); onOpenUpdate(complaint); }}
                >
                  Update Ticket Status
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Close Timeline
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
