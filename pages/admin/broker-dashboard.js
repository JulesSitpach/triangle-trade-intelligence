/**
 * Cristina's Dashboard - Modular Component Version
 * Five tabs: Service Queue, USMCA Certificates, HS Classification, Document Review, Monthly Support, Crisis Response
 * Uses modular components for maintainability (following Jorge's pattern)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';

// Import Cristina's modular tab components
import ServiceQueueTab from '../../components/broker/ServiceQueueTab';
import ServiceWorkflowTab from '../../components/shared/ServiceWorkflowTab';
import { getServiceConfig } from '../../config/service-configurations';

export default function CristinaDashboardModular() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service-queue');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [cristinaServices, setCristinaServices] = useState([]);

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

        // Load service configurations and requests (no hardcoding)
        const { getServicesForTeamMember } = await import('../../config/service-configurations');
        const services = getServicesForTeamMember('cristina');
        const serviceConfigs = services.map(serviceType => getServiceConfig(serviceType));
        setCristinaServices(serviceConfigs);

        // Load actual service requests from database
        const response = await fetch('/api/admin/service-requests');
        const data = await response.json();
        if (data.success && data.requests) {
          const cristinaRequests = data.requests.filter(req =>
            services.includes(req.service_type) || req.assigned_to === 'Cristina'
          );
          setServiceRequests(cristinaRequests);
        }

        setLoading(false);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        router.push('/login');
      }
    };

    initializeDashboard();
  }, [router]);

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
      case 'service-queue':
        return <ServiceQueueTab />;
      case 'usmca-certificate':
        return <ServiceWorkflowTab serviceConfig={getServiceConfig('usmca-certificate')} teamMember="cristina" />;
      case 'hs-classification':
        return <ServiceWorkflowTab serviceConfig={getServiceConfig('hs-classification')} teamMember="cristina" />;
      case 'document-review':
        return <ServiceWorkflowTab serviceConfig={getServiceConfig('document-review')} teamMember="cristina" />;
      case 'monthly-compliance-support':
        return <ServiceWorkflowTab serviceConfig={getServiceConfig('monthly-compliance-support')} teamMember="cristina" />;
      case 'compliance-crisis-response':
        return <ServiceWorkflowTab serviceConfig={getServiceConfig('compliance-crisis-response')} teamMember="cristina" />;
      default:
        return <ServiceQueueTab />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading Cristina's Dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cristina's Compliance Dashboard - Triangle Intelligence</title>
        <meta name="description" content="SMB Compliance & Document Validation Services" />
      </Head>

      <div className="admin-layout">
        <AdminNavigation />

        <main className="admin-main">
          <div className="dashboard-header">
            <div className="header-content">
              <h1 className="dashboard-title">Cristina's Compliance Services</h1>
              <div className="user-info">
                <span className="user-name">Cristina Martinez</span>
                <span className="user-role">SMB Compliance Specialist</span>
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
                className={`tab-button ${activeTab === 'service-queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('service-queue')}
              >
                📋 Service Queue
              </button>
              <button
                className={`tab-button ${activeTab === 'usmca-certificate' ? 'active' : ''}`}
                onClick={() => setActiveTab('usmca-certificate')}
              >
                📜 USMCA Certificates
              </button>
              <button
                className={`tab-button ${activeTab === 'hs-classification' ? 'active' : ''}`}
                onClick={() => setActiveTab('hs-classification')}
              >
                🔍 HS Classification
              </button>
              <button
                className={`tab-button ${activeTab === 'document-review' ? 'active' : ''}`}
                onClick={() => setActiveTab('document-review')}
              >
                📋 Document Review
              </button>
              <button
                className={`tab-button ${activeTab === 'monthly-compliance-support' ? 'active' : ''}`}
                onClick={() => setActiveTab('monthly-compliance-support')}
              >
                📞 Monthly Support
              </button>
              <button
                className={`tab-button ${activeTab === 'compliance-crisis-response' ? 'active' : ''}`}
                onClick={() => setActiveTab('compliance-crisis-response')}
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