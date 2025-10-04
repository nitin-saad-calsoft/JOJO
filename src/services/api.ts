const API_BASE_URL = 'http://10.0.2.2:5000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = true) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Only add auth header if required and token exists
    if (requiresAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log('Making API request to:', url);
    console.log('Requires auth:', requiresAuth);
    console.log('Has token:', !!this.token);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '300';
          throw new Error(`Too many requests. Please wait ${Math.ceil(parseInt(retryAfter) / 60)} minutes and try again.`);
        }
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden');
        }
        if (response.status === 404) {
          throw new Error('Endpoint not found');
        }
        if (response.status >= 500) {
          throw new Error('Server error');
        }
        
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false); // No auth required for login
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false); // No auth required for register
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
    return this.request(`/backgrounds${query ? `?${query}` : ''}`, {}, true); // Require auth
  }

  async getBackground(id: string) {
    return this.request(`/backgrounds/${id}`, {}, true); // Require auth
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
    return this.request(`/characters${query ? `?${query}` : ''}`, {}, true); // Require auth
  }

  async getCharacter(id: string) {
    return this.request(`/characters/${id}`, {}, true); // Require auth
  }

  // Audio APIs
  async getAudioFiles(params?: { page?: number; limit?: number; category?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    console.log('🎵 Making audio API request:', `/audio${query ? `?${query}` : ''}`);
    return this.request(`/audio${query ? `?${query}` : ''}`, {}, true); // Require auth
  }

  async getAudioFile(id: string) {
    return this.request(`/audio/${id}`, {}, true); // Require auth
  }

  // Helper methods for URL generation
  getBackgroundUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/backgrounds/${filename}`;
  }

  getCharacterUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/characters/${filename}`;
  }

  getAudioUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/audio/${filename}`;
  }

  getRiveUrl(filename: string) {
    return `${this.baseURL.replace('/api', '')}/uploads/rive/${filename}`;
  }
}

export const apiService = new ApiService();
export default apiService;