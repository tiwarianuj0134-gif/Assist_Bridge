/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

console.log('🔗 API Base URL:', API_BASE_URL);

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  const user = localStorage.getItem('assetbridge_user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.accessToken || null;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }
  return null;
}

// Generic API call function with automatic auth token injection
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // CRITICAL: Automatically attach Authorization header to EVERY request
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Auth token attached to request:', endpoint);
  } else {
    console.warn('⚠️ No auth token found for request:', endpoint);
  }

  try {
    console.log(`📡 API Call: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers, // Allow override if needed
      },
    });

    const data = await response.json();
    console.log(`✅ API Response (${endpoint}):`, data);
    
    return data;
  } catch (error) {
    console.error(`❌ API call error (${endpoint}):`, error);
    return {
      status: 'error',
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server'
      }
    };
  }
}

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    accountType?: 'BORROWER' | 'INVESTOR';
  }) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    return apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    return apiCall('/users/profile', {
      method: 'GET',
    });
  },

  updateDetails: async (data: {
    dateOfBirth: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    occupation: string;
    annualIncome: string;
    panNumber: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  }) => {
    return apiCall('/users/details', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getDashboard: async () => {
    return apiCall('/users/dashboard', {
      method: 'GET',
    });
  },
};

// Assets API
export const assetsApi = {
  getAssets: async () => {
    return apiCall('/assets', {
      method: 'GET',
    });
  },

  addAsset: async (data: {
    assetType: string;
    name: string;
    currentValue: number;
    currency?: string;
    metadata?: any;
  }) => {
    return apiCall('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  lockAsset: async (assetId: string, walletAddress?: string) => {
    return apiCall(`/assets/${assetId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  },

  unlockAsset: async (assetId: string) => {
    return apiCall(`/assets/${assetId}/unlock`, {
      method: 'POST',
    });
  },

  getCreditLimit: async () => {
    return apiCall('/assets/credit-limit', {
      method: 'GET',
    });
  },
};

// Loans API
export const loansApi = {
  getLoans: async () => {
    return apiCall('/loans', {
      method: 'GET',
    });
  },

  getPendingLoans: async () => {
    return apiCall('/loans/pending', {
      method: 'GET',
    });
  },

  getFundingOpportunities: async () => {
    return apiCall('/loans/funding-opportunities', {
      method: 'GET',
    });
  },

  investInLoan: async (loanId: string) => {
    return apiCall(`/loans/${loanId}/invest`, {
      method: 'POST',
    });
  },

  applyLoan: async (data: {
    amount: number;
    tenure: number;
    purpose?: string;
  }) => {
    return apiCall('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  calculateEMI: async (data: {
    amount: number;
    tenure: number;
  }) => {
    return apiCall('/loans/calculate-emi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveLoan: async (loanId: string, decision: 'APPROVE' | 'REJECT', reason?: string) => {
    return apiCall(`/loans/${loanId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  },

  rejectLoan: async (loanId: string, reason?: string) => {
    return apiCall(`/loans/${loanId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'REJECT', reason }),
    });
  },

  // PHASE 3: Marketplace & Portfolio
  browseMarketplace: async (filters?: {
    riskBand?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.riskBand) params.append('riskBand', filters.riskBand);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    return apiCall(`/loans/marketplace/browse?${params.toString()}`, {
      method: 'GET',
    });
  },

  getPortfolio: async () => {
    return apiCall('/loans/portfolio', {
      method: 'GET',
    });
  },

  repayLoan: async (loanId: string, repayAmount: number) => {
    return apiCall(`/loans/${loanId}/repay`, {
      method: 'POST',
      body: JSON.stringify({ repayAmount }),
    });
  },
};

