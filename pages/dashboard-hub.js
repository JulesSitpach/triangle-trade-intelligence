import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSmartT } from '../lib/smartT';
import { useMemoryOptimizedPolling } from '../hooks/useMemoryOptimization.js';
import SalesOperationsDashboard from '../components/SalesOperationsDashboard';

export default function DashboardHub() {
  const { smartT } = useSmartT();
  const [activeView, setActiveView] = useState('executive');
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState({
    tradeFlows: '500,800+',
    intelligence: '519,341+',
    networkEffects: '205+',
    compounds: '0',
    volatility: 'HIGH',
    lastUpdate: '--:--'
  });

  const [beastMasterStatus, setBeastMasterStatus] = useState({});
  const [compoundInsights, setCompoundInsights] = useState([]);
  const [intelligenceSources, setIntelligenceSources] = useState({});
  const [performance, setPerformance] = useState({});

  const dashboardViews = [
    { id: 'executive', name: 'Executive', icon: '📊' },
    { id: 'intelligence', name: 'Intelligence', icon: '🧠' },
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'implementation', name: 'Implementation', icon: '🚀' },
    { id: 'partnership', name: 'Partnership', icon: '🤝' },
    { id: 'sales', name: 'Sales Operations', icon: '🇲🇽' }
  ];

  // Set initial time only on client to avoid hydration mismatch
  useEffect(() => {
    setLiveData(prev => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString()
    }));
  }, []);

  // Memory-optimized Dashboard Hub Intelligence API connection
  const fetchIntelligenceData = async () => {
    try {
      const response = await fetch('/api/dashboard-hub-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardView: activeView,
          mockUserProfile: {
            businessType: 'Electronics',
            primarySupplierCountry: 'China',
            importVolume: '$1M - $5M',
            companyName: 'Dashboard Hub Demo',
            timelinePriority: 'COST'
          }
        })
      });

      if (response.ok) {
        const intelligenceData = await response.json();
        
        if (intelligenceData.success && intelligenceData.intelligence) {
          const intel = intelligenceData.intelligence;
          
          // Update live metrics with real data from Beast Master & Goldmine
          setLiveData({
            tradeFlows: intel.metrics.tradeFlows,
            intelligence: `${intel.metrics.totalRecords.toLocaleString()}+`,
            networkEffects: `${intel.metrics.networkSessions}+`,
            compounds: String(intel.metrics.compoundInsights),
            volatility: intel.marketContext.volatility,
            lastUpdate: new Date(intelligenceData.timestamp).toLocaleTimeString()
          });

          // Update Beast Master status with real activation data
          setBeastMasterStatus(intel.beastMasterStatus);
          
          // Update compound insights from real Beast Master activation
          setCompoundInsights(intel.compoundInsights);
          
          // Update intelligence sources from Goldmine Intelligence
          setIntelligenceSources(intel.intelligenceSources);
          
          // Update performance metrics
          setPerformance(intel.performance);
        }
      }
    } catch (error) {
      console.error('Dashboard Intelligence fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use memory-optimized polling with automatic cleanup (30-second intervals)
  useMemoryOptimizedPolling(fetchIntelligenceData, 30000, 'DashboardHub');

  // Re-fetch when view changes
  useEffect(() => {
    fetchIntelligenceData();
  }, [activeView]);

  const ExecutiveView = () => (
    <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-xl">
      {/* Enterprise Scale Metrics */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Enterprise Scale</h3>
          <div className="bloomberg-status bloomberg-status-success">MASSIVE</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">{liveData.intelligence}</div>
          <div className="bloomberg-metric-label">Total Intelligence Records</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">{liveData.tradeFlows}</div>
          <div className="bloomberg-metric-label">Trade Flow Analysis</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">{liveData.networkEffects}</div>
          <div className="bloomberg-metric-label">Network Learning Sessions</div>
        </div>
      </div>

      {/* Beast Master Intelligence */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Beast Master Intelligence</h3>
          <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
        </div>
        <div className="bloomberg-mb-lg">
          {Object.entries(beastMasterStatus).map(([beast, data]) => (
            <div key={beast} className="bloomberg-flex bloomberg-justify-between bloomberg-mb-sm">
              <span className="bloomberg-card-subtitle">{beast.charAt(0).toUpperCase() + beast.slice(1)}</span>
              <div className="bloomberg-flex">
                <span className="bloomberg-metric-value" style={{ fontSize: '14px', marginRight: '8px' }}>{data.confidence}%</span>
                <div className={`bloomberg-status ${data.status === 'ACTIVE' ? 'bloomberg-status-success' : 'bloomberg-status-error'}`}>
                  {data.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">{liveData.compounds}</div>
          <div className="bloomberg-metric-label">Compound Insights Generated</div>
        </div>
      </div>

      {/* Market Conditions */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Market Conditions</h3>
          <div className="bloomberg-status bloomberg-status-error">URGENT</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-error">{liveData.volatility}</div>
          <div className="bloomberg-metric-label">Tariff Volatility</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">25-50%</div>
          <div className="bloomberg-metric-label">Bilateral Risk Range</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">0%</div>
          <div className="bloomberg-metric-label">USMCA Protection</div>
        </div>
        <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
          Get Protected →
        </Link>
      </div>
    </div>
  );

  const IntelligenceView = () => (
    <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-xl">
      {/* Compound Insights */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Compound Intelligence</h3>
          <div className="bloomberg-status bloomberg-status-success">REAL-TIME</div>
        </div>
        <div className="bloomberg-mb-lg">
          {compoundInsights.map((insight, index) => (
            <div key={index} className="bloomberg-card bloomberg-mb-md" style={{ padding: '12px' }}>
              <div className="bloomberg-flex bloomberg-justify-between bloomberg-mb-sm">
                <span className="bloomberg-card-subtitle" style={{ fontSize: '12px' }}>{insight.type}</span>
                <div className={`bloomberg-status ${insight.urgency === 'high' ? 'bloomberg-status-error' : 'bloomberg-status-success'}`}>
                  {insight.confidence}%
                </div>
              </div>
              <p className="bloomberg-card-subtitle bloomberg-mb-sm">{insight.title}</p>
              <p style={{ fontSize: '12px', color: '#666' }}>{insight.actionable}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Sources */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Intelligence Sources</h3>
          <div className="bloomberg-status bloomberg-status-success">GOLDMINE</div>
        </div>
        <div className="bloomberg-mb-lg">
          <div className="bloomberg-metric bloomberg-mb-md">
            <div className="bloomberg-metric-value">{intelligenceSources.comtrade?.records?.toLocaleString() || '17,500'}+</div>
            <div className="bloomberg-metric-label">Comtrade HS Classifications</div>
          </div>
          <div className="bloomberg-metric bloomberg-mb-md">
            <div className="bloomberg-metric-value">{intelligenceSources.workflow?.sessions || liveData.networkEffects}</div>
            <div className="bloomberg-metric-label">Workflow Learning Sessions</div>
          </div>
          <div className="bloomberg-metric bloomberg-mb-md">
            <div className="bloomberg-metric-value">{intelligenceSources.marcus?.consultations || '20'}+</div>
            <div className="bloomberg-metric-label">Marcus AI Consultations</div>
          </div>
          <div className="bloomberg-metric bloomberg-mb-md">
            <div className="bloomberg-metric-value">{intelligenceSources.hindsight?.patterns || '17'}+</div>
            <div className="bloomberg-metric-label">Hindsight Success Patterns</div>
          </div>
        </div>
        <div className="bloomberg-card-subtitle">
          Network Effects: Each session improves intelligence for all future users
        </div>
      </div>
    </div>
  );

  const FinancialView = () => (
    <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-xl">
      {/* Savings Performance */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Savings Performance</h3>
          <div className="bloomberg-status bloomberg-status-success">OPTIMIZED</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">$847M+</div>
          <div className="bloomberg-metric-label">Total Savings Generated</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">$245K</div>
          <div className="bloomberg-metric-label">Average Per Company</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">380+</div>
          <div className="bloomberg-metric-label">Protected Companies</div>
        </div>
      </div>

      {/* ROI Projections */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">ROI Projections</h3>
          <div className="bloomberg-status bloomberg-status-success">HIGH</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">1,247%</div>
          <div className="bloomberg-metric-label">Average ROI</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">12.3</div>
          <div className="bloomberg-metric-label">Days to Implementation</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">92%</div>
          <div className="bloomberg-metric-label">Success Rate</div>
        </div>
      </div>

      {/* Cost Optimization */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">Cost Optimization</h3>
          <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value text-success">80%</div>
          <div className="bloomberg-metric-label">API Cost Reduction</div>
        </div>
        <div className="bloomberg-metric">
          <div className="bloomberg-metric-value">85%</div>
          <div className="bloomberg-metric-label">Faster Query Response</div>
        </div>
        <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
          Start Optimization →
        </Link>
      </div>
    </div>
  );

  const getCurrentView = () => {
    switch (activeView) {
      case 'intelligence':
        return <IntelligenceView />;
      case 'financial':
        return <FinancialView />;
      case 'implementation':
        return (
          <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-xl">
            {/* Implementation Progress */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">{smartT("dashboard.implementationprogre")}</h3>
                <div className="bloomberg-status bloomberg-status-success">READY</div>
              </div>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value text-success">12.3</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.averagedaysto")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">92%</div>
                  <div className="bloomberg-metric-label">{smartT("product.successrate")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">6</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.intelligencesystemsa")}</div>
                </div>
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Start Implementation →
              </Link>
            </div>

            {/* Performance Metrics */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">{smartT("dashboard.performancemetrics")}</h3>
                <div className="bloomberg-status bloomberg-status-success">OPTIMIZED</div>
              </div>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value text-success">{performance.totalProcessingTime || '0'}ms</div>
                  <div className="bloomberg-metric-label">{smartT("alerts.responsetime")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">{performance.intelligenceQuality || 60}%</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.intelligencequality")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value text-success">{performance.networkEffectsActive ? 'YES' : 'NO'}</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.networkeffectsactive")}</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'partnership':
        return (
          <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-xl">
            {/* Partnership Network */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">{smartT("dashboard.partnershipecosystem")}</h3>
                <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
              </div>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">47+</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.strategicpartners")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">23</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.countriescovered")}</div>
                </div>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value">15+</div>
                  <div className="bloomberg-metric-label">{smartT("dashboard.tradespecialists")}</div>
                </div>
              </div>
              <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
                Explore Partnerships →
              </Link>
            </div>

            {/* Specialist Connection */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">{smartT("dashboard.specialistconnection")}</h3>
                <div className="bloomberg-status bloomberg-status-success">AVAILABLE</div>
              </div>
              <div className="bloomberg-mb-lg">
                <p className="bloomberg-card-subtitle">
                  Connect with certified trade specialists for implementation support and advanced optimization strategies.
                </p>
                <div className="bloomberg-metric bloomberg-mb-md">
                  <div className="bloomberg-metric-value text-success">$245K</div>
                  <div className="bloomberg-metric-label">Average Specialist-Assisted Savings</div>
                </div>
              </div>
              <Link href="/partnership" className="bloomberg-btn bloomberg-btn-secondary">
                Request Specialist →
              </Link>
            </div>
          </div>
        );
      case 'sales':
        return <SalesOperationsDashboard />;
      default:
        return <ExecutiveView />;
    }
  };

  return (
    <>
      <Head>
        <title>Triangle Intelligence Hub - Executive Dashboard</title>
        <meta name="description" content="Bloomberg Terminal-style executive dashboard with real-time trade intelligence and compound insights" />
      </Head>

      {/* Bloomberg Professional Navigation */}
      <header className="bloomberg-nav">
        <div className="bloomberg-flex">
          <div className="bloomberg-nav-brand">Triangle Intelligence Hub</div>
          <div className="bloomberg-flex">
            <span className="bloomberg-nav-link" style={{ color: '#666' }}>
              Last Update: {liveData.lastUpdate}
            </span>
            <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <div className="bloomberg-container">
        {/* Dashboard Navigation */}
        <div className="bloomberg-section">
          <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h1 className="bloomberg-hero-title">Executive Intelligence Hub</h1>
              <div className="bloomberg-status bloomberg-status-success">LIVE</div>
            </div>
            <p className="bloomberg-hero-subtitle bloomberg-mb-lg">
              Bloomberg Terminal-style dashboard powered by Beast Master Intelligence and 519,341+ database records
            </p>
            
            {/* View Selector */}
            <div className="bloomberg-flex bloomberg-mb-xl">
              {dashboardViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`bloomberg-btn ${activeView === view.id ? 'bloomberg-btn-primary' : 'bloomberg-btn-secondary'}`}
                  style={{ marginRight: '8px' }}
                >
                  {view.icon} {view.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Dashboard Content */}
        <div className="bloomberg-section">
          {getCurrentView()}
        </div>

        {/* Emergency Alert Banner */}
        <div className="bloomberg-section">
          <div className="bloomberg-card border-error">
            <div className="bloomberg-flex">
              <div>
                <h4 className="bloomberg-card-title text-error">🚨 Trade War Alert: US-Canada Tariff Escalation</h4>
                <p className="bloomberg-card-subtitle">
                  New bilateral tariffs threaten $2.1B in trade. USMCA triangle routing provides immediate protection.
                </p>
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Protect Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}