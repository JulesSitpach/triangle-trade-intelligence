/**
 * Cristina's Dashboard - Team Collaboration Services
 * All services are SHARED with Jorge - different lead/support roles per service
 * Cristina leads: USMCA Optimization (70%), Supply Chain Opt (60%), Crisis Navigator (60%)
 * Jorge leads: Pathfinder (65%), Supply Chain Resilience (60%), Manufacturing (60%)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { requireAdminAuth } from '../../lib/auth/serverAuth';

// Import shared service tab components (Team Collaboration Model)
import TradeHealthCheckTab from '../../components/shared/TradeHealthCheckTab';
import USMCAAdvantageTab from '../../components/shared/USMCAAdvantageTab';
import SupplyChainOptimizationTab from '../../components/shared/SupplyChainOptimizationTab';
import PathfinderTab from '../../components/shared/PathfinderTab';
import SupplyChainResilienceTab from '../../components/shared/SupplyChainResilienceTab';
import CrisisNavigatorTab from '../../components/shared/CrisisNavigatorTab';
import FloatingTeamChat from '../../components/shared/FloatingTeamChat';
import AdminIntelligenceMetrics from '../../components/admin/AdminIntelligenceMetrics';
import TariffPolicyUpdatesManager from '../../components/admin/TariffPolicyUpdatesManager';

export default function CristinaDashboardModular({ session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trade-health-check');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [cristinaServices, setCristinaServices] = useState([]);
  const [adminIntelligence, setAdminIntelligence] = useState(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Session is already verified server-side, just load data
        await loadServiceRequests();
        setLoading(false);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const loadServiceRequests = async () => {
    try {
      // Load ALL service requests (team collaboration - both Jorge and Cristina see everything)
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();
      if (data.success) {
        setServiceRequests(data.requests || []);
        // Extract admin intelligence metrics for opportunity prioritization
        if (data.summary && data.summary.admin_intelligence) {
          setAdminIntelligence(data.summary.admin_intelligence);
          console.log('📊 Admin intelligence loaded:', data.summary.admin_intelligence);
        }
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

  // Calculate metrics from actual data (no hardcoding)
  const calculateRevenue = () => {
    return cristinaServices.reduce((total, service) => {
      const requests = serviceRequests.filter(req => req.service_type === service.type);
      return total + (requests.length * service.price);
    }, 0);
  };

  const calculateCapacityUtilization = () => {
    if (cristinaServices.length === 0) return 0;
    const totalCurrent = serviceRequests.length;
    const totalCapacity = cristinaServices.reduce((sum, service) => sum + service.monthlyCapacity, 0);
    return totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trade-health-check':
        return <TradeHealthCheckTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} currentUser="Cristina" />;
      case 'usmca-advantage':
        return <USMCAAdvantageTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} userRole="Cristina" />;
      case 'supply-chain-optimization':
        return <SupplyChainOptimizationTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'pathfinder':
        return <PathfinderTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'supply-chain-resilience':
        return <SupplyChainResilienceTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'crisis-navigator':
        return <CrisisNavigatorTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'policy-updates':
        return <TariffPolicyUpdatesManager />;
      default:
        return <TradeHealthCheckTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} currentUser="Cristina" />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          Loading Cristina's Dashboard...
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cristina&apos;s Compliance Dashboard - Triangle Trade Intelligence</title>
        <meta name="description" content="SMB Compliance & Document Validation Services" />
      </Head>

      <div className="admin-layout">
        <AdminNavigation />

        <main className="admin-main">
          <div className="dashboard-header">
            <div className="header-content">
              <h1 className="dashboard-title">Cristina's Service Dashboard</h1>
              <div className="user-info">
                <span className="user-name">Trade Compliance Expert - Licensed Specialist</span>
                <span className="user-role">USMCA Advantage • Supply Chain Optimization • Crisis Navigator</span>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3 className="metric-title">Active Services</h3>
                <div className="metric-value">{serviceRequests.filter(r => r.status === 'in_progress').length}</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Pending Requests</h3>
                <div className="metric-value">{serviceRequests.filter(r => r.status === 'pending').length}</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Completed</h3>
                <div className="metric-value">{serviceRequests.filter(r => r.status === 'completed').length}</div>
              </div>
              <div className="metric-card metric-urgent">
                <h3 className="metric-title">🔥 Needs Attention</h3>
                <div className="metric-value">{serviceRequests.filter(r => r.status === 'pending' && new Date() - new Date(r.created_at) > 2 * 24 * 60 * 60 * 1000).length}</div>
              </div>
            </div>
          </div>

          {/* Admin Intelligence Metrics - Client Opportunity Data */}
          {adminIntelligence && (
            <AdminIntelligenceMetrics adminIntelligence={adminIntelligence} />
          )}

          <div className="dashboard-tabs">
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'trade-health-check' ? 'active' : ''}`}
                onClick={() => setActiveTab('trade-health-check')}
                data-tab="trade-health-check"
              >
                🏥 Trade Health Check <span className="service-price">$99</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'usmca-advantage' ? 'active' : ''}`}
                onClick={() => setActiveTab('usmca-advantage')}
                data-tab="usmca-advantage"
              >
                📜 USMCA Advantage Sprint <span className="service-price">$175</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'supply-chain-optimization' ? 'active' : ''}`}
                onClick={() => setActiveTab('supply-chain-optimization')}
                data-tab="supply-chain-optimization"
              >
                🔧 Supply Chain Optimization <span className="service-price">$275</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'pathfinder' ? 'active' : ''}`}
                onClick={() => setActiveTab('pathfinder')}
                data-tab="pathfinder"
              >
                🚀 Pathfinder Market Entry <span className="service-price">$350</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'supply-chain-resilience' ? 'active' : ''}`}
                onClick={() => setActiveTab('supply-chain-resilience')}
                data-tab="supply-chain-resilience"
              >
                🛡️ Supply Chain Resilience <span className="service-price">$450</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'crisis-navigator' ? 'active' : ''}`}
                onClick={() => setActiveTab('crisis-navigator')}
                data-tab="crisis-navigator"
              >
                🆘 Crisis Navigator <span className="service-price">$200/mo</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'policy-updates' ? 'active' : ''}`}
                onClick={() => setActiveTab('policy-updates')}
                data-tab="policy-updates"
              >
                🎯 Policy Updates <span className="badge badge-new">NEW</span>
              </button>
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </main>

        <FloatingTeamChat currentUser="Cristina" />
      </div>
    </>
  );
}

// Server-side authentication protection
export async function getServerSideProps(context) {
  return requireAdminAuth(context);
}