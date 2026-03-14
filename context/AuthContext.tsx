import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem } from '@/lib/storage';
import * as Api from '@/lib/api';

const TOKEN_KEY = 'campuslens_access_token';

interface AuthContextType {
  accessToken: string | null;
  userProfile: Api.UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Api.UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const profile = await Api.fetchUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // If profile fetch fails, it might mean the token is invalid
      if (accessToken) {
        setAccessToken(null);
        await Api.logout();
      }
    }
  };

  useEffect(() => {
    async function loadAuth() {
      const token = await getItem(TOKEN_KEY);
      if (token) {
        setAccessToken(token);
        // We'll fetch the profile in a separate effect or after setting token
      }
      setIsLoading(false);
    }
    loadAuth();
  }, []);

  useEffect(() => {
    if (accessToken) {
      refreshProfile();
    } else {
      setUserProfile(null);
    }
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await Api.login(email, password);
    if (result.ok && result.data) {
      setAccessToken(result.data.access_token);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      throw new Error(result.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await Api.register(email, password);
    if (result.ok && result.data) {
      setAccessToken(result.data.access_token);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      throw new Error(result.error || 'Registration failed');
    }
  };

  const logout = async () => {
    await Api.logout();
    setAccessToken(null);
    setUserProfile(null);
  };

  const isProfileComplete = !!(
    userProfile?.name &&
    userProfile?.year &&
    userProfile?.major &&
    userProfile?.goals &&
    userProfile?.goals.length > 0
  );

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userProfile,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        isProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
