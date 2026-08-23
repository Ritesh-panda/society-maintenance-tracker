import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Sliders, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { playAppleChime } from '../utils/audio';

export default function AdminSettingsModal({ onClose, onUpdated }) {
  const [days, setDays] = useState(3);
  const [openComplaints, setOpenComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const [settingsRes, complaintsRes] = await Promise.all([
          api.getSettings(),
          api.getComplaints()
        ]);
        if (settingsRes.data.settings?.overdue_days_threshold) {
          setDays(parseInt(settingsRes.data.settings.overdue_days_threshold, 10));
        }
        const openOnly = (complaintsRes.data?.complaints || []).filter(c => c.status !== 'Resolved');
        setOpenComplaints(openOnly);
      } catch (err) {
        setError('Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const previewOverdueCount = openComplaints.filter(c => {
    const createdTime = new Date(c.created_at).getTime();
    const daysOpen = Math.floor((Date.now() - createdTime) / 86400000);
    return daysOpen >= days;
  }).length;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.updateOverdueThreshold(days);
      playAppleChime();
      setMessage(`Overdue threshold updated to ${days} days.`);
      onUpdated();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to update threshold');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-squircle" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <span className="pill-badge pill-overdue" style={{ marginBottom: '4px' }}>ADMIN CONFIGURATION</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#D97706" />
              SLA & Overdue Detection Settings
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{ padding: '10px 14px', background: '#F0FDF4', color: '#166534', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-squircle-sm)', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="#D97706" />
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Overdue Age Threshold (Days)</strong>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: '14px' }}>
              Any unresolved complaint (status <code>Open</code> or <code>In Progress</code>) that has remained unaddressed for longer than this number of days will automatically be flagged as <span className="pill-badge pill-overdue" style={{ fontSize: '10px' }}>OVERDUE</span> and bubble up to the very top of the admin view.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="number" 
                min="1" 
                max="60" 
                className="form-input" 
                style={{ width: '100px', fontSize: '16px', fontWeight: 800 }}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                required
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-sub)' }}>days open before overdue</span>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
              {[2, 3, 5, 7, 10].map(preset => (
                <button 
                  key={preset}
                  type="button"
                  className={`btn btn-sm ${days === preset ? 'btn-amber' : 'btn-secondary'}`}
                  onClick={() => setDays(preset)}
                >
                  {preset} Days
                </button>
              ))}
            </div>

            {/* Live Impact Preview */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-sub)' }}>
              <strong>Live Impact Preview:</strong> At {days} days, <strong style={{ color: previewOverdueCount > 0 ? '#EF4444' : '#16A34A' }}>{previewOverdueCount}</strong> currently open complaints will be flagged as overdue.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-amber" disabled={saving || loading}>
              <span>{saving ? 'Saving...' : 'Apply Threshold'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