// AI API
export const aiApi = {
  analyzeDocument: async (documentType: string) => {
    return apiCall('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ documentType }),
    });
  },

  getTrustScore: async () => {
    return apiCall('/ai/trust-score', {
      method: 'GET',
    });
  },

  getTrustScoreHistory: async () => {
    return apiCall('/ai/trust-score/history', {
      method: 'GET',
    });
  },

  chat: async (message: string) => {
    return apiCall('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  voiceCommand: async (text: string) => {
    return apiCall('/ai/command', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  predictRisk: async (data: {
    loanAmount: number;
    tenure: number;
    purpose: string;
  }) => {
    return apiCall('/ai/predict-risk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Cards API
export const cardsApi = {
  issueCard: async (loanId: string) => {
    return apiCall('/cards/issue', {
      method: 'POST',
      body: JSON.stringify({ loanId }),
    });
  },

  getMyCard: async () => {
    return apiCall('/cards/my-card', {
      method: 'GET',
    });
  },

  processTransaction: async (data: {
    amount: number;
    merchant: string;
    category?: string;
    location?: string;
    currency?: string;
  }) => {
    return apiCall('/cards/transact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTransactions: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiCall(`/cards/transactions${query}`, {
      method: 'GET',
    });
  },

  toggleCardStatus: async (freeze: boolean) => {
    return apiCall('/cards/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ freeze }),
    });
  },

  // Global multi-currency card endpoints
  issueGlobalCard: async (primaryCurrency: string, cardType: string = 'VIRTUAL') => {
    return apiCall('/cards/global/issue', {
      method: 'POST',
      body: JSON.stringify({ primaryCurrency, cardType }),
    });
  },

  getGlobalCard: async () => {
    return apiCall('/cards/global', {
      method: 'GET',
    });
  },

  setPreferredCurrency: async (currency: string) => {
    return apiCall('/cards/global/set-currency', {
      method: 'POST',
      body: JSON.stringify({ currency }),
    });
  },

  getGlobalCardTransactions: async (currency?: string) => {
    const query = currency ? `?currency=${currency}` : '';
    return apiCall(`/cards/global/transactions${query}`, {
      method: 'GET',
    });
  },
};

// FX Hedging API
export const fxApi = {
  getFXRates: async () => {
    return apiCall('/fx/rates', {
      method: 'GET',
    });
  },

  convertCurrency: async (from: string, to: string, amount: number) => {
    return apiCall(`/fx/convert?from=${from}&to=${to}&amount=${amount}`, {
      method: 'GET',
    });
  },

  createHedge: async (data: {
    sourceCurrency: string;
    targetCurrency: string;
    notionalAmount: number;
    hedgeRatio?: number;
    hedgeType?: string;
  }) => {
    return apiCall('/fx/hedge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHedgeRecommendation: async (
    sourceCurrency: string,
    targetCurrency: string,
    amount: number
  ) => {
    return apiCall(
      `/fx/hedge-recommendation?sourceCurrency=${sourceCurrency}&targetCurrency=${targetCurrency}&amount=${amount}`,
      {
        method: 'GET',
      }
    );
  },

  getActiveHedges: async () => {
    return apiCall('/fx/hedges', {
      method: 'GET',
    });
  },
};

// Certificates API
export const certificatesApi = {
  generateCertificate: async (assetId: string) => {
    return apiCall('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    });
  },

  downloadCertificate: async (certificateId: string) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}/download`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { status: 'success' as const };
    } catch (error) {
      console.error('Download certificate error:', error);
      return {
        status: 'error' as const,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: 'Failed to download certificate'
        }
      };
    }
  },

  verifyCertificate: async (hash: string) => {
    return apiCall(`/certificates/verify/${hash}`, {
      method: 'GET',
    });
  },

  getMyCertificates: async () => {
    return apiCall('/certificates', {
      method: 'GET',
    });
  },

  revokeCertificate: async (certificateId: string) => {
    return apiCall(`/certificates/${certificateId}/revoke`, {
      method: 'POST',
    });
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (params?: {
    status?: 'UNREAD' | 'READ' | 'ARCHIVED' | 'ALL';
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    return apiCall(`/notifications?${query.toString()}`, {
      method: 'GET',
    });
  },

  getUnreadCount: async () => {
    return apiCall('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markAsRead: async (notificationId: string) => {
    return apiCall(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },

  markAllAsRead: async () => {
    return apiCall('/notifications/read-all', {
      method: 'POST',
    });
  },

  deleteNotification: async (notificationId: string) => {
    return apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  getPreferences: async () => {
    return apiCall('/notifications/preferences', {
      method: 'GET',
    });
  },

  updatePreferences: async (preferences: any) => {
    return apiCall('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};
