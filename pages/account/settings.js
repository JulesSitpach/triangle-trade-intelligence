import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TriangleLayout from '../../components/TriangleLayout';
import { useToast, useConfirm } from '../../components/Toast';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [userTier, setUserTier] = useState('Trial'); // Track subscription tier
  const router = useRouter();
  const toast = useToast();
  const { confirm: confirmDialog, ConfirmDialog} = useConfirm();

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    policyAlerts: true,
    tariffChanges: true,
    weeklySummary: false,
    serviceMatches: true
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUserTier(data.user?.subscription_tier || 'Trial'); // Get subscription tier
      } else {
        router.push('/login?redirect=/account/settings');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login?redirect=/account/settings');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllWorkflowData = async () => {
    await confirmDialog({
      title: 'Delete All Workflow Data?',
      message: 'This will delete all your saved workflows and alerts. This action cannot be undone.',
      type: 'danger',
      confirmText: 'Yes, Delete Everything',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/user/delete-workflow-data', {
            method: 'DELETE'
          });

          if (response.ok) {
            toast.success('All workflow data deleted successfully');
            setDeleteConfirm(false);
            router.push('/dashboard');
          } else {
            const data = await response.json();
            toast.error(data.error || 'Failed to delete data');
          }
        } catch (error) {
          console.error('Delete failed:', error);
          toast.error('Failed to delete data');
        }
      }
    });
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailChangeError('');
    setEmailChangeSuccess('');

    if (!newEmail || !newEmail.includes('@')) {
      setEmailChangeError('Please enter a valid email address');
      return;
    }

    if (newEmail === user?.email) {
      setEmailChangeError('This is already your current email');
      return;
    }

    setEmailChangeLoading(true);

    try {
      const response = await fetch('/api/user/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailChangeSuccess('Verification email sent! Please check your inbox to confirm the change.');
        setNewEmail('');
      } else {
        setEmailChangeError(data.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Email change failed:', error);
      setEmailChangeError('An unexpected error occurred');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    setPasswordChangeLoading(true);

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordChangeSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordChangeError(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password change failed:', error);
      setPasswordChangeError('An unexpected error occurred');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setNotificationLoading(true);
    setNotificationSuccess('');

    try {
      const response = await fetch('/api/user/update-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notificationPrefs)
      });

      if (response.ok) {
        setNotificationSuccess('Notification preferences saved successfully!');
        setTimeout(() => setNotificationSuccess(''), 3000);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Notification save failed:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setNotificationLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout user={user}>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading settings...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout user={user}>
      <Head>
        <title>Account Settings - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-title">Account Settings</h1>
            <p className="section-description">Manage your account, credentials, and privacy preferences</p>
          </div>

          {/* Account Information */}
          <div className="content-card">
            <h3 className="content-card-title">Account Information</h3>
            <div className="text-body">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.user_metadata?.full_name || 'Not set'}</p>
              <p><strong>Company:</strong> {user?.user_metadata?.company_name || 'Not set'}</p>
              <p><strong>Subscription:</strong> {user?.subscription_tier || 'Trial'}</p>
            </div>
          </div>

          {/* Email Change */}
          <div className="content-card">
            <h3 className="content-card-title">Change Email Address</h3>
            <p className="text-body">Update your email address. You'll need to verify the new email before the change takes effect.</p>

            {emailChangeSuccess && (
              <div className="status-success" style={{marginTop: '1rem'}}>
                {emailChangeSuccess}
              </div>
            )}

            {emailChangeError && (
              <div className="status-error" style={{marginTop: '1rem'}}>
                {emailChangeError}
              </div>
            )}

            <form onSubmit={handleEmailChange} style={{marginTop: '1rem'}}>
              <div className="form-group">
                <label className="form-label">New Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder={user?.email}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={emailChangeLoading}
              >
                {emailChangeLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="content-card">
            <h3 className="content-card-title">Change Password</h3>
            <p className="text-body">Choose a strong password with at least 6 characters.</p>

            {passwordChangeSuccess && (
              <div className="status-success" style={{marginTop: '1rem'}}>
                {passwordChangeSuccess}
              </div>
            )}

            {passwordChangeError && (
              <div className="status-error" style={{marginTop: '1rem'}}>
                {passwordChangeError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{marginTop: '1rem'}}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={passwordChangeLoading}
              >
                {passwordChangeLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="content-card">
            <h3 className="content-card-title">Data Privacy & Storage</h3>

            <div className="text-body">
              <p>Your workflow analyses are automatically saved to enable:</p>
              <ul style={{marginTop: '0.5rem', paddingLeft: '1.5rem'}}>
                <li>Trade risk alerts and monitoring</li>
                <li>Professional service requests with context</li>
                <li>Certificate regeneration and history</li>
                <li>Dashboard access to past analyses</li>
              </ul>
            </div>

            <div className="service-request-card" style={{borderLeft: '4px solid #ef4444', backgroundColor: '#fef2f2', marginTop: '1rem'}}>
              <h4 className="text-bold">Delete All Workflow Data</h4>
              <p className="text-body">
                Permanently delete all saved workflows, alerts, and analysis history. This will disable all alert monitoring and service features.
              </p>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="btn-secondary"
                >
                  Delete My Workflow Data
                </button>
              ) : (
                <div>
                  <p className="text-bold" style={{color: '#ef4444'}}>
                    ⚠️ Are you absolutely sure?
                  </p>
                  <div className="hero-buttons">
                    <button
                      onClick={deleteAllWorkflowData}
                      className="btn-primary"
                      style={{backgroundColor: '#ef4444'}}
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="content-card">
            <h3 className="content-card-title">📧 Email Notification Preferences</h3>

            {userTier === 'Trial' ? (
              <div>
                <div className="alert alert-warning" style={{marginTop: '1rem'}}>
                  <div className="alert-content">
                    <div className="alert-title">🔒 Upgrade Required</div>
                    <div className="text-body">
                      Email alerts are available for paying subscribers. Upgrade to receive real-time notifications about:
                    </div>
                    <ul className="text-body" style={{marginTop: '0.5rem', marginLeft: '1.5rem'}}>
                      <li>Government policy alerts affecting your components</li>
                      <li>Tariff rate changes for your HS codes</li>
                      <li>Weekly summary of all monitored sources</li>
                      <li>New professional services matching your profile</li>
                    </ul>
                    <button
                      className="btn-primary"
                      style={{marginTop: '1rem'}}
                      onClick={() => router.push('/pricing')}
                    >
                      View Pricing Plans (Starting at $99/month)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-body">
                  Choose how you want to receive alerts about trade policy changes affecting your supply chain:
                </p>

                {notificationSuccess && (
                  <div className="status-success" style={{marginTop: '1rem'}}>
                    {notificationSuccess}
                  </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.policyAlerts}
                      onChange={(e) => setNotificationPrefs({...notificationPrefs, policyAlerts: e.target.checked})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span className="text-body">Email me when government policy alerts affect my components</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.tariffChanges}
                      onChange={(e) => setNotificationPrefs({...notificationPrefs, tariffChanges: e.target.checked})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span className="text-body">Email me when tariff rates change for my HS codes</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.weeklySummary}
                      onChange={(e) => setNotificationPrefs({...notificationPrefs, weeklySummary: e.target.checked})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span className="text-body">Email me weekly summary of all monitored sources</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.serviceMatches}
                      onChange={(e) => setNotificationPrefs({...notificationPrefs, serviceMatches: e.target.checked})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span className="text-body">Email me when new professional services match my profile</span>
                  </label>
                </div>

                <p className="form-help" style={{ marginTop: '1rem' }}>
                  💡 We only send alerts relevant to your specific trade profile. You can change these preferences anytime.
                </p>

                <button
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={handleNotificationSave}
                  disabled={notificationLoading}
                >
                  {notificationLoading ? 'Saving...' : 'Save Notification Preferences'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      {ConfirmDialog}
    </TriangleLayout>
  );
}
