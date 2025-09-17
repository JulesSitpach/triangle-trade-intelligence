import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function UserDashboard({ user, profile }) {
  // Nuclear option: Simple signOut and utility functions
  const signOut = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('triangle_user_session');
    window.location.href = '/';
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
  const trialExpired = isTrialExpired();

  // Safe subscription data
  const subscriptionData = profile || dashboardData.user_profile || {};
  const isTrialActive = subscriptionData.is_trial;
  const planName = subscriptionData.subscription_plan || 'Essential';

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
              <div className="nav-logo-subtitle">My Dashboard</div>
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
            <div className="hero-badge">
              Free Trial Active • Expires {subscriptionData.trial_expires_at ?
                new Date(subscriptionData.trial_expires_at).toLocaleDateString() :
                'Soon'}
            </div>
          )}

          {/* Your Trade Savings */}
          <div className="content-card">
            <h2 className="content-card-title">💰 Your Trade Savings</h2>

            <div className="grid-3-cols">
              <div>
                <h3 className="content-card-title">Total Saved</h3>
                <p className="text-body">$0</p>
                <p className="content-card-description">Tariff savings achieved</p>
              </div>

              <div>
                <h3 className="content-card-title">Classifications</h3>
                <p className="text-body">{usageStats?.used || 0} / {usageStats?.included || 5}</p>
                <p className="content-card-description">Completed this month</p>
              </div>

              <div>
                <h3 className="content-card-title">Savings Rate</h3>
                <p className="text-body">15-25%</p>
                <p className="content-card-description">Average tariff reduction</p>
              </div>
            </div>

            {usageStats?.remaining === 1 && (
              <div className="hero-badge">
                ⚠️ Only 1 classification remaining! <Link href="/pricing" className="nav-link">Upgrade to continue</Link>
              </div>
            )}
          </div>

          {/* Your Triangle Intelligence Team */}
          <div className="content-card">
            <h2 className="content-card-title">🤝 Your Triangle Intelligence Team</h2>
            <p className="content-card-description">
              Direct access to trade experts when you need guidance
            </p>

            <div className="grid-2-cols">
              <div className="content-card">
                <div className="team-member">
                  <div className="team-member-avatar">👨‍💼</div>
                  <div>
                    <h3 className="content-card-title">Jorge</h3>
                    <p className="content-card-description">Partnerships & Suppliers</p>
                    <div className="team-status online">🟢 Available</div>
                  </div>
                </div>
                <p className="text-body">
                  Specializes in Mexico supplier connections and partnership opportunities
                </p>
                <Link href="mailto:jorge@triangleintelligence.com" className="hero-secondary-button">
                  Schedule Consultation
                </Link>
              </div>

              <div className="content-card">
                <div className="team-member">
                  <div className="team-member-avatar">👩‍💼</div>
                  <div>
                    <h3 className="content-card-title">Cristina</h3>
                    <p className="content-card-description">Compliance & Logistics</p>
                    <div className="team-status online">🟢 Available</div>
                  </div>
                </div>
                <p className="text-body">
                  Expert in USMCA compliance, trade regulations, and logistics optimization
                </p>
                <Link href="mailto:cristina@triangleintelligence.com" className="hero-secondary-button">
                  Schedule Consultation
                </Link>
              </div>
            </div>
          </div>

          {/* Current Workflows Status */}
          <div className="content-card">
            <h2 className="content-card-title">📋 Current Workflows</h2>

            {recentActivity && recentActivity.length > 0 ? (
              <div>
                <p className="content-card-description">You have active workflows in progress</p>
                <Link href="/usmca-workflow" className="hero-primary-button">
                  🚀 Continue Classification
                </Link>
              </div>
            ) : (
              <div>
                <p className="content-card-description">
                  Start your USMCA product classification to unlock tariff savings
                </p>

                {/* Prominent Start Classification Button */}
                <div className="hero-cta">
                  <Link href="/usmca-workflow" className="hero-primary-button large">
                    🚀 Start Classification ({usageStats?.remaining || 5} remaining)
                  </Link>
                </div>

                <p className="text-body">
                  Average time: 10 minutes • Average savings: 15-25%
                </p>
              </div>
            )}
          </div>

          {/* Recent Trade Activity */}
          <div className="content-card">
            <h2 className="content-card-title">📊 Recent Trade Activity</h2>

            {recentActivity && recentActivity.length > 0 ? (
              <div>
                {recentActivity.slice(0, 2).map((activity, index) => (
                  <div key={activity.id || index} className="activity-item">
                    <h3 className="content-card-title">
                      {activity.product_description || 'Product Classification'}
                    </h3>
                    <p className="content-card-description">
                      HS Code: {activity.hs_code || 'Pending'} • {activity.status === 'completed' ? '✅ Complete' : '⏳ Processing'}
                      {activity.tariff_savings && ` • 💰 $${activity.tariff_savings} saved`}
                    </p>
                  </div>
                ))}

                <Link href="/certificates" className="nav-link">
                  View All Activity →
                </Link>
              </div>
            ) : (
              <div>
                <p className="content-card-description">
                  Your completed classifications and savings will appear here
                </p>
              </div>
            )}
          </div>

          {/* Trial Conversion Incentive */}
          {isTrialActive && (
            <div className="content-card">
              <h2 className="content-card-title">🎯 Upgrade Your Trial</h2>
              <p className="content-card-description">
                Get unlimited classifications and direct access to trade experts
              </p>

              <div className="hero-buttons">
                <Link href="/pricing" className="hero-primary-button">
                  View Plans & Pricing
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}