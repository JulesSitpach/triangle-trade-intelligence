import React, { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Return sensible defaults when context is not available
    return {
      subscription: {
        plan: 'professional',
        plan_name: 'Professional Plan',
        usage_remaining: 'Demo Mode',
        usage_status: 'active',
        features_available: ['web_verification', 'confidence_scoring', 'expert_validation']
      },
      user: {
        id: 'demo-user-jorge',
        email: 'jorge@triangleintel.com',
        role: 'expert'
      },
      loading: false,
      error: null
    };
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

      // For now, use demo/development data
      // In production, this would fetch from your subscription API
      const mockSubscription = {
        plan: 'professional',
        plan_name: 'Professional Plan',
        usage_remaining: '150 classifications',
        usage_status: 'active',
        upgrade_needed: false,
        features_available: [
          'basic_classification',
          'web_verification',
          'confidence_scoring',
          'certificate_generation',
          'expert_validation'
        ],
        certificates_used: 3,
        certificates_limit: 25,
        trial_days_remaining: null // Not on trial
      };

      const mockUser = {
        id: 'jorge-expert-001',
        email: 'jorge@triangleintel.com',
        role: 'expert',
        name: 'Jorge Martinez',
        specialization: 'Mexico Trade & Manufacturing'
      };

      setSubscription(mockSubscription);
      setUser(mockUser);
      setError(null);

    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError(err.message);

      // Fallback to minimal working state
      setSubscription({
        plan: 'demo',
        plan_name: 'Demo Mode',
        usage_remaining: 'Unlimited (Demo)',
        usage_status: 'demo',
        features_available: ['basic_classification']
      });

      setUser({
        id: 'demo-user',
        email: 'demo@triangleintel.com',
        role: 'demo'
      });

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