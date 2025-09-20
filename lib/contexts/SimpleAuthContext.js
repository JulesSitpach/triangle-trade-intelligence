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

  // Load user from localStorage ONCE on mount
  useEffect(() => {
    const stored = localStorage.getItem('triangle_user_session');

    if (stored) {
      try {
        const userData = JSON.parse(stored);
        if (userData && userData.email && userData.loggedIn) {
          setUser(userData);
          console.log('✅ User session restored:', userData.email);
        } else {
          console.log('⚠️ Invalid session, clearing');
          localStorage.removeItem('triangle_user_session');
        }
      } catch (e) {
        console.log('❌ Corrupted session, clearing');
        localStorage.removeItem('triangle_user_session');
      }
    }

    setLoading(false);
  }, []); // Run ONLY on mount

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Login failed' };
      }

      // Create session data
      const sessionData = {
        ...result.user,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };

      // Store and set user
      localStorage.setItem('triangle_user_session', JSON.stringify(sessionData));
      setUser(sessionData);

      console.log('✅ Login successful:', email);
      return { success: true, user: sessionData };

    } catch (error) {
      console.error('❌ Login error:', error);
      return { error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('triangle_user_session');
    localStorage.removeItem('current_user');
    setUser(null);
    console.log('✅ Logout successful');
    // Return to home page
    window.location.href = '/';
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