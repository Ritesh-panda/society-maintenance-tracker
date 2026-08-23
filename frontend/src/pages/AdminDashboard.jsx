import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import { 
  ClipboardList, 
  Flame, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Sliders, 
  Layers, 
  RefreshCw, 
  X,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  User
} from 'lucide-react';
import { playHapticTick, playAppleChime } from '../utils/audio';

const CATEGORIES = [
  'All Categories',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Security',
  'Common Area',
  'Cleanliness',
  'Lift / Elevator',
  'Other'
];

export default function AdminDashboard({ onSelectComplaint, onOpenUpdateComplaint, onOpenSettings }) {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [pendingResidents, setPendingResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateError, setDateError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('"From Date" cannot be later than "To Date".');
      return;
    }
    setDateError('');

    try {
      setRefreshing(true);
      const [statsRes, complaintsRes, pendingRes] = await Promise.all([
        api.getDashboardStats(),
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter === 'All Categories' ? 'all' : categoryFilter,
          priority: priorityFilter,
          search: searchQuery,
          from_date: fromDate,
          to_date: toDate
        }),
        api.getPendingApprovals()
      ]);

      setStats(statsRes.data);
      setComplaints(complaintsRes.data.complaints || []);
      setPendingResidents(pendingRes.data?.pending_residents || []);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleApproveResident = async (id, name) => {
    playHapticTick();
    try {
      await api.approveUser(id);
      playAppleChime();
      setActionMessage(`✅ Approved apartment registration for ${name}. Verification email sent.`);
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to approve resident');
    }
  };

  const handleRejectResident = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reject and remove registration request for ${name}?`)) {
      return;
    }
    playHapticTick();
    try {
      await api.rejectUser(id);
      setActionMessage(`❌ Removed registration request for ${name}.`);
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reject resident');
    }
  };

  const clearFilters = () => {
    playHapticTick();
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setDateError('');
  };

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || searchQuery !== '' || fromDate !== '' || toDate !== '';

  return (
    <div>
      
      {/* Top Operations Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', padding: '2px 10px', borderRadius: 'var(--radius-capsule)', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
            <span>RWA OPERATIONS CONSOLE</span>
            <span>•</span>
            <span>Managing Committee Hub</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Maintenance & SLA Control
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { playHapticTick(); onOpenSettings(); }}>
            <Sliders size={14} color="#D97706" />
            <span>SLA Threshold ({stats?.summary?.overdue_threshold_days || 3}d)</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { playHapticTick(); loadData(); }} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: '12px 16px', background: 'var(--accent-amber-light)', color: 'var(--accent-terracotta)', borderRadius: 'var(--radius-squircle-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {dateError && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-squircle-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{dateError}</span>
        </div>
      )}

      {/* RWA Resident Verification Queue */}
      {pendingResidents.length > 0 && (
        <div className="squircle-card" style={{ marginBottom: '24px', borderLeft: '4px solid #D97706', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-amber-light)', color: '#D97706', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Resident Verification Queue ({pendingResidents.length} Pending)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  New signups awaiting committee authorization before accessing tickets and notices
                </p>
              </div>
            </div>
            <span className="pill-badge pill-open" style={{ fontSize: '10px' }}>
              ACTION REQUIRED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingResidents.map(resident => (
              <div 
                key={resident.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-squircle-sm)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>{resident.name}</span>
                    <span className="pill-badge pill-open" style={{ fontSize: '10px' }}>{resident.flat_number || 'Unit Not Specified'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {resident.email} {resident.phone && `• ${resident.phone}`} • Registered {new Date(resident.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-sm"
                    style={{ background: '#16A34A', color: '#FFFFFF', fontWeight: 800 }}
                    onClick={() => handleApproveResident(resident.id, resident.name)}
                  >
                    <UserCheck size={14} />
                    <span>✓ Approve & Activate</span>
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectResident(resident.id, resident.name)}
                  >
                    <UserX size={14} />
                    <span>✕ Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Tiles Strip (Tour Target: Admin KPIs) */}
      <div id="tour-admin-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Total */}
        <div className="squircle-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered</span>
            <ClipboardList size={18} color="var(--text-sub)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>{stats?.summary?.total ?? '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>All building units</div>
        </div>

        {/* SLA Overdue (Tour Target: SLA Overdue) */}
        <div className="squircle-card" style={{ padding: '20px', borderLeft: '4px solid #EF4444', background: stats?.summary?.overdue > 0 ? 'var(--bg-surface)' : 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>SLA Overdue</span>
            <Flame size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', marginTop: '8px' }}>{stats?.summary?.overdue ?? '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Exceeding {stats?.summary?.overdue_threshold_days || 3} days limit</div>
        </div>

        {/* Open */}
        <div className="squircle-card" style={{ padding: '20px', borderLeft: '4px solid #D97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>Awaiting Dispatch</span>
            <Hourglass size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginTop: '8px' }}>{stats?.summary?.open ?? '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Pending vendor assignment</div>
        </div>

        {/* In Progress */}
        <div className="squircle-card" style={{ padding: '20px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>In Progress</span>
            <Layers size={18} color="#2563EB" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563EB', marginTop: '8px' }}>{stats?.summary?.in_progress ?? '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Technician on site</div>
        </div>

        {/* Resolved */}
        <div className="squircle-card" style={{ padding: '20px', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>Resolved</span>
            <CheckCircle2 size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', marginTop: '8px' }}>{stats?.summary?.resolved ?? '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Closed & verified</div>
        </div>

      </div>

      {/* Category Breakdown (Tour Target: Admin Categories) */}
      {stats?.by_category && (
        <div id="tour-admin-categories" className="squircle-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#D97706" />
              Maintenance Category Distribution
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time estate breakdown</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {Object.entries(stats.by_category).map(([cat, count]) => {
              const pct = stats.summary?.total ? Math.round((count / stats.summary.total) * 100) : 0;
              return (
                <div key={cat} style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-squircle-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800 }}>
                    <span>{cat}</span>
                    <span style={{ color: '#D97706' }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '9999px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #D97706, #B45309)' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toolbar (Tour Target: Admin Filters) */}
      <div id="tour-admin-filters" className="squircle-card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            
            {/* Status */}
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Open">Received (Open)</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="overdue">SLA Overdue Only</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="High">Urgent</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="form-label">From Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
              />
            </div>

            {/* To Date */}
            <div>
              <label className="form-label">To Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
              />
            </div>

          </div>

          {/* Search Bar & Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                placeholder="Search ticket ID, resident name, flat number, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-amber">
              <Search size={14} />
              <span>Filter Results</span>
            </button>

            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Master Queue Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Master Estate Operations Queue
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {complaints.length} tickets • Unresolved overdue tickets are automatically prioritized at the top
          </span>
        </div>
      </div>

      {/* Grid of Complaints (Tour Target: Complaints Grid) */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading master operations queue...
        </div>
      ) : complaints.length === 0 ? (
        <div className="squircle-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>No matching tickets found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>All resident requests have been addressed or match query criteria.</p>
        </div>
      ) : (
        <div id="tour-complaints-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {complaints.map(complaint => (
            <ComplaintCard 
              key={complaint.id}
              complaint={complaint}
              isAdmin={true}
              onSelect={onSelectComplaint}
              onOpenUpdate={onOpenUpdateComplaint}
            />
          ))}
        </div>
      )}

    </div>
  );
}
