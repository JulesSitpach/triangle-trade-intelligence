import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CertificateLibrary() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });

  useEffect(() => {
    fetchCertificates();
  }, [pagination.offset, statusFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        status: statusFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/certificates/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch certificates');
      }

      setCertificates(data.certificates || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchCertificates();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-warning',
      in_progress: 'status-default',
      completed: 'status-active',
      rejected: 'status-canceled'
    };
    return badges[status] || 'status-default';
  };

  const getQualificationBadge = (status) => {
    const badges = {
      QUALIFIED: 'status-active',
      NOT_QUALIFIED: 'status-canceled',
      PARTIAL: 'status-warning'
    };
    return badges[status] || 'status-default';
  };

  return (
    <>
      <Head>
        <title>Certificate Library | TradeFlow Intelligence</title>
        <meta name="description" content="View and manage your USMCA certificates" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">TradeFlow Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/certificates" className="nav-menu-link">Certificates</Link>
            <Link href="/profile" className="nav-menu-link">Profile</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Certificate Library</h1>
            <p className="section-header-subtitle">
              View and download your USMCA compliance certificates
            </p>
          </div>

          {/* Search and Filters */}
          <div className="content-card">
            <div className="search-filters">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company or product..."
                  className="form-input"
                />
                <button type="submit" className="btn-primary">
                  Search
                </button>
              </form>

              <div className="filter-buttons">
                <button
                  onClick={() => handleStatusFilter('')}
                  className={statusFilter === '' ? 'btn-primary' : 'btn-secondary'}
                >
                  All
                </button>
                <button
                  onClick={() => handleStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusFilter('in_progress')}
                  className={statusFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusFilter('completed')}
                  className={statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="content-card">
              <p className="text-body">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} certificates
              </p>
            </div>
          )}

          {/* Certificates List */}
          {loading ? (
            <div className="content-card">
              <p className="text-body">Loading certificates...</p>
            </div>
          ) : error ? (
            <div className="content-card">
              <h3 className="content-card-title">Error Loading Certificates</h3>
              <p className="content-card-description">{error}</p>
              <button onClick={fetchCertificates} className="btn-primary">
                Retry
              </button>
            </div>
          ) : certificates.length === 0 ? (
            <div className="content-card">
              <h3 className="content-card-title">No Certificates Found</h3>
              <p className="content-card-description">
                You haven't generated any USMCA certificates yet.
              </p>
              <div className="hero-button-group">
                <Link href="/usmca-workflow" className="hero-primary-button">
                  Start USMCA Analysis
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="certificates-grid">
                {certificates.map((cert) => (
                  <div key={cert.id} className="content-card certificate-card">
                    <div className="certificate-header">
                      <h3 className="content-card-title">{cert.company}</h3>
                      <span className={`certificate-status ${getStatusBadge(cert.status)}`}>
                        {cert.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="certificate-details">
                      <div className="detail-row">
                        <span className="detail-label">Product:</span>
                        <span className="detail-value">{cert.product}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">USMCA Status:</span>
                        <span className={`detail-value ${getQualificationBadge(cert.qualification_status)}`}>
                          {cert.qualification_status}
                        </span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Annual Tariff Cost:</span>
                        <span className="detail-value">{formatCurrency(cert.annual_tariff_cost)}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Potential Savings:</span>
                        <span className="detail-value savings">{formatCurrency(cert.potential_savings)}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(cert.created_at)}</span>
                      </div>

                      {cert.updated_at !== cert.created_at && (
                        <div className="detail-row">
                          <span className="detail-label">Updated:</span>
                          <span className="detail-value">{formatDate(cert.updated_at)}</span>
                        </div>
                      )}
                    </div>

                    <div className="certificate-actions">
                      {cert.certificate_url ? (
                        <>
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                          >
                            View Certificate
                          </a>
                          <a
                            href={cert.certificate_url}
                            download
                            className="btn-secondary"
                          >
                            Download PDF
                          </a>
                        </>
                      ) : cert.status === 'completed' ? (
                        <p className="text-body">Certificate processing...</p>
                      ) : (
                        <p className="text-body">Certificate pending completion</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="content-card">
                  <div className="pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={pagination.offset === 0}
                      className="btn-secondary"
                    >
                      Previous
                    </button>

                    <span className="pagination-info">
                      Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      className="btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Actions */}
          <div className="content-card">
            <h3 className="content-card-title">Quick Actions</h3>
            <div className="hero-button-group">
              <Link href="/usmca-workflow" className="hero-primary-button">
                New USMCA Analysis
              </Link>
              <Link href="/services/mexico-trade-services" className="hero-secondary-button">
                Professional Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="content-card">
        <div className="container-app">
          <div className="section-header">
            <p className="text-body">
              © 2024 TradeFlow Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
