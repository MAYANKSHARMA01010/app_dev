import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext();

const STORAGE_KEY = '@chatapp_auth_credentials';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username && parsed?.password) {
          const profile = await api.getProfile(parsed);
          setUser(profile);
          setCredentials(parsed);
        }
      }
    } catch (e) {
      console.log('Error restoring auth state:', e);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      throw new Error('Please enter both username and password.');
    }
    const creds = { username: trimmedUser, password };
    const profile = await api.login(trimmedUser, password);
    setUser(profile);
    setCredentials(creds);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    return profile;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.log('Error during logout:', e);
    }
    setUser(null);
    setCredentials(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credentials,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

