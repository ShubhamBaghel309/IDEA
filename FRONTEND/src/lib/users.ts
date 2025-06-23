import api from './api';
import { User } from './types';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const response = await api.put<User>('/users/profile', updates);
    return response.data;
  },

  // Change password
  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },

  // Get all users (for admin purposes)
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
