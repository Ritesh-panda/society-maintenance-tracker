import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Play, 
  Pause,
  CheckCircle2,
  Sliders,
  Mail,
  Megaphone,
  Layers,
  Flame,
  Clock
} from 'lucide-react';
import { playAppleChime } from '../utils/audio';

// Detailed Resident Presentation Steps
const RESIDENT_STEPS = [
  {
    targetId: 'tour-nav-tabs',
    title: "1. Navigation Bar & Views",
    badge: "Resident Demo: Navigation",
    speech: "Welcome to Gulmohar Meadows! This top navigation bar allows you to seamlessly switch between your active home maintenance requests and the official society notice board.",
    tip: "Click tabs anytime to toggle views instantly with zero page reloads.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-btn-request',
    title: "2. Visual Care Request",
    badge: "Resident Demo: Lodge Issue",
    speech: "Whenever you encounter a maintenance problem, click 'Request Service'! Our visual interface features room tiles (Bathroom, Kitchen, Balcony) and an Auto-Draft assistant that fills in technical details for you.",
    tip: "You can also pick preferred arrival slots and attach photo evidence.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-hero-ring',
    title: "3. Real-Time Status Ring",
    badge: "Resident Demo: Live Status",
    speech: "This concentric status ring gives you an instant summary of your apartment and estate health. It reflects the status of your active requests and updates when tickets are resolved.",
    tip: "Displays real-time percentage ratios of resolved vs active repairs.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-complaints-grid',
    title: "4. 3-Stage Lifecycle Stepper",
    badge: "Resident Demo: Status Tracker",
    speech: "Every complaint displays a live 3-stage progress stepper (1. Received → 2. Dispatched → 3. Handled). Click on any card to open the complete chronological timeline and audit trail.",
    tip: "Any ticket open past the SLA threshold (3 days) is flagged for urgent attention.",
    placement: 'top'
  },
  {
    targetId: 'tour-nav-tabs',
    title: "5. Digital Notice Board",
    badge: "Resident Demo: Circulars",
    speech: "Click the 'Notice Board' tab to view official RWA announcements like water tank cleanings, power maintenance, and AGM meetings. Pinned circulars send instant email alerts directly to your inbox.",
    tip: "Keeps all residents informed of important estate operations.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-btn-outbox',
    title: "6. Email Stream Inspector",
    badge: "Resident Demo: Live Outbox",
    speech: "Click 'Email Stream' to inspect transactional email logs and see full rendered HTML previews of status updates and notices dispatched in real time.",
    tip: "Inspect email delivery timestamps, recipient lists, and formatted templates.",
    placement: 'bottom'
  }
];

// Detailed Admin Executive Presentation Steps
const ADMIN_STEPS = [
  {
    targetId: 'tour-nav-tabs',
    title: "1. RWA Operations Console",
    badge: "Admin Demo: Overview",
    speech: "Welcome to the RWA Estate Administration system. This console provides complete executive oversight over maintenance tickets, vendor dispatch, and resident communications.",
    tip: "Toggle between the live estate queue and the digital notice board.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-admin-kpis',
    title: "2. Real-Time KPI Control Strip",
    badge: "Admin Demo: Operational Pulse",
    speech: "These live metric cards give management an instant pulse across Total Registered issues, Open unassigned tickets, In-Progress staff work, and Resolved repairs.",
    tip: "Provides instant quantitative metrics across all apartment towers.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-admin-kpis',
    title: "3. Red SLA Overdue Alert",
    badge: "Admin Demo: SLA Breach",
    speech: "Notice the red 'SLA Overdue' counter! Under society bylaws, any ticket open longer than the configured threshold (default: 3 days) is automatically flagged and highlighted in red.",
    tip: "Prevents unresolved maintenance requests from aging unaddressed.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-admin-categories',
    title: "4. Maintenance Distribution Analytics",
    badge: "Admin Demo: Analytics",
    speech: "These interactive visual bars breakdown workload across Plumbing, Electrical, Lift AMC, Carpentry, Security, and Housekeeping.",
    tip: "Enables smart resource allocation and staff roster planning.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-admin-filters',
    title: "5. Multi-Criteria SQL Search Toolbar",
    badge: "Admin Demo: Advanced Search",
    speech: "Search by ticket ID, resident name, tower/flat, or date ranges. Combine multi-parameter filters to pinpoint specific maintenance issues instantly.",
    tip: "Sanitized prepared statements prevent SQL injection vulnerabilities.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-complaints-grid',
    title: "6. Master Operations Queue",
    badge: "Admin Demo: Queue Action",
    speech: "Manage tickets directly from the queue. Click 'Update' on any card to change status (Open → In Progress → Resolved), adjust priority, and add official audit remarks.",
    tip: "Status changes automatically dispatch instant email confirmations to residents.",
    placement: 'top'
  },
  {
    targetId: 'tour-btn-request',
    title: "7. Dynamic SLA Threshold Configuration",
    badge: "Admin Demo: Dynamic Rules",
    speech: "Click 'SLA Limits' to configure overdue thresholds between 1 and 60 days on the fly! The system updates all active ticket calculations immediately without server restarts.",
    tip: "Adapts to festival weekends or emergency maintenance policies.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-btn-outbox',
    title: "8. Live Outbox & SMTP Inspector",
    badge: "Admin Demo: Communication Log",
    speech: "Click 'Email Stream' in the navbar to inspect all delivered transactional emails, check recipient lists, and view full rendered HTML templates in real time.",
    tip: "Thank you for exploring Gulmohar Meadows! Click 'Finish Tour' to explore freely.",
    placement: 'bottom'
  }
];

export default function AvatarTourGuide({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth();
  const steps = isAdmin ? ADMIN_STEPS : RESIDENT_STEPS;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsAutoPlay(false);
      playAppleChime();
    } else {
      // Clean up highlights
      document.querySelectorAll('.tour-active-highlight').forEach(el => {
        el.classList.remove('tour-active-highlight');
      });
    }
  }, [isOpen]);

  // Clean and apply active highlight directly on DOM element
  useEffect(() => {
    if (!isOpen) return;

    // Remove previous highlights
    document.querySelectorAll('.tour-active-highlight').forEach(el => {
      el.classList.remove('tour-active-highlight');
    });

    const step = steps[currentStep];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.classList.add('tour-active-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (el) el.classList.remove('tour-active-highlight');
    };
  }, [isOpen, currentStep, steps]);

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isOpen && isAutoPlay) {
      timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsAutoPlay(false);
            return prev;
          }
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isAutoPlay, steps.length]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      
      {/* Tour Card Modal - Clean, floating, non-intrusive */}
      <div 
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          maxWidth: '440px',
          width: 'calc(100vw - 64px)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-squircle-md)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          zIndex: 10001,
          pointerEvents: 'auto',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill-badge pill-open" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              {step.badge}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Title & Speech */}
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          {step.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '14px' }}>
          {step.speech}
        </p>

        {/* Tip Box */}
        {step.tip && (
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-squircle-sm)', padding: '10px 12px', fontSize: '12px', color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <span>💡</span>
            <span><strong>Pro Tip:</strong> {step.tip}</span>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {isAutoPlay ? <Pause size={12} /> : <Play size={12} />}
            <span>{isAutoPlay ? 'Pause' : 'Auto-Play'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isFirst && (
              <button 
                onClick={handlePrev}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
            )}

            <button 
              onClick={handleNext}
              className="btn btn-amber btn-sm"
              style={{ fontSize: '12px', padding: '6px 16px' }}
            >
              <span>{isLast ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
