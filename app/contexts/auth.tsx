// ============================================================
// app/contexts/auth.tsx
// ============================================================
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "~/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo?: string;
  school_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(localStorage.getItem("edunexus_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.me()
        .then(res => setUser(res.data))
        .catch(() => { setToken(null); localStorage.removeItem("edunexus_token"); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    const { user: u, token: t } = res.data;
    localStorage.setItem("edunexus_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem("edunexus_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};