import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserRole = "admin" | "evaluator" | null;

interface AuthContextType {
  role: UserRole;
  userName: string;
  user: User | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  user: null,
  login: async () => ({}),
  logout: async () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);
      setUserName(profile?.full_name || "");
      setRole((roleData?.role as UserRole) || "evaluator");
    } catch {
      setRole(null);
      setUserName("");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      if (mounted) setIsLoading(false);
    });

    // 2. Listen for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setIsLoading(true);
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setUserName("");
        }
        if (mounted) setIsLoading(false);
      }
    );
...
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ role, userName, user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
