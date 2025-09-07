/**
 * TRUMP TARIFF MONITORING API ENDPOINT
 * Integrates with Triangle Intelligence existing API architecture
 * 
 * Endpoints:
 * POST /api/trump-tariff-monitoring - Control monitoring system
 * GET /api/trump-tariff-monitoring - Get monitoring status and recent alerts
 */

import { TrumpTariffMonitorService } from '../../lib/services/trump-tariff-monitor-service.js';
import { ProductionLogger } from '../../lib/utils/production-logger.js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';

// Use ProductionLogger as an object, not a constructor
const logger = ProductionLogger;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const monitor = new TrumpTariffMonitorService();
    
    if (req.method === 'POST') {
      return await handlePost(req, res, monitor);
    } else if (req.method === 'GET') {
      return await handleGet(req, res, monitor);
    } else {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed',
        supportedMethods: ['GET', 'POST']
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Trump tariff monitoring API error', error, { responseTime });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: SYSTEM_CONFIG.api.useMockData ? error.message : 'Server error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle POST requests - Control monitoring system
 */
async function handlePost(req, res, monitor) {
  const { action, data } = req.body;
  
  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action parameter required',
      supportedActions: [
        'start_monitoring',
        'stop_monitoring', 
        'force_urgent_check',
        'get_customer_alerts',
        'subscribe_customer',
        'update_customer_products'
      ]
    });
  }
  
  try {
    switch (action) {
      case 'start_monitoring':
        const startResult = await monitor.startRealTimeMonitoring();
        logger.info('Trump tariff monitoring started via API');
        return res.json({
          success: true,
          message: 'Trump-era real-time tariff monitoring started',
          checkSchedule: {
            urgent: `${monitor.checkSchedule.URGENT / 1000}s`,
            critical: `${monitor.checkSchedule.CRITICAL / 1000}s`,
            important: `${monitor.checkSchedule.IMPORTANT / 1000}s`
          },
          timestamp: new Date().toISOString()
        });
        
      case 'force_urgent_check':
        const urgentUpdates = await monitor.checkUrgentSources();
        logger.info('Forced urgent check completed', { updatesFound: urgentUpdates.length });
        return res.json({
          success: true,
          message: `Urgent check completed - found ${urgentUpdates.length} updates`,
          updates: urgentUpdates,
          timestamp: new Date().toISOString()
        });
        
      case 'get_customer_alerts':
        const customerId = data?.customerId;
        if (!customerId) {
          return res.status(400).json({
            success: false,
            error: 'Customer ID required for alerts lookup'
          });
        }
        
        const alerts = await getCustomerAlerts(customerId);
        return res.json({
          success: true,
          customerId,
          alerts,
          totalCount: alerts.length,
          unreadCount: alerts.filter(a => !a.read_status).length,
          timestamp: new Date().toISOString()
        });
        
      case 'subscribe_customer':
        const subscription = await subscribeCustomer(data);
        return res.json({
          success: true,
          message: 'Customer subscribed to tariff alerts successfully',
          subscription,
          timestamp: new Date().toISOString()
        });
        
      case 'update_customer_products':
        const products = await updateCustomerProducts(data);
        return res.json({
          success: true,
          message: 'Customer product tracking updated successfully',
          products,
          timestamp: new Date().toISOString()
        });
        
      case 'get_recent_impacts':
        const impacts = await getRecentTariffImpacts(data?.days || 30);
        return res.json({
          success: true,
          impacts,
          trumpEraContext: {
            averageChangeFrequency: '2.3 days',
            volatilityLevel: 'EXTREME',
            lastMajorChange: impacts[0]?.announcement_date,
            totalCustomersAffected: impacts.reduce((sum, impact) => sum + (impact.customers_affected || 0), 0)
          },
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported action: ${action}`,
          supportedActions: [
            'start_monitoring',
            'force_urgent_check',
            'get_customer_alerts', 
            'subscribe_customer',
            'update_customer_products',
            'get_recent_impacts'
          ]
        });
    }
  } catch (error) {
    logger.error(`Failed to handle action: ${action}`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to execute action: ${action}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle GET requests - Get monitoring status and alerts
 */
async function handleGet(req, res, monitor) {
  const { customer_id, include_alerts, days } = req.query;
  
  try {
    // Get health status
    const health = await monitor.healthCheck();
    
    // Get recent regulatory updates
    const recentUpdates = await getRecentRegulatoryUpdates(parseInt(days) || 7);
    
    // Get customer alerts if requested
    let customerAlerts = null;
    if (customer_id && include_alerts === 'true') {
      customerAlerts = await getCustomerAlerts(customer_id);
    }
    
    // Get overall statistics
    const stats = await getMonitoringStatistics();
    
    return res.json({
      success: true,
      monitoring: {
        healthy: health.healthy,
        activeSources: health.activeSources,
        lastUpdate: health.lastUpdate
      },
      recentUpdates: {
        count: recentUpdates.length,
        updates: recentUpdates.slice(0, 10), // Limit to 10 most recent
        period: `${days || 7} days`
      },
      customerAlerts: customerAlerts ? {
        total: customerAlerts.length,
        unread: customerAlerts.filter(a => !a.read_status).length,
        critical: customerAlerts.filter(a => a.severity === 'critical').length,
        alerts: customerAlerts.slice(0, 5) // Top 5 most recent
      } : null,
      statistics: stats,
      trumpEraContext: {
        description: 'Real-time monitoring active for unprecedented tariff volatility',
        riskLevel: 'EXTREME',
        recommendation: 'Monitor Triangle Intelligence dashboard daily for changes'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get monitoring status', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve monitoring status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get customer alerts from database
 */
async function getCustomerAlerts(customerId) {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    const { data: alerts, error } = await monitor.db.client
      .from('alert_instances')
      .select(`
        *,
        customer_alerts!inner(company_name, contact_email)
      `)
      .eq('customer_alerts.user_id', customerId)
      .or('read_status.eq.false,severity.eq.critical')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logger.error('Failed to fetch customer alerts', error);
      return [];
    }
    
    return alerts || [];
  } catch (error) {
    logger.error('Error fetching customer alerts', error);
    return [];
  }
}

/**
 * Subscribe customer to tariff alerts
 */
async function subscribeCustomer(data) {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    const {
      user_id,
      company_name,
      contact_email,
      hs_codes = [],
      countries = [],
      business_type,
      trade_volume_annually,
      notification_preferences = { email: true, in_app: true }
    } = data;
    
    if (!user_id || !company_name || !contact_email) {
      throw new Error('User ID, company name, and contact email are required');
    }
    
    const { data: subscription, error } = await monitor.db.client
      .from('customer_alerts')
      .upsert({
        user_id,
        company_name,
        contact_email,
        alert_type: 'trump_tariff',
        hs_codes,
        countries,
        business_type,
        trade_volume_annually,
        alert_priority: 'high',
        notification_preferences,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,alert_type'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    logger.info('Customer subscribed to Trump tariff alerts', { 
      userId: user_id, 
      company: company_name,
      hsCodesCount: hs_codes.length 
    });
    
    return subscription;
  } catch (error) {
    logger.error('Failed to subscribe customer', error);
    throw error;
  }
}

/**
 * Update customer product tracking
 */
async function updateCustomerProducts(data) {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    const { customer_alert_id, products } = data;
    
    if (!customer_alert_id || !Array.isArray(products)) {
      throw new Error('Customer alert ID and products array are required');
    }
    
    // Delete existing products for this customer
    await monitor.db.client
      .from('customer_product_tracking')
      .delete()
      .eq('customer_alert_id', customer_alert_id);
    
    // Insert new products
    const productInserts = products.map(product => ({
      customer_alert_id,
      hs_code: product.hs_code,
      product_description: product.description,
      supplier_countries: product.supplier_countries || [],
      annual_volume_usd: product.annual_volume_usd,
      unit_price_usd: product.unit_price_usd,
      priority_level: product.priority_level || 'medium'
    }));
    
    const { data: insertedProducts, error } = await monitor.db.client
      .from('customer_product_tracking')
      .insert(productInserts)
      .select();
    
    if (error) {
      throw error;
    }
    
    logger.info('Customer product tracking updated', { 
      customerId: customer_alert_id,
      productsCount: products.length 
    });
    
    return insertedProducts;
  } catch (error) {
    logger.error('Failed to update customer products', error);
    throw error;
  }
}

/**
 * Get recent tariff impacts
 */
async function getRecentTariffImpacts(days = 30) {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: impacts, error } = await monitor.db.client
      .from('regulatory_updates')
      .select('*')
      .eq('is_trump_era', true)
      .gte('announcement_date', cutoffDate)
      .order('announcement_date', { ascending: false });
    
    if (error) {
      logger.error('Failed to fetch recent tariff impacts', error);
      return [];
    }
    
    return impacts || [];
  } catch (error) {
    logger.error('Error fetching recent tariff impacts', error);
    return [];
  }
}

/**
 * Get recent regulatory updates
 */
async function getRecentRegulatoryUpdates(days = 7) {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: updates, error } = await monitor.db.client
      .from('regulatory_updates')
      .select('*')
      .gte('announcement_date', cutoffDate)
      .order('announcement_date', { ascending: false })
      .limit(20);
    
    if (error) {
      logger.error('Failed to fetch recent regulatory updates', error);
      return [];
    }
    
    return updates || [];
  } catch (error) {
    logger.error('Error fetching recent regulatory updates', error);
    return [];
  }
}

/**
 * Get monitoring statistics
 */
async function getMonitoringStatistics() {
  try {
    const monitor = new TrumpTariffMonitorService();
    
    // Get counts from various tables
    const [alertsResult, updatesResult, customersResult] = await Promise.all([
      monitor.db.client.from('alert_instances').select('count').single(),
      monitor.db.client.from('regulatory_updates').select('count').single(), 
      monitor.db.client.from('customer_alerts').select('count').eq('is_active', true).single()
    ]);
    
    return {
      totalAlerts: alertsResult.data?.count || 0,
      totalUpdates: updatesResult.data?.count || 0,
      activeCustomers: customersResult.data?.count || 0,
      systemStatus: 'operational'
    };
  } catch (error) {
    logger.error('Error fetching monitoring statistics', error);
    return {
      totalAlerts: 0,
      totalUpdates: 0,
      activeCustomers: 0,
      systemStatus: 'degraded'
    };
  }
}