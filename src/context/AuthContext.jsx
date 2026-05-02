import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

// Create a context for authentication state
export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
        } else {
          setSession(data.session || null);
          setUser(data.session?.user || null);
          setIsAuthenticated(Boolean(data.session?.user));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setIsAuthenticated(Boolean(nextSession?.user));
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    session,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
