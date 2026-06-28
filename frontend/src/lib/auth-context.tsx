'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient, setTokens, clearTokens, setAccessToken } from './api-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  role: 'admin' | 'room_staff' | 'boat_staff' | 'member';
  status: 'active' | 'inactive';
  lineId?: string;
  facebook?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; loading: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<string>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, loading: true });

  useEffect(() => {
    const refresh = async () => {
      const rt = localStorage.getItem('refreshToken');
      if (!rt) {
        dispatch({ type: 'SET_LOADING', loading: false });
        return;
      }

      try {
        const data = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken: rt });
        setTokens(data.accessToken, data.refreshToken);
        dispatch({ type: 'SET_USER', user: data.user });
      } catch {
        clearTokens();
        dispatch({ type: 'CLEAR_USER' });
      }
    };

    refresh();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    dispatch({ type: 'SET_USER', user: data.user });
  }, []);

  const register = useCallback(async (input: { email: string; password: string; firstName: string; lastName: string }) => {
    const data = await apiClient.post<AuthResponse>('/auth/register', input);
    setTokens(data.accessToken, data.refreshToken);
    dispatch({ type: 'SET_USER', user: data.user });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const data = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return data.message;
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    const data = await apiClient.post<{ message: string }>('/auth/reset-password', { email, otp, newPassword });
    return data.message;
  }, []);

  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, forgotPassword, resetPassword, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
