const TOKEN_STORAGE_KEY = 'stocksense_erp_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.details = data?.details;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: (role: string) => request<any>('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request<any>('/api/auth/me'),
  updateProfile: (data: any) => request<any>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  forgotPasswordOtp: (email: string) => request<any>('/api/auth/forgot-password-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordOtp: (payload: any) => request<any>('/api/auth/reset-password-otp', { method: 'POST', body: JSON.stringify(payload) }),
  getUsers: () => request<any[]>('/api/auth/users'),
  createUser: (data: any) => request<any>('/api/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUser: (id: string) => request<any>(`/api/auth/users/${id}/toggle`, { method: 'PUT' }),

  // Dashboard
  getDashboardStats: (params?: { warehouse_id?: string; category_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/api/dashboard/stats${query ? `?${query}` : ''}`);
  },

  // Products
  getProducts: (params?: { search?: string; category_id?: string; status?: string; low_stock?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id: string) => request<any>(`/api/products/${id}`),
  createProduct: (data: any) => request<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/api/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<any[]>('/api/categories'),
  createCategory: (data: any) => request<any>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<any>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Reordering Rules
  getReorderRules: () => request<any[]>('/api/reorder-rules'),
  createReorderRule: (data: any) => request<any>('/api/reorder-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateReorderRule: (id: string, data: any) => request<any>(`/api/reorder-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReorderRule: (id: string) => request<any>(`/api/reorder-rules/${id}`, { method: 'DELETE' }),
  replenishProduct: (productId: string) => request<any>(`/api/reorder-rules/replenish/${productId}`, { method: 'POST' }),

  // Warehouses & Locations
  getWarehouses: () => request<any[]>('/api/warehouses'),
  createWarehouse: (data: any) => request<any>('/api/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id: string, data: any) => request<any>(`/api/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id: string) => request<any>(`/api/warehouses/${id}`, { method: 'DELETE' }),

  getLocations: (params?: { warehouse_id?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/locations${query ? `?${query}` : ''}`);
  },
  createLocation: (data: any) => request<any>('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id: string, data: any) => request<any>(`/api/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLocation: (id: string) => request<any>(`/api/locations/${id}`, { method: 'DELETE' }),

  // Operations: Receipts
  getReceipts: (params?: { status?: string; warehouse_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/operations/receipts${query ? `?${query}` : ''}`);
  },
  getReceipt: (id: string) => request<any>(`/api/operations/receipts/${id}`),
  createReceipt: (data: any) => request<any>('/api/operations/receipts', { method: 'POST', body: JSON.stringify(data) }),
  validateReceipt: (id: string) => request<any>(`/api/operations/receipts/${id}/validate`, { method: 'POST' }),

  // Operations: Deliveries
  getDeliveries: (params?: { status?: string; warehouse_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/operations/deliveries${query ? `?${query}` : ''}`);
  },
  getDelivery: (id: string) => request<any>(`/api/operations/deliveries/${id}`),
  createDelivery: (data: any) => request<any>('/api/operations/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  validateDelivery: (id: string) => request<any>(`/api/operations/deliveries/${id}/validate`, { method: 'POST' }),

  // Operations: Transfers
  getTransfers: (params?: { status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/operations/transfers${query ? `?${query}` : ''}`);
  },
  getTransfer: (id: string) => request<any>(`/api/operations/transfers/${id}`),
  createTransfer: (data: any) => request<any>('/api/operations/transfers', { method: 'POST', body: JSON.stringify(data) }),
  validateTransfer: (id: string) => request<any>(`/api/operations/transfers/${id}/validate`, { method: 'POST' }),

  // Operations: Adjustments
  getAdjustments: () => request<any[]>('/api/operations/adjustments'),
  createAdjustment: (data: any) => request<any>('/api/operations/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  validateAdjustment: (id: string) => request<any>(`/api/operations/adjustments/${id}/validate`, { method: 'POST' }),

  // Move History
  getMovements: (params?: { product_id?: string; doc_type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/operations/movements${query ? `?${query}` : ''}`);
  },

  // Inventory
  getStockOverview: () => request<any[]>('/api/inventory/overview'),
  getStockByLocation: (params?: { warehouse_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/inventory/by-location${query ? `?${query}` : ''}`);
  },
  getStockLedger: (params?: { product_id?: string; warehouse_id?: string; location_id?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/inventory/ledger${query ? `?${query}` : ''}`);
  },

  // Reports
  getInventoryReport: () => request<any>('/api/reports/inventory'),
  getLowStockReport: () => request<any[]>('/api/reports/low-stock'),
  getMovementsReport: (params?: { doc_type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/api/reports/movements${query ? `?${query}` : ''}`);
  },
  getAdjustmentsReport: () => request<any[]>('/api/reports/adjustments'),

  // Audit Logs
  getAuditLogs: (params?: { entity_type?: string; action?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/audit-logs${query ? `?${query}` : ''}`);
  }
};
