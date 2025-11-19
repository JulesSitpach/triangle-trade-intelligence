import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../database/supabase-client';

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
      // === STEP 1: Clear cookie via API ===
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      console.log('✅ Logout successful - clearing local data');

      // === STEP 2: Clear localStorage based on user's save consent ===
      // If user didn't consent to save, clear their workflow data on exit
      const saveConsent = localStorage.getItem('save_data_consent');
      if (saveConsent === 'erase' || !saveConsent) {
        // User chose "erase" OR no consent was recorded
        // → Wipe unsaved workflow data from device
        const WORKFLOW_KEYS = [
          'usmca_workflow_data',
          'usmca_company_data',
          'usmca_workflow_results',
          'usmca_alerts_subscription',
          'user_subscription_status',
          'workflow_session_id',
          'save_data_consent',
          'triangle-dev-mode'
        ];

        WORKFLOW_KEYS.forEach(key => {
          localStorage.removeItem(key);
        });

        console.log('🗑️ Workflow data wiped - user did not consent to save');
      } else if (saveConsent === 'save') {
        // User chose to save → only clear auth-related keys, keep workflow for next login
        localStorage.removeItem('triangle-dev-mode');
        console.log('💾 Workflow data preserved - user saved to database');
      }

      // === STEP 3: Redirect to home ===
      window.location.replace('/');
    } catch (error) {
      console.error('❌ Logout error:', error);

      // Even if API fails, still clear localStorage
      const saveConsent = localStorage.getItem('save_data_consent');
      if (saveConsent === 'erase' || !saveConsent) {
        const WORKFLOW_KEYS = [
          'usmca_workflow_data',
          'usmca_company_data',
          'usmca_workflow_results',
          'usmca_alerts_subscription',
          'user_subscription_status',
          'workflow_session_id',
          'save_data_consent'
        ];
        WORKFLOW_KEYS.forEach(key => localStorage.removeItem(key));
      }

      // Redirect to clear session
      window.location.replace('/');
    }
  };

  const signInWithGoogle = async (selectedPlan = null) => {
    try {
      // ✅ FIX: Store selected plan before OAuth redirect so callback knows where to send user
      if (selectedPlan && typeof window !== 'undefined') {
        localStorage.setItem('oauth_selected_plan', selectedPlan);
        console.log('💾 Stored OAuth plan:', selectedPlan);
      }

      const supabase = getSupabaseClient();
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3001/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        return { error: error.message };
      }

      // Supabase will redirect to Google, then back to callback URL
      return { success: true };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return { error: 'Failed to sign in with Google' };
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
      signInWithGoogle, // NEW: Google OAuth sign-in
      logout
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};