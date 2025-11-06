/**
 * Analytics Tab Content Component
 * Two-view analytics dashboard: Overview (shared metrics) and Deep Dive (detailed insights)
 *
 * OVERVIEW TAB - For both dev + sales (daily check-in):
 * - MRR trend (is revenue growing?)
 * - Conversion rate (trial to paid %)
 * - Active users by region (where to focus sales effort)
 * - Top segments/use cases (which customer types are winning)
 * - Tier split (how users are distributed)
 *
 * DEEP DIVE TAB - For detailed product/marketing insights:
 * - Feature adoption rates (what's actually being used)
 * - Cohort retention (is the product stickier over time)
 * - Geographic distribution (where users are coming from)
 * - Policy trigger correlation (when news breaks, does usage spike)
 * - Conversion funnel (free → paid, where we're losing people)
 */

import { useState, useEffect } from 'react';

export default function AnalyticsTabContent() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview | deepdive
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();

    // Load Chart.js if not already loaded
    if (!window.Chart && !chartLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => setChartLoaded(true);
      document.head.appendChild(script);
    } else if (window.Chart) {
      setChartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (chartLoaded && analyticsData && activeView === 'overview') {
      renderOverviewCharts();
    }
    if (chartLoaded && deepDiveData && activeView === 'deepdive') {
      renderDeepDiveCharts();
    }
  }, [chartLoaded, analyticsData, deepDiveData, activeView]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch overview analytics
      const overviewRes = await fetch('/api/admin/analytics-overview', {
        credentials: 'include'
      });

      if (overviewRes.ok) {
        const result = await overviewRes.json();
        setAnalyticsData(result.data?.analytics);
      }

      // Fetch deep dive analytics
      const deepDiveRes = await fetch('/api/admin/analytics-deepdive', {
        credentials: 'include'
      });

      if (deepDiveRes.ok) {
        const result = await deepDiveRes.json();
        setDeepDiveData(result.data?.analytics);
      }
    } catch (err) {
      console.error('Analytics data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCharts = () => {
    // MRR Trend Chart
    const mrrCtx = document.getElementById('mrrTrendChart');
    if (mrrCtx && window.Chart && analyticsData?.mrr_trend) {
      const existingChart = window.Chart.getChart(mrrCtx);
      if (existingChart) existingChart.destroy();

      new window.Chart(mrrCtx, {
        type: 'line',
        data: {
          labels: analyticsData.mrr_trend.months,
          datasets: [{
            label: 'MRR ($)',
            data: analyticsData.mrr_trend.values,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Tier Distribution Chart
    const tierCtx = document.getElementById('tierDistributionChart');
    if (tierCtx && window.Chart && analyticsData?.tier_distribution) {
      const existingChart = window.Chart.getChart(tierCtx);
      if (existingChart) existingChart.destroy();

      const tiers = Object.keys(analyticsData.tier_distribution);
      const counts = Object.values(analyticsData.tier_distribution);

      new window.Chart(tierCtx, {
        type: 'doughnut',
        data: {
          labels: tiers,
          datasets: [{
            data: counts,
            backgroundColor: ['#94a3b8', '#60a5fa', '#3b82f6', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  const renderDeepDiveCharts = () => {
    // Feature Adoption Chart
    const featureCtx = document.getElementById('featureAdoptionChart');
    if (featureCtx && window.Chart && deepDiveData?.feature_adoption) {
      const existingChart = window.Chart.getChart(featureCtx);
      if (existingChart) existingChart.destroy();

      const features = Object.keys(deepDiveData.feature_adoption);
      const rates = Object.values(deepDiveData.feature_adoption);

      new window.Chart(featureCtx, {
        type: 'bar',
        data: {
          labels: features,
          datasets: [{
            label: 'Adoption Rate (%)',
            data: rates,
            backgroundColor: '#3B82F6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }

    // Cohort Retention Chart
    const cohortCtx = document.getElementById('cohortRetentionChart');
    if (cohortCtx && window.Chart && deepDiveData?.cohort_retention) {
      const existingChart = window.Chart.getChart(cohortCtx);
      if (existingChart) existingChart.destroy();

      new window.Chart(cohortCtx, {
        type: 'line',
        data: {
          labels: deepDiveData.cohort_retention.weeks,
          datasets: deepDiveData.cohort_retention.cohorts.map((cohort, idx) => ({
            label: cohort.name,
            data: cohort.retention_rates,
            borderColor: ['#3B82F6', '#10B981', '#F59E0B'][idx % 3],
            tension: 0.4
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (!analyticsData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No analytics data available</div>;
  }

  return (
    <div>
      {/* View Toggle */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #E5E7EB',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveView('overview')}
          className={activeView === 'overview' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 20px' }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveView('deepdive')}
          className={activeView === 'deepdive' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 20px' }}
        >
          🔬 Deep Dive
        </button>
      </div>

      {/* OVERVIEW TAB - Shared Metrics for Dev + Sales */}
      {activeView === 'overview' && (
        <div>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
            Daily check-in metrics for both dev and sales teams
          </p>

          {/* Key Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* MRR */}
            <div style={{
              padding: '20px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#16A34A', marginBottom: '5px' }}>Monthly Recurring Revenue</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803D' }}>
                ${analyticsData.mrr?.toLocaleString() || 0}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                {analyticsData.mrr_growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.mrr_growth || 0).toFixed(1)}% vs last month
              </p>
            </div>

            {/* Conversion Rate */}
            <div style={{
              padding: '20px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#2563EB', marginBottom: '5px' }}>Trial → Paid Conversion</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E40AF' }}>
                {analyticsData.conversion_rate?.toFixed(1) || 0}%
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                {analyticsData.conversions_this_month || 0} conversions this month
              </p>
            </div>

            {/* Active Users */}
            <div style={{
              padding: '20px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#D97706', marginBottom: '5px' }}>Active Users (30d)</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#B45309' }}>
                {analyticsData.active_users || 0}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                {analyticsData.total_analyses || 0} analyses completed
              </p>
            </div>

            {/* Top Use Case */}
            <div style={{
              padding: '20px',
              backgroundColor: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#7C3AED', marginBottom: '5px' }}>Top Use Case</h3>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#6D28D9' }}>
                {analyticsData.top_industry || 'Electronics'}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                {analyticsData.top_industry_count || 0} users
              </p>
            </div>
          </div>

          {/* MRR Trend Chart */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>MRR Trend (Last 6 Months)</h3>
            <div style={{ height: '250px', position: 'relative' }}>
              <canvas id="mrrTrendChart"></canvas>
            </div>
          </div>

          {/* Regional Distribution */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Active Users by Region</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {analyticsData.regional_distribution && Object.entries(analyticsData.regional_distribution).map(([region, count]) => (
                <div key={region} style={{
                  padding: '15px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</p>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>{region}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Distribution */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Subscription Tier Split</h3>
            <div style={{ height: '250px', position: 'relative' }}>
              <canvas id="tierDistributionChart"></canvas>
            </div>
          </div>
        </div>
      )}

      {/* DEEP DIVE TAB - Detailed Product/Marketing Insights */}
      {activeView === 'deepdive' && (
        <div>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
            Detailed insights for product decisions and marketing optimization
          </p>

          {deepDiveData ? (
            <>
              {/* CRITICAL INSIGHT: Certificate Adoption Analysis */}
              {deepDiveData.certificate_adoption_analysis && (
                <div style={{
                  backgroundColor: deepDiveData.certificate_adoption_analysis.overall_rate < 50 ? '#FEF2F2' : '#F0FDF4',
                  padding: '20px',
                  borderRadius: '8px',
                  border: `2px solid ${deepDiveData.certificate_adoption_analysis.overall_rate < 50 ? '#FCA5A5' : '#BBF7D0'}`,
                  marginBottom: '30px'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#1F2937' }}>
                    🚨 Certificate Adoption Deep Dive
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px', fontStyle: 'italic' }}>
                    {deepDiveData.certificate_adoption_analysis.insight}
                  </p>

                  {/* Key Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Overall Certificate Rate</p>
                      <p style={{ fontSize: '32px', fontWeight: 'bold', color: deepDiveData.certificate_adoption_analysis.overall_rate < 50 ? '#DC2626' : '#16A34A' }}>
                        {deepDiveData.certificate_adoption_analysis.overall_rate}%
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                        {deepDiveData.certificate_adoption_analysis.certificates_generated} of {deepDiveData.certificate_adoption_analysis.total_analyses} analyses
                      </p>
                    </div>

                    <div style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Drop-off Volume</p>
                      <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#DC2626' }}>
                        {deepDiveData.certificate_adoption_analysis.certificates_not_generated}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                        Users who didn't generate certificate
                      </p>
                    </div>

                    <div style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Avg Time to Certificate</p>
                      <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3B82F6' }}>
                        {deepDiveData.certificate_adoption_analysis.avg_time_to_certificate_minutes
                          ? `${deepDiveData.certificate_adoption_analysis.avg_time_to_certificate_minutes}min`
                          : 'N/A'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                        Median: {deepDiveData.certificate_adoption_analysis.median_time_to_certificate_minutes
                          ? `${deepDiveData.certificate_adoption_analysis.median_time_to_certificate_minutes}min`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Conversion by Tier */}
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                      Certificate Generation by Subscription Tier
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tier</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Analyses</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Certificates</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Conversion Rate</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Insight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(deepDiveData.certificate_adoption_analysis.conversion_by_tier).map(([tier, stats]) => (
                            <tr key={tier} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{tier}</td>
                              <td style={{ padding: '12px' }}>{stats.analyses}</td>
                              <td style={{ padding: '12px' }}>{stats.certificates}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  color: parseFloat(stats.conversion_rate) < 50 ? '#DC2626' : '#16A34A',
                                  fontWeight: 'bold'
                                }}>
                                  {stats.conversion_rate}%
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#6B7280' }}>
                                {parseFloat(stats.conversion_rate) === 0 && stats.analyses > 0 && (
                                  <span style={{ color: '#DC2626', fontWeight: 'bold' }}>
                                    ⚠️ ZERO certificates generated - major drop-off
                                  </span>
                                )}
                                {parseFloat(stats.conversion_rate) > 0 && parseFloat(stats.conversion_rate) < 50 && (
                                  <span style={{ color: '#F59E0B' }}>
                                    Low conversion - investigate UX or pricing
                                  </span>
                                )}
                                {parseFloat(stats.conversion_rate) >= 50 && stats.analyses > 0 && (
                                  <span style={{ color: '#16A34A' }}>Healthy conversion</span>
                                )}
                                {stats.analyses === 0 && (
                                  <span style={{ color: '#9CA3AF' }}>No data yet</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '6px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#92400E' }}>
                      📋 Recommended Actions
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                      <li>Contact users who completed analysis but didn't generate certificate (follow-up opportunity)</li>
                      <li>Investigate UX friction in certificate generation flow</li>
                      <li>Consider A/B test: Prompt certificate download immediately after analysis vs later</li>
                      <li>Check if Trial watermark is discouraging downloads (pricing barrier?)</li>
                      <li>Track correlation: Does certificate generation predict conversion to paid?</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Feature Adoption Rates */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                marginBottom: '30px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Feature Adoption Rates</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '15px' }}>
                  What's actually being used?
                </p>
                <div style={{ height: '250px', position: 'relative' }}>
                  <canvas id="featureAdoptionChart"></canvas>
                </div>
              </div>

              {/* Cohort Retention */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                marginBottom: '30px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Cohort Retention Analysis</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '15px' }}>
                  Is the product stickier over time?
                </p>
                <div style={{ height: '250px', position: 'relative' }}>
                  <canvas id="cohortRetentionChart"></canvas>
                </div>
              </div>

              {/* Policy Trigger Correlation */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                marginBottom: '30px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Policy Trigger Correlation</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '15px' }}>
                  When news breaks, does usage spike?
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Policy Event</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Usage Spike</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>New Signups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deepDiveData.policy_triggers?.map((trigger, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px' }}>{trigger.event}</td>
                          <td style={{ padding: '12px' }}>{trigger.date}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: trigger.spike_percent > 50 ? '#16A34A' : '#6B7280',
                              fontWeight: trigger.spike_percent > 50 ? 'bold' : 'normal'
                            }}>
                              +{trigger.spike_percent}%
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>{trigger.new_signups}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conversion Funnel Breakdown */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Conversion Funnel Breakdown</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '15px' }}>
                  Where are we losing people?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {deepDiveData.funnel_stages?.map((stage, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '10px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px'
                    }}>
                      <div style={{ minWidth: '150px', fontWeight: '600' }}>{stage.name}</div>
                      <div style={{ flex: 1, backgroundColor: '#E5E7EB', height: '30px', borderRadius: '4px', position: 'relative' }}>
                        <div style={{
                          width: `${stage.percent}%`,
                          height: '100%',
                          backgroundColor: stage.percent > 50 ? '#10B981' : '#F59E0B',
                          borderRadius: '4px',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <div style={{ minWidth: '80px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold' }}>{stage.count}</span> ({stage.percent.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '16px', color: '#6B7280' }}>
                Deep dive analytics not yet available. Check back after more data is collected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
