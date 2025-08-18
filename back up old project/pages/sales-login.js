import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function SalesLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Your husband's exclusive sales access (in production, this would be in a secure database)
  const salesTeamAccounts = [
    { 
      email: 'husband.sales@triangle.com', 
      password: 'MexicanSales2025!',
      name: 'Mexican Partnership Specialist',
      role: 'partnership_manager',
      territories: ['MX', 'US', 'CA'],
      specialization: 'Triangle Routing & Mexican Partnerships'
    },
    {
      email: 'admin@triangle.com',
      password: 'AdminAccess2025!',
      name: 'Admin',
      role: 'admin',
      territories: ['ALL']
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check credentials
    const account = salesTeamAccounts.find(
      acc => acc.email === credentials.email && acc.password === credentials.password
    );

    if (account) {
      // Store auth in localStorage (in production, use secure session management)
      localStorage.setItem('salesAuth', JSON.stringify({
        authenticated: true,
        email: account.email,
        name: account.name,
        role: account.role,
        territories: account.territories,
        loginTime: new Date().toISOString()
      }));

      // Redirect to Mexican partnership hub (dedicated for your husband)
      router.push('/mexican-partnership-hub');
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sales Team Login - Triangle Intelligence</title>
      </Head>

      <main className="signup-form-section">
        <div className="container">
          <div className="signup-form-container">
          {/* Header */}
          <div className="signup-form-title">
            <h1>🇲🇽 Mexican Partnership Hub</h1>
            <p className="signup-form-subtitle">
              Exclusive Access for Triangle Intelligence Partnership Manager
            </p>
          </div>

          {/* Login Form */}
          <form className="signup-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>
                Email Address
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="husband.sales@triangle.com"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Access Partnership Hub'}
              </button>
            </div>
          </form>

          {/* Demo Credentials Box */}
          <div className="info-box">
            <h3>DEMO CREDENTIALS</h3>
            <div className="credentials-info">
              <div className="credential-group">
                <strong>Mexican Partnership Specialist:</strong><br />
                Email: husband.sales@triangle.com<br />
                Password: MexicanSales2025!
              </div>
              <div className="credential-group">
                <strong>Admin Access:</strong><br />
                Email: admin@triangle.com<br />
                Password: AdminAccess2025!
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="features-list">
            <h3>Sales Portal Features:</h3>
            <ul>
              <li>✓ Partnership opportunity matching</li>
              <li>✓ CRM for deal management</li>
              <li>✓ Mexican partner database</li>
              <li>✓ Commission tracking</li>
              <li>✓ Analytics & reporting</li>
            </ul>
          </div>

          {/* Back to Main Site */}
          <div className="form-footer">
            <Link href="/dashboard" className="link-secondary">
              ← Back to Main Dashboard
            </Link>
          </div>
          </div>
        </div>
      </main>
    </>
  );
}