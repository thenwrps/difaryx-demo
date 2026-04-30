import { GoogleUser, GoogleAuthState } from './types';

const AUTH_STORAGE_KEY = 'difaryx_google_demo_user';

const DEMO_USER: GoogleUser = {
  name: 'Demo Researcher',
  email: 'demo@difaryx.local',
  organization: 'DIFARYX Demo Lab',
};

export function signInWithGoogleDemo(): GoogleAuthState {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USER));
  return {
    isAuthenticated: true,
    user: DEMO_USER,
  };
}

export function getGoogleAuthState(): GoogleAuthState {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      const user = JSON.parse(stored) as GoogleUser;
      return {
        isAuthenticated: true,
        user,
      };
    } catch (e) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }
  }
  return {
    isAuthenticated: false,
    user: null,
  };
}

export function signOutGoogleDemo(): GoogleAuthState {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return {
    isAuthenticated: false,
    user: null,
  };
}
