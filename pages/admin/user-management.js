/**
 * USER MANAGEMENT ADMIN INTERFACE
 * Manage customer accounts, subscriptions, and user data
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';

const Plus = ({ className }) => (
  <span className={className}>[plus]</span>
);

const Edit = ({ className }) => (
  <span className={className}>[edit]</span>
);

const User = ({ className }) => (
  <span className={className}>[user]</span>
);

const CheckCircle = ({ className }) => (
  <span className={className}>[check]</span>
);

const AlertCircle = ({ className }) => (
  <span className={className}>[alert]</span>
);

const Mail = ({ className }) => (
  <span className={className}>[mail]</span>
);

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to load from real APIs - will show empty if APIs don't exist
      try {
        const userResponse = await fetch('/api/admin/users', { method: 'GET' });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUsers(userData.users || []);
          console.log('✅ Loaded users:', userData.users?.length || 0);
        } else {
          console.log('No /api/admin/users API - showing empty state');
          setUsers([]);
        }
      } catch (error) {
        console.log('User API not available:', error.message);
        setUsers([]);
      }

      try {
        const subscriptionResponse = await fetch('/api/admin/subscriptions', { method: 'GET' });
        if (subscriptionResponse.ok) {
          const subData = await subscriptionResponse.json();
          setSubscriptions(subData.subscriptions || []);
          console.log('✅ Loaded subscriptions:', subData.subscriptions?.length || 0);
        } else {
          console.log('No /api/admin/subscriptions API - showing empty state');
          setSubscriptions([]);
        }
      } catch (error) {
        console.log('Subscription API not available:', error.message);
        setSubscriptions([]);
      }

      try {
        const analyticsResponse = await fetch('/api/admin/user-analytics', { method: 'GET' });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData || {});
          console.log('✅ Loaded analytics data');
        } else {
          console.log('No /api/admin/user-analytics API - showing empty state');
          setAnalytics({
            total_users: 0,
            active_users: 0,
            trial_users: 0,
            total_mrr: 0,
            churn_rate: 0,
            avg_savings_per_user: 0
          });
        }
      } catch (error) {
        console.log('User analytics API not available:', error.message);
        setAnalytics({
          total_users: 0,
          active_users: 0,
          trial_users: 0,
          total_mrr: 0,
          churn_rate: 0,
          avg_savings_per_user: 0
        });
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeUser = async (userId, newTier) => {
    try {
      // TODO: Implement API call
      console.log('Upgrading user:', userId, 'to:', newTier);
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, subscription_tier: newTier, status: 'active' }
          : user
      ));
    } catch (error) {
      console.error('Failed to upgrade user:', error);
    }
  };

  const handleAddUser = () => {
    // Simulate adding a new user
    const newUser = {
      id: String(users.length + 1),
      company_name: 'New Company Inc',
      email: 'new.user@example.com',
      status: 'trial',
      subscription_tier: 'basic',
      workflow_completions: 0,
      certificates_generated: 0,
      total_savings: 0,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      industry: 'Technology',
      company_size: '1-50',
      phone: '+1-555-0000',
      city: 'San Francisco',
      state: 'CA',
      country: 'US'
    };
    
    setUsers(prev => [newUser, ...prev]);
    alert('New user added successfully!');
  };

  const handleExportUsers = () => {
    // Create CSV export of users
    const csvData = [
      ['Company Name', 'Email', 'Status', 'Tier', 'Workflows', 'Certificates', 'Savings', 'Created'],
      ...users.map(user => [
        user.company_name,
        user.email,
        user.status,
        user.subscription_tier,
        user.workflow_completions,
        user.certificates_generated,
        user.total_savings,
        new Date(user.created_at).toLocaleDateString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Exported ${users.length} users to CSV file!`);
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-muted">Loading user management system...</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="content-card">
            <h1 className="page-title">
              User Management
            </h1>
            <p className="page-subtitle">
              Manage customer accounts, subscriptions, and platform usage
            </p>
          </div>
          
          <div className="hero-button-group">
            <div className="content-card analysis">
              <div className="content-card-icon">
                <User className="icon-md" />
              </div>
              <div className="calculator-metric-value success">{analytics.active_users}</div>
              <div className="calculator-metric-title">Active Users</div>
              <p className="text-muted">
                ${analytics.total_mrr?.toLocaleString()} MRR
              </p>
            </div>
            
            <button className="btn-primary" onClick={handleAddUser}>
              <Plus className="icon-sm" />
              <span>Add User</span>
            </button>
            
            <button className="btn-secondary" onClick={handleExportUsers}>
              <span>Export Users</span>
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid-4-cols element-spacing">
          <div className="content-card analysis">
            <div className="calculator-metric-value info">{analytics.total_users}</div>
            <div className="calculator-metric-title">Total Users</div>
          </div>
          <div className="content-card classification">
            <div className="calculator-metric-value warning">{analytics.trial_users}</div>
            <div className="calculator-metric-title">Trial Users</div>
          </div>
          <div className="content-card success">
            <div className="calculator-metric-value success">${analytics.avg_savings_per_user?.toLocaleString()}</div>
            <div className="calculator-metric-title">Avg Savings/User</div>
          </div>
          <div className="content-card compliance">
            <div className="calculator-metric-value primary">{analytics.churn_rate}%</div>
            <div className="calculator-metric-title">Churn Rate</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="section-spacing">
          <nav className="nav-menu">
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'nav-menu-link' : 'btn-secondary'}
            >
              User Accounts ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={activeTab === 'subscriptions' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Subscriptions ({subscriptions.length})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'users' && (
          <UsersList 
            users={users} 
            onUpgradeUser={handleUpgradeUser}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsList subscriptions={subscriptions} users={users} />
        )}
      </div>
    </TriangleLayout>
  );
}

function UsersList({ users, onUpgradeUser }) {
  return (
    <div className="element-spacing">
      {users.map(user => (
        <div key={user.id} className="content-card">
          <div className="card-header">
            <div className="content-card">
              <div className="hero-button-group">
                <h3 className="content-card-title">
                  {user.company_name}
                </h3>
                <span className={`status-${user.status === 'active' ? 'success' : 'warning'}`}>
                  {user.status === 'active' ? (
                    <>
                      <CheckCircle className="icon-sm" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="icon-sm" />
                      <span>Trial Expired</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-muted element-spacing">
                <Mail className="icon-sm" />
                <span>{user.email}</span>
              </p>
              <div className="grid-4-cols">
                <div className="text-body">
                  <span>Tier: </span>
                  <span className="status-info">{user.subscription_tier}</span>
                </div>
                <div className="text-body">
                  <span>Workflows: </span>
                  <span className="calculator-metric-value primary">{user.workflow_completions}</span>
                </div>
                <div className="text-body">
                  <span>Certificates: </span>
                  <span className="calculator-metric-value success">{user.certificates_generated}</span>
                </div>
                <div className="text-body">
                  <span>Savings: </span>
                  <span className="status-success">${user.total_savings?.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid-2-cols">
                <div className="text-muted">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="text-muted">
                  Last Login: {new Date(user.last_login).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-button-group">
            {user.status === 'trial_expired' && (
              <button
                onClick={() => onUpgradeUser(user.id, 'Professional')}
                className="btn-success"
              >
                <CheckCircle className="icon-sm" />
                <span>Activate Professional</span>
              </button>
            )}
            <button className="btn-primary">
              <Edit className="icon-sm" />
              <span>Edit Account</span>
            </button>
            <button className="btn-secondary">
              <span>View Usage</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubscriptionsList({ subscriptions, users }) {
  return (
    <div className="element-spacing">
      {subscriptions.map(subscription => {
        const user = users.find(u => u.id === subscription.user_id);
        
        return (
          <div key={subscription.id} className="content-card">
            <div className="card-header">
              <div className="content-card">
                <div className="hero-button-group">
                  <h3 className="content-card-title">
                    {user?.company_name}
                  </h3>
                  <span className="status-success">
                    <span>{subscription.tier}</span>
                  </span>
                </div>
                <p className="text-muted element-spacing">
                  <Mail className="icon-sm" />
                  <span>{user?.email}</span>
                </p>
                <div className="grid-3-cols">
                  <div className="text-body">
                    <span>Monthly: </span>
                    <span className="calculator-metric-value success">${subscription.monthly_fee}</span>
                  </div>
                  <div className="text-body">
                    <span>Usage: </span>
                    <span className="status-info">{subscription.usage_percent}%</span>
                  </div>
                  <div className="text-body">
                    <span>Next Billing: </span>
                    <span className="text-muted">{new Date(subscription.next_billing).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="content-card analysis">
                <div className="calculator-metric-value success">${subscription.monthly_fee}</div>
                <div className="calculator-metric-title">Monthly Revenue</div>
              </div>
            </div>
            
            <div className="hero-button-group">
              <button className="btn-primary">
                <span>Billing History</span>
              </button>
              <button className="btn-secondary">
                <span>Usage Analytics</span>
              </button>
              <button className="btn-secondary">
                <span>Account Settings</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}