// lib/services/integrated-tariff-system.js
// Single system that updates database AND generates customer alerts

export class IntegratedTariffSystem {
  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  // CORE WORKFLOW: Monitor → Update Database → Generate Alerts
  async processNewTariffUpdate(updateData) {
    console.log('🔄 Processing tariff update:', updateData.title);
    
    try {
      // STEP 1: Update your existing database tables
      const databaseUpdates = await this.updateTriangleDatabase(updateData);
      
      // STEP 2: Find affected customers
      const affectedCustomers = await this.findAffectedCustomers(databaseUpdates);
      
      // STEP 3: Generate alerts for customers  
      const alerts = await this.generateCustomerAlerts(databaseUpdates, affectedCustomers);
      
      // STEP 4: Store alerts in database (for alerts page)
      await this.storeAlertsInDatabase(alerts);
      
      // STEP 5: Send notifications
      await this.sendNotifications(alerts);
      
      console.log('✅ Tariff update processed successfully');
      return { databaseUpdates, alerts, affectedCustomers: affectedCustomers.length };
      
    } catch (error) {
      console.error('❌ Failed to process tariff update:', error);
      throw error;
    }
  }

  // STEP 1: Update your existing Triangle Intelligence database
  async updateTriangleDatabase(updateData) {
    const updates = {
      tariffRatesUpdated: [],
      hsCodes: [],
      usmcaRulesChanged: []
    };

    // Update your existing tariff_rates table
    for (const change of updateData.changes) {
      if (change.type === 'tariff_rate') {
        const { data, error } = await this.supabase
          .from('tariff_rates')
          .upsert({
            hs_code: change.hsCode,
            country: change.country || 'US',
            mfn_rate: change.newRate,
            usmca_rate: change.usmcaRate || 0,
            effective_date: change.effectiveDate,
            source: `${change.source}_${new Date().toISOString().split('T')[0]}`,
            last_verified: new Date().toISOString(),
            trump_era_update: true,
            regulatory_reference: change.documentNumber
          });

        if (!error) {
          updates.tariffRatesUpdated.push({
            hsCode: change.hsCode,
            oldRate: change.oldRate,
            newRate: change.newRate,
            source: change.source
          });
        }
      }
    }

    // Update your comtrade_reference table if HS codes affected
    for (const hsCode of updateData.affectedHSCodes) {
      const { data, error } = await this.supabase
        .from('comtrade_reference')
        .update({
          mfn_tariff_rate: updateData.newRates[hsCode],
          last_updated: new Date().toISOString(),
          trump_era_volatile: true
        })
        .eq('hs_code', hsCode);
    }

    return updates;
  }

  // STEP 2: Find customers affected by these changes
  async findAffectedCustomers(databaseUpdates) {
    const affectedHSCodes = databaseUpdates.tariffRatesUpdated.map(u => u.hsCode);
    
    // Query your existing customer data (however you store it)
    const { data: customers, error } = await this.supabase
      .from('customer_product_tracking') // Your customer table
      .select('*')
      .overlaps('tracked_hs_codes', affectedHSCodes);

    if (error) {
      console.error('Error finding affected customers:', error);
      return [];
    }

    return customers || [];
  }

