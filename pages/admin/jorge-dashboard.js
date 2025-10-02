/**
 * Jorge's Dashboard - Modular Component Version
 * Four tabs: Service Queue, Supplier Vetting, Market Entry, Supplier Intel
 * Uses modular components for maintainability
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

// Import Jorge's specialized tab components
import ServiceQueueTab from '../../components/jorge/ServiceQueueTab';
import SupplierSourcingTab from '../../components/jorge/SupplierSourcingTab';
import ManufacturingFeasibilityTab from '../../components/jorge/ManufacturingFeasibilityTab';
import MarketEntryTab from '../../components/jorge/MarketEntryTab';

export default function JorgeDashboardCleanModular() {
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('supplier-sourcing');
  const [serviceRequests, setServiceRequests] = useState([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      // Wait for auth context to finish loading
      if (authLoading) {
        return;
      }

      // Check if user is authenticated
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Load service requests
        await loadServiceRequests();
        setLoading(false);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user, authLoading, router]);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge');
      const data = await response.json();
      if (data.success) {
        setServiceRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
      setServiceRequests([]);
    }
  };

  const handleRequestUpdate = async (requestId, updateData) => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, ...updateData })
      });
      if (response.ok) {
        await loadServiceRequests();
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'service-queue':
        return <ServiceQueueTab />;
      case 'supplier-sourcing':
        return <SupplierSourcingTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'manufacturing-feasibility':
        return <ManufacturingFeasibilityTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'market-entry':
        return <MarketEntryTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      default:
        return <ServiceQueueTab />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          {authLoading ? 'Verifying authentication...' : 'Loading Jorge\'s Dashboard...'}
        </div>
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
              <h1 className="dashboard-title">Mexico Trade Services Dashboard</h1>
              <div className="user-info">
                <span className="user-name">Mexico Trade Specialist</span>
                <span className="user-role">Supplier Sourcing • Manufacturing • Market Entry</span>
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