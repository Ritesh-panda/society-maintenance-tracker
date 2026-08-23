import React from 'react';
import { Activity, Check } from 'lucide-react';

export default function HeroStatusRing({ 
  total, 
  resolved, 
  open, 
  inProgress,
  openCount = 0,
  inProgressCount = 0,
  resolvedCount = 0
}) {
  const activeOpen = open !== undefined ? open : openCount;
  const activeInProg = inProgress !== undefined ? inProgress : inProgressCount;
  const activeResolved = resolved !== undefined ? resolved : resolvedCount;
  const calcTotal = total !== undefined ? total : (activeOpen + activeInProg + activeResolved);

  const percent = calcTotal > 0 ? Math.round((activeResolved / calcTotal) * 100) : 100;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const hasActive = (activeOpen + activeInProg) > 0;
  const strokeColor = hasActive ? '#D97706' : '#16A34A';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      
      {/* Concentric Circle Graphic */}
      <div 
        style={{ 
          position: 'relative', 
          width: '120px', 
          height: '120px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg 
          viewBox="0 0 120 120" 
          style={{ 
            width: '120px', 
            height: '120px', 
            transform: 'rotate(-90deg)', 
            overflow: 'visible' 
          }}
        >
          <circle 
            cx="60" 
            cy="60" 
            r={radius} 
            fill="none" 
            stroke="var(--border-color)" 
            strokeWidth="10"
          />
          <circle 
            cx="60" 
            cy="60" 
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: strokeColor, lineHeight: 1 }}>
            {percent}%
          </span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
            Handled
          </span>
        </div>
      </div>

      {/* Narrative Status */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: hasActive ? 'var(--accent-amber-light)' : 'var(--state-resolved-bg)', color: hasActive ? 'var(--accent-terracotta)' : 'var(--state-resolved)', padding: '3px 10px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
          {hasActive ? (
            <>
              <Activity size={12} className="spin" />
              <span>Active Care Dispatched</span>
            </>
          ) : (
            <>
              <Check size={12} />
              <span>Your Home is Running Perfectly</span>
            </>
          )}
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {hasActive 
            ? `${activeOpen + activeInProg} active care request${(activeOpen + activeInProg) > 1 ? 's' : ''} being handled` 
            : 'All facilities & utilities in pristine condition'}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-sub)', flexWrap: 'wrap' }}>
          <div><strong style={{ color: 'var(--text-main)' }}>{activeResolved}</strong> Resolved</div>
          <span>•</span>
          <div><strong style={{ color: 'var(--accent-terracotta)' }}>{activeOpen + activeInProg}</strong> In Flight</div>
          <span>•</span>
          <div><strong style={{ color: '#16a34a' }}>{percent}%</strong> Peace of Mind</div>
        </div>
      </div>

    </div>
  );
}
