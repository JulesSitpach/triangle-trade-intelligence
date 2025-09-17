import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UserDashboard from '../components/UserDashboard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for session (nuclear option approach)
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');

    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);

        // If admin user accidentally comes here, redirect to admin dashboard
        if (userData.isAdmin) {
          router.push('/admin/dashboard');
          return;
        }
      } catch (e) {
        console.log('Invalid stored user data');
        router.push('/login');
        return;
      }
    } else {
      // No session found, redirect to login
      router.push('/login');
      return;
    }

    setLoading(false);
  }, []);

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
  return <UserDashboard user={user} profile={user} />;
}