/**
 * SIMPLE DASHBOARD TEST - Minimal version to debug issues
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';

export default function SimpleDashboardTest() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
        if (!userData.isAdmin) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      console.log('Loading test data...');
      const response = await fetch('/api/admin/deals');
      console.log('Response:', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Data:', data);
        setDeals(data.data?.deals || []);
      } else {
        console.error('API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation user={user} />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading test dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Simple Dashboard Test</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNavigation user={user} />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Simple Dashboard Test</h1>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Deals Data Test</h2>
              <p className="mb-4">Number of deals loaded: {deals.length}</p>

              {deals.length > 0 ? (
                <div className="space-y-2">
                  {deals.map((deal, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">{deal.client}</div>
                      <div className="text-sm text-gray-600">
                        Value: ${deal.value?.toLocaleString()} | Status: {deal.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No deals data loaded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}