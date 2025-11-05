/**
 * useSubscriptionLimit Hook
 *
 * Simple React hook to check if user has reached their subscription limit.
 * Use this in any component that has workflow entry buttons.
 *
 * Usage:
 * ```javascript
 * import { useSubscriptionLimit } from '@/lib/hooks/useSubscriptionLimit';
 *
 * function MyComponent() {
 *   const { limitReached, loading, usageStats } = useSubscriptionLimit();
 *
 *   if (limitReached) {
 *     return <Link href="/pricing">🔒 Upgrade for More Analyses</Link>;
 *   }
 *
 *   return <Link href="/usmca-workflow">Start New Workflow</Link>;
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export function useSubscriptionLimit() {
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/check-usage-limit', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsageStats(data.usage);
          setLimitReached(data.limitReached || false);
        }
      } catch (error) {
        console.error('[useSubscriptionLimit] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLimit();
  }, []);

  return { limitReached, loading, usageStats };
}
