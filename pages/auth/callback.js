import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../../lib/database/supabase-client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseClient();

        console.log('🔄 Processing OAuth callback...', window.location.href);

        // ✅ FIX: Give Supabase time to process the URL hash and set the session
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          console.error('❌ No session found after OAuth callback');
          console.log('URL:', window.location.href);
          setError('Authentication failed. Please try again.');
          // Redirect back to login after 3 seconds
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        console.log('✅ OAuth session established:', session.user.email);

        // Create or update user profile in our database
        const { user } = session;
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            provider: 'google'
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Profile creation error:', result.error);
          setError(result.error || 'Failed to create profile');
          return;
        }

        console.log('✅ User profile created/updated');

        // ✅ FIX: Check if user selected a paid plan before OAuth
        const selectedPlan = localStorage.getItem('oauth_selected_plan');

        if (selectedPlan && selectedPlan !== 'trial') {
          // User selected a paid plan → redirect to pricing to complete subscription
          console.log('🔄 Redirecting to pricing for plan:', selectedPlan);
          localStorage.removeItem('oauth_selected_plan'); // Clean up
          window.location.href = `/pricing?plan=${selectedPlan}`;
        } else {
          // Free tier user → redirect to dashboard
          console.log('🔄 Redirecting to dashboard (free tier)');
          if (selectedPlan) localStorage.removeItem('oauth_selected_plan'); // Clean up
          window.location.href = '/dashboard';
        }

      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <>
      <Head>
        <title>Signing in... - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div className="content-card">
            {error ? (
              <>
                <h1 className="section-header-title">Authentication Error</h1>
                <div className="status-error" style={{ marginTop: '1.5rem' }}>
                  {error}
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary"
                  style={{ marginTop: '1.5rem' }}
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <h1 className="section-header-title">Signing you in...</h1>
                <p className="section-header-subtitle">Please wait while we complete your authentication.</p>
                <div style={{ marginTop: '2rem' }}>
                  <div className="loading-spinner"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
