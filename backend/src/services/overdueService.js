import db from '../config/db.js';

/**
 * Get current configured overdue threshold in days
 */
export function getOverdueThresholdDays() {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'overdue_days_threshold'`).get();
  return row ? parseInt(row.value, 10) : 3;
}

/**
 * Decorate a complaint object with overdue metadata
 */
export function enrichWithOverdueStatus(complaint, thresholdDays = null) {
  if (!complaint) return null;
  const threshold = thresholdDays !== null ? thresholdDays : getOverdueThresholdDays();
  
  const createdAtTime = new Date(complaint.created_at).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - createdAtTime) / (1000 * 60 * 60 * 24));

  const isResolved = complaint.status === 'Resolved';
  const isOverdue = !isResolved && diffDays >= threshold;

  return {
    ...complaint,
    days_open: diffDays,
    is_overdue: isOverdue,
    overdue_threshold: threshold
  };
}

/**
 * Enrich an array of complaints and sort them with overdue items at the top
 */
export function enrichAndSortComplaints(complaints) {
  const threshold = getOverdueThresholdDays();
  const enriched = complaints.map(c => enrichWithOverdueStatus(c, threshold));
  
  // Sort: Overdue items first, then High priority, then newer created_at
  return enriched.sort((a, b) => {
    // 1. Overdue first
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;

    // 2. Unresolved before Resolved
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;

    // 3. Priority weight (High > Medium > Low)
    const priorityWeights = { High: 3, Medium: 2, Low: 1 };
    const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    if (pDiff !== 0) return pDiff;

    // 4. Date descending
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
