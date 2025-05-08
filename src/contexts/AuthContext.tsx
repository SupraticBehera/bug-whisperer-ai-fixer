
import React, { createContext, useState, useContext, useEffect } from "react";

interface User {
  id: string;
  username: string;
  avatar: string;
  githubToken?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (githubCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem("bugWhispererUser");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // In a real implementation, this would communicate with a backend
  const login = async (githubCode: string) => {
    setIsLoading(true);
    try {
      // Mock authentication for demo purposes
      // In production, this would exchange the code for a token with GitHub API
      const mockUser: User = {
        id: "user-123",
        username: "developer",
        avatar: "https://github.com/identicons/app/icon1.png",
        githubToken: "mock-github-token"
      };
      
      setUser(mockUser);
      localStorage.setItem("bugWhispererUser", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bugWhispererUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
