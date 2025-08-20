/**
 * SALES OPERATIONS DASHBOARD - Enterprise Bloomberg Terminal Style
 * Integrated with Triangle Intelligence Platform
 * PURPOSE: Partnership sales pipeline management with Bloomberg-style professionalism
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSmartT } from '../lib/smartT';

export default function SalesOperationsDashboard() {
  const { smartT } = useSmartT();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');

  useEffect(() => {
    loadSalesOperationsData();
  }, []);

  const loadSalesOperationsData = async () => {
    try {
      // In production, this would call the specialist-leads API
      const response = await fetch('/api/specialist-leads');
      const leadsData = await response.json();
      
      // Enhanced sales data with Triangle Intelligence integration
      const mockSalesData = {
        // Executive KPI Overview
        executive: {
          monthlyRevenue: 425000,
          quarterlyTarget: 1200000,
          conversionRate: 31.2,
          averageDealSize: 187500,
          totalPipeline: 2850000,
          activeSpecialists: 8
        },

        // Pipeline Overview from Triangle Intelligence
        pipeline: {
          totalLeads: leadsData.success ? leadsData.totalLeads : 0,
          qualifiedLeads: leadsData.success ? leadsData.leads?.length : 0,
          activeDeals: 12,
          closedThisMonth: 3,
          avgDealSize: 125000,
          conversionRate: 24.5
        },

        // Live Lead Data from Triangle Intelligence Platform
        liveLeads: leadsData.success ? leadsData.leads : [],

        // Commission Tracking
        commissions: {
          thisMonth: 67500,
          thisQuarter: 185000,
          ytd: 425000,
          target: 600000,
          avgCommission: 22500,
          topDeal: 45000
        },

        // Specialist Network Performance
        specialists: [
          {
            id: 'spec_001',
            name: 'Carlos Mendez',
            location: 'Mexico City',
            specialty: 'Electronics Manufacturing',
            activeDeals: 5,
            closedQ4: 7,
            revenue: 387500,
            rating: 4.9,
            responseTime: '2.3h',
            status: 'available',
            languages: ['ES', 'EN'],
            certifications: ['USMCA', 'Electronics']
          },
          {
            id: 'spec_002',
            name: 'Ana Gutierrez',
            location: 'Guadalajara',
            specialty: 'Industrial Manufacturing',
            activeDeals: 4,
            closedQ4: 5,
            revenue: 412500,
            rating: 4.8,
            responseTime: '1.8h',
            status: 'busy',
            languages: ['ES', 'EN'],
            certifications: ['USMCA', 'Manufacturing']
          },
          {
            id: 'spec_003',
            name: 'Roberto Silva',
            location: 'Tijuana',
            specialty: 'Automotive',
            activeDeals: 3,
            closedQ4: 6,
            revenue: 297500,
            rating: 4.7,
            responseTime: '3.1h',
            status: 'available',
            languages: ['ES', 'EN'],
            certifications: ['USMCA', 'Automotive']
          }
        ],

        // Performance Metrics
        performance: {
          platformLeads: leadsData.success ? leadsData.totalLeads : 0,
          platformConversion: 31.2,
          avgCloseTime: 18,
          satisfaction: 4.6,
          repeatBusiness: 23,
          referrals: 18
        }
      };

      setSalesData(mockSalesData);
    } catch (error) {
      console.error('Failed to load sales data:', error);
      // Fallback to demo data
      setSalesData(getDemoSalesData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoSalesData = () => ({
    executive: { monthlyRevenue: 425000, quarterlyTarget: 1200000, conversionRate: 31.2 },
    pipeline: { totalLeads: 47, qualifiedLeads: 23, activeDeals: 12 },
    liveLeads: [],
    commissions: { thisMonth: 67500, thisQuarter: 185000 },
    specialists: [],
    performance: { platformLeads: 34, platformConversion: 31.2 }
  });

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const getTierColor = (tier) => {
    switch(tier?.toUpperCase()) {
      case 'PLATINUM': return 'var(--bloomberg-yellow)';
      case 'GOLD': return 'var(--bloomberg-orange)';
      case 'SILVER': return 'var(--bloomberg-gray-300)';
      case 'BRONZE': return 'var(--bloomberg-gray-400)';
      default: return 'var(--bloomberg-blue)';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency?.toUpperCase()) {
      case 'HIGH': return 'var(--bloomberg-red)';
      case 'MEDIUM': return 'var(--bloomberg-orange)';
      case 'LOW': return 'var(--bloomberg-green)';
      default: return 'var(--bloomberg-gray-400)';
    }
  };

  if (loading) {
    return (
      <div className="bloomberg-container">
        <div className="bloomberg-card">
          <div className="bloomberg-text-center bloomberg-p-xl">
            <div className="loading-spinner"></div>
            <h3>{smartT('salesOperations.loading', 'Loading Sales Operations...')}</h3>
            <p>{smartT('salesOperations.loadingDesc', 'Retrieving pipeline and commission data')}</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'pipeline', name: smartT('salesOperations.tabs.pipeline', 'Pipeline'), icon: '🎯' },
    { id: 'specialists', name: smartT('salesOperations.tabs.specialists', 'Specialists'), icon: '🇲🇽' },
    { id: 'commissions', name: smartT('salesOperations.tabs.commissions', 'Commissions'), icon: '💰' },
    { id: 'analytics', name: smartT('salesOperations.tabs.analytics', 'Analytics'), icon: '📊' }
  ];

  return (
    <div className="bloomberg-container">
      {/* Header with Real-Time Metrics */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <div>
            <h1 className="bloomberg-card-title">
              🤝 {smartT('salesOperations.title', 'Partnership Sales Operations')}
            </h1>
            <p className="bloomberg-text-muted">
              {smartT('salesOperations.subtitle', 'Triangle Intelligence Platform Lead Management')}
            </p>
          </div>
          <div className="bloomberg-status bloomberg-status-success">
            <div className="bloomberg-status-dot"></div>
            {smartT('salesOperations.status.live', 'LIVE PIPELINE')}
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-lg">
          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">
                {formatCurrency(salesData.commissions.thisMonth)}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('salesOperations.kpi.monthlyCommissions', 'Monthly Commissions')}
              </div>
            </div>
            <div className="bloomberg-metric-change positive">
              +{((salesData.commissions.thisMonth / salesData.commissions.target) * 100).toFixed(0)}% {smartT('common.ofTarget', 'of target')}
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-warning">
                {salesData.pipeline.activeDeals}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('salesOperations.kpi.activeDeals', 'Active Deals')}
              </div>
            </div>
            <div className="bloomberg-metric-change positive">
              {smartT('common.avg', 'Avg')}: {formatCurrency(salesData.pipeline.avgDealSize)}
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-info">
                {salesData.pipeline.qualifiedLeads}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('salesOperations.kpi.qualifiedLeads', 'Qualified Leads')}
              </div>
            </div>
            <div className="bloomberg-metric-change positive">
              {salesData.pipeline.conversionRate}% {smartT('salesOperations.conversion', 'conversion')}
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">
                {salesData.performance.platformLeads}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('salesOperations.kpi.platformLeads', 'Platform Leads')}
              </div>
            </div>
            <div className="bloomberg-metric-change positive">
              {salesData.performance.platformConversion}% {smartT('salesOperations.convert', 'convert')}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bloomberg-tabs bloomberg-mb-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`bloomberg-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="bloomberg-tab-icon">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Pipeline View */}
      {activeTab === 'pipeline' && (
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">
              🎯 {smartT('salesOperations.pipeline.hotLeads', 'Hot Leads from Triangle Intelligence')}
            </h3>
            <div className="bloomberg-status bloomberg-status-warning">
              {smartT('salesOperations.pipeline.actionRequired', 'ACTION REQUIRED')}
            </div>
          </div>

          <div className="leads-table">
            {salesData.liveLeads.length > 0 ? (
              salesData.liveLeads.map((lead) => (
                <div key={lead.id} className="lead-row bloomberg-border-bottom bloomberg-p-md">
                  <div className="bloomberg-grid bloomberg-grid-3 bloomberg-items-center">
                    <div className="lead-info">
                      <div className="lead-company bloomberg-text-lg bloomberg-font-semibold">
                        {lead.companyName}
                      </div>
                      <div className="lead-details bloomberg-text-sm bloomberg-text-muted">
                        {lead.businessType} • {lead.importVolume} • {lead.supplierCountry}
                      </div>
                      <div className="lead-specialist bloomberg-text-xs">
                        {smartT('salesOperations.assignedTo', 'Assigned to')}: {lead.assignedSpecialist || 'Unassigned'}
                      </div>
                    </div>

                    <div className="lead-metrics bloomberg-text-center">
                      <div className="lead-savings bloomberg-text-success bloomberg-text-lg bloomberg-font-semibold">
                        {formatCurrency(lead.totalSavings)}
                      </div>
                      <div className="bloomberg-text-xs bloomberg-text-muted">
                        {smartT('salesOperations.potentialSavings', 'Potential Savings')}
                      </div>
                      <div className="lead-commission bloomberg-text-xs">
                        {smartT('salesOperations.commission', 'Commission')}: {formatCurrency(lead.specialistFeePool)}
                      </div>
                    </div>

                    <div className="lead-actions bloomberg-text-right">
                      <div className="bloomberg-mb-sm">
                        <span 
                          className="bloomberg-badge"
                          style={{ backgroundColor: getTierColor(lead.tier) }}
                        >
                          {lead.tier}
                        </span>
                        <span 
                          className="bloomberg-badge bloomberg-ml-sm"
                          style={{ backgroundColor: getUrgencyColor(lead.urgency) }}
                        >
                          {lead.urgency}
                        </span>
                      </div>
                      <div className="bloomberg-flex bloomberg-gap-sm">
                        <button className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-sm">
                          {smartT('salesOperations.actions.claim', 'Claim Lead')}
                        </button>
                        <button className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-sm">
                          {smartT('salesOperations.actions.details', 'Details')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bloomberg-text-center bloomberg-p-xl bloomberg-text-muted">
                <h4>{smartT('salesOperations.noLeads', 'No active leads at this time')}</h4>
                <p>{smartT('salesOperations.noLeadsDesc', 'New leads will appear here when users complete the Triangle Intelligence platform')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specialists View */}
      {activeTab === 'specialists' && (
        <div className="bloomberg-grid bloomberg-grid-2 bloomberg-gap-lg">
          {salesData.specialists.map((specialist) => (
            <div key={specialist.id} className="bloomberg-card">
              <div className="bloomberg-card-header">
                <div>
                  <h4 className="bloomberg-card-title">{specialist.name}</h4>
                  <p className="bloomberg-text-muted">{specialist.location} • {specialist.specialty}</p>
                </div>
                <div className={`bloomberg-status bloomberg-status-${specialist.status === 'available' ? 'success' : 'warning'}`}>
                  {specialist.status.toUpperCase()}
                </div>
              </div>

              <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-md">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value">{specialist.activeDeals}</div>
                  <div className="bloomberg-metric-label">{smartT('salesOperations.activeDeals', 'Active Deals')}</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value">{formatCurrency(specialist.revenue)}</div>
                  <div className="bloomberg-metric-label">{smartT('salesOperations.revenue', 'Revenue')}</div>
                </div>
              </div>

              <div className="specialist-details">
                <div className="bloomberg-flex bloomberg-justify-between bloomberg-mb-sm">
                  <span>{smartT('salesOperations.rating', 'Rating')}</span>
                  <span>⭐ {specialist.rating}</span>
                </div>
                <div className="bloomberg-flex bloomberg-justify-between bloomberg-mb-sm">
                  <span>{smartT('salesOperations.responseTime', 'Response Time')}</span>
                  <span>{specialist.responseTime}</span>
                </div>
                <div className="bloomberg-flex bloomberg-justify-between bloomberg-mb-sm">
                  <span>{smartT('salesOperations.languages', 'Languages')}</span>
                  <span>{specialist.languages.join(', ')}</span>
                </div>
              </div>

              <div className="bloomberg-flex bloomberg-gap-sm bloomberg-mt-md">
                <button className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-sm">
                  {smartT('salesOperations.actions.contact', 'Contact')}
                </button>
                <button className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-sm">
                  {smartT('salesOperations.actions.assign', 'Assign Lead')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commissions View */}
      {activeTab === 'commissions' && (
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">
              💰 {smartT('salesOperations.commissions.tracking', 'Commission Tracking')}
            </h3>
          </div>

          <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-lg">
            <div className="bloomberg-metric-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value text-success">
                  {formatCurrency(salesData.commissions.thisMonth)}
                </div>
                <div className="bloomberg-metric-label">
                  {smartT('salesOperations.commissions.thisMonth', 'This Month')}
                </div>
              </div>
            </div>

            <div className="bloomberg-metric-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value text-info">
                  {formatCurrency(salesData.commissions.thisQuarter)}
                </div>
                <div className="bloomberg-metric-label">
                  {smartT('salesOperations.commissions.thisQuarter', 'This Quarter')}
                </div>
              </div>
            </div>

            <div className="bloomberg-metric-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value text-warning">
                  {formatCurrency(salesData.commissions.ytd)}
                </div>
                <div className="bloomberg-metric-label">
                  {smartT('salesOperations.commissions.ytd', 'Year to Date')}
                </div>
              </div>
            </div>
          </div>

          <div className="commission-progress">
            <h4 className="bloomberg-mb-md">
              {smartT('salesOperations.commissions.annualProgress', 'Annual Progress')}
            </h4>
            <div className="bloomberg-progress-bar">
              <div 
                className="bloomberg-progress-fill"
                style={{ 
                  width: `${(salesData.commissions.ytd / salesData.commissions.target) * 100}%`,
                  backgroundColor: 'var(--bloomberg-green)'
                }}
              ></div>
            </div>
            <div className="bloomberg-flex bloomberg-justify-between bloomberg-mt-sm bloomberg-text-sm">
              <span>{formatCurrency(salesData.commissions.ytd)}</span>
              <span>{formatCurrency(salesData.commissions.target)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && (
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">
              📊 {smartT('salesOperations.analytics.performance', 'Performance Analytics')}
            </h3>
          </div>

          <div className="bloomberg-grid bloomberg-grid-2 bloomberg-gap-lg">
            <div className="bloomberg-metric-card">
              <h4 className="bloomberg-mb-md">
                {smartT('salesOperations.analytics.platformIntegration', 'Platform Integration Success')}
              </h4>
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value text-success">
                  {salesData.performance.platformConversion}%
                </div>
                <div className="bloomberg-metric-label">
                  {smartT('salesOperations.analytics.conversionRate', 'Platform Lead Conversion')}
                </div>
              </div>
            </div>

            <div className="bloomberg-metric-card">
              <h4 className="bloomberg-mb-md">
                {smartT('salesOperations.analytics.efficiency', 'Operational Efficiency')}
              </h4>
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value text-info">
                  {salesData.performance.avgCloseTime} {smartT('common.days', 'days')}
                </div>
                <div className="bloomberg-metric-label">
                  {smartT('salesOperations.analytics.avgCloseTime', 'Average Close Time')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Center */}
      <div className="bloomberg-card bloomberg-mt-lg">
        <div className="bloomberg-flex bloomberg-justify-between bloomberg-items-center">
          <div>
            <h3 className="bloomberg-card-title">
              🚀 {smartT('salesOperations.actionCenter', 'Action Center')}
            </h3>
            <p className="bloomberg-text-muted">
              {smartT('salesOperations.actionCenterDesc', 'Quick access to key sales operations')}
            </p>
          </div>
          <div className="bloomberg-flex bloomberg-gap-md">
            <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
              {smartT('salesOperations.actions.generateLeads', 'Generate New Leads')} →
            </Link>
            <button className="bloomberg-btn bloomberg-btn-secondary">
              {smartT('salesOperations.actions.exportReport', 'Export Pipeline Report')}
            </button>
            <Link href="/dashboard-hub" className="bloomberg-btn bloomberg-btn-ghost">
              {smartT('salesOperations.actions.mainDashboard', 'Main Dashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}