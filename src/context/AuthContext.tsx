import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_URL = 'http://localhost:5000';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  username?: string;
  bio?: string;
  is_verified?: boolean;
  is_private?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, isAuthenticated: false,
  login: () => {}, logout: () => {}, updateUser: () => {},
  loading: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('chatUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('chatToken'));
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    const hydrate = async () => {
      if (token && !user) {
        try {
          const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            localStorage.setItem('chatUser', JSON.stringify(userData));
          } else {
            logout();
          }
        } catch (e) {
          console.error('Session hydration failed', e);
        }
      }
      setLoading(false);
    };
    hydrate();
  }, [token]);

  const login = (userData: User, tokenStr: string) => {
    localStorage.setItem('chatToken', tokenStr);
    localStorage.setItem('chatUser', JSON.stringify(userData));
    setUser(userData);
    setToken(tokenStr);
  };

  const logout = () => {
    localStorage.removeItem('chatToken');
    localStorage.removeItem('chatUser');
    setUser(null);
    setToken(null);
    // Use replace to prevent back-button loops to protected pages
    window.location.replace('/auth');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('chatUser', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// API helper
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('chatToken');
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' })
    }
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('chatToken');
    localStorage.removeItem('chatUser');
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }
  return res;
};

export { API_URL };
