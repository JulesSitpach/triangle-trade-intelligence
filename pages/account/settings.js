import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AccountSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [emailPrefs, setEmailPrefs] = useState({
    email_marketing: true,
    email_product_updates: true,
    email_security_alerts: true,
    email_billing_notifications: true,
    email_service_updates: true,
    email_weekly_digest: false
  });

  const [smsPrefs, setSmsPrefs] = useState({
    sms_enabled: false,
    sms_security_alerts: false
  });

  const [privacyPrefs, setPrivacyPrefs] = useState({
    profile_visibility: 'private',
    data_sharing_analytics: true
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/preferences');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      setPreferences(data.preferences);
      setEmailPrefs({
        email_marketing: data.preferences.email_marketing,
        email_product_updates: data.preferences.email_product_updates,
        email_security_alerts: data.preferences.email_security_alerts,
        email_billing_notifications: data.preferences.email_billing_notifications,
        email_service_updates: data.preferences.email_service_updates,
        email_weekly_digest: data.preferences.email_weekly_digest
      });
      setSmsPrefs({
        sms_enabled: data.preferences.sms_enabled,
        sms_security_alerts: data.preferences.sms_security_alerts
      });
      setPrivacyPrefs({
        profile_visibility: data.preferences.profile_visibility,
        data_sharing_analytics: data.preferences.data_sharing_analytics
      });
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSuccessMessage('');
    setError('');

    try {
      setSaving(true);
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailPrefs,
          ...smsPrefs,
          ...privacyPrefs
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update preferences');
      }

      setPreferences(data.preferences);
      setSuccessMessage('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPrefChange = (key) => {
    setEmailPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSmsPrefChange = (key) => {
    setSmsPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyPrefChange = (key, value) => {
    setPrivacyPrefs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Head>
        <title>Account Settings | TradeFlow Intelligence</title>
        <meta name="description" content="Manage your account settings and preferences" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">TradeFlow Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/profile" className="nav-menu-link">Profile</Link>
            <Link href="/account/settings" className="nav-menu-link">Settings</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Account Settings</h1>
            <p className="section-header-subtitle">
              Manage your notification preferences and privacy settings
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="content-card success-message">
              <p className="text-body">✓ {successMessage}</p>
            </div>
          )}

          {error && (
            <div className="content-card error-message">
              <p className="text-body">✗ {error}</p>
            </div>
          )}

          {loading ? (
            <div className="content-card">
              <p className="text-body">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Email Notifications */}
              <div className="content-card">
                <h2 className="content-card-title">Email Notifications</h2>
                <p className="content-card-description">
                  Choose which emails you'd like to receive
                </p>

                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Marketing & Promotions</strong>
                      <p className="text-body">
                        Receive updates about new features, special offers, and industry insights
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_marketing}
                        onChange={() => handleEmailPrefChange('email_marketing')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Product Updates</strong>
                      <p className="text-body">
                        Get notified when we release new features and improvements
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_product_updates}
                        onChange={() => handleEmailPrefChange('email_product_updates')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Security Alerts</strong>
                      <p className="text-body">
                        Important security notifications (always enabled for your protection)
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_security_alerts}
                        disabled
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Billing Notifications</strong>
                      <p className="text-body">
                        Invoices, payment confirmations, and subscription updates
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_billing_notifications}
                        onChange={() => handleEmailPrefChange('email_billing_notifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Service Updates</strong>
                      <p className="text-body">
                        Updates on your professional service requests
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_service_updates}
                        onChange={() => handleEmailPrefChange('email_service_updates')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Weekly Digest</strong>
                      <p className="text-body">
                        Weekly summary of your activity and important updates
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailPrefs.email_weekly_digest}
                        onChange={() => handleEmailPrefChange('email_weekly_digest')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SMS Notifications (Future Feature) */}
              <div className="content-card">
                <h2 className="content-card-title">SMS Notifications</h2>
                <p className="content-card-description">
                  Receive text message alerts (coming soon)
                </p>

                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Enable SMS Notifications</strong>
                      <p className="text-body">
                        Get important alerts via text message
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={smsPrefs.sms_enabled}
                        onChange={() => handleSmsPrefChange('sms_enabled')}
                        disabled
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="content-card">
                <h2 className="content-card-title">Privacy & Data</h2>
                <p className="content-card-description">
                  Control how your data is used
                </p>

                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Profile Visibility</strong>
                      <p className="text-body">
                        Control who can see your profile information
                      </p>
                    </div>
                    <select
                      value={privacyPrefs.profile_visibility}
                      onChange={(e) => handlePrivacyPrefChange('profile_visibility', e.target.value)}
                      className="form-input"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Analytics & Improvements</strong>
                      <p className="text-body">
                        Help us improve by sharing anonymous usage data
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={privacyPrefs.data_sharing_analytics}
                        onChange={() => handlePrivacyPrefChange('data_sharing_analytics', !privacyPrefs.data_sharing_analytics)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="content-card">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="content-card danger-zone">
                <h2 className="content-card-title">Danger Zone</h2>
                <p className="content-card-description">
                  Permanent account actions
                </p>
                <button
                  onClick={() => alert('Account deletion feature coming soon. Please contact support for assistance.')}
                  className="btn-danger"
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="content-card">
        <div className="container-app">
          <div className="section-header">
            <p className="text-body">
              © 2024 TradeFlow Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
