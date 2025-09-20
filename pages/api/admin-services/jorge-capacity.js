/**
 * Jorge's Capacity API - Real capacity tracking from database
 * Monthly limits and current usage for service delivery
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Query service completions for current month
    const { data: completedServices, error: serviceError } = await supabase
      .from('service_completions')
      .select('service_type, hours_spent, completed_at')
      .eq('provider', 'Jorge')
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString());

    if (serviceError) {
      console.error('Service completions query error:', serviceError);
    }

    // Query active intelligence subscriptions
    const { data: intelligenceClients, error: intError } = await supabase
      .from('intelligence_subscriptions')
      .select('client_id, subscription_status')
      .eq('provider', 'Jorge')
      .eq('subscription_status', 'active');

    if (intError) {
      console.error('Intelligence subscriptions query error:', intError);
    }

    // Calculate current usage
    let supplierVettingCount = 0;
    let strategyHours = 0;

    if (completedServices) {
      completedServices.forEach(service => {
        if (service.service_type === 'supplier-vetting') {
          supplierVettingCount++;
        } else if (service.service_type === 'market-entry') {
          strategyHours += service.hours_spent || 4; // Default 4 hours if not tracked
        }
      });
    }

    const activeIntelligenceClients = intelligenceClients ? intelligenceClients.length : 0;

    // Define monthly capacity limits
    const capacityLimits = {
      supplier_vetting: 10,  // Max 10 supplier vetting projects per month
      strategy_hours: 15,    // Max 15 hours strategy consulting per month
      intelligence_clients: 20 // Target 20+ intelligence subscribers
    };

    // Service pricing
    const servicePricing = {
      supplier_vetting: 750,
      strategy_hours: 400,
      intelligence_clients: 300
    };

    // Calculate capacity utilization
    const capacityData = {
      supplier_vetting: {
        current: supplierVettingCount,
        limit: capacityLimits.supplier_vetting,
        price: servicePricing.supplier_vetting,
        utilization: (supplierVettingCount / capacityLimits.supplier_vetting) * 100,
        revenue: supplierVettingCount * servicePricing.supplier_vetting
      },
      strategy_hours: {
        current: strategyHours,
        limit: capacityLimits.strategy_hours,
        price: servicePricing.strategy_hours,
        utilization: (strategyHours / capacityLimits.strategy_hours) * 100,
        revenue: strategyHours * servicePricing.strategy_hours
      },
      intelligence_clients: {
        current: activeIntelligenceClients,
        limit: capacityLimits.intelligence_clients,
        price: servicePricing.intelligence_clients,
        utilization: (activeIntelligenceClients / capacityLimits.intelligence_clients) * 100,
        revenue: activeIntelligenceClients * servicePricing.intelligence_clients
      }
    };

    // Calculate overall capacity status
    const overallUtilization = Object.values(capacityData).reduce((sum, service) => {
      return sum + service.utilization;
    }, 0) / 3;

    return res.status(200).json({
      success: true,
      capacity: capacityData,
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      overall_utilization: Math.round(overallUtilization),
      warnings: generateCapacityWarnings(capacityData),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Jorge capacity:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: 'Could not load capacity data'
    });
  }
}

// Generate capacity warnings
function generateCapacityWarnings(capacityData) {
  const warnings = [];

  Object.entries(capacityData).forEach(([serviceType, data]) => {
    if (data.utilization >= 90) {
      warnings.push({
        type: 'critical',
        service: serviceType,
        message: `${serviceType.replace('_', ' ')} capacity at ${Math.round(data.utilization)}% - Stop accepting new projects`
      });
    } else if (data.utilization >= 75) {
      warnings.push({
        type: 'warning',
        service: serviceType,
        message: `${serviceType.replace('_', ' ')} capacity at ${Math.round(data.utilization)}% - Limit new intake`
      });
    }
  });

  return warnings;
}