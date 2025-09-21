/**
 * Cristina's Broker Dashboard - Streamlined Implementation
 * Uses modular tab components for better maintainability
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminNavigation from '../../components/AdminNavigation';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';
import TeamChatWidget from '../../components/admin/TeamChatWidget';

// Import tab components
import ServiceQueueTab from '../../components/broker/ServiceQueueTab';
import CertificateGenerationTab from '../../components/broker/CertificateGenerationTab';
import HSCodeClassificationTab from '../../components/broker/HSCodeClassificationTab';
import ShipmentTrackingTab from '../../components/broker/ShipmentTrackingTab';

import { CRISTINA_SERVICE_CAPACITY } from '../../config/service-capacity-config';

export default function BrokerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service-queue');

  // Detail panel state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check authentication using correct session key
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

        setUser(authUser);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const calculateTotalRevenue = () => {
    return (
      CRISTINA_SERVICE_CAPACITY.certificates.current * CRISTINA_SERVICE_CAPACITY.certificates.rate +
      CRISTINA_SERVICE_CAPACITY.classifications.current * CRISTINA_SERVICE_CAPACITY.classifications.rate +
      CRISTINA_SERVICE_CAPACITY.clearance.current * CRISTINA_SERVICE_CAPACITY.clearance.rate +
      CRISTINA_SERVICE_CAPACITY.crisis.current * CRISTINA_SERVICE_CAPACITY.crisis.rate
    );
  };

  const calculateCapacityUtilization = () => {
    const totalCurrent =
      CRISTINA_SERVICE_CAPACITY.certificates.current +
      CRISTINA_SERVICE_CAPACITY.classifications.current +
      CRISTINA_SERVICE_CAPACITY.clearance.current +
      CRISTINA_SERVICE_CAPACITY.crisis.current;

    const totalTarget =
      CRISTINA_SERVICE_CAPACITY.certificates.monthly_target +
      CRISTINA_SERVICE_CAPACITY.classifications.monthly_target +
      CRISTINA_SERVICE_CAPACITY.clearance.monthly_target +
      CRISTINA_SERVICE_CAPACITY.crisis.monthly_target;

    return Math.round((totalCurrent / totalTarget) * 100);
  };

  const renderTabContent = () => {
    const tabProps = {
      setSelectedRecord,
      setDetailPanelOpen
    };

    switch (activeTab) {
      case 'service-queue':
        return <ServiceQueueTab {...tabProps} />;
      case 'certificate-generation':
        return <CertificateGenerationTab {...tabProps} />;
      case 'hs-code-classification':
        return <HSCodeClassificationTab {...tabProps} />;
      case 'shipment-tracking':
        return <ShipmentTrackingTab {...tabProps} />;
      default:
        return <ServiceQueueTab {...tabProps} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading Broker Dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cristina's Broker Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Professional USMCA compliance and logistics dashboard" />
      </Head>

      <div className="admin-layout">
        <AdminNavigation />

        <main className="admin-main">
          <div className="dashboard-header">
            <div className="header-content">
              <h1 className="dashboard-title">Cristina's Broker Dashboard</h1>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Cristina Martinez'}</span>
                <span className="user-role">USMCA Compliance Specialist</span>
              </div>
            </div>

            <div className="dashboard-metrics">
              <div className="metric-card">
                <h3 className="metric-title">Monthly Revenue</h3>
                <div className="metric-value">${calculateTotalRevenue().toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Capacity Utilization</h3>
                <div className="metric-value">{calculateCapacityUtilization()}%</div>
              </div>
              <div className="metric-card">
                <h3 className="metric-title">Active Services</h3>
                <div className="metric-value">
                  {CRISTINA_SERVICE_CAPACITY.certificates.current +
                   CRISTINA_SERVICE_CAPACITY.classifications.current +
                   CRISTINA_SERVICE_CAPACITY.clearance.current +
                   CRISTINA_SERVICE_CAPACITY.crisis.current}
                </div>
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
                className={`tab-button ${activeTab === 'certificate-generation' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificate-generation')}
              >
                📜 Certificate Generation
              </button>
              <button
                className={`tab-button ${activeTab === 'hs-code-classification' ? 'active' : ''}`}
                onClick={() => setActiveTab('hs-code-classification')}
              >
                🔍 HS Code Classification
              </button>
              <button
                className={`tab-button ${activeTab === 'shipment-tracking' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipment-tracking')}
              >
                🚢 Shipment Tracking
              </button>
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </main>

        {detailPanelOpen && (
          <SimpleDetailPanel
            record={selectedRecord}
            onClose={() => {
              setDetailPanelOpen(false);
              setSelectedRecord(null);
            }}
          />
        )}

        <TeamChatWidget />
      </div>
    </>
  );
}