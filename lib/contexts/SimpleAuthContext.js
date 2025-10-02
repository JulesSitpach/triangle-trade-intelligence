import { createContext, useContext, useState, useEffect } from 'react';

const SimpleAuthContext = createContext({});

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check cookie-based session on mount
  useEffect(() => {
    fetch('/api/auth/me', {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
      if (data.authenticated && data.user) {
        setUser(data.user);
        console.log('✅ User session restored:', data.user.email);
      } else {
        console.log('⚠️ No valid session');
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('❌ Auth check failed:', error);
      setLoading(false);
    });
  }, []); // Run ONLY on mount

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Login failed' };
      }

      // Cookie is set automatically by the API
      // Just update local state
      setUser(result.user);

      console.log('✅ Login successful:', email);
      return { success: true, user: result.user };

    } catch (error) {
      console.error('❌ Login error:', error);
      return { error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Clear cookie via API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Clear local state
      setUser(null);
      console.log('✅ Logout successful');

      // Return to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API fails, clear local state
      setUser(null);
      window.location.href = '/';
    }
  };

  const isAdmin = user?.isAdmin || false;

  return (
    <SimpleAuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      logout
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};