import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';

export default function UserDashboard({ user, profile }) {
  const { logout } = useSimpleAuth();

  // Use the proper logout that clears cookies
  const signOut = () => {
    logout();
  };

  const isTrialExpired = () => {
    // Simple trial expiration check based on user data
    if (profile?.subscription_tier === 'Trial' || user?.subscription_tier === 'Trial') {
      // For now, assume trials don't expire (MVP approach)
      return false;
    }
    return false;
  };
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.admin-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/dashboard-data?user_id=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setDashboardData(data);
      } else {
        // Fallback data for user
        setDashboardData({
          user_profile: profile || {},
          usage_stats: getUsageStats() || { used: 0, included: 5, remaining: 5, percentage: 0 },
          recent_activity: [],
          quick_actions: [
            {
              id: 1,
              title: 'Classify Product',
              description: 'Get instant HS codes with AI',
              icon: '📋',
              action_url: '/usmca-workflow',
              requires_subscription: false
            },
            {
              id: 2,
              title: 'View Pricing',
              description: 'Compare plans & features',
              icon: '📊',
              action_url: '/pricing',
              requires_subscription: false
            }
          ],
          notifications: [],
          data_status: { source: 'fallback' }
        });
      }
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
      // Use minimal fallback
      setDashboardData({
        user_profile: profile || {},
        usage_stats: { used: 0, included: 5, remaining: 5, percentage: 0 },
        recent_activity: [],
        quick_actions: [],
        notifications: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const usageStats = dashboardData.usage_stats;
  const recentActivity = dashboardData.recent_activity;
  const quickActions = dashboardData.quick_actions;

  // Use subscription data from API
  const subscriptionData = dashboardData.user_profile || {};
  const isTrialActive = subscriptionData.is_trial;
  const trialExpired = subscriptionData.trial_expired || isTrialExpired();
  const planName = subscriptionData.subscription_plan || 'Trial';

  return (
    <>
      <Head>
        <title>My Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Your Triangle Intelligence dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">Triangle Intelligence</div>
              <div className="nav-logo-subtitle">{user ? 'My Dashboard' : 'USMCA Trade Platform'}</div>
            </div>
          </Link>

          {/* Main Navigation */}
          <div className="nav-menu">
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/usmca-workflow" className="nav-menu-link">Workflows</Link>
            <Link href="/trade-risk-alternatives" className="nav-menu-link">Alerts</Link>
            <Link href="/certificates" className="nav-menu-link">Certificates</Link>
          </div>

          {/* Right Side Actions */}
          <div className="nav-menu">
            {/* User Menu */}
            <div className="admin-dropdown">
              <button
                className="user-menu-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                👤 {user.user_metadata?.company_name || user.email?.split('@')[0]}
              </button>
              {userMenuOpen && (
                <div className="admin-dropdown-menu">
                  <Link href="/profile" className="admin-dropdown-item">
                    View Profile
                  </Link>
                  <Link href="/account-settings" className="admin-dropdown-item">
                    Account Settings
                  </Link>
                  <Link href="/pricing" className="admin-dropdown-item">
                    Subscription/Billing
                  </Link>
                  <Link href="mailto:support@triangleintelligence.com" className="admin-dropdown-item">
                    Help
                  </Link>
                  <button onClick={signOut} className="admin-dropdown-item">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="container-app">

          {/* Welcome Section - Business Focus */}
          <div className="section-header">
            <h1 className="section-header-title">
              Trade Dashboard
            </h1>
            <p className="section-header-subtitle">
              {user.user_metadata?.company_name || 'Your Business'} • USMCA Compliance & Savings
            </p>
          </div>

          {/* Trial Warning */}
          {isTrialActive && trialExpired && (
            <div className="hero-badge">
              ⚠️ Your free trial has expired. Upgrade to continue using Triangle Intelligence.
            </div>
          )}

          {/* Trial Info */}
          {isTrialActive && !trialExpired && (
            <div className="hero-badge" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <span>Free Trial Active • Expires {subscriptionData.trial_expires_at ?
                new Date(subscriptionData.trial_expires_at).toLocaleDateString() :
                'Soon'}</span>
              <Link href="/pricing" className="btn-primary" style={{marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                Upgrade
              </Link>
            </div>
          )}

          {/* Trade Performance Metrics */}
          <div className="content-card">
            <h2 className="content-card-title">Trade Performance Overview</h2>

            <div className="grid-3-cols">
              <div>
                <h3 className="content-card-title">Total Savings</h3>
                <p className="text-body">${usageStats?.total_savings?.toLocaleString() || '0'}</p>
                <p className="content-card-description">Cumulative tariff savings</p>
              </div>

              <div>
                <h3 className="content-card-title">Compliance Analysis</h3>
                <p className="text-body">{usageStats?.used || 0} / {usageStats?.included === 999 ? '∞' : usageStats?.included || 5}</p>
                <p className="content-card-description">Completed this month</p>
                {usageStats?.percentage > 0 && (
                  <div className="progress-bar" style={{width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '4px'}}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(usageStats.percentage, 100)}%`,
                        height: '100%',
                        backgroundColor: usageStats.percentage >= 100 ? '#ef4444' : usageStats.percentage >= 80 ? '#f59e0b' : '#10b981',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="content-card-title">Optimization Rate</h3>
                <p className="text-body">15-25%</p>
                <p className="content-card-description">Average cost reduction</p>
              </div>
            </div>

            {/* Business Intelligence Recommendations */}
            {dashboardData.business_intelligence && dashboardData.business_intelligence.length > 0 && (
              <div className="element-spacing">
                <h3 className="section-subtitle">💡 Strategic Recommendations</h3>
                <div className="grid-2-cols">
                  {dashboardData.business_intelligence.slice(0, 4).map((intel, index) => (
                    <div key={index} className={`status-card ${intel.priority === 'high' ? 'urgent' : 'info'}`}>
                      <div className="header-actions">
                        <div>
                          <div className="text-bold">{intel.recommendation}</div>
                          <div className="text-body">
                            {intel.savings_potential && `Potential: $${intel.savings_potential.toLocaleString()}`}
                          </div>
                          {intel.timeline && (
                            <div className="text-small">Timeline: {intel.timeline}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Triangle Routing Opportunities */}
            {dashboardData.triangle_opportunities && dashboardData.triangle_opportunities.length > 0 && (
              <div className="element-spacing">
                <h3 className="section-subtitle">🍁🇲🇽 Triangle Routing Opportunities</h3>
                <div className="grid-2-cols">
                  {dashboardData.triangle_opportunities.slice(0, 2).map((opportunity, index) => (
                    <div key={index} className="status-card success">
                      <div className="header-actions">
                        <div>
                          <div className="text-bold">{opportunity.route}</div>
                          <div className="text-body">
                            {opportunity.savings_percent}% savings • ${opportunity.annual_savings?.toLocaleString() || 'TBD'}
                          </div>
                          <div className="text-small">{opportunity.benefits}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage warnings and upgrade prompts */}
            {usageStats?.limit_reached && (
              <div className="alert alert-warning" style={{marginTop: '1rem'}}>
                <div className="alert-content">
                  <div className="alert-title">Monthly Limit Reached</div>
                  <div className="text-body">
                    You've completed {usageStats.used} analyses this month. Upgrade to continue.
                  </div>
                  <div className="hero-buttons" style={{marginTop: '0.5rem'}}>
                    <Link href="/pricing" className="btn-primary">
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {usageStats?.remaining <= 1 && !usageStats?.limit_reached && (
              <div className="alert alert-info" style={{marginTop: '1rem'}}>
                <div className="alert-content">
                  <div className="text-body">
                    {usageStats.remaining === 1 ? 'Only 1 analysis remaining this month.' : 'No analyses remaining this month.'}
                    <Link href="/pricing" className="nav-link" style={{marginLeft: '0.5rem'}}>Upgrade for unlimited access</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Self-Service Analysis Tools */}
          <div className="content-card">
            <h2 className="content-card-title">Self-Service Analysis Tools</h2>

            {recentActivity && recentActivity.length > 0 ? (
              <div>
                <p className="content-card-description">Continue your active compliance analysis</p>
                <div className="hero-buttons">
                  <Link href="/usmca-workflow" className="btn-primary">
                    Continue Analysis
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="content-card-description">
                  Automated USMCA compliance analysis and certificate generation
                </p>

                <div className="hero-cta">
                  <Link href="/usmca-workflow" className="btn-primary large">
                    Start Compliance Analysis ({usageStats?.remaining || 5} remaining)
                  </Link>
                </div>

                <p className="text-body">
                  Average completion time: 10 minutes | Average savings: 15-25%
                </p>
              </div>
            )}
          </div>

          {/* Professional Services */}
          <div className="content-card">
            <h2 className="content-card-title">Professional Trade Services</h2>
            <p className="content-card-description">
              Expert consultation and implementation services for complex trade scenarios
            </p>

            <div className="grid-2-cols">
              <div className="content-card">
                <div className="team-member">
                  <div className="team-member-avatar">J</div>
                  <div>
                    <h3 className="content-card-title">Jorge Cervantes</h3>
                    <p className="content-card-description">Mexico Trade Specialist</p>
                    <div className="team-status online">Available</div>
                  </div>
                </div>
                <p className="text-body">
                  Supplier vetting, market entry strategy, and partnership intelligence for Mexico operations
                </p>
                <div className="hero-buttons">
                  <Link href="/services/logistics-support" className="btn-primary">
                    Request Consultation
                  </Link>
                </div>
              </div>

              <div className="content-card">
                <div className="team-member">
                  <div className="team-member-avatar">C</div>
                  <div>
                    <h3 className="content-card-title">Cristina Martinez</h3>
                    <p className="content-card-description">Customs & Logistics</p>
                    <div className="team-status online">Available</div>
                  </div>
                </div>
                <p className="text-body">
                  HS code classification, customs compliance, and multi-route logistics optimization
                </p>
                <div className="hero-buttons">
                  <Link href="/services/logistics-support" className="btn-primary">
                    Request Consultation
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* System Notifications */}
          {dashboardData?.notifications && dashboardData.notifications.length > 0 && (
            <div className="content-card">
              <h2 className="content-card-title">Important Notifications</h2>
              {dashboardData.notifications.map((notification, index) => (
                <div key={index} className={`alert alert-${notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : 'info'}`} style={{marginBottom: index < dashboardData.notifications.length - 1 ? '0.5rem' : '0'}}>
                  <div className="alert-content">
                    <div className="text-body">{notification.message}</div>
                    {notification.action_url && (
                      <div className="hero-buttons" style={{marginTop: '0.5rem'}}>
                        <Link href={notification.action_url} className="btn-primary">
                          {notification.type === 'error' ? 'Upgrade Now' : 'View Pricing'}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity - Only show if there is activity */}
          {recentActivity && recentActivity.length > 0 && (
            <div className="content-card">
              <h2 className="content-card-title">Recent Activity</h2>
              <div>
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <div key={activity.id || index} className="activity-item" style={{padding: '0.75rem 0', borderBottom: index < recentActivity.length - 1 ? '1px solid #e5e7eb' : 'none'}}>
                    <h3 className="content-card-title">
                      {activity.product_description || 'Product Classification'}
                    </h3>
                    <p className="content-card-description">
                      Company: {activity.company_name || 'Not specified'} | Status: {activity.status === 'completed' ? 'Complete' : 'Processing'}
                      {activity.tariff_savings && ` | Savings: $${activity.tariff_savings.toLocaleString()}`}
                    </p>
                    <p className="text-muted" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
                      {new Date(activity.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                <Link href="/certificates" className="nav-link">
                  View Complete History →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}