import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';

export default function BrokerManagement() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(stored);
      if (!userData.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
    } catch (e) {
      router.push('/login');
    }
  }, []);

  return (
    <>
      <AdminNavigation user={user} />
      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">🚛 Cristina's Broker Network</h1>
          </div>
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="text-body">Cristina's broker management system coming soon...</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}