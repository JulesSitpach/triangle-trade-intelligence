import React, { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // ✅ FAIL LOUDLY: Context must be provided by SubscriptionProvider
    // No fallback to demo user - authentication is required
    throw new Error(
      'SubscriptionContext not found. Make sure your component is wrapped with <SubscriptionProvider>. ' +
      'This component requires authentication and cannot function without a valid user session.'
    );
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize subscription data
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Fetch real subscription data from authentication endpoint
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Include cookies for session auth
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user subscription data');
      }

      const { user: authUser, authenticated } = await response.json();

      if (!authenticated || !authUser) {
        throw new Error('User not authenticated');
      }

      // Map subscription tier to feature access
      const tierFeatures = {
        'Trial': ['basic_classification'],
        'Starter': ['basic_classification', 'certificate_generation'],
        'Professional': ['basic_classification', 'web_verification', 'confidence_scoring', 'certificate_generation', 'expert_validation'],
        'Premium': ['basic_classification', 'web_verification', 'confidence_scoring', 'certificate_generation', 'expert_validation', 'priority_support']
      };

      const tierLimits = {
        'Trial': { classifications: 1, certificates: 0 },
        'Starter': { classifications: 10, certificates: 10 },
        'Professional': { classifications: Infinity, certificates: Infinity },
        'Premium': { classifications: Infinity, certificates: Infinity }
      };

      const userTier = authUser.subscription_tier || 'Trial';
      const limits = tierLimits[userTier] || tierLimits['Trial'];

      const realSubscription = {
        plan: userTier.toLowerCase(),
        plan_name: `${userTier} Plan`,
        usage_remaining: limits.classifications === Infinity ? 'Unlimited' : `${limits.classifications} remaining`,
        usage_status: 'active',
        upgrade_needed: userTier === 'Trial',
        features_available: tierFeatures[userTier] || tierFeatures['Trial'],
        certificates_used: 0, // TODO: Fetch from usage tracking table
        certificates_limit: limits.certificates,
        trial_days_remaining: userTier === 'Trial' ? 7 : null
      };

      const realUser = {
        id: authUser.id,
        email: authUser.email,
        role: authUser.isAdmin ? 'admin' : 'user',
        name: authUser.company_name || authUser.email.split('@')[0],
        subscription_tier: userTier
      };

      setSubscription(realSubscription);
      setUser(realUser);
      setError(null);

    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError(err.message);

      // ✅ FAIL LOUDLY: No fallback to demo user
      // If auth fails, leave subscription/user null and show error to user
      // Components checking subscription status will see the error and display it
      setSubscription(null);
      setUser(null);

    } finally {
      setLoading(false);
    }
  };

  const updateUsage = (usageType, amount = 1) => {
    // Update usage tracking
    setSubscription(prev => ({
      ...prev,
      // Update usage counters based on type
      certificates_used: usageType === 'certificate'
        ? Math.min(prev.certificates_used + amount, prev.certificates_limit)
        : prev.certificates_used
    }));
  };

  const checkFeatureAccess = (feature) => {
    return subscription?.features_available?.includes(feature) ?? false;
  };

  const value = {
    subscription,
    user,
    loading,
    error,
    updateUsage,
    checkFeatureAccess,
    refreshSubscription: loadSubscriptionData
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;