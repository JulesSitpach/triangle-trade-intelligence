import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UserDashboard from '../components/UserDashboard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check cookie-based session via API
    fetch('/api/auth/me', {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
      if (data.authenticated && data.user) {
        setUser(data.user);
        console.log('✅ Dashboard access granted for:', data.user.isAdmin ? 'admin' : 'user');
        setLoading(false);
      } else {
        console.log('❌ No valid session, redirecting to login');
        router.push('/login');
      }
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      router.push('/login');
    });
  }, []);

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
  return <UserDashboard key={refreshKey} user={user} profile={user} />;
}