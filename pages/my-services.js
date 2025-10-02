import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function MyServices() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services/my-services', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setServices(data.services || []);
      } else {
        setError(data.error || 'Failed to load services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#eab308';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#16a34a';
      case 'pending_payment':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'pending_payment':
        return 'Payment Pending';
      default:
        return status;
    }
  };

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    return service.status === filter;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="card loading-card">
          <h2>Loading your services...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card error-card">
          <h2>Error Loading Services</h2>
          <p className="text-body">{error}</p>
          <button onClick={fetchServices} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Services - Triangle Intelligence</title>
      </Head>

      <div className="container">
        <div className="page-header">
          <h1>My Services</h1>
          <p className="text-body">
            Track your professional service requests and access completed deliverables
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Services ({services.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({services.filter(s => s.status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            In Progress ({services.filter(s => s.status === 'in_progress').length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({services.filter(s => s.status === 'completed').length})
          </button>
        </div>

        {filteredServices.length === 0 ? (
          <div className="card empty-state">
            <h3>No Services Found</h3>
            <p className="text-body">
              {filter === 'all'
                ? "You haven't purchased any professional services yet."
                : `You don't have any ${filter.replace('_', ' ')} services.`}
            </p>
            <Link href="/services/logistics-support" className="btn-primary">
              Browse Professional Services
            </Link>
          </div>
        ) : (
          <div className="services-grid">
            {filteredServices.map(service => (
              <div key={service.id} className="card service-card">
                <div className="service-header">
                  <h3 className="card-title">{service.service_type}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(service.status) }}
                  >
                    {getStatusLabel(service.status)}
                  </span>
                </div>

                <div className="service-details">
                  <div className="detail-row">
                    <span className="detail-label">Company:</span>
                    <span className="detail-value">{service.client_company}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">${service.price}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Requested:</span>
                    <span className="detail-value">
                      {new Date(service.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {service.paid_at && (
                    <div className="detail-row">
                      <span className="detail-label">Paid:</span>
                      <span className="detail-value">
                        {new Date(service.paid_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {service.status === 'completed' && service.completion && (
                  <div className="completion-info">
                    <h4>Service Completed</h4>
                    <p className="text-body">
                      Completed on {new Date(service.completion.completed_at).toLocaleDateString()}
                    </p>
                    {service.completion.report_url && (
                      <a
                        href={service.completion.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary download-btn"
                      >
                        Download Report
                      </a>
                    )}
                  </div>
                )}

                {service.status === 'in_progress' && (
                  <div className="progress-info">
                    <p className="text-body">
                      Our team is working on your request. You'll receive an email when it's completed.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin-bottom: 0.5rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .filter-tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          color: #2563eb;
        }

        .filter-tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .service-card {
          padding: 1.5rem;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .service-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .detail-label {
          color: #6b7280;
        }

        .detail-value {
          font-weight: 500;
        }

        .completion-info,
        .progress-info {
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          margin-top: 1rem;
        }

        .completion-info h4 {
          margin-bottom: 0.5rem;
          color: #16a34a;
        }

        .download-btn {
          display: inline-block;
          margin-top: 0.75rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-state h3 {
          margin-bottom: 0.75rem;
        }

        .empty-state .btn-primary {
          margin-top: 1.5rem;
        }

        .loading-card,
        .error-card {
          text-align: center;
          padding: 3rem 2rem;
        }
      `}</style>
    </>
  );
}
