import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  PlusCircle, 
  Sliders, 
  Mail, 
  LogOut, 
  Sun, 
  Moon, 
  ClipboardList,
  Megaphone,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenNewComplaint, 
  onOpenSettings, 
  onOpenOutbox,
  onOpenTour,
  theme,
  toggleTheme
}) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      background: 'var(--bg-surface)', 
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Estate Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('complaints')}>
            <div style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px var(--accent-amber-glow)' }}>
              <Building size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Gulmohar Meadows
                <span className="pill-badge pill-open" style={{ fontSize: '9px', padding: '1px 6px' }}>ESTATE CARE</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Co-op Housing Society</div>
            </div>
          </div>

          {/* Navigation Tabs (Tour Target #1) */}
          <nav id="tour-nav-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-capsule)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', background: activeTab === 'complaints' ? 'var(--text-main)' : 'transparent', color: activeTab === 'complaints' ? 'var(--bg-surface)' : 'var(--text-sub)' }}
              onClick={() => setActiveTab('complaints')}
            >
              <ClipboardList size={13} />
              <span>{isAdmin ? 'Estate Care Hub' : 'My Active Care'}</span>
            </button>

            <button 
              className={`btn btn-sm ${activeTab === 'notices' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', background: activeTab === 'notices' ? 'var(--text-main)' : 'transparent', color: activeTab === 'notices' ? 'var(--bg-surface)' : 'var(--text-sub)' }}
              onClick={() => setActiveTab('notices')}
            >
              <Megaphone size={13} />
              <span>Notice Board</span>
            </button>
          </nav>
        </div>

        {/* Action Controls & Demo Presenter Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Main Action */}
          {!isAdmin ? (
            <button id="tour-btn-request" className="btn btn-amber btn-sm" onClick={onOpenNewComplaint}>
              <PlusCircle size={14} />
              <span>Request Service</span>
            </button>
          ) : (
            <button id="tour-btn-request" className="btn btn-secondary btn-sm" onClick={onOpenSettings}>
              <Sliders size={13} />
              <span>SLA Limits</span>
            </button>
          )}

          {/* Prominent Demo Presenter Trigger Button */}
          <button 
            id="tour-btn-present-demo"
            className="btn btn-sm"
            onClick={onOpenTour}
            title="Start Interactive Walkthrough Presentation"
            style={{
              background: 'linear-gradient(135deg, #D97706, #B45309)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px var(--accent-amber-glow)',
              fontWeight: 800
            }}
          >
            <Sparkles size={13} />
            <span>Present App Demo</span>
          </button>

          {/* Email Outbox Inspector (Admin Only to protect resident privacy) */}
          {isAdmin && (
            <button 
              id="tour-btn-outbox"
              className="btn btn-secondary btn-sm" 
              onClick={onOpenOutbox} 
              title="Inspect Live Sent Email Stream"
              style={{ color: 'var(--accent-terracotta)', background: 'var(--accent-amber-light)', border: '1px solid var(--border-color)' }}
            >
              <Mail size={13} />
              <span>Email Stream</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px 10px' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* User Account Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-capsule)', border: '1px solid var(--border-color)', marginLeft: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.1 }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{user?.name?.split(' ')[0]}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {isAdmin ? 'Estate Manager' : (user?.flat_number || 'Resident')}
              </span>
            </div>
            <button 
              onClick={logout} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
