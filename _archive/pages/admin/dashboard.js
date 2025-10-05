import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminDashboard from '../../components/AdminDashboard';
import AdminNavigation from '../../components/AdminNavigation';

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

        // Check if user has admin access
        if (!userData.isAdmin) {
          // Non-admin user accessing admin area, redirect to regular dashboard
          router.push('/dashboard');
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

  // Show admin dashboard for admin users
  return (
    <>
      <AdminNavigation user={user} />
      <AdminDashboard user={user} />
    </>
  );
}