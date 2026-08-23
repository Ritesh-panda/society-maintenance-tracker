const API_BASE = '/api/v1';

/**
 * Generic request helper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('society_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth & User Management
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getMe: () => request('/auth/me'),
  getPendingApprovals: () => request('/auth/pending-approvals'),
  approveUser: (id) => request(`/auth/users/${id}/approve`, { method: 'PATCH' }),
  rejectUser: (id) => request(`/auth/users/${id}/reject`, { method: 'DELETE' }),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/complaints${queryString}`);
  },

  getComplaintById: (id) => request(`/complaints/${id}`),

  createComplaint: (formData) => request('/complaints', {
    method: 'POST',
    body: formData // FormData handles multipart boundary automatically
  }),

  updateComplaintStatus: (id, payload) => request(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getDashboardStats: () => request('/complaints/dashboard/stats'),

  // Notices
  getNotices: () => request('/notices'),
  createNotice: (payload) => request('/notices', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteNotice: (id) => request(`/notices/${id}`, {
    method: 'DELETE'
  }),

  // Settings & Evaluation
  getSettings: () => request('/settings'),
  updateOverdueThreshold: (days) => request('/settings/overdue-threshold', {
    method: 'PATCH',
    body: JSON.stringify({ days })
  }),
  getEmailOutbox: () => request('/settings/email-outbox')
};
