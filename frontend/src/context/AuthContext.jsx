import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/authService";

const TOKEN_KEY = "docIntellectToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginUser(email, password);
    localStorage.setItem(TOKEN_KEY, result.access_token);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    return registerUser(userData);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}