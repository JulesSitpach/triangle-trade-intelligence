/**
 * Marketplace Intelligence Dashboard
 * Mines SaaS workflow data for marketplace opportunities
 *
 * Every SaaS workflow today = Marketplace data tomorrow!
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminNavigation from '../../components/AdminNavigation';
import { requireAdminAuth } from '../../lib/auth/serverAuth';

export default function MarketplaceIntelligence({ session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('executive');
  const [data, setData] = useState({
    executiveSummary: null,
    hotLeads: [],
    supplierDemand: [],
    industryOpportunities: [],
    highValueBuyers: []
  });

  useEffect(() => {
    // Session is already verified server-side, just load data
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExecutiveSummary(),
        loadHotLeads(),
        loadSupplierDemand(),
        loadIndustryOpportunities(),
        loadHighValueBuyers()
      ]);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutiveSummary = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-intelligence?query=executive-summary');
      const result = await response.json();
      if (result.success) {
        setData(prev => ({ ...prev, executiveSummary: result.data }));
      }
    } catch (error) {
      console.error('Error loading executive summary:', error);
    }
  };

  const loadHotLeads = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-intelligence?query=hot-leads');
      const result = await response.json();
      if (result.success) {
        setData(prev => ({ ...prev, hotLeads: result.data || [] }));
      }
    } catch (error) {
      console.error('Error loading hot leads:', error);
    }
  };

  const loadSupplierDemand = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-intelligence?query=supplier-demand');
      const result = await response.json();
      if (result.success) {
        setData(prev => ({ ...prev, supplierDemand: result.data || [] }));
      }
    } catch (error) {
      console.error('Error loading supplier demand:', error);
    }
  };

  const loadIndustryOpportunities = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-intelligence?query=industry-opportunities');
      const result = await response.json();
      if (result.success) {
        setData(prev => ({ ...prev, industryOpportunities: result.data || [] }));
      }
    } catch (error) {
      console.error('Error loading industry opportunities:', error);
    }
  };

  const loadHighValueBuyers = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-intelligence?query=high-value-buyers');
      const result = await response.json();
      if (result.success) {
        setData(prev => ({ ...prev, highValueBuyers: result.data || [] }));
      }
    } catch (error) {
      console.error('Error loading high-value buyers:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="admin-main">
        <AdminNavigation />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading marketplace intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Marketplace Intelligence - Admin Dashboard</title>
      </Head>

      <div className="admin-main">
        <AdminNavigation />

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">📊 Marketplace Intelligence</h1>
            <p className="user-role">Mining SaaS workflow data for marketplace opportunities</p>
          </div>

          {/* View Tabs */}
          <div className="dashboard-tabs">
            <button
              className={activeView === 'executive' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveView('executive')}
            >
              Executive Summary
            </button>
            <button
              className={activeView === 'hot-leads' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveView('hot-leads')}
            >
              🔥 Hot Leads (30 Days)
            </button>
            <button
              className={activeView === 'supplier-demand' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveView('supplier-demand')}
            >
              Supplier Demand
            </button>
            <button
              className={activeView === 'industry' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveView('industry')}
            >
              Industry Opportunities
            </button>
            <button
              className={activeView === 'high-value' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveView('high-value')}
            >
              High-Value Buyers
            </button>
          </div>
        </div>

        {/* Executive Summary View */}
        {activeView === 'executive' && data.executiveSummary && (
          <div className="marketplace-section">
            <h2 className="form-section-title">Marketplace Readiness Metrics</h2>
            <p className="form-section-description">
              High-level metrics to determine marketplace launch viability
            </p>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{data.executiveSummary.total_workflows || 0}</div>
                <div className="metric-label">Total Workflows</div>
              </div>

              <div className="metric-card metric-highlight">
                <div className="metric-value">{data.executiveSummary.market_opportunity_workflows || 0}</div>
                <div className="metric-label">Market Opportunities</div>
                <div className="metric-subtitle">Not USMCA qualified yet</div>
              </div>

              <div className="metric-card metric-success">
                <div className="metric-value">{data.executiveSummary.opted_in_workflows || 0}</div>
                <div className="metric-label">Opted In</div>
                <div className="metric-subtitle">Supplier matching consent</div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{data.executiveSummary.high_value_leads || 0}</div>
                <div className="metric-label">High-Value Leads</div>
                <div className="metric-subtitle">$50K+ savings potential</div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{data.executiveSummary.expert_verified_workflows || 0}</div>
                <div className="metric-label">Expert Verified</div>
              </div>

              <div className="metric-card metric-highlight">
                <div className="metric-value">
                  {formatCurrency(data.executiveSummary.total_savings_opportunity)}
                </div>
                <div className="metric-label">Total Savings Opportunity</div>
              </div>

              <div className="metric-card">
                <div className="metric-value">
                  {(data.executiveSummary.avg_opportunity_score || 0).toFixed(0)}
                </div>
                <div className="metric-label">Avg Opportunity Score</div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{data.executiveSummary.industries_covered || 0}</div>
                <div className="metric-label">Industries Covered</div>
              </div>
            </div>

            {/* Marketplace Launch Checklist */}
            <div className="card" style={{ marginTop: '2rem' }}>
              <h3 className="card-title">Marketplace Launch Checklist</h3>
              <div className="checklist">
                <div className={data.executiveSummary.total_workflows >= 100 ? 'checklist-item-complete' : 'checklist-item'}>
                  <span className="checklist-status">
                    {data.executiveSummary.total_workflows >= 100 ? '✅' : '⏳'}
                  </span>
                  <span className="checklist-text">
                    100+ completed workflows (data foundation) - {data.executiveSummary.total_workflows}/100
                  </span>
                </div>
                <div className={data.executiveSummary.opted_in_workflows >= 50 ? 'checklist-item-complete' : 'checklist-item'}>
                  <span className="checklist-status">
                    {data.executiveSummary.opted_in_workflows >= 50 ? '✅' : '⏳'}
                  </span>
                  <span className="checklist-text">
                    50+ opted-in leads - {data.executiveSummary.opted_in_workflows}/50
                  </span>
                </div>
                <div className={data.executiveSummary.expert_verified_workflows >= 20 ? 'checklist-item-complete' : 'checklist-item'}>
                  <span className="checklist-status">
                    {data.executiveSummary.expert_verified_workflows >= 20 ? '✅' : '⏳'}
                  </span>
                  <span className="checklist-text">
                    20+ verified workflows - {data.executiveSummary.expert_verified_workflows}/20
                  </span>
                </div>
                <div className={data.supplierDemand.length >= 20 ? 'checklist-item-complete' : 'checklist-item'}>
                  <span className="checklist-status">
                    {data.supplierDemand.length >= 20 ? '✅' : '⏳'}
                  </span>
                  <span className="checklist-text">
                    20+ high-demand HS codes - {data.supplierDemand.length}/20
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hot Leads View */}
        {activeView === 'hot-leads' && (
          <div className="marketplace-section">
            <h2 className="form-section-title">🔥 Hot Leads (Last 30 Days)</h2>
            <p className="form-section-description">
              Recent workflows with high opportunity scores - strike while the iron is hot!
            </p>

            {data.hotLeads.length === 0 ? (
              <div className="empty-state">
                <p>No hot leads in the last 30 days</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Product</th>
                      <th>Industry</th>
                      <th>Savings Potential</th>
                      <th>Opportunity Score</th>
                      <th>Sourcing Interest</th>
                      <th>Timeline</th>
                      <th>Days Ago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hotLeads.map((lead, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">{lead.company_name}</td>
                        <td>{lead.product_description?.substring(0, 50)}...</td>
                        <td>{lead.industry_sector}</td>
                        <td className="text-success text-bold">
                          {formatCurrency(lead.estimated_annual_savings)}
                        </td>
                        <td>
                          <span className="badge badge-success">
                            {lead.mexico_opportunity_score}
                          </span>
                        </td>
                        <td>{lead.sourcing_interest || 'Not specified'}</td>
                        <td>{lead.timeline || 'Not specified'}</td>
                        <td className="text-muted">{lead.days_since_completion}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Supplier Demand View */}
        {activeView === 'supplier-demand' && (
          <div className="marketplace-section">
            <h2 className="form-section-title">Supplier Demand Analysis</h2>
            <p className="form-section-description">
              What products do US importers need from Mexico suppliers?
            </p>

            {data.supplierDemand.length === 0 ? (
              <div className="empty-state">
                <p>No supplier demand data available yet</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>HS Code</th>
                      <th>Product Description</th>
                      <th>Current Source</th>
                      <th># Companies</th>
                      <th>Market Size</th>
                      <th>Avg Tariff</th>
                      <th>Avg Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.supplierDemand.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-mono">{item.hs_code}</td>
                        <td>{item.component_description}</td>
                        <td>
                          <span className="badge badge-warning">{item.current_supplier_country}</span>
                        </td>
                        <td className="text-bold">{item.demand_count}</td>
                        <td>{formatCurrency(item.total_market_size)}</td>
                        <td className="text-warning">{formatPercent(item.avg_tariff_rate)}</td>
                        <td className="text-success">{formatPercent(item.avg_savings_opportunity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Industry Opportunities View */}
        {activeView === 'industry' && (
          <div className="marketplace-section">
            <h2 className="form-section-title">Industry Opportunities</h2>
            <p className="form-section-description">
              Which industries have the most Mexico sourcing potential?
            </p>

            {data.industryOpportunities.length === 0 ? (
              <div className="empty-state">
                <p>No industry data available yet</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Industry Sector</th>
                      <th>Workflows</th>
                      <th>Not Qualified</th>
                      <th>Avg Opportunity</th>
                      <th>Total Savings</th>
                      <th>Avg Trade Volume</th>
                      <th>Opted In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.industryOpportunities.map((industry, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">{industry.industry_sector}</td>
                        <td>{industry.workflow_count}</td>
                        <td className="text-warning">{industry.not_qualified_count}</td>
                        <td>
                          <span className="badge badge-info">
                            {industry.avg_opportunity_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="text-success text-bold">
                          {formatCurrency(industry.total_savings_potential)}
                        </td>
                        <td>{formatCurrency(industry.avg_trade_volume)}</td>
                        <td className="text-success">{industry.opted_in_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* High-Value Buyers View */}
        {activeView === 'high-value' && (
          <div className="marketplace-section">
            <h2 className="form-section-title">High-Value Buyer Leads</h2>
            <p className="form-section-description">
              Companies with $50K+ savings potential who opted in to supplier matching
            </p>

            {data.highValueBuyers.length === 0 ? (
              <div className="empty-state">
                <p>No high-value buyers yet - need workflows with $50K+ savings</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Business Type</th>
                      <th>Product</th>
                      <th>Trade Volume</th>
                      <th>Est. Savings</th>
                      <th>Opportunity Score</th>
                      <th>Sourcing Interest</th>
                      <th>Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.highValueBuyers.map((buyer, idx) => (
                      <tr key={idx}>
                        <td className="text-bold">{buyer.company_name}</td>
                        <td>{buyer.business_type}</td>
                        <td>{buyer.product_description?.substring(0, 40)}...</td>
                        <td>{formatCurrency(buyer.trade_volume)}</td>
                        <td className="text-success text-bold">
                          {formatCurrency(buyer.estimated_annual_savings)}
                        </td>
                        <td>
                          <span className="badge badge-success">
                            {buyer.mexico_opportunity_score}
                          </span>
                        </td>
                        <td>{buyer.sourcing_interest}</td>
                        <td>{buyer.timeline || 'Not specified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Server-side authentication protection
export async function getServerSideProps(context) {
  return requireAdminAuth(context);
}
