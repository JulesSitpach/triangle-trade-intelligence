/**
 * REDIRECT TO OPERATIONAL DASHBOARD
 * Replace mockup sales dashboard with functional business tools
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SalesDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to operational dashboard with real functionality
    console.log('🚀 Redirecting from mockup to operational dashboard...');
    router.replace('/sales/operational-dashboard');
  }, [router]);

  return (
    <div>
      <p>Redirecting to Jorge's operational business dashboard...</p>
    </div>
  );
}