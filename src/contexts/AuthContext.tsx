import { useState, createContext, useContext, ReactNode } from "react";

type UserRole = "admin" | "evaluator" | null;

interface AuthContextType {
  role: UserRole;
  userName: string;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState("");

  const login = (r: UserRole, name: string) => {
    setRole(r);
    setUserName(name);
  };
  const logout = () => {
    setRole(null);
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ role, userName, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  );
}
