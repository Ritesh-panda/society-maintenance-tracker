import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AdminDashboard from './pages/AdminDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import NoticeBoardPage from './pages/NoticeBoardPage';
import ComplaintHistoryModal from './components/ComplaintHistoryModal';
import UpdateStatusModal from './components/UpdateStatusModal';
import NewComplaintModal from './components/NewComplaintModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import EmailOutboxModal from './components/EmailOutboxModal';
import AvatarTourGuide from './components/AvatarTourGuide';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'notices'
  const [theme, setTheme] = useState(localStorage.getItem('society_theme') || 'light');

  // Modals state
  const [historyComplaintId, setHistoryComplaintId] = useState(null);
  const [updatingComplaint, setUpdatingComplaint] = useState(null);
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOutbox, setShowOutbox] = useState(false);
  const [showAvatarTour, setShowAvatarTour] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); // Trigger reload

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('society_theme', theme);
  }, [theme]);

  // Prompt onboarding tour on first login for each distinct user
  useEffect(() => {
    if (user) {
      const userTourKey = `tour_viewed_${user.id}_${user.role}`;
      if (!sessionStorage.getItem(userTourKey)) {
        setShowAvatarTour(true);
        sessionStorage.setItem(userTourKey, 'true');
      }
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDataChange = () => {
    setDataVersion(v => v + 1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ marginBottom: '12px', color: '#D97706' }} />
          <p style={{ fontWeight: 700, fontSize: '14px' }}>Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // If user is registered but not yet approved by RWA Secretary
  if (user.is_approved === 0 && !isAdmin) {
    return <PendingApprovalPage />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Clean Frosted Header */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewComplaint={() => setShowNewComplaint(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenOutbox={() => setShowOutbox(true)}
        onOpenTour={() => setShowAvatarTour(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Editorial Canvas */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px 100px', flex: 1 }}>
        {activeTab === 'complaints' ? (
          isAdmin ? (
            <AdminDashboard 
              key={`admin_${dataVersion}`}
              onSelectComplaint={(c) => setHistoryComplaintId(c.id)}
              onOpenUpdateComplaint={(c) => setUpdatingComplaint(c)}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <ResidentDashboard 
              key={`res_${dataVersion}`}
              onSelectComplaint={(c) => setHistoryComplaintId(c.id)}
              onOpenNewComplaint={() => setShowNewComplaint(true)}
              onGoToNotices={() => setActiveTab('notices')}
            />
          )
        ) : (
          <NoticeBoardPage key={`notices_${dataVersion}`} />
        )}
      </main>

      {/* Interactive Avatar Onboarding Presenter */}
      <AvatarTourGuide 
        isOpen={showAvatarTour}
        onClose={() => setShowAvatarTour(false)}
        onOpenNewComplaint={() => { setShowAvatarTour(false); setShowNewComplaint(true); }}
        onNavigateTab={(tab) => { setShowAvatarTour(false); setActiveTab(tab); }}
      />

      {/* Modals */}
      {historyComplaintId && (
        <ComplaintHistoryModal 
          complaintId={historyComplaintId}
          onClose={() => setHistoryComplaintId(null)}
          onOpenUpdate={(c) => setUpdatingComplaint(c)}
          isAdmin={isAdmin}
        />
      )}

      {updatingComplaint && (
        <UpdateStatusModal 
          complaint={updatingComplaint}
          onClose={() => setUpdatingComplaint(null)}
          onUpdated={handleDataChange}
        />
      )}

      {showNewComplaint && (
        <NewComplaintModal 
          onClose={() => setShowNewComplaint(false)}
          onCreated={handleDataChange}
        />
      )}

      {showSettings && (
        <AdminSettingsModal 
          onClose={() => setShowSettings(false)}
          onUpdated={handleDataChange}
        />
      )}

      {showOutbox && (
        <EmailOutboxModal 
          onClose={() => setShowOutbox(false)}
        />
      )}

    </div>
  );
}
