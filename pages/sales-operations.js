/**
 * SALES OPERATIONS PAGE - Triangle Intelligence Platform
 * Dedicated page for sales operations management
 * Bloomberg Terminal styling with comprehensive sales functionality
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSmartT } from '../lib/smartT';
import SalesOperationsDashboard from '../components/SalesOperationsDashboard';
import SpecialistNetworkManager from '../components/SpecialistNetworkManager';

export default function SalesOperationsPage() {
  const { smartT } = useSmartT();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { 
      id: 'dashboard', 
      name: smartT('salesOperations.tabs.dashboard', 'Sales Dashboard'), 
      icon: '📊',
      description: smartT('salesOperations.tabs.dashboardDesc', 'Pipeline management and commission tracking')
    },
    { 
      id: 'specialists', 
      name: smartT('salesOperations.tabs.specialistNetwork', 'Specialist Network'), 
      icon: '🇲🇽',
      description: smartT('salesOperations.tabs.specialistDesc', 'Mexican trade specialists and expertise')
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'specialists':
        return <SpecialistNetworkManager />;
      case 'dashboard':
      default:
        return <SalesOperationsDashboard />;
    }
  };

  return (
    <>
      <Head>
        <title>Sales Operations - Triangle Intelligence Platform</title>
        <meta name="description" content="Partnership sales operations, lead management, and Mexican specialist network for Triangle Intelligence Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Bloomberg Professional Navigation */}
      <header className="bloomberg-nav">
        <div className="bloomberg-container">
          <div className="bloomberg-flex bloomberg-justify-between bloomberg-items-center">
            <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-lg">
              <Link href="/dashboard-hub" className="bloomberg-nav-brand">
                Triangle Intelligence
              </Link>
              <div className="bloomberg-nav-breadcrumb">
                <Link href="/dashboard-hub" className="bloomberg-nav-link">
                  {smartT('nav.dashboard', 'Dashboard')}
                </Link>
                <span className="bloomberg-nav-separator">→</span>
                <span className="bloomberg-nav-current">
                  {smartT('nav.salesOperations', 'Sales Operations')}
                </span>
              </div>
            </div>
            <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-md">
              <div className="bloomberg-status bloomberg-status-success">
                <div className="bloomberg-status-dot"></div>
                {smartT('salesOperations.status.live', 'LIVE PIPELINE')}
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                {smartT('nav.getStarted', 'Get Started')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="bloomberg-container bloomberg-py-lg">
        {/* Page Header */}
        <div className="bloomberg-section bloomberg-mb-xl">
          <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <div>
                <h1 className="bloomberg-hero-title">
                  🤝 {smartT('salesOperations.title', 'Sales Operations Hub')}
                </h1>
                <p className="bloomberg-hero-subtitle">
                  {smartT('salesOperations.subtitle', 'Comprehensive partnership sales management with Mexican specialist network')}
                </p>
              </div>
              <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-md">
                <div className="bloomberg-metric-card bloomberg-metric-compact">
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-success">$425K</div>
                    <div className="bloomberg-metric-label">
                      {smartT('salesOperations.monthlyRevenue', 'Monthly Revenue')}
                    </div>
                  </div>
                </div>
                <div className="bloomberg-metric-card bloomberg-metric-compact">
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-info">31.2%</div>
                    <div className="bloomberg-metric-label">
                      {smartT('salesOperations.conversionRate', 'Conversion Rate')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bloomberg-tabs bloomberg-mt-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`bloomberg-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <div className="bloomberg-tab-content">
                    <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-sm">
                      <span className="bloomberg-tab-icon">{tab.icon}</span>
                      <span className="bloomberg-tab-name">{tab.name}</span>
                    </div>
                    <div className="bloomberg-tab-description">
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="bloomberg-section">
          {renderTabContent()}
        </div>

        {/* Quick Actions Panel */}
        <div className="bloomberg-section bloomberg-mt-xl">
          <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h3 className="bloomberg-card-title">
                🚀 {smartT('salesOperations.quickActions', 'Quick Actions')}
              </h3>
              <p className="bloomberg-text-muted">
                {smartT('salesOperations.quickActionsDesc', 'Streamlined access to key sales operations')}
              </p>
            </div>

            <div className="bloomberg-grid bloomberg-grid-4 bloomberg-gap-md">
              <Link href="/partnership" className="bloomberg-action-card">
                <div className="bloomberg-action-icon">🎯</div>
                <div className="bloomberg-action-content">
                  <h4 className="bloomberg-action-title">
                    {smartT('salesOperations.actions.generateLeads', 'Generate Leads')}
                  </h4>
                  <p className="bloomberg-action-description">
                    {smartT('salesOperations.actions.generateLeadsDesc', 'Create new partnership opportunities')}
                  </p>
                </div>
              </Link>

              <div className="bloomberg-action-card bloomberg-cursor-pointer">
                <div className="bloomberg-action-icon">🇲🇽</div>
                <div className="bloomberg-action-content">
                  <h4 className="bloomberg-action-title">
                    {smartT('salesOperations.actions.manageSpecialists', 'Manage Specialists')}
                  </h4>
                  <p className="bloomberg-action-description">
                    {smartT('salesOperations.actions.manageSpecialistsDesc', 'Coordinate Mexican specialist network')}
                  </p>
                </div>
              </div>

              <div className="bloomberg-action-card bloomberg-cursor-pointer">
                <div className="bloomberg-action-icon">📊</div>
                <div className="bloomberg-action-content">
                  <h4 className="bloomberg-action-title">
                    {smartT('salesOperations.actions.analytics', 'View Analytics')}
                  </h4>
                  <p className="bloomberg-action-description">
                    {smartT('salesOperations.actions.analyticsDesc', 'Performance metrics and insights')}
                  </p>
                </div>
              </div>

              <Link href="/dashboard-hub" className="bloomberg-action-card">
                <div className="bloomberg-action-icon">🏠</div>
                <div className="bloomberg-action-content">
                  <h4 className="bloomberg-action-title">
                    {smartT('salesOperations.actions.mainDashboard', 'Main Dashboard')}
                  </h4>
                  <p className="bloomberg-action-description">
                    {smartT('salesOperations.actions.mainDashboardDesc', 'Return to executive hub')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Integration Information */}
        <div className="bloomberg-section bloomberg-mt-xl">
          <div className="bloomberg-card bloomberg-border-info">
            <div className="bloomberg-card-header">
              <h3 className="bloomberg-card-title text-info">
                🔄 {smartT('salesOperations.integration.title', 'Platform Integration')}
              </h3>
            </div>
            <div className="bloomberg-card-content">
              <div className="bloomberg-grid bloomberg-grid-3 bloomberg-gap-lg">
                <div className="bloomberg-integration-feature">
                  <h4 className="bloomberg-font-semibold bloomberg-mb-sm">
                    {smartT('salesOperations.integration.triangleIntel', 'Triangle Intelligence')}
                  </h4>
                  <p className="bloomberg-text-sm bloomberg-text-muted">
                    {smartT('salesOperations.integration.triangleIntelDesc', 'Leads automatically generated from platform users completing the 6-page intelligence journey')}
                  </p>
                </div>
                <div className="bloomberg-integration-feature">
                  <h4 className="bloomberg-font-semibold bloomberg-mb-sm">
                    {smartT('salesOperations.integration.usmcaNetwork', 'USMCA Specialist Network')}
                  </h4>
                  <p className="bloomberg-text-sm bloomberg-text-muted">
                    {smartT('salesOperations.integration.usmcaNetworkDesc', 'Certified Mexican specialists with proven track records in triangle routing implementation')}
                  </p>
                </div>
                <div className="bloomberg-integration-feature">
                  <h4 className="bloomberg-font-semibold bloomberg-mb-sm">
                    {smartT('salesOperations.integration.realTimeData', 'Real-Time Intelligence')}
                  </h4>
                  <p className="bloomberg-text-sm bloomberg-text-muted">
                    {smartT('salesOperations.integration.realTimeDataDesc', 'Live market data and commission calculations based on current tariff volatility')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}