import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ServiceConfirmation() {
  const router = useRouter();
  const { session_id, service_request_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session_id && service_request_id) {
      verifyPayment();
    }
  }, [session_id, service_request_id]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/services/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id, service_request_id })
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
                Our expert team has been notified of your service request
              </li>
              <li className="text-body">
                You'll receive an email within 24 hours with next steps
              </li>
              <li className="text-body">
                Track your service progress in your dashboard
              </li>
              <li className="text-body">
                Receive your completed deliverable within 5-7 business days
              </li>
            </ol>
          </div>

          <div className="actions-center">
            <Link href="/dashboard" className="btn-primary">
              View My Dashboard
            </Link>
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
