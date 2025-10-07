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

  const signUp = async (email, password, companyName, fullName) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          company_name: companyName,
          full_name: fullName,
          accept_terms: true // Auto-accept for dev, or add checkbox in signup form
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Registration failed' };
      }

      console.log('✅ Registration successful:', email);
      return { data: result };

    } catch (error) {
      console.error('❌ Registration error:', error);
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

      console.log('✅ Logout successful');

      // Redirect immediately (don't clear state first to avoid flash)
      window.location.replace('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API fails, redirect to clear session
      window.location.replace('/');
    }
  };

  const isAdmin = user?.isAdmin || false;

  return (
    <SimpleAuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      signUp,
      logout
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};