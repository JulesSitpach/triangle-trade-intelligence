import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });

  useEffect(() => {
    fetchInvoices();
  }, [pagination.offset]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/invoices/list?limit=${pagination.limit}&offset=${pagination.offset}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      setInvoices(data.invoices || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const formatAmount = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'status-active',
      open: 'status-warning',
      draft: 'status-default',
      uncollectible: 'status-canceled',
      void: 'status-canceled',
      payment_failed: 'status-canceled'
    };
    return badges[status] || 'status-default';
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  return (
    <>
      <Head>
        <title>Invoice History | Triangle Trade Intelligence</title>
        <meta name="description" content="View your billing history and invoices" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
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
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/account/subscription" className="nav-menu-link">Subscription</Link>
            <Link href="/account/invoices" className="nav-menu-link">Invoices</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Invoice History</h1>
            <p className="section-header-subtitle">
              View and download your billing invoices
            </p>
          </div>

          {loading ? (
            <div className="content-card">
              <p className="text-body">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="content-card">
              <h3 className="content-card-title">Error Loading Invoices</h3>
              <p className="content-card-description">{error}</p>
              <button onClick={fetchInvoices} className="btn-primary">
                Retry
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="content-card">
              <h3 className="content-card-title">No Invoices Found</h3>
              <p className="content-card-description">
                You don't have any invoices yet. Invoices will appear here after your first billing cycle.
              </p>
              <div className="hero-button-group">
                <Link href="/account/subscription" className="hero-primary-button">
                  View Subscription
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Invoice List */}
              <div className="content-card">
                <h2 className="content-card-title">All Invoices</h2>

                <div className="invoice-list">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="invoice-item">
                      <div className="invoice-info">
                        <div className="invoice-header">
                          <span className="invoice-number">
                            {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                          </span>
                          <span className={`invoice-status ${getStatusBadge(invoice.status)}`}>
                            {invoice.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="invoice-details">
                          <div className="detail-row">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value">
                              {formatAmount(invoice.amount, invoice.currency)}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">
                              {formatDate(invoice.created_at)}
                            </span>
                          </div>

                          {invoice.paid_at && (
                            <div className="detail-row">
                              <span className="detail-label">Paid:</span>
                              <span className="detail-value">
                                {formatDate(invoice.paid_at)}
                              </span>
                            </div>
                          )}

                          {invoice.description && (
                            <div className="detail-row">
                              <span className="detail-label">Description:</span>
                              <span className="detail-value">{invoice.description}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="invoice-actions">
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                          >
                            View Invoice
                          </a>
                        )}
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total > pagination.limit && (
                  <div className="pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={pagination.offset === 0}
                      className="btn-secondary"
                    >
                      Previous
                    </button>

                    <span className="pagination-info">
                      Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      className="btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Back to Subscription */}
              <div className="content-card">
                <div className="hero-button-group">
                  <Link href="/account/subscription" className="hero-secondary-button">
                    Back to Subscription
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="content-card">
        <div className="container-app">
          <div className="section-header">
            <p className="text-body">
              © 2024 Triangle Trade Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