  // STEP 3: Generate alerts for affected customers
  async generateCustomerAlerts(databaseUpdates, customers) {
    const alerts = [];

    for (const customer of customers) {
      for (const update of databaseUpdates.tariffRatesUpdated) {
        // Check if customer tracks this HS code
        if (customer.tracked_hs_codes?.includes(update.hsCode)) {
          const alert = {
            customer_id: customer.id,
            alert_type: 'TARIFF_RATE_CHANGE',
            severity: this.calculateSeverity(update.oldRate, update.newRate),
            title: `Tariff Alert: ${update.hsCode}`,
            message: this.generateAlertMessage(update, customer),
            hs_codes_affected: [update.hsCode],
            old_rate: update.oldRate,
            new_rate: update.newRate,
            effective_date: new Date().toISOString(),
            estimated_impact: await this.calculateImpact(customer, update),
            action_required: true,
            trump_era_alert: true,
            created_at: new Date().toISOString(),
            is_read: false,
            notification_sent: false
          };

          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  // STEP 4: Store alerts in database (powers your alerts page)
  async storeAlertsInDatabase(alerts) {
    const { data, error } = await this.supabase
      .from('customer_alerts')
      .insert(alerts);

    if (error) {
      console.error('Error storing alerts:', error);
      throw error;
    }

    return data;
  }

  // STEP 5: Send notifications (email, SMS, etc.)
  async sendNotifications(alerts) {
    for (const alert of alerts) {
      try {
        // Multi-channel notification
        await this.sendEmail(alert);
        
        if (alert.severity === 'CRITICAL') {
          await this.sendSMS(alert);
        }
        
        // Mark as sent
        await this.supabase
          .from('customer_alerts')
          .update({ notification_sent: true })
          .eq('id', alert.id);
          
      } catch (error) {
        console.error(`Failed to send notification for alert ${alert.id}:`, error);
      }
    }
  }

  generateAlertMessage(update, customer) {
    const changeDirection = update.newRate > update.oldRate ? 'INCREASE' : 'DECREASE';
    const changeAmount = Math.abs(update.newRate - update.oldRate);
    
    return `TARIFF ${changeDirection}: HS Code ${update.hsCode}

OLD RATE: ${update.oldRate}%
NEW RATE: ${update.newRate}%
CHANGE: ${changeDirection === 'INCREASE' ? '+' : '-'}${changeAmount}%

EFFECTIVE: Immediately
SOURCE: ${update.source}

${changeDirection === 'INCREASE' ? 'COST IMPACT: Higher import duties' : 'SAVINGS: Lower import duties'}

RECOMMENDED ACTIONS:
• Review pending shipments
• Update pricing calculations
• Consider USMCA qualification options
• Contact customs broker if needed

This is a Trump-era rapid change. Monitor for additional updates.`;
  }

  calculateSeverity(oldRate, newRate) {
    const change = Math.abs(newRate - oldRate);
    
    if (change >= 20) return 'CRITICAL';
    if (change >= 10) return 'HIGH';
    if (change >= 5) return 'MEDIUM';
    return 'LOW';
  }

  async calculateImpact(customer, update) {
    // Estimate based on customer's trade volume and rate change
    const rateChange = update.newRate - update.oldRate;
    const estimatedAnnualCost = (customer.estimated_annual_volume || 1000000) * (rateChange / 100);
    
    return {
      annualCostChange: estimatedAnnualCost,
      percentageImpact: rateChange,
      recommendation: estimatedAnnualCost > 50000 ? 'URGENT_REVIEW' : 'MONITOR'
    };
  }
}

// pages/api/integrated-tariff-updates.js
// API endpoint that handles both database updates and alert generation

import { IntegratedTariffSystem } from '../../lib/services/integrated-tariff-system';

export default async function handler(req, res) {
  const system = new IntegratedTariffSystem();
  
  if (req.method === 'POST') {
    const { action, data } = req.body;
    
    switch (action) {
      case 'process_tariff_update':
        try {
          const result = await system.processNewTariffUpdate(data);
          return res.json({
            success: true,
            ...result,
            message: 'Tariff update processed and alerts generated'
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to process tariff update',
            details: error.message
          });
        }

      case 'get_customer_alerts':
        try {
          const alerts = await system.getCustomerAlerts(data.customerId, data.filters);
          return res.json({
            success: true,
            alerts,
            unreadCount: alerts.filter(a => !a.is_read).length
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to get customer alerts'
          });
        }

      case 'mark_alert_read':
        try {
          await system.markAlertAsRead(data.alertId);
          return res.json({ success: true });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to mark alert as read'
          });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Database schema additions for alerts system
const alertsSchema = `
-- Add to your existing Supabase database
CREATE TABLE IF NOT EXISTS customer_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  alert_type TEXT NOT NULL, -- 'TARIFF_RATE_CHANGE', 'USMCA_RULE_CHANGE', 'DEADLINE_REMINDER'
  severity TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  hs_codes_affected TEXT[], -- Array of affected HS codes
  old_rate DECIMAL,
  new_rate DECIMAL,
  effective_date TIMESTAMP,
  estimated_impact JSONB, -- Store impact calculations
  action_required BOOLEAN DEFAULT false,
  trump_era_alert BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  regulatory_reference TEXT -- Link to source document
);

-- Index for performance
CREATE INDEX idx_customer_alerts_customer_id ON customer_alerts(customer_id);
CREATE INDEX idx_customer_alerts_unread ON customer_alerts(customer_id) WHERE is_read = false;
CREATE INDEX idx_customer_alerts_trump_era ON customer_alerts(trump_era_alert) WHERE trump_era_alert = true;

-- Customer product tracking table (if not exists)
CREATE TABLE IF NOT EXISTS customer_product_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID,
  company_name TEXT,
  tracked_hs_codes TEXT[], -- HS codes customer imports
  supplier_countries TEXT[], -- Countries they import from
  estimated_annual_volume BIGINT,
  alert_preferences JSONB DEFAULT '{"email": true, "sms": false, "webhook": false}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// React component for alerts page
const CustomerAlertsPage = `
// pages/alerts.js
// Customer alerts page powered by the integrated system

import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';

export default function CustomerAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/integrated-tariff-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_customer_alerts',
          data: { 
            customerId: 'current_customer_id', // Get from auth
            filters: { severity: filter === 'all' ? null : filter }
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await fetch('/api/integrated-tariff-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_alert_read',
          data: { alertId }
        })
      });
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 border-red-500 text-red-900';
      case 'HIGH': return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  if (loading) return <div className="p-6">Loading alerts...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tariff Alerts</h1>
        <p className="text-gray-600">Real-time updates on tariff changes affecting your imports</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm \${
                filter === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }\`}
            >
              {tab === 'all' ? 'All Alerts' : tab}
              {tab === 'all' && alerts.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {alerts.filter(a => !a.is_read).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={\`border-l-4 p-6 bg-white rounded-lg shadow \${getSeverityColor(alert.severity)} \${
              !alert.is_read ? 'ring-2 ring-blue-200' : ''
            }\`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="text-lg font-semibold">{alert.title}</h3>
                  {alert.trump_era_alert && (
                    <span className="bg-red-600 text-white px-2 py-1 text-xs rounded">
                      TRUMP ERA
                    </span>
                  )}
                  {!alert.is_read && (
                    <span className="bg-blue-600 text-white px-2 py-1 text-xs rounded">
                      NEW
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                    {alert.message}
                  </pre>
                </div>
                
                {alert.estimated_impact && (
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <h4 className="font-medium text-sm mb-2">Estimated Impact:</h4>
                    <p className="text-sm">
                      Annual Cost Change: \${alert.estimated_impact.annualCostChange?.toLocaleString() || 'TBD'}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
              
              <div className="ml-4">
                {!alert.is_read && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
          <p className="text-gray-500">You're all caught up! We'll notify you of any tariff changes.</p>
        </div>
      )}
    </div>
  );
}
`;