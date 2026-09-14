const rawBase = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5050/api' : 'https://expenset-api.onrender.com/api');
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('expenset_token');
  const headers = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error (${response.status}): ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  verify2FA: (data) => fetchAPI('/auth/verify-2fa', { method: 'POST', body: JSON.stringify(data) }),
  register: (userData) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => fetchAPI('/auth/me'),
  getPinStatus: () => fetchAPI('/auth/pin-status'),
  verifyPin: (pin) => fetchAPI('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  setPin: (data) => fetchAPI('/auth/set-pin', { method: 'POST', body: JSON.stringify(data) }),

  // Services
  getServices: () => fetchAPI('/services'),
  createService: (data) => fetchAPI('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => fetchAPI(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => fetchAPI(`/services/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => fetchAPI('/categories'),
  createCategory: (data) => fetchAPI('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => fetchAPI(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => fetchAPI(`/categories/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),

  getDeals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/deals${query ? `?${query}` : ''}`);
  },
  getDeal: (id) => fetchAPI(`/deals/${id}`),
  getDealHistory: (id) => fetchAPI(`/deals/${id}/history`),
  createDeal: (data) => fetchAPI('/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id, data) => fetchAPI(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeal: (id) => fetchAPI(`/deals/${id}`, { method: 'DELETE' }),
  markDealAsLost: (id, loss_reason) => fetchAPI(`/deals/${id}/lost`, { method: 'PUT', body: JSON.stringify({ loss_reason }) }),
  restoreDeal: (id) => fetchAPI(`/deals/${id}/restore`, { method: 'PUT' }),
  closeDeal: (id, close_reason) => fetchAPI(`/deals/${id}/close`, { method: 'PUT', body: JSON.stringify({ close_reason }) }),
  recordDealPayment: (dealId, data) => fetchAPI(`/deals/${dealId}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  deleteDealPayment: (paymentId) => fetchAPI(`/deals/payments/${paymentId}`, { method: 'DELETE' }),

  // Employees & Team Members
  getEmployees: () => fetchAPI('/employees'),
  createEmployee: (data) => fetchAPI('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => fetchAPI(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => fetchAPI(`/employees/${id}`, { method: 'DELETE' }),

  // Salary Payments & Matrix
  getSalaries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/salaries${query ? `?${query}` : ''}`);
  },
  recordSalaryPayment: (data) => fetchAPI('/salaries', { method: 'POST', body: JSON.stringify(data) }),
  deleteSalaryPayment: (id) => fetchAPI(`/salaries/${id}`, { method: 'DELETE' }),
  getSalaryMatrix: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/salaries/matrix${query ? `?${query}` : ''}`);
  },

  // Analytics
  getAnalyticsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/summary${query ? `?${query}` : ''}`);
  },
};

