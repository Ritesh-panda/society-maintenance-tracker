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
    speech: "Welcome to Gulmohar Meadows! I am Aria, your personal Estate Concierge. This top navigation bar allows you to seamlessly switch between your active home maintenance requests and the official society notice board.",
    tip: "Click tabs anytime to toggle views instantly with zero page reloads.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-btn-request',
    title: "2. Zero-Type Care Request",
    badge: "Resident Demo: Lodge Issue",
    speech: "Whenever you encounter a maintenance problem, click 'Request Service'! Our visual interface features 3D room tiles (Bathroom, Kitchen, Balcony) and a 1-click Auto-Draft assistant that fills in technical details for you.",
    tip: "You can also pick 1-hour arrival slots and attach photo evidence.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-hero-ring',
    title: "3. Peace of Mind Health Ring",
    badge: "Resident Demo: Live Health",
    speech: "This concentric status ring gives you an instant live summary of your apartment and estate health. It pulses with an ambient amber glow during active dispatches and turns green when all tickets are resolved.",
    tip: "Displays real-time percentage ratios of resolved vs active repairs.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-complaints-grid',
    title: "4. 3-Stage Progress Stepper",
    badge: "Resident Demo: Delivery Tracker",
    speech: "Every complaint displays a live 3-stage progress stepper (1. Received → 2. Dispatched → 3. Handled). Click on any card to open the timeline drawer, view the live technician gate map, and inspect your digital NFC Gate Pass!",
    tip: "Any ticket open past the SLA threshold (3 days) is highlighted in red for urgent attention.",
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
    speech: "Click 'Email Stream' to inspect the live transactional email logs and see full rendered HTML previews of status updates and notices dispatched to residents in real time.",
    tip: "Inspect email delivery timestamps, recipient lists, and formatted templates.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-chatbot-launcher',
    title: "7. 24/7 AI Concierge Assistant",
    badge: "Resident Demo: AI Support",
    speech: "I am stationed right here at the bottom right corner! Tap my icon anytime to ask questions about plumbing leaks, electrical tripping, elevator AMC, or society bylaws.",
    tip: "I can also navigate the app and lodge complaints for you automatically.",
    placement: 'top'
  }
];

// Detailed Admin Executive Presentation Steps
const ADMIN_STEPS = [
  {
    targetId: 'tour-nav-tabs',
    title: "1. RWA Operations Console",
    badge: "Admin Demo: Overview",
    speech: "Welcome! I am Aria, presenting the RWA Estate Administration system for you. This console provides complete executive oversight over maintenance tickets, vendor dispatch, and resident communications.",
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
    tip: "Audits outgoing resident notifications and verification emails.",
    placement: 'bottom'
  },
  {
    targetId: 'tour-chatbot-launcher',
    title: "9. 24/7 AI Concierge Assistance",
    badge: "Admin Demo: AI Station",
    speech: "Our AI Concierge is available 24/7 on both the Login screen and admin dashboard to guide new residents, answer maintenance FAQs, and streamline operations.",
    tip: "Thank you for exploring Gulmohar Meadows! Click 'Finish Tour' anytime to explore freely.",
    placement: 'top'
  }
];

export default function AvatarTourGuide({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth();
  const steps = isAdmin ? ADMIN_STEPS : RESIDENT_STEPS;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);

  // Position calculation with smooth scroll and bounding box expansion
  const measureTarget = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
      }, 300);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      measureTarget(currentStep);
    }
  }, [isOpen, currentStep]);

  // Auto-play timer (7s per step)
  useEffect(() => {
    let timer;
    if (isOpen && autoPlay) {
      timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setAutoPlay(false);
            return prev;
          }
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isOpen, autoPlay, currentStep, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setAutoPlay(false);
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, pointerEvents: 'none' }}>
      
      {/* Dynamic Animated Spotlight Cutout */}
      {targetRect && (
        <div 
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            border: '2px solid #D97706',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'auto'
          }}
        />
      )}

      {/* Floating Tour Guide Dialog Card */}
      <div 
        style={{
          position: 'fixed',
          bottom: '36px',
          left: '36px',
          maxWidth: '460px',
          width: 'calc(100vw - 72px)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-squircle-md)',
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          padding: '24px',
          color: 'var(--text-main)',
          pointerEvents: 'auto',
          zIndex: 1150
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill-badge pill-open" style={{ fontSize: '10px' }}>
              {step.badge}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button 
            onClick={handleFinish} 
            style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            <X size={14} />
          </button>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {step.title}
        </h3>

        <p style={{ fontSize: '14px', color: 'var(--text-sub)', lineHeight: 1.55, marginBottom: '14px' }}>
          {step.speech}
        </p>

        {step.tip && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
            💡 <strong>Pro Tip:</strong> {step.tip}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setAutoPlay(!autoPlay)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {autoPlay ? <Pause size={12} /> : <Play size={12} />}
            <span>{autoPlay ? 'Pause Auto-Play' : '▶ Auto-Play'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handlePrev}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
            )}

            <button 
              className="btn btn-amber btn-sm"
              onClick={handleNext}
              style={{ fontSize: '12px', padding: '6px 16px' }}
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
