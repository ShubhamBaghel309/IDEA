import api from './api';
import { Token, UserCreate, UserLogin } from './types';

export const authService = {  // Register a new user
  async register(userData: UserCreate): Promise<Token> {
    const response = await api.post<Token>('/auth/register', userData);
    
    // Store token and user data
    localStorage.setItem('accessToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  // Login user
  async login(credentials: UserLogin): Promise<Token> {
    const response = await api.post<Token>('/auth/login', credentials);
    
    // Store token and user data
    localStorage.setItem('accessToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return localStorage.getItem('accessToken') !== null;
  },

  // Get access token
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};
