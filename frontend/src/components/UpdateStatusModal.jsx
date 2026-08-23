import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Send, AlertCircle, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { playAppleChime } from '../utils/audio';

export default function UpdateStatusModal({ complaint, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint?.status || 'Open');
  const [priority, setPriority] = useState(complaint?.priority || 'Medium');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.updateComplaintStatus(complaint.id, {
        status,
        priority,
        note: note.trim() || undefined
      });
      playAppleChime();
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-squircle" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <span className="pill-badge pill-open" style={{ marginBottom: '4px' }}>RWA COMMITTEE ACTION</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Update Complaint Status & Notes</h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Target summary */}
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--radius-squircle-sm)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ticket ID: #{complaint.id.replace('cmp_', 'CMP-')}</div>
          <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px', color: 'var(--text-main)' }}>{complaint.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px' }}>
            Unit: <strong>{complaint.resident_flat}</strong> ({complaint.resident_name})
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Status */}
            <div className="form-group">
              <label className="form-label">Update Status *</label>
              <select 
                className="form-select" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="Open">Open (Awaiting Action)</option>
                <option value="In Progress">In Progress (Technician Assigned)</option>
                <option value="Resolved">Resolved (Work Complete & Closed)</option>
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Urgency Priority *</label>
              <select 
                className="form-select" 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          {/* Action note */}
          <div className="form-group">
            <label className="form-label">RWA / Technician Action Note</label>
            <textarea 
              className="form-textarea" 
              rows={3} 
              placeholder="e.g., Plumber visited site. New pipe joint scheduled for installation tomorrow at 11 AM..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              This note will be logged in the permanent audit trail and emailed to the resident.
            </span>
          </div>

          {/* Email notice badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-squircle-sm)', fontSize: '12px', color: 'var(--text-main)', marginBottom: '18px' }}>
            <Mail size={15} color="#D97706" />
            <span>Automated status email will be sent to <strong>{complaint.resident_email}</strong>.</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-amber" disabled={submitting}>
              <Send size={14} />
              <span>{submitting ? 'Updating...' : 'Save & Dispatch Email'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
