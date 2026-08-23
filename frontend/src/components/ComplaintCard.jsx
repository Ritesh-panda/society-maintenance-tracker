import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  ChevronRight, 
  Droplets, 
  Zap, 
  Hammer, 
  Shield, 
  Layers, 
  Sparkles, 
  Hourglass, 
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';

const categoryConfig = {
  'Plumbing': { label: 'Plumbing', icon: Droplets, color: '#D97706' },
  'Electrical': { label: 'Electrical', icon: Zap, color: '#D97706' },
  'Carpentry': { label: 'Carpentry', icon: Hammer, color: '#B45309' },
  'Security': { label: 'Security', icon: Shield, color: '#1E40AF' },
  'Common Area': { label: 'Amenities', icon: Layers, color: '#0D9488' },
  'Cleanliness': { label: 'Housekeeping', icon: Sparkles, color: '#059669' },
  'Lift / Elevator': { label: 'Elevator', icon: Hourglass, color: '#BE123C' },
  'Other': { label: 'General', icon: HelpCircle, color: '#6B7280' }
};

export default function ComplaintCard({ complaint, onSelect, onOpenUpdate, isAdmin }) {
  const cat = categoryConfig[complaint.category] || categoryConfig['Other'];
  const CatIcon = cat.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleCardClick = () => {
    onSelect(complaint);
  };

  return (
    <div 
      className="squircle-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative',
        cursor: 'pointer',
        borderLeft: complaint.is_overdue 
          ? '4px solid #EF4444' 
          : (complaint.status === 'Resolved' ? '4px solid #16A34A' : (complaint.status === 'In Progress' ? '4px solid #2563EB' : '4px solid #D97706'))
      }}
      onClick={handleCardClick}
    >
      <div>
        
        {/* Top Status & Category Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 7px', borderRadius: 'var(--radius-capsule)' }}>
              #{complaint.id.replace('cmp_', 'CMP-')}
            </span>

            {complaint.status === 'Open' && (
              <span className="pill-badge pill-open">Awaiting Dispatch</span>
            )}
            {complaint.status === 'In Progress' && (
              <span className="pill-badge pill-progress">In Progress</span>
            )}
            {complaint.status === 'Resolved' && (
              <span className="pill-badge pill-resolved"><CheckCircle2 size={11} /> Handled</span>
            )}

            {complaint.is_overdue && (
              <span className="pill-badge pill-overdue">
                <Flame size={11} /> SLA Overdue ({complaint.days_open}d)
              </span>
            )}
          </div>

          <span style={{ fontSize: '11px', fontWeight: 700, color: cat.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CatIcon size={12} />
            {cat.label}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '6px' }}>
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {complaint.description}
        </p>

        {/* Responsive Progress Indicator Bar */}
        <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-squircle-sm)', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
          <div className="progress-stepper">
            
            {/* Step 1: Received */}
            <div className="stepper-node" style={{ color: '#16A34A' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
              <span>1. Received</span>
            </div>

            <div className={`stepper-line ${complaint.status !== 'Open' ? (complaint.status === 'Resolved' ? 'completed' : 'active') : ''}`} />

            {/* Step 2: Dispatched */}
            <div className="stepper-node" style={{ color: complaint.status !== 'Open' ? 'var(--text-main)' : 'var(--text-muted)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: complaint.status === 'Resolved' ? '#16A34A' : (complaint.status === 'In Progress' ? '#2563EB' : 'var(--border-strong)') }} />
              <span>2. Dispatched</span>
            </div>

            <div className={`stepper-line ${complaint.status === 'Resolved' ? 'completed' : ''}`} />

            {/* Step 3: Handled */}
            <div className="stepper-node" style={{ color: complaint.status === 'Resolved' ? '#16A34A' : 'var(--text-muted)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: complaint.status === 'Resolved' ? '#16A34A' : 'var(--border-strong)' }} />
              <span>3. Handled</span>
            </div>

          </div>
        </div>

        {/* Attached Photo Thumbnail */}
        {complaint.photo_url && (
          <div style={{ marginBottom: '14px', borderRadius: 'var(--radius-squircle-sm)', overflow: 'hidden', height: '85px', background: '#0F172A', position: 'relative' }}>
            <img 
              src={complaint.photo_url} 
              alt="Evidence" 
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', height: '85px', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ImageIcon size={10} /> Photo Evidence
            </div>
          </div>
        )}

      </div>

      {/* Footer info & action */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
        <div>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{complaint.resident_flat}</span>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(complaint.created_at)}</div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleCardClick}
          >
            <span>Timeline</span>
            <ChevronRight size={13} />
          </button>

          {isAdmin && (
            <button 
              className="btn btn-amber btn-sm"
              onClick={() => onOpenUpdate(complaint)}
            >
              <span>Update</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
