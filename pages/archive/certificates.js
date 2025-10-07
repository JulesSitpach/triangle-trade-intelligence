import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TriangleLayout from '../components/TriangleLayout';

export default function CertificatesPage() {
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
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
        loadCertificates();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout user={user}>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading certificates...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout user={user}>
      <Head>
        <title>My Certificates - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-title">USMCA Certificates</h1>
            <p className="section-description">All your generated USMCA certificates</p>
          </div>

          {certificates.length === 0 ? (
            <div className="content-card">
              <p className="text-body">No certificates generated yet.</p>
              <a href="/usmca-workflow" className="btn-primary">
                Run USMCA Analysis →
              </a>
            </div>
          ) : (
            <div className="content-card">
              {certificates.map(cert => (
                <div key={cert.id} className="service-request-card">
                  <div className="header-actions">
                    <div>
                      <div className="text-bold">{cert.product_description}</div>
                      <div className="text-body">
                        {cert.certificate_number} •
                        {new Date(cert.created_at).toLocaleDateString()}
                        {cert.estimated_annual_savings && ` • $${cert.estimated_annual_savings.toLocaleString()}/year savings`}
                      </div>
                    </div>
                    {cert.pdf_url && (
                      <a
                        href={cert.pdf_url}
                        download
                        className="btn-primary"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </TriangleLayout>
  );
}
