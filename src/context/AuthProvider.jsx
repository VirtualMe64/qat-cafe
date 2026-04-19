import { useEffect, useMemo, useState } from "react";
import { getUserById, signInOrCreateUser } from "../services/authService";
import { AuthContext } from "./authContext";

const AUTH_STORAGE_KEY = "qat-cafe:user";

function readStoredUser() {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue?.id) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeStoredUser(user) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      username: user.username,
    }),
  );
}

function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedUser = readStoredUser();

      if (!storedUser) {
        if (mounted) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const existingUser = await getUserById(storedUser.id);

        if (!mounted) {
          return;
        }

        if (!existingUser) {
          clearStoredUser();
          setUser(null);
          setIsInitializing(false);
          return;
        }

        setUser(existingUser);
      } catch (error) {
        if (!mounted) {
          return;
        }

        clearStoredUser();
        setUser(null);
        setAuthError(error.message || "Failed to restore session.");
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(username) {
    const existingOrNewUser = await signInOrCreateUser(username);
    writeStoredUser(existingOrNewUser);
    setAuthError("");
    setUser(existingOrNewUser);
  }

  function signOut() {
    clearStoredUser();
    setUser(null);
  }

  function clearAuthError() {
    setAuthError("");
  }

  const value = useMemo(
    () => ({
      user,
      authError,
      isInitializing,
      signIn,
      signOut,
      clearAuthError,
    }),
    [user, authError, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}