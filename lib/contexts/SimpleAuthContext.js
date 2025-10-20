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
  const [subscriptionTier, setSubscriptionTier] = useState('Trial');

  // Check cookie-based session on mount (SINGLE API CALL)
  useEffect(() => {
    // Add cache-busting timestamp to prevent browser caching stale tier data
    fetch(`/api/auth/me?t=${Date.now()}`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
      if (data.authenticated && data.user) {
        setUser(data.user);
        // Extract subscription tier from user data (added Oct 15, 2025)
        setSubscriptionTier(data.user.subscription_tier || 'Trial');
        console.log('✅ User session restored:', data.user.email, '| Tier:', data.user.subscription_tier || 'Trial');
      } else {
        console.log('⚠️ No valid session');
        setSubscriptionTier('Trial'); // Default for non-authenticated users
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('❌ Auth check failed:', error);
      setSubscriptionTier('Trial'); // Fallback on error
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
      setSubscriptionTier(result.user.subscription_tier || 'Trial'); // ✅ FIX: Update tier after login

      console.log('✅ Login successful:', email, '| Tier:', result.user.subscription_tier || 'Trial');
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

      // Update subscription tier after signup (defaults to 'Trial' for new users)
      setSubscriptionTier(result.user?.subscription_tier || 'Trial'); // ✅ FIX: Update tier after signup

      console.log('✅ Registration successful:', email, '| Tier:', result.user?.subscription_tier || 'Trial');
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

  // Refresh function to force reload user data (e.g., after subscription upgrade)
  const refreshUser = async () => {
    setLoading(true);
    try {
      // Add cache-busting timestamp to force fresh data
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, { credentials: 'include' });
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setSubscriptionTier(data.user.subscription_tier || 'Trial');
        console.log('🔄 User data refreshed - New tier:', data.user.subscription_tier || 'Trial');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleAuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      subscriptionTier, // NEW: Expose subscription tier to all components
      refreshUser,      // NEW: Manual refresh function (e.g., after upgrade)
      login,
      signUp,
      logout
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};