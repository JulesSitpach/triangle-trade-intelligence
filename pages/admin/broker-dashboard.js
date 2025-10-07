/**
 * Cristina's Dashboard - Modular Component Version
 * 4 tabs: Service Queue, USMCA Certificates, HS Classification, Crisis Response
 * Uses modular components for maintainability (following Jorge's pattern)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

// Import Cristina's modular tab components
import USMCACertificateTab from '../../components/cristina/USMCACertificateTab';
import HSClassificationTab from '../../components/cristina/HSClassificationTab';
import CrisisResponseTab from '../../components/cristina/CrisisResponseTab';

export default function CristinaDashboardModular() {
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('usmca-certificate');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [cristinaServices, setCristinaServices] = useState([]);

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
        // Load service requests for Cristina
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
      const response = await fetch('/api/admin/service-requests?assigned_to=Cristina');
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
      case 'usmca-certificate':
        return <USMCACertificateTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'hs-classification':
        return <HSClassificationTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      case 'compliance-crisis-response':
        return <CrisisResponseTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
      default:
        return <USMCACertificateTab requests={serviceRequests} onRequestUpdate={handleRequestUpdate} />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          {authLoading ? 'Verifying authentication...' : 'Loading Cristina\'s Dashboard...'}
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
              <h1 className="dashboard-title">Compliance Services Dashboard</h1>
              <div className="user-info">
                <span className="user-name">Compliance Specialist</span>
                <span className="user-role">USMCA Certificates • HS Classification • Crisis Response</span>
              </div>
            </div>

            <div className="dashboard-metrics">
              <div className="metric-card">
                <h3 className="metric-title">Monthly Revenue</h3>
                <div className="metric-value">${calculateRevenue().toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Capacity Utilization</h3>
                <div className="metric-value">{calculateCapacityUtilization()}%</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Active Services</h3>
                <div className="metric-value">{serviceRequests.length}</div>
              </div>
            </div>
          </div>

          <div className="dashboard-tabs">
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'usmca-certificate' ? 'active' : ''}`}
                onClick={() => setActiveTab('usmca-certificate')}
                data-tab="usmca-certificate"
              >
                📜 USMCA Certificates
              </button>
              <button
                className={`tab-button ${activeTab === 'hs-classification' ? 'active' : ''}`}
                onClick={() => setActiveTab('hs-classification')}
                data-tab="hs-classification"
              >
                🔍 HS Classification
              </button>
              <button
                className={`tab-button ${activeTab === 'compliance-crisis-response' ? 'active' : ''}`}
                onClick={() => setActiveTab('compliance-crisis-response')}
                data-tab="crisis-response"
              >
                🆘 Crisis Response
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