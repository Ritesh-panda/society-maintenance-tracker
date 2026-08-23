import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  LogOut, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { playHapticTick, playAppleChime } from '../utils/audio';
import { api } from '../services/api';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckStatus = async () => {
    playHapticTick();
    setChecking(true);
    setMessage('');
    try {
      const res = await api.getMe();
      if (res.data?.user?.is_approved === 1) {
        playAppleChime();
        window.location.reload();
      } else {
        setMessage('Your registration is still under review by the RWA Secretary. Please check back shortly.');
      }
    } catch (err) {
      setMessage('Failed to check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg-page)' }}>
      
      <div className="squircle-card modal-squircle-lg" style={{ maxWidth: '580px', width: '100%', padding: '36px', textAlign: 'center', background: 'var(--bg-surface)' }}>
        
        {/* Verification Icon Header */}
        <div 
          style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', 
            color: '#FFFFFF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px',
            boxShadow: '0 12px 24px var(--accent-amber-glow)'
          }}
        >
          <ShieldCheck size={36} />
        </div>

        <span className="pill-badge pill-open" style={{ fontSize: '11px', padding: '3px 10px', marginBottom: '10px' }}>
          APARTMENT VERIFICATION IN PROGRESS
        </span>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '6px', marginBottom: '10px' }}>
          Welcome, {user?.name}!
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '22px' }}>
          Your registration for <strong>{user?.flat_number || 'your apartment unit'}</strong> has been submitted to the RWA Managing Committee.
        </p>

        {/* Security Info Card */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-squircle-sm)', padding: '18px', textAlign: 'left', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 800, fontSize: '13px' }}>
            <Lock size={15} color="#D97706" />
            <span>Why is verification required?</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: 1.5 }}>
            To safeguard society privacy and prevent unauthorized profile creation, the Estate Committee verifies every new resident against society flat occupancy records before granting full portal access.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: '#166534', fontWeight: 700 }}>
            <Clock size={14} />
            <span>Estimated Turnaround: Under 4 Hours</span>
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', color: 'var(--text-main)', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            {message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-amber btn-lg"
            onClick={handleCheckStatus}
            disabled={checking}
          >
            <RefreshCw size={15} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>

          <button 
            className="btn btn-secondary btn-lg"
            onClick={logout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Security Helpdesk */}
        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
          Need urgent access? Contact Society Security Desk at Gate 2 or reach out to <strong>admin@society.com</strong>.
        </div>

      </div>

    </div>
  );
}
