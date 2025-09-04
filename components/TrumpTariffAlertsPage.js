/**
 * TRUMP TARIFF ALERTS PAGE COMPONENT
 * Integrates with Triangle Intelligence existing component architecture
 * 
 * Features:
 * - Real-time alert dashboard
 * - Customer subscription management
 * - Impact calculations
 * - Integration with existing Triangle Intelligence styling
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, DollarSign, TrendingUp, Bell, Settings, RefreshCw } from 'lucide-react';

export default function TrumpTariffAlertsPage({ customerId, companyName }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlertsData();
    loadMonitoringStatus();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadAlertsData, 120000);
    return () => clearInterval(interval);
  }, [customerId]);

  const loadAlertsData = async () => {
    if (!customerId) return;
    
    try {
      const response = await fetch('/api/trump-tariff-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_customer_alerts',
          data: { customerId }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringStatus = async () => {
    try {
      const response = await fetch(`/api/trump-tariff-monitoring?customer_id=${customerId}&include_alerts=true&days=7`);
      const result = await response.json();
      
      if (result.success) {
        setMonitoringStatus(result);
      }
    } catch (error) {
      console.error('Failed to load monitoring status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAlertsData(), loadMonitoringStatus()]);
    setRefreshing(false);
  };

  const markAsRead = async (alertId) => {
    try {
      // Update local state immediately
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read_status: true } : alert
      ));
      
      // TODO: API call to mark as read
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'low': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Trump-era tariff alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="page-title">
                🚨 Trump-Era Tariff Alerts
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring for {companyName || 'your business'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Status */}
      {monitoringStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                monitoringStatus.monitoring?.healthy 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-red-700 bg-red-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  monitoringStatus.monitoring?.healthy ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {monitoringStatus.monitoring?.healthy ? 'Monitoring Active' : 'System Issues'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Bell className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Active Sources</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {monitoringStatus.monitoring?.activeSources || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-900">Recent Updates</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {monitoringStatus.recentUpdates?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Your Alerts</p>
                    <p className="text-2xl font-bold text-green-600">
                      {alerts.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">Unread</p>
                    <p className="text-2xl font-bold text-red-600">
                      {alerts.filter(a => !a.read_status).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Tariff Alerts ({alerts.length})
            </h2>
          </div>
          
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
              <p className="text-gray-500">
                You&apos;ll see Trump-era tariff alerts here when they affect your tracked products.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className={`p-6 ${!alert.read_status ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {alert.alert_title}
                          </h3>
                          
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </div>
                          
                          {alert.estimated_impact && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Estimated Impact</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Annual Cost Increase</p>
                                  <p className="font-bold text-red-600">
                                    {formatCurrency(alert.estimated_impact.cost_increase)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Rate Increase</p>
                                  <p className="font-bold text-orange-600">
                                    +{alert.estimated_impact.percentage_increase?.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Products Affected</p>
                                  <p className="font-bold text-blue-600">
                                    {alert.estimated_impact.affected_products}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                            {alert.alert_message}
                          </div>
                          
                          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <h4 className="font-medium text-yellow-900 mb-2">Recommended Actions</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                {alert.recommended_actions.slice(0, 5).map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6 flex-shrink-0 text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(alert.created_at)}
                          </p>
                          {!alert.read_status && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trump Era Context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Trump-Era Tariff Volatility Warning
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Tariff rates are changing rapidly during this administration. 
                  Triangle Intelligence monitors government sources 24/7 to keep you informed.
                  <span className="font-semibold"> Stay vigilant and check daily.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}