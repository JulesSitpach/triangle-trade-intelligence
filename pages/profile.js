import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UserProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: ''
  });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.profile);
      setFormData({
        full_name: data.profile.full_name || '',
        email: data.profile.email || '',
        company_name: data.profile.company_name || '',
        phone: data.profile.phone || '',
        address: data.profile.address || '',
        city: data.profile.city || '',
        state: data.profile.state || '',
        zip_code: data.profile.zip_code || '',
        country: data.profile.country || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');

    try {
      setSaving(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(data.profile);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>My Profile | TradeFlow Intelligence</title>
        <meta name="description" content="Manage your profile and account settings" />
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
            <Link href="/account/subscription" className="nav-menu-link">Subscription</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">My Profile</h1>
            <p className="section-header-subtitle">
              Manage your personal information and account settings
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
              <p className="text-body">Loading profile...</p>
            </div>
          ) : !profile ? (
            <div className="content-card">
              <h3 className="content-card-title">Profile Not Found</h3>
              <p className="content-card-description">
                Unable to load your profile. Please try again.
              </p>
              <button onClick={fetchProfile} className="btn-primary">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Profile Information */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="content-card-title">Profile Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Acme Inc."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid-2-cols">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="New York"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">State/Province</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid-2-cols">
                      <div className="form-group">
                        <label className="form-label">ZIP/Postal Code</label>
                        <input
                          type="text"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="10001"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="United States"
                        />
                      </div>
                    </div>

                    <div className="hero-button-group">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            full_name: profile.full_name || '',
                            email: profile.email || '',
                            company_name: profile.company_name || '',
                            phone: profile.phone || '',
                            address: profile.address || '',
                            city: profile.city || '',
                            state: profile.state || '',
                            zip_code: profile.zip_code || '',
                            country: profile.country || ''
                          });
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-display">
                    <div className="detail-row">
                      <span className="detail-label">Full Name:</span>
                      <span className="detail-value">{profile.full_name || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{profile.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Company:</span>
                      <span className="detail-value">{profile.company_name || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{profile.phone || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{profile.address || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{profile.city || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{profile.state || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ZIP Code:</span>
                      <span className="detail-value">{profile.zip_code || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Country:</span>
                      <span className="detail-value">{profile.country || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Member Since:</span>
                      <span className="detail-value">{formatDate(profile.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Settings */}
              <div className="content-card">
                <h2 className="content-card-title">Security</h2>
                <p className="content-card-description">
                  Manage your password and security settings
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-secondary"
                >
                  Change Password
                </button>
              </div>

              {/* Quick Links */}
              <div className="content-card">
                <h3 className="content-card-title">Account Management</h3>
                <div className="hero-button-group">
                  <Link href="/account/subscription" className="hero-secondary-button">
                    Manage Subscription
                  </Link>
                  <Link href="/account/invoices" className="hero-secondary-button">
                    View Invoices
                  </Link>
                  <Link href="/account/payment-methods" className="hero-secondary-button">
                    Payment Methods
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="content-card-title">Change Password</h3>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  minLength={8}
                  required
                />
                <p className="text-body">Minimum 8 characters</p>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  minLength={8}
                  required
                />
              </div>

              {passwordError && (
                <p className="error-message">{passwordError}</p>
              )}

              <div className="hero-button-group">
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                    setPasswordError('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
