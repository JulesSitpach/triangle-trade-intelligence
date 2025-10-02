import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TriangleLayout from '../../components/TriangleLayout';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function AccountSettings() {
  const { user } = useSimpleAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Essential settings only
  const [settings, setSettings] = useState({
    company_name: '',
    email: '',
    industry: '',
    notify_service_requests: true,
    notify_security_alerts: true
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSettings();
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setSettings({
          company_name: data.company_name || user?.user_metadata?.company_name || '',
          email: data.email || user?.email || '',
          industry: data.industry || '',
          notify_service_requests: data.notify_service_requests ?? true,
          notify_security_alerts: data.notify_security_alerts ?? true
        });
      } else {
        // Fallback to user data
        setSettings({
          company_name: user?.user_metadata?.company_name || '',
          email: user?.email || '',
          industry: '',
          notify_service_requests: true,
          notify_security_alerts: true
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Use user data as fallback
      setSettings({
        company_name: user?.user_metadata?.company_name || '',
        email: user?.email || '',
        industry: '',
        notify_service_requests: true,
        notify_security_alerts: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');

    try {
      setSaving(true);
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading settings...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings - Triangle Intelligence</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="section-header">
              <h1 className="section-title">Account Settings</h1>
              <p className="text-body">
                Manage your profile, password, and notification preferences
              </p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #16a34a', marginBottom: '2rem' }}>
                <p className="text-body" style={{ color: '#16a34a', margin: 0 }}>✓ {successMessage}</p>
              </div>
            )}

            {error && (
              <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #dc2626', marginBottom: '2rem' }}>
                <p className="text-body" style={{ color: '#dc2626', margin: 0 }}>✗ {error}</p>
              </div>
            )}

            {/* Profile Information */}
            <div className="card">
              <h2 className="card-title">Profile Information</h2>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label htmlFor="company_name">Company Name</label>
                  <input
                    type="text"
                    id="company_name"
                    className="form-input"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={settings.email}
                    disabled
                    style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                  />
                  <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Contact support to change your email address
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Industry</label>
                  <select
                    id="industry"
                    className="form-input"
                    value={settings.industry}
                    onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                  >
                    <option value="">Select your industry</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="automotive">Automotive</option>
                    <option value="electronics">Electronics</option>
                    <option value="textiles">Textiles & Apparel</option>
                    <option value="food">Food & Beverage</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="machinery">Machinery</option>
                    <option value="logistics">Logistics & Transportation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Password & Security */}
            <div className="card">
              <h2 className="card-title">Password & Security</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label htmlFor="current_password">Current Password</label>
                  <input
                    type="password"
                    id="current_password"
                    className="form-input"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new_password">New Password</label>
                  <input
                    type="password"
                    id="new_password"
                    className="form-input"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm_password"
                    className="form-input"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Notifications */}
            <div className="card">
              <h2 className="card-title">Email Notifications</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                Choose what emails you want to receive
              </p>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="notify_service_requests"
                  checked={settings.notify_service_requests}
                  onChange={(e) => setSettings({ ...settings, notify_service_requests: e.target.checked })}
                  style={{ marginRight: '0.75rem' }}
                />
                <label htmlFor="notify_service_requests" className="text-body" style={{ margin: 0 }}>
                  Service request updates (when your orders are processed)
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="notify_security_alerts"
                  checked={settings.notify_security_alerts}
                  disabled
                  style={{ marginRight: '0.75rem', cursor: 'not-allowed' }}
                />
                <label htmlFor="notify_security_alerts" className="text-body" style={{ margin: 0, color: '#6b7280' }}>
                  Security alerts (always on for your protection)
                </label>
              </div>

              <button onClick={handleSaveSettings} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ border: '1px solid #dc2626' }}>
              <h2 className="card-title" style={{ color: '#dc2626' }}>Danger Zone</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                Once you delete your account, there is no going back. This will permanently delete your profile, workflow data, and service history.
              </p>
              <button
                className="btn-secondary"
                onClick={() => {
                  if (confirm('Are you absolutely sure? This action cannot be undone.')) {
                    router.push('/account/delete');
                  }
                }}
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
