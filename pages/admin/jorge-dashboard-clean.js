/**
 * Jorge's Dashboard - Modular Component Version
 * Four tabs: Service Queue, Supplier Vetting, Market Entry, Supplier Intel
 * Uses modular components for maintainability
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';

// Import Jorge's specialized tab components
import ServiceQueueTab from '../../components/jorge/ServiceQueueTab';
import SupplierSourcingTab from '../../components/jorge/SupplierSourcingTab';
import ManufacturingFeasibilityTab from '../../components/jorge/ManufacturingFeasibilityTab';
import MarketEntryTab from '../../components/jorge/MarketEntryTab';

export default function JorgeDashboardCleanModular() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('supplier-sourcing');

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check authentication
        const stored = localStorage.getItem('triangle_user_session');
        if (!stored) {
          router.push('/login');
          return;
        }

        const authUser = JSON.parse(stored);
        if (!authUser.email || !authUser.loggedIn) {
          router.push('/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        router.push('/login');
      }
    };

    initializeDashboard();
  }, [router]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'service-queue':
        return <ServiceQueueTab />;
      case 'supplier-sourcing':
        return <SupplierSourcingTab />;
      case 'manufacturing-feasibility':
        return <ManufacturingFeasibilityTab />;
      case 'market-entry':
        return <MarketEntryTab />;
      default:
        return <ServiceQueueTab />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading Jorge's Dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Mexico Trade Partnership & Intelligence Dashboard" />
      </Head>

      <div className="admin-layout">
        <AdminNavigation />

        <main className="admin-main">
          <div className="dashboard-header">
            <div className="header-content">
              <h1 className="dashboard-title">Jorge's Partnership Dashboard</h1>
              <div className="user-info">
                <span className="user-name">Jorge Martinez</span>
                <span className="user-role">Mexico Trade Specialist</span>
              </div>
            </div>

            <div className="dashboard-metrics">
              <div className="metric-card">
                <h3 className="metric-title">Active Partnerships</h3>
                <div className="metric-value">12</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Monthly Revenue</h3>
                <div className="metric-value">$45,500</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Intelligence Reports</h3>
                <div className="metric-value">8</div>
              </div>
            </div>
          </div>

          <div className="dashboard-tabs">
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'service-queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('service-queue')}
              >
                📋 Service Queue
              </button>
              <button
                className={`tab-button ${activeTab === 'supplier-sourcing' ? 'active' : ''}`}
                onClick={() => setActiveTab('supplier-sourcing')}
              >
                🔍 Supplier Sourcing
              </button>
              <button
                className={`tab-button ${activeTab === 'manufacturing-feasibility' ? 'active' : ''}`}
                onClick={() => setActiveTab('manufacturing-feasibility')}
              >
                🏭 Manufacturing Feasibility
              </button>
              <button
                className={`tab-button ${activeTab === 'market-entry' ? 'active' : ''}`}
                onClick={() => setActiveTab('market-entry')}
              >
                🚀 Market Entry
              </button>
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}