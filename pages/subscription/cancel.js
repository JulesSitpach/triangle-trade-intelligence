import Head from 'next/head';
import Link from 'next/link';

export default function SubscriptionCancel() {
  return (
    <>
      <Head>
        <title>Subscription Cancelled | Triangle Trade Intelligence</title>
        <meta name="description" content="Subscription process was cancelled" />
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
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Subscription Cancelled</h1>
            <p className="section-header-subtitle">
              No charges were made to your account.
            </p>

            <div className="content-card">
              <h2 className="content-card-title">What happened?</h2>
              <p className="content-card-description">
                You cancelled the subscription process before completing payment.
                No charges have been made and no subscription has been created.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Still Interested?</h3>
              <div>
                <p className="text-body">
                  ✓ Try our free USMCA analysis tool
                </p>
                <p className="text-body">
                  ✓ Explore professional services à la carte
                </p>
                <p className="text-body">
                  ✓ Contact our team with questions
                </p>
                <p className="text-body">
                  ✓ Review pricing and plan features
                </p>
              </div>
            </div>

            <div className="hero-button-group">
              <Link href="/usmca-workflow" className="hero-primary-button">
                Try Free Analysis
              </Link>
              <Link href="/pricing" className="hero-secondary-button">
                View Pricing
              </Link>
            </div>
          </div>
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
