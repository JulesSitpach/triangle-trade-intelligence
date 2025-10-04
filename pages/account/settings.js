import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TriangleLayout from '../../components/TriangleLayout';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllWorkflowData = async () => {
    if (!confirm('Are you sure? This will delete all your saved workflows and alerts. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/user/delete-workflow-data', {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('All workflow data deleted successfully');
        setDeleteConfirm(false);
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete data');
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
            <p className="section-description">Manage your data and privacy preferences</p>
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
            <h3 className="content-card-title">Account Information</h3>
            <div className="text-body">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.user_metadata?.full_name || 'Not set'}</p>
              <p><strong>Company:</strong> {user?.user_metadata?.company_name || 'Not set'}</p>
            </div>
          </div>

        </div>
      </div>
    </TriangleLayout>
  );
}
