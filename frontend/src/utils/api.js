const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchAPI(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error (${response.status}): ${response.statusText}`);
  }

  return data;
}

export const api = {
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

  // Deals & Receivables
  getDeals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/deals${query ? `?${query}` : ''}`);
  },
  getDeal: (id) => fetchAPI(`/deals/${id}`),
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
  getSalaryMatrix: () => fetchAPI('/salaries/matrix'),

  // Analytics
  getAnalyticsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/summary${query ? `?${query}` : ''}`);
  },
};
