import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';

export default function AlertHistoryPage() {
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        loadAnalyses();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vulnerability-analyses');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout user={user}>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading analyses...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout user={user}>
      <Head>
        <title>Vulnerability Analyses - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-title">Vulnerability Analysis History</h1>
            <p className="section-description">All your supply chain risk analyses</p>
          </div>

          {analyses.length === 0 ? (
            <div className="content-card">
              <p className="text-body">No analyses found.</p>
              <Link href="/trade-risk-alternatives" className="btn-primary">
                Run Vulnerability Analysis →
              </Link>
            </div>
          ) : (
            <div className="content-card">
              {analyses.map(analysis => {
                const riskColor = analysis.overall_risk_level === 'HIGH' ? '#ef4444' :
                                 analysis.overall_risk_level === 'MODERATE' ? '#f59e0b' : '#10b981';

                return (
                  <div key={analysis.id} className="service-request-card">
                    <div className="header-actions">
                      <div>
                        <div className="text-bold">{analysis.product_description || analysis.company_name}</div>
                        <div className="text-body">
                          Risk: <strong style={{color: riskColor}}>{analysis.overall_risk_level}</strong> •
                          Score: {analysis.risk_score}/100 •
                          {analysis.alert_count} alerts •
                          {new Date(analysis.analyzed_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Link
                        href={`/trade-risk-alternatives?analysis_id=${analysis.id}`}
                        className="btn-secondary"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </TriangleLayout>
  );
}
