import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ProductionAuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(ProductionAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('triangle_user_session');
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
        console.log('✅ Auth session restored:', userData.email);
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      localStorage.removeItem('triangle_user_session');
    }
    setLoading(false);
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Login failed' };
      }

      // Store session
      const sessionData = {
        ...result.user,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('triangle_user_session', JSON.stringify(sessionData));
      setUser(sessionData);

      console.log('✅ Sign in successful:', email);
      return { data: sessionData };

    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email, password, company_name, full_name) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, company_name, full_name })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Registration failed' };
      }

      // Check if email confirmation is required
      if (result.email_confirmation_required) {
        console.log('✅ Sign up successful, email confirmation required:', email);
        return { data: { message: result.message, email_confirmation_required: true } };
      }

      // Auto sign in only if no email confirmation required (legacy behavior)
      const sessionData = {
        ...result.user,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('triangle_user_session', JSON.stringify(sessionData));
      setUser(sessionData);

      console.log('✅ Sign up successful with immediate login:', email);
      return { data: sessionData };

    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      localStorage.removeItem('triangle_user_session');
      setUser(null);
      console.log('✅ Sign out successful');
      router.push('/');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.role === 'admin' || false;

  // Get user profile (same as user for simplicity)
  const profile = user;

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut
  };

  return (
    <ProductionAuthContext.Provider value={value}>
      {children}
    </ProductionAuthContext.Provider>
  );
};