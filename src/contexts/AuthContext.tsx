import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  name: string;
  email: string;
  organization?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'demoAuth';
const PROFILE_KEY = 'demoProfile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const authStatus = localStorage.getItem(AUTH_KEY);
    const profileData = localStorage.getItem(PROFILE_KEY);

    if (authStatus === 'true' && profileData) {
      try {
        const parsedUser = JSON.parse(profileData) as AuthUser;
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        // Invalid data, clear auth
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(PROFILE_KEY);
      }
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);

  const signIn = (newUser: AuthUser) => {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, signIn, signOut }}>
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
