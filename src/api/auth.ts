/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, isDemoMode, saveTokens, simulateNetworkDelay } from './client';
import { AuthResponse, ApiError } from '../types/api';
import { MockDatabase } from './mockDb';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const users = MockDatabase.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== password) {
      throw {
        status: 400,
        title: 'Authentication Failed',
        detail: 'Invalid email address or password.',
      } as ApiError;
    }
    
    // Simulate JWT generation
    const mockResponse: AuthResponse = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessToken: `mock-jwt-token-for-${user.id}-${Date.now()}`,
      refreshToken: `mock-refresh-token-${user.id}-${Date.now()}`,
      refreshTokenExpiresOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    saveTokens(mockResponse.accessToken, mockResponse.refreshToken, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    return mockResponse;
  }

  const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  const data = response.data;
  saveTokens(data.accessToken, data.refreshToken, {
    id: data.userId,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
  });
  return data;
};

export const register = async (fullName: string, email: string, password: string): Promise<AuthResponse> => {
  if (isDemoMode()) {
    await simulateNetworkDelay();
    const users = MockDatabase.getUsers();
    
    // Email uniqueness check
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw {
        status: 400,
        title: 'Validation Failed',
        detail: 'A user with this email address already exists.',
        errors: {
          Email: ['Email is already in use.']
        }
      } as ApiError;
    }

    // Password validation rules check
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw {
        status: 400,
        title: 'Validation Failed',
        detail: 'Password is too weak.',
        errors: {
          Password: ['Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number.']
        }
      } as ApiError;
    }

    const newId = `usr-${users.length + 1}`;
    const newUser = {
      id: newId,
      email,
      fullName,
      role: 'User' as const,
      interests: [] as string[],
      passwordHash: password,
      bookmarks: [] as string[],
    };

    users.push(newUser);
    MockDatabase.saveUsers(users);

    const mockResponse: AuthResponse = {
      userId: newId,
      fullName,
      email,
      role: 'User',
      accessToken: `mock-jwt-token-for-${newId}-${Date.now()}`,
      refreshToken: `mock-refresh-token-${newId}-${Date.now()}`,
      refreshTokenExpiresOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    saveTokens(mockResponse.accessToken, mockResponse.refreshToken, {
      id: newId,
      fullName,
      email,
      role: 'User',
    });
    return mockResponse;
  }

  const response = await apiClient.post<AuthResponse>('/auth/register', { fullName, email, password });
  const data = response.data;
  saveTokens(data.accessToken, data.refreshToken, {
    id: data.userId,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
  });
  return data;
};
