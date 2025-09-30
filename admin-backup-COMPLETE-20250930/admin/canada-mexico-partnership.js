/**
 * Canada-Mexico Strategic Partnership Dashboard
 * Track opportunities from the new bilateral agreement
 * Real-time updates on USMCA review, trade opportunities, and executive partnerships
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';
import TeamChatWidget from '../../components/admin/TeamChatWidget';

export default function CanadaMexicoPartnership() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('opportunities');
  // Detail panel state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Partnership data states
  const [partnershipOpportunities, setPartnershipOpportunities] = useState([]);
  const [executiveConnections, setExecutiveConnections] = useState([]);
  const [criticalMinerals, setCriticalMinerals] = useState([]);
  const [railOpportunities, setRailOpportunities] = useState([]);

  // Filtering states
  const [sectorFilter, setSectorFilter] = useState('all');

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(stored);
      if (!userData.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
      loadPartnershipData();
    } catch {
      router.push('/login');
    }
  }, []);

  const loadPartnershipData = async () => {
    try {
      setLoading(true);
      console.log('🍁🇲🇽 Loading Canada-Mexico partnership data from database...');

      // Load partnership data from database-driven APIs
      const [opportunitiesResponse, executivesResponse, railResponse, mineralsResponse] = await Promise.all([
        fetch('/api/admin/canada-mexico-opportunities'), // Now database-driven
        fetch('/api/admin/executive-partnerships'), // Now database-driven
        fetch('/api/admin/cpkc-rail-opportunities-db'), // Database version
        fetch('/api/admin/critical-minerals-trade-db') // Database version
      ]);

      // Process opportunities data from database
      if (opportunitiesResponse.ok) {
        const data = await opportunitiesResponse.json();
        if (data.success) {
          setPartnershipOpportunities(data.opportunities || []);
          setTradeCorridors(data.trade_corridors || []);
          setUsmcaUpdates(data.usmca_updates || []);
        } else {
          console.error('Database query failed for opportunities:', data.error);
        }
      }

      // Process executive connections from database
      if (executivesResponse.ok) {
        const data = await executivesResponse.json();
        if (data.success) {
          setExecutiveConnections(data.executives || []);
        } else {
          console.error('Database query failed for executives:', data.error);
        }
      }

      // Process rail opportunities from database
      if (railResponse.ok) {
        const data = await railResponse.json();
        if (data.success) {
          setRailOpportunities(data.rail_routes || []);
        } else {
          console.error('Database query failed for rail routes:', data.error);
        }
      }

      // Process critical minerals from database
      if (mineralsResponse.ok) {
        const data = await mineralsResponse.json();
        if (data.success) {
          setCriticalMinerals(data.minerals || []);
        } else {
          console.error('Database query failed for minerals:', data.error);
        }
      }

    } catch (error) {
      console.error('Database connection error:', error);
      // Show error state instead of fallback data
      setPartnershipOpportunities([]);
      setExecutiveConnections([]);
      setRailOpportunities([]);
      setCriticalMinerals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClick = (record, recordType) => {
    setSelectedRecord({ ...record, recordType });
    setDetailPanelOpen(true);
  };

  const renderOpportunities = () => (
    <div className="space-y-6">
      {/* Database Metrics - Using Salesforce Revenue Cards */}
      <div className="revenue-cards">
        <div className="revenue-card jorge">
          <div className="revenue-amount">🍁 {partnershipOpportunities.length}</div>
          <div className="revenue-label">Partnership Opportunities (Database)</div>
        </div>

        <div className="revenue-card cristina">
          <div className="revenue-amount">👥 {executiveConnections.length}</div>
          <div className="revenue-label">Canadian Executives in Mexico</div>
        </div>

        <div className="revenue-card joint">
          <div className="revenue-amount">🚂 {railOpportunities.length}</div>
          <div className="revenue-label">CPKC Rail Routes (DB-driven)</div>
        </div>

        <div className="revenue-card jorge">
          <div className="revenue-amount">⚡ {criticalMinerals.length}</div>
          <div className="revenue-label">Critical Minerals with HS Codes</div>
        </div>
      </div>

      {/* Partnership Opportunities Table - Using Salesforce Styles */}
      <div className="admin-card">
        <div className="card-header">
          <h3>Strategic Partnership Opportunities</h3>
          <div className="flex gap-2">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="admin-btn secondary"
            >
              <option value="all">All Sectors</option>
              <option value="energy">Energy</option>
              <option value="minerals">Critical Minerals</option>
              <option value="rail">Rail Transport</option>
              <option value="auto">Automotive</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Sector</th>
                <th>Value (USD)</th>
                <th>Timeline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partnershipOpportunities.length > 0 ? partnershipOpportunities.map((opportunity) => (
                <tr key={opportunity.id} className="admin-row" onClick={() => handleRecordClick(opportunity, 'partnership_opportunity')}>
                  <td>
                    <div className="client-info">
                      <div className="client-name">{opportunity.title}</div>
                      <div className="client-details">{opportunity.description}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${
                      opportunity.sector === 'energy' ? 'status-pending' :
                      opportunity.sector === 'minerals' ? 'status-completed' :
                      opportunity.sector === 'rail' ? 'status-in-progress' :
                      'status-on-hold'
                    }`}>
                      {opportunity.sector}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {opportunity.estimated_value_usd ?
                      `$${(opportunity.estimated_value_usd / 1000000000).toFixed(1)}B` :
                      'TBD'
                    }
                  </td>
                  <td className="timeline-cell">
                    <div className="timeline-date">
                      {opportunity.timeline_start} - {opportunity.timeline_end}
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${
                      opportunity.status === 'active' ? 'status-in-progress' :
                      opportunity.status === 'planning' ? 'status-pending' :
                      'status-on-hold'
                    }`}>
                      {opportunity.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="admin-btn secondary">View Details</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    <div className="client-info">
                      <div className="client-name">Database Connection Required</div>
                      <div className="client-details">Partnership opportunities will load from database</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExecutives = () => (
    <div className="space-y-6">
      {/* Executive Connections */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Key Executive Partnerships</h3>
          <p className="text-sm text-gray-600">Canadian executives with significant Mexico operations</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executive
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mexico Operations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partnership Potential
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">François Poirier</div>
                  <div className="text-sm text-gray-500">CEO</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">TC Energy</div>
                  <div className="text-sm text-gray-500">Calgary-based</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Southeast Gateway Pipeline
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $3.9B
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    High
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Keith Creel</div>
                  <div className="text-sm text-gray-500">President & CEO</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">CPKC</div>
                  <div className="text-sm text-gray-500">Rail Network</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Direct Canada-Mexico Rail
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Multi-billion
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Critical
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Scott Thomson</div>
                  <div className="text-sm text-gray-500">President & CEO</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Scotiabank</div>
                  <div className="text-sm text-gray-500">Financial Services</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  4th largest loan portfolio
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Billions
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Medium
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRailOpportunities = () => (
    <div className="space-y-6">
      {/* CPKC Rail Network Opportunities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CPKC Rail Network Optimization</h3>
          <p className="text-sm text-gray-600">Direct Canada-Mexico shipping routes via CPKC network</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route Visualization */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Primary Routes</h4>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl mr-3">🚂</span>
                  <div>
                    <div className="font-medium">Vancouver → Mexico City</div>
                    <div className="text-sm text-gray-600">Direct CPKC route, 5-7 days transit</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl mr-3">🚂</span>
                  <div>
                    <div className="font-medium">Calgary → Monterrey</div>
                    <div className="text-sm text-gray-600">Energy corridor route, 4-6 days</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl mr-3">🚂</span>
                  <div>
                    <div className="font-medium">Toronto → Guadalajara</div>
                    <div className="text-sm text-gray-600">Manufacturing hub connection</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Triangle Routing Benefits */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Triangle Routing Advantages</h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-yellow-800">USMCA Compliance</div>
                  <div className="text-sm text-yellow-700">Maintain preferential tariff rates</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">Cost Savings</div>
                  <div className="text-sm text-green-700">15-25% vs direct US routes</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800">Capacity</div>
                  <div className="text-sm text-blue-700">Dedicated Canada-Mexico lanes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCriticalMinerals = () => (
    <div className="space-y-6">
      {/* Critical Minerals Trade */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Minerals Trade Opportunities</h3>
          <p className="text-sm text-gray-600">Energy transition materials for North American supply chains</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mineral
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HS Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Canada Production
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mexico Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triangle Routing Benefit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Lithium</div>
                  <div className="text-sm text-gray-500">Battery grade</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2805.19
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    High
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Growing
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  USMCA 0% tariff
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Copper</div>
                  <div className="text-sm text-gray-500">Refined</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  7403.11
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Major Producer
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    High
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Regional supply chain
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Nickel</div>
                  <div className="text-sm text-gray-500">Class I</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  7502.10
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    World Leader
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Emerging
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Strategic positioning
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Canada-Mexico Partnership | Triangle Intelligence</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNavigation currentPage="Canada-Mexico Partnership" />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍁🇲🇽</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Canada-Mexico Strategic Partnership</h1>
                <p className="text-gray-600">Track opportunities from the new bilateral agreement</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'opportunities', name: 'Partnership Opportunities', icon: '🎯' },
                { id: 'executives', name: 'Executive Connections', icon: '👥' },
                { id: 'rail', name: 'CPKC Rail Network', icon: '🚂' },
                { id: 'minerals', name: 'Critical Minerals', icon: '⚡' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'opportunities' && renderOpportunities()}
            {activeTab === 'executives' && renderExecutives()}
            {activeTab === 'rail' && renderRailOpportunities()}
            {activeTab === 'minerals' && renderCriticalMinerals()}
          </div>
        </div>

        {/* Detail Panel */}
        {detailPanelOpen && (
          <SimpleDetailPanel
            record={selectedRecord}
            onClose={() => setDetailPanelOpen(false)}
            onSave={(updatedRecord) => {
              console.log('Partnership record updated:', updatedRecord);
              setDetailPanelOpen(false);
            }}
          />
        )}

        {/* Team Chat Widget */}
        <TeamChatWidget
          dashboardContext="partnership"
          userName={user?.username || 'admin'}
          language="english"
          minimized={true}
        />
      </div>
    </>
  );
}