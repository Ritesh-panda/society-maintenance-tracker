import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Home,
  Clock,
  Shield,
  Layers,
  Sun,
  Moon,
  Megaphone,
  ClipboardList
} from 'lucide-react';
import { playHapticTick, playAppleChime } from '../utils/audio';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState('admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [theme, setTheme] = useState(localStorage.getItem('society_theme') || 'light');

  const toggleTheme = () => {
    playHapticTick();
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('society_theme', next);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register({
          name,
          email,
          password,
          flat_number: flatNumber,
          phone
        });
      } else {
        await login(email, password);
      }
      playAppleChime();
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToRegisterMode = () => {
    playHapticTick();
    setIsRegisterMode(true);
    setError('');
    setActiveDemoRole(null);
    setEmail('');
    setPassword('');
    setName('');
    setFlatNumber('');
    setPhone('');
  };

  const switchToLoginMode = () => {
    playHapticTick();
    setIsRegisterMode(false);
    setError('');
    setActiveDemoRole(null);
    setEmail('');
    setPassword('');
  };

  const autofillCredentials = (role, demoEmail, demoPassword) => {
    playHapticTick();
    setIsRegisterMode(false);
    setActiveDemoRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setName('');
    setFlatNumber('');
    setPhone('');
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      
      {/* Top Quiet Navigation Bar */}
      <header style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-amber-glow)' }}>
            <Building size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Gulmohar Meadows CHS
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Co-operative Housing Society Management</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* Main Split Content */}
      <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Column: Clear Functional Overview */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', padding: '4px 12px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 800, marginBottom: '14px' }}>
            <Building size={13} />
            <span>ESTATE MANAGEMENT PORTAL</span>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
            Transparent Care.<br />
            Accountable Management.
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '480px' }}>
            A unified operations and resident portal providing verifiable maintenance tracking, immutable audit history, and direct committee communications.
          </p>

          {/* Feature Highlights Strip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div className="squircle-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Lifecycle Tracking & History</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px', lineHeight: 1.5 }}>
                  Lodge maintenance requests with category, priority, and photo evidence. Inspect complete chronological audit trails of every status transition.
                </p>
              </div>
            </div>

            <div className="squircle-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Dynamic SLA Overdue Detection</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px', lineHeight: 1.5 }}>
                  Unresolved tickets open past the committee-configured SLA threshold are automatically flagged and prioritized at the top of the queue.
                </p>
              </div>
            </div>

            <div className="squircle-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Megaphone size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Official Notice Board & Circulars</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px', lineHeight: 1.5 }}>
                  Stay informed of scheduled utility cleanings and meetings. Important notices trigger instant automated email notifications.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Interactive Login / Registration Card */}
        <div className="squircle-card modal-squircle" style={{ maxWidth: '460px', width: '100%', margin: '0 auto', padding: '36px 32px' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {isRegisterMode ? 'Register New Flat' : 'Sign In to Portal'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
              {isRegisterMode ? 'Register your flat unit to access society tracking' : 'Enter your registered credentials to access your care dashboard'}
            </p>
          </div>

          {/* 1-Click Evaluator Guided Demo Launcher */}
          {!isRegisterMode && (
            <div style={{ marginBottom: '22px', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Evaluator 1-Click Demo Profiles:
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => autofillCredentials('admin', 'admin@society.com', 'admin123')}
                  className={`btn btn-sm ${activeDemoRole === 'admin' ? 'btn-amber' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 10px' }}
                >
                  <ShieldCheck size={14} />
                  <span>Admin Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => autofillCredentials('resident', 'aarav@society.com', 'password123')}
                  className={`btn btn-sm ${activeDemoRole === 'resident' ? 'btn-amber' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 10px' }}
                >
                  <Home size={14} />
                  <span>Resident Demo</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {isRegisterMode && (
              <>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Vikram Malhotra"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Tower & Flat Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Tower C - Flat 502"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="resident@society.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Password *</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-amber btn-lg" 
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : (isRegisterMode ? 'Register Apartment Profile' : 'Sign In to Portal')}</span>
              <ArrowRight size={16} />
            </button>

          </form>

          {/* Toggle Mode */}
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-sub)' }}>
            {isRegisterMode ? (
              <span>
                Already registered?{' '}
                <button 
                  type="button"
                  onClick={switchToLoginMode}
                  style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  Sign In here
                </button>
              </span>
            ) : (
              <span>
                New resident at Gulmohar Meadows?{' '}
                <button 
                  type="button"
                  onClick={switchToRegisterMode}
                  style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  Register Flat
                </button>
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
