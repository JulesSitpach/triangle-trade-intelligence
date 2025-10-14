import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ServiceConfirmation() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session_id) {
      verifyPayment();
    }
  }, [session_id]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/services/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id })
      });

      const data = await response.json();

      if (data.success) {
        setServiceData(data.service);
      } else {
        setError(data.error || 'Payment verification failed');
      }
    } catch (err) {
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card element-spacing">
          <h2>Verifying your payment...</h2>
          <p className="text-body">Please wait while we confirm your service purchase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card element-spacing">
          <h2 className="error-text">Payment Verification Failed</h2>
          <p className="text-body">{error}</p>
          <Link href="/services/logistics-support" className="btn-primary">
            Return to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Service Purchase Confirmed - Triangle Trade Intelligence</title>
      </Head>

      {/* Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">Triangle Trade Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/services" className="nav-menu-link">Services</Link>
            <Link href="/pricing" className="nav-menu-link">Pricing</Link>
            <Link href="/login" className="nav-cta-button">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card element-spacing">
          <div className="success-icon">
            <div className="checkmark">✓</div>
            <h1>Service Purchase Confirmed!</h1>
          </div>

          <div className="card order-details">
            <h3 className="card-title">Order Details</h3>
            <div className="details-grid">
              <p className="text-body">
                <strong>Service:</strong> {serviceData?.service_type}
              </p>
              <p className="text-body">
                <strong>Price:</strong> ${serviceData?.price}
              </p>
              <p className="text-body">
                <strong>Status:</strong> Pending Expert Review
              </p>
              <p className="text-body">
                <strong>Order ID:</strong> {serviceData?.id}
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h3 className="card-title">What Happens Next?</h3>
            <ol className="steps-list">
              <li className="text-body">
                <strong>Confirmation Email:</strong> You'll receive a payment receipt at <strong>{serviceData?.subscriber_data?.contact_email || 'your email'}</strong>
              </li>
              <li className="text-body">
                <strong>Expert Assignment:</strong> Our team has been notified and will begin your service within 24 hours
              </li>
              <li className="text-body">
                <strong>Service Delivery:</strong> Receive your completed deliverable within 5-7 business days via email
              </li>
              <li className="text-body">
                <strong>Questions?</strong> Reply to any email from us or contact support@triangleintelligence.com
              </li>
            </ol>
          </div>

          <div className="next-steps" style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px'}}>
            <h3 className="card-title">💡 Want to save 15-25% on future services?</h3>
            <p className="text-body">
              Subscribe to our Professional ($299/mo) or Premium ($599/mo) plan to get automatic discounts on all services plus unlimited USMCA analysis.
            </p>
            <div style={{marginTop: '1rem'}}>
              <Link href="/pricing" className="btn-primary" style={{marginRight: '0.5rem'}}>
                View Pricing Plans
              </Link>
              <Link href="/services" className="btn-secondary">
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 4rem auto;
          padding: 0 1rem;
        }

        .element-spacing {
          margin-top: 4rem;
        }

        .success-icon {
          text-align: center;
          margin-bottom: 2rem;
        }

        .checkmark {
          font-size: 3rem;
          color: #16a34a;
          margin-bottom: 1rem;
        }

        .error-text {
          color: #dc2626;
        }

        .order-details {
          background: #f9fafb;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .details-grid {
          margin-top: 1rem;
        }

        .details-grid p {
          margin-bottom: 0.75rem;
        }

        .next-steps {
          margin-top: 2rem;
        }

        .steps-list {
          padding-left: 1.5rem;
          margin-top: 1rem;
        }

        .steps-list li {
          margin-bottom: 0.5rem;
        }

        .actions-center {
          margin-top: 2rem;
          text-align: center;
        }
      `}</style>
    </>
  );
}
