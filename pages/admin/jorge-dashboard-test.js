/**
 * Jorge's Dashboard - Minimal Test Version
 */

import { useState } from 'react';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';

export default function JorgeDashboardTest() {
  const [activeTab, setActiveTab] = useState('service-queue');

  return (
    <>
      <Head>
        <title>Jorge's Dashboard - Test</title>
      </Head>

      <div className="admin-layout">
        <AdminNavigation />

        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">Jorge's Dashboard - Test</h1>
            <p className="admin-subtitle">Latin America Trade Services</p>
          </div>

          <div className="dashboard-tabs">
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'service-queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('service-queue')}
              >
                Service Queue
              </button>
              <button
                className={`tab-button ${activeTab === 'supplier-vetting' ? 'active' : ''}`}
                onClick={() => setActiveTab('supplier-vetting')}
              >
                Supplier Vetting
              </button>
              <button
                className={`tab-button ${activeTab === 'market-entry' ? 'active' : ''}`}
                onClick={() => setActiveTab('market-entry')}
              >
                Market Entry
              </button>
              <button
                className={`tab-button ${activeTab === 'supplier-intel' ? 'active' : ''}`}
                onClick={() => setActiveTab('supplier-intel')}
              >
                Supplier Intel
              </button>
            </div>

            <div className="tab-content">
              <h2>Active Tab: {activeTab}</h2>
              <p>Dashboard is working! The 4 tabs are functioning correctly.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}