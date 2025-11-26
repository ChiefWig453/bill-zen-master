/**
 * API Client for backend authentication
 * Handles JWT token storage and automatic refresh
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'user';
  };
  accessToken: string;
  refreshToken: string;
}

interface SignupResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new access token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          return { error: 'Session expired. Please log in again.' };
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || `Request failed with status ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data) {
      this.saveTokens(result.data.accessToken, result.data.refreshToken);
      localStorage.setItem('userId', result.data.user.id);
    }

    return result;
  }

  async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<ApiResponse<SignupResponse>> {
    return this.request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    }
    this.clearTokens();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Bills API
  async getBills() {
    return this.request('/bills', { method: 'GET' });
  }

  async createBill(bill: any) {
    return this.request('/bills', {
      method: 'POST',
      body: JSON.stringify(bill),
    });
  }

  async updateBill(id: string, updates: any) {
    return this.request(`/bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteBill(id: string) {
    return this.request(`/bills/${id}`, { method: 'DELETE' });
  }

  async getBillTemplates() {
    return this.request('/bills/templates', { method: 'GET' });
  }

  async createBillTemplate(template: any) {
    return this.request('/bills/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateBillTemplate(id: string, updates: any) {
    return this.request(`/bills/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteBillTemplate(id: string) {
    return this.request(`/bills/templates/${id}`, { method: 'DELETE' });
  }

  // Incomes API
  async getIncomes() {
    return this.request('/incomes', { method: 'GET' });
  }

  async createIncome(income: any) {
    return this.request('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  }

  async updateIncome(id: string, updates: any) {
    return this.request(`/incomes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteIncome(id: string) {
    return this.request(`/incomes/${id}`, { method: 'DELETE' });
  }

  // DoorDash API
  async getDashSessions() {
    return this.request('/dash/sessions', { method: 'GET' });
  }

  async createDashSession(session: any) {
    return this.request('/dash/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async updateDashSession(id: string, updates: any) {
    return this.request(`/dash/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDashSession(id: string) {
    return this.request(`/dash/sessions/${id}`, { method: 'DELETE' });
  }

  async getDashExpenses() {
    return this.request('/dash/expenses', { method: 'GET' });
  }

  async createDashExpense(expense: any) {
    return this.request('/dash/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateDashExpense(id: string, updates: any) {
    return this.request(`/dash/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDashExpense(id: string) {
    return this.request(`/dash/expenses/${id}`, { method: 'DELETE' });
  }

  // Maintenance API
  async getMaintenanceTasks(frequency?: string) {
    const query = frequency ? `?frequency=${frequency}` : '';
    return this.request(`/maintenance/tasks${query}`, { method: 'GET' });
  }

  async createMaintenanceTask(task: any) {
    return this.request('/maintenance/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateMaintenanceTask(id: string, updates: any) {
    return this.request(`/maintenance/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteMaintenanceTask(id: string) {
    return this.request(`/maintenance/tasks/${id}`, { method: 'DELETE' });
  }

  async getMaintenanceHistory(taskId?: string) {
    const query = taskId ? `?task_id=${taskId}` : '';
    return this.request(`/maintenance/history${query}`, { method: 'GET' });
  }

  async createMaintenanceHistory(history: any) {
    return this.request('/maintenance/history', {
      method: 'POST',
      body: JSON.stringify(history),
    });
  }

  // Preferences API
  async getPreferences() {
    return this.request('/preferences', { method: 'GET' });
  }

  async updatePreferences(updates: any) {
    return this.request('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Profile API
  async getProfile() {
    return this.request('/auth/profile', { method: 'GET' });
  }

  async getUserRole() {
    return this.request('/auth/role', { method: 'GET' });
  }

  // Users (Admin)
  async getUsers() {
    return this.request('/users', { method: 'GET' });
  }

  async inviteUser(data: { email: string; firstName: string; lastName: string; role: string; password: string }) {
    return this.request('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: { firstName?: string; lastName?: string; email?: string; role?: string }) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  // Password Management
  async requestPasswordReset(email: string) {
    return this.request('/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/password/update', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export const apiClient = new ApiClient();
