import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function EmailOutboxModal({ onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchOutbox = async () => {
    try {
      setLoading(true);
      const res = await api.getEmailOutbox();
      setEmails(res.data.outbox || []);
      if (res.data.outbox?.length > 0 && !selectedEmail) {
        setSelectedEmail(res.data.outbox[0]);
      }
    } catch (err) {
      console.error('Failed to fetch outbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-squircle modal-squircle-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pill-badge pill-open" style={{ fontSize: '10px' }}>
                LIVE EMAIL DISPATCH LOG
              </span>
              <span className="pill-badge pill-resolved" style={{ fontSize: '10px' }}>
                {emails.length} Messages Sent
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              Simulated & Live Email Outbox Inspector
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchOutbox} title="Refresh Outbox">
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {loading && emails.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading outbox dispatches...
          </div>
        ) : emails.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-squircle-sm)' }}>
            <Mail size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>No emails dispatched yet in this session.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Updating a complaint status or posting an Important Notice will trigger live email logs.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: '16px', minHeight: '380px', maxHeight: '55vh' }}>
            
            {/* Email List Sidebar */}
            <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border-color)', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div 
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-squircle-sm)',
                      background: isSelected ? 'var(--accent-amber-light)' : 'var(--bg-subtle)',
                      border: isSelected ? '1px solid #D97706' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span className="pill-badge pill-resolved" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        <CheckCircle2 size={10} /> SENT
                      </span>
                      <span>{formatDate(email.sent_at)}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      To: {email.to.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Email HTML Preview Pane */}
            <div style={{ overflowY: 'auto', background: '#FFFFFF', color: '#0F172A', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)', padding: '16px' }}>
              {selectedEmail ? (
                <div>
                  <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      <strong>To:</strong> {selectedEmail.to.join(', ')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      <strong>Sent:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                      {selectedEmail.subject}
                    </div>
                  </div>

                  {selectedEmail.html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                  ) : (
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                      {selectedEmail.text}
                    </pre>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
                  Select an email to inspect its rendered HTML template
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
