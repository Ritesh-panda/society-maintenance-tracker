import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import HeroStatusRing from '../components/HeroStatusRing';
import { 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Building,
  Pin,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { playHapticTick, playAppleChime } from '../utils/audio';

export default function ResidentDashboard({ onSelectComplaint, onOpenNewComplaint, onGoToNotices }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [pinnedNotices, setPinnedNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusTab, setStatusTab] = useState('all');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [compRes, noticeRes] = await Promise.all([
        api.getComplaints(),
        api.getNotices()
      ]);

      setComplaints(compRes.data.complaints || []);
      const pinned = (noticeRes.data.notices || []).filter(n => n.is_important === 1);
      setPinnedNotices(pinned);
    } catch (err) {
      console.error('Failed to load resident data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (statusTab === 'all') return true;
    return c.status === statusTab;
  });

  const openCount = complaints.filter(c => c.status === 'Open').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div>
      
      {/* Editorial Apple Welcome Banner */}
      <div className="squircle-card" style={{ marginBottom: '24px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', padding: '2px 10px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
              <span>{user?.flat_number || 'Apartment Unit'}</span>
              <span>•</span>
              <span>Resident Care Portal</span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {getGreeting()}, {user?.name?.split(' ')[0]}.
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginTop: '4px', maxWidth: '520px' }}>
              Your home is running smoothly. Track active care requests, scheduled maintenance, and estate announcements.
            </p>
          </div>

          {/* Hero Concentric Ring (Tour Target #3) */}
          <div id="tour-hero-ring">
            <HeroStatusRing 
              openCount={openCount} 
              inProgressCount={inProgressCount} 
              resolvedCount={resolvedCount} 
            />
          </div>

        </div>
      </div>

      {/* Pinned Circulars Spotlight */}
      {pinnedNotices.length > 0 && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pinnedNotices.map(notice => (
            <div 
              key={notice.id} 
              className="squircle-card" 
              style={{ 
                padding: '16px 20px', 
                borderLeft: '4px solid #D97706', 
                background: 'var(--bg-surface)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer'
              }}
              onClick={onGoToNotices}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: 'var(--accent-amber-light)', color: '#D97706', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pin size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill-badge pill-open" style={{ fontSize: '9px', padding: '1px 6px' }}>OFFICIAL BROADCAST</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{notice.title}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {notice.content.slice(0, 95)}...
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#D97706', whiteSpace: 'nowrap' }}>
                <span>Read Circular</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section Header & Filter Capsule Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Active Service Requests
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredComplaints.length} of {complaints.length} requests for {user?.flat_number}
          </span>
        </div>

        {/* Filter Capsule Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-capsule)', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'Open', label: `Received (${openCount})` },
            { id: 'In Progress', label: `Dispatched (${inProgressCount})` },
            { id: 'Resolved', label: `Handled (${resolvedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { playHapticTick(); setStatusTab(tab.id); }}
              className="btn btn-sm"
              style={{
                border: 'none',
                background: statusTab === tab.id ? 'var(--text-main)' : 'transparent',
                color: statusTab === tab.id ? 'var(--bg-surface)' : 'var(--text-sub)',
                fontWeight: statusTab === tab.id ? 800 : 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid (Tour Target: Complaints Grid) */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your service tickets...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="squircle-card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>No active care requests</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)', maxWidth: '400px', margin: '0 auto 20px' }}>
            Everything in your apartment is in perfect condition. Click below if you need any repairs or assistance.
          </p>
          <button className="btn btn-amber" onClick={onOpenNewComplaint}>
            <PlusCircle size={14} />
            <span>Request Home Service</span>
          </button>
        </div>
      ) : (
        <div id="tour-complaints-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {filteredComplaints.map(complaint => (
            <ComplaintCard 
              key={complaint.id}
              complaint={complaint}
              isAdmin={false}
              onSelect={onSelectComplaint}
            />
          ))}
        </div>
      )}

    </div>
  );
}
