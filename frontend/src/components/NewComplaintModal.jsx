import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  X, 
  Upload, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Clock, 
  Star, 
  Check, 
  Camera, 
  Droplets, 
  Zap, 
  Hammer, 
  Shield, 
  Layers, 
  Hourglass,
  ArrowRight,
  UserCheck,
  Bath,
  UtensilsCrossed,
  Tv,
  Trees,
  DoorClosed,
  Building2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { playAppleChime } from '../utils/audio';

const ROOM_TILES = [
  { id: 'Bathroom', label: 'Bathroom', category: 'Plumbing', icon: Bath, color: '#0284C7', bg: '#E0F2FE', desc: 'Tap, shower, drain' },
  { id: 'Kitchen', label: 'Kitchen', category: 'Plumbing', icon: UtensilsCrossed, color: '#D97706', bg: '#FEF3C7', desc: 'Sink, pipeline, filter' },
  { id: 'Living', label: 'Living Room', category: 'Electrical', icon: Tv, color: '#4F46E5', bg: '#EEF2FF', desc: 'Lighting, fan, switch' },
  { id: 'Balcony', label: 'Balcony Area', category: 'Common Area', icon: Trees, color: '#059669', bg: '#D1FAE5', desc: 'Drainage, railing' },
  { id: 'Entrance', label: 'Main Entrance', category: 'Carpentry', icon: DoorClosed, color: '#B45309', bg: '#FFEDD5', desc: 'Locks, latch, hinges' },
  { id: 'Elevator', label: 'Lift Lobby', category: 'Lift / Elevator', icon: Building2, color: '#E11D48', bg: '#FFE4E6', desc: 'Lift door, buttons' },
];

const TIME_SLOTS = [
  { id: 'slot1', label: 'Today, 10:00 AM - 11:00 AM', tag: 'Fastest Slot' },
  { id: 'slot2', label: 'Today, 02:00 PM - 03:00 PM', tag: 'Standard' },
  { id: 'slot3', label: 'Tomorrow, 11:00 AM - 12:00 PM', tag: 'Available' }
];

export default function NewComplaintModal({ onClose, onCreated }) {
  const { user } = useAuth();
  
  const [selectedRoom, setSelectedRoom] = useState('Bathroom');
  const [category, setCategory] = useState('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedSlot, setSelectedSlot] = useState('slot1');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDrafted, setAiDrafted] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room.id);
    setCategory(room.category);
    if (!title) {
      setTitle(`${room.label} maintenance issue`);
    }
  };

  const handleAiAutoDraft = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalyzing(false);
      setAiDrafted(true);
      if (selectedRoom === 'Bathroom') {
        setTitle('Bathroom shower mixer valve leakage');
        setDescription('Auto-Draft: Constant water seepage detected from secondary bathroom mixer cartridge. Requires cartridge replacement and silicone resealing.');
        setPriority('High');
      } else if (selectedRoom === 'Kitchen') {
        setTitle('Under-sink water inlet pipeline dripping');
        setDescription('Auto-Draft: Slow persistent water accumulation below kitchen sink cabinet. Requires washer inspection and threaded joint tightening.');
        setPriority('Medium');
      } else if (selectedRoom === 'Living') {
        setTitle('Living room main ceiling fan regulator tripping');
        setDescription('Auto-Draft: Fan regulator sparking and tripping inverter line on speed setting 4. Requires module replacement.');
        setPriority('Medium');
      } else if (selectedRoom === 'Elevator') {
        setTitle('Passenger Lift #2 stopping with floor misalignment');
        setDescription('Auto-Draft: Lift cabin stopping 2 inches above floor level with intermittent shudder. Requires Otis engineer leveling calibration.');
        setPriority('High');
      } else {
        setTitle(`${selectedRoom} repair and inspection`);
        setDescription(`Auto-Draft: General repair and maintenance required in the ${selectedRoom} area.`);
      }
    }, 450);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size exceeds 5MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a brief title for the issue.');
      return;
    }
    if (description.trim().length < 5) {
      setError('Please describe the problem (at least 5 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      await api.createComplaint(formData);
      playAppleChime();
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to lodge complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-squircle modal-squircle-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span className="pill-badge pill-open" style={{ marginBottom: '4px' }}>RESIDENT SERVICE DISPATCH</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Request Home Maintenance
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Visual Room Selector (Zero-Type UX) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>1. Select Location in Home</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap to diagnose</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {ROOM_TILES.map(room => {
                const isSelected = selectedRoom === room.id;
                const IconComponent = room.icon;
                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    style={{
                      background: isSelected ? room.bg : 'var(--bg-subtle)',
                      border: isSelected ? `2px solid ${room.color}` : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-squircle-sm)',
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition)',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <div style={{ color: isSelected ? room.color : 'var(--text-sub)' }}>
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{room.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{room.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Smart Diagnostic Assistant */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-squircle-sm)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#D97706" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Smart Diagnostic Assistant</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAiAutoDraft}
                disabled={aiAnalyzing}
                style={{ fontSize: '11px', padding: '4px 10px', color: '#D97706', borderColor: '#FDE68A' }}
              >
                <Sparkles size={12} />
                <span>{aiAnalyzing ? 'Diagnosing...' : 'Auto-Draft Diagnostic'}</span>
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Automatically fills technical fault details and recommended priority based on selected room.
            </div>
          </div>

          {/* 3. Title & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Subject / Issue Summary *</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Bathroom shower mixer valve leakage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Detailed Problem Description *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe the issue, symptoms, or location in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 4. Priority & Arrival Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Urgency Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'Low', label: 'Low', color: '#10B981', bg: '#D1FAE5' },
                  { id: 'Medium', label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
                  { id: 'High', label: 'Urgent', color: '#EF4444', bg: '#FEE2E2' }
                ].map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    style={{
                      background: priority === p.id ? p.bg : 'var(--bg-subtle)',
                      border: priority === p.id ? `2px solid ${p.color}` : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-squircle-sm)',
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: priority === p.id ? p.color : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrival Slot */}
            <div>
              <label className="form-label">Preferred Arrival Window</label>
              <select className="form-select" value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                {TIME_SLOTS.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({s.tag})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Photo Upload */}
          <div>
            <label className="form-label">Attach Photo Evidence (Optional, Max 5MB)</label>
            {previewUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-squircle-sm)', overflow: 'hidden', height: '140px', border: '1px solid var(--border-color)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-squircle-sm)',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <Camera size={24} color="#D97706" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Click to snap or upload photo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG or WebP up to 5MB</div>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-amber btn-lg" 
              style={{ flex: 2 }} 
              disabled={submitting}
            >
              <span>{submitting ? 'Lodging Service Request...' : 'Send to Management'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
