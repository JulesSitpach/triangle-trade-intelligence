import React, { createContext, useContext, useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../../config/system-config';

const AlertContext = createContext();

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate alert count from user profile and crisis data
  const calculateAlertCount = async () => {
    try {
      setLoading(true);
      
      // Get user profile from localStorage (saved from workflow)
      const userProfile = JSON.parse(localStorage.getItem('triangle-user-profile') || '{}');
      
      if (!userProfile.companyName) {
        setAlertCount(0);
        setAlerts([]);
        setLoading(false);
        return;
      }

      // Simulate getting crisis data and generating personalized alerts
      // In production, this would be an API call
      const simulatedAlerts = await generatePersonalizedAlerts(userProfile);
      
      setAlerts(simulatedAlerts);
      setAlertCount(simulatedAlerts.length);
      
    } catch (error) {
      console.error('Failed to calculate alert count:', error);
      setAlertCount(0);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate personalized alerts based on user profile
  const generatePersonalizedAlerts = async (userProfile) => {
    const alerts = [];
    
    // Alert 1: Industry-specific tariff changes
    if (userProfile.industry) {
      alerts.push({
        id: 'industry-tariff-' + Date.now(),
        title: `${userProfile.industry} Tariff Update`,
        severity: 'high',
        impact: `Potential ${SYSTEM_CONFIG.alerts.minDutyIncrease}-${SYSTEM_CONFIG.alerts.maxDutyIncrease}% duty increase`,
        affectedProducts: userProfile.products || [],
        createdAt: new Date().toISOString()
      });
    }

    // Alert 2: Product-specific alerts
    if (userProfile.products && userProfile.products.length > 0) {
      const hasElectronics = userProfile.products.some(p => 
        p.toLowerCase().includes('electronic') || 
        p.toLowerCase().includes('wire') || 
        p.toLowerCase().includes('cable')
      );
      
      if (hasElectronics) {
        alerts.push({
          id: 'electronics-alert-' + Date.now(),
          title: 'Electronics Sector Impact',
          severity: 'medium',
          impact: 'Supply chain disruption expected',
          affectedProducts: userProfile.products.filter(p => 
            p.toLowerCase().includes('electronic') || 
            p.toLowerCase().includes('wire') || 
            p.toLowerCase().includes('cable')
          ),
          createdAt: new Date().toISOString()
        });
      }
    }

    // Alert 3: Geographic routing opportunities
    if (userProfile.supplyChain && userProfile.supplyChain.includes('China')) {
      alerts.push({
        id: 'routing-opportunity-' + Date.now(),
        title: 'Mexico Routing Opportunity',
        severity: 'opportunity',
        impact: `Potential ${SYSTEM_CONFIG.alerts.minTariffSavings}-${SYSTEM_CONFIG.alerts.maxTariffSavings}% tariff savings`,
        description: 'Triangle routing through Mexico could save significant duties',
        createdAt: new Date().toISOString()
      });
    }

    return alerts;
  };

  // Initialize on mount and set up periodic refresh
  useEffect(() => {
    calculateAlertCount();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      calculateAlertCount();
    }, SYSTEM_CONFIG.alerts.refreshIntervalMs); // Configurable refresh interval
    
    return () => clearInterval(interval);
  }, []);

  // Listen for user profile changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'triangle-user-profile') {
        calculateAlertCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    alertCount,
    alerts,
    loading,
    refreshAlerts: calculateAlertCount
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;