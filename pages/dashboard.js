import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
import UserDashboard from '../components/UserDashboard';
import BrokerChatbot from '../components/chatbot/BrokerChatbot';

export default function Dashboard() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Use shared auth context instead of redundant API call
  const { user, loading } = useSimpleAuth();

  // Redirect if not authenticated (only runs after auth check completes)
  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No valid session, redirecting to login');
      router.push('/login');
    } else if (!loading && user) {
      console.log('✅ Dashboard access granted for:', user.isAdmin ? 'admin' : 'user');
    }
  }, [loading, user, router]);

  // Force refresh when navigating to dashboard
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (url === '/dashboard') {
        setRefreshKey(prev => prev + 1);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">
            Loading account...
          </div>
        </div>
      </div>
    );
  }

  // If no user found, redirect to login (handled in useEffect)
  if (!user) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">
            Redirecting to login...
          </div>
        </div>
      </div>
    );
  }

  // Show user dashboard for regular users
  return (
    <>
      <UserDashboard key={refreshKey} user={user} profile={user} />
      <BrokerChatbot currentFormField="dashboard" sessionId={`dash_${user.id}`} />
    </>
  );
}