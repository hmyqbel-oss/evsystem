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
        supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

      return {
        userName: profile?.full_name || "",
        role: (roleData?.role as UserRole) || null,
      };
    } catch {
      return {
        userName: "",
        role: null as UserRole,
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = async (sessionUser: User | null) => {
      if (!mounted) return;

      if (!sessionUser) {
        setUser(null);
        setRole(null);
        setUserName("");
        setIsLoading(false);
        return;
      }

      setUser(sessionUser);
      const profile = await fetchUserProfile(sessionUser.id);

      if (!mounted) return;
      setUserName(profile.userName);
      setRole(profile.role);
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoading(true);
      void applySession(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session?.user ?? null);
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    const timer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setUserName("");
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ role, userName, user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
