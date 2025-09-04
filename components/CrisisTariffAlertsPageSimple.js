/**
 * SIMPLIFIED CRISIS TARIFF ALERTS PAGE - FOR DEBUGGING
 */

import { useState, useEffect } from 'react';

export default function CrisisTariffAlertsPageSimple() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="page-title">
        🚨 Crisis Tariff Alerts - Simplified Version
      </h1>
      <p>This is a simplified version to test build issues.</p>
    </div>
  );
}