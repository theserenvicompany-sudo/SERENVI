"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  distributorId: string;
  email: string;
  isAdmin: boolean;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | undefined>;
  signOut: () => void;
  setSession: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoaded: false,
  isSignedIn: false,
  getToken: async () => undefined,
  signOut: () => {},
  setSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("serenvi_token");
    const storedUser = localStorage.getItem("serenvi_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("serenvi_token");
        localStorage.removeItem("serenvi_user");
      }
    }
    setIsLoaded(true);
  }, []);

  const setSession = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("serenvi_token", newToken);
    localStorage.setItem("serenvi_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("serenvi_token");
    localStorage.removeItem("serenvi_user");
    setToken(null);
    setUser(null);
    router.push("/sign-in");
  }, [router]);

  const getToken = useCallback(async () => {
    return token || undefined;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoaded,
        isSignedIn: !!token,
        getToken,
        signOut,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
