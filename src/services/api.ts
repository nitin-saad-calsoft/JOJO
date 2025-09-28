const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Audio APIs
  async getAudioFiles(params?: { page?: number; limit?: number; category?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/audio${query ? `?${query}` : ''}`);
  }

  async getAudioFile(id: string) {
    return this.request(`/audio/${id}`);
  }

  // Background APIs
  async getBackgrounds(params?: { page?: number; limit?: number; category?: string; type?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/backgrounds${query ? `?${query}` : ''}`);
  }

  async getBackground(id: string) {
    return this.request(`/backgrounds/${id}`);
  }

  // Character APIs
  async getCharacters(params?: { page?: number; limit?: number; category?: string; type?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/characters${query ? `?${query}` : ''}`);
  }

  async getCharacter(id: string) {
    return this.request(`/characters/${id}`);
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // File URL helpers
  getAudioUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/audio/${filename}`;
  }

  getBackgroundUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/backgrounds/${filename}`;
  }

  getCharacterUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/characters/${filename}`;
  }

  getRiveUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/rive/${filename}`;
  }
}

export const apiService = new ApiService();
export default apiService;