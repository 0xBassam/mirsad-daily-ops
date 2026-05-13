import { createContext, useContext, useState, ReactNode } from 'react';
import { User, OrgPlan } from '../types';

interface AuthContextValue {
  user:            User | null;
  token:           string | null;
  organizationId:  string | null;
  orgName:         string;
  plan:            OrgPlan;
  login:           (user: User, token: string) => void;
  logout:          () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('mirsad_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('mirsad_token')
  );

  function login(u: User, t: string) {
    setUser(u);
    setToken(t);
    sessionStorage.setItem('mirsad_user', JSON.stringify(u));
    sessionStorage.setItem('mirsad_token', t);
  }

  function logout() {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('mirsad_user');
    sessionStorage.removeItem('mirsad_token');
  }

  // Derived from the user object returned by the login endpoint,
  // which now includes organizationId, orgName, and plan.
  const organizationId = user?.organizationId ?? null;
  const orgName        = user?.orgName ?? '';
  const plan: OrgPlan  = (user?.plan as OrgPlan) ?? 'trial';

  return (
    <AuthContext.Provider value={{ user, token, organizationId, orgName, plan, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
