import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Footer from '../components/Footer'

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Head>
        <title>About Us | Triangle Trade Intelligence</title>
        <meta name="description" content="Canadian-owned USMCA compliance platform with Mexico-based expert team. North American business standards with Mexico market access and insights." />
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
          <button
            className="nav-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link href="/services" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/signup" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-video-section">
        <video
          className="hero-video-element"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 0.8;
          }}
          onError={(e) => {
            console.warn('Video failed to load:', e);
            e.target.style.display = 'none';
          }}
        >
          <source src="/image/earth-seamless-loop.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="hero-gradient-overlay" />

        <div className="hero-content-container">
          <div className="hero-badge">
            About Triangle Trade Intelligence
          </div>

          <h1 className="hero-main-title">
            Your Mexico Trade Team
          </h1>
          <h2 className="hero-sub-title">
            <span className="hero-yellow-highlight">Canadian-Owned Platform</span><br/>
            <span>Mexico-Based Expert Team</span>
          </h2>

          <p className="hero-description-text">
            North American business standards combined with Mexico market access and insights. Professional USMCA compliance platform with bilingual expert team support.
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Who We Are</h2>
            <p className="section-header-subtitle">
              Canadian-owned platform with Mexico-based operations delivering professional trade services at SMB-friendly prices
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <div className="content-card-icon">C</div>
              <h3 className="content-card-title">Canadian Ownership</h3>
              <p className="content-card-description">
                Founded by Canadian trade technology expert with 15+ years of experience at IBM, Cognos, Mitel, and LinkedIn. Based in Ottawa, now living in Mexico. Brings North American business standards and enterprise-quality deliverables to the small business market.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">M</div>
              <h3 className="content-card-title">Mexico-Based Team</h3>
              <p className="content-card-description">
                Expert team located in Mexico with deep local market knowledge, supplier relationships, and cultural understanding. Bilingual capabilities (Spanish/English) provide complete USMCA coverage across North America.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">T</div>
              <h3 className="content-card-title">Trust Factor</h3>
              <p className="content-card-description">
                Canadian ownership provides North American companies confidence in professional standards and business practices, while Mexico operations deliver local insights and relationships that distant consultants cannot provide.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">B</div>
              <h3 className="content-card-title">SMB Focus</h3>
              <p className="content-card-description">
                Built specifically for small manufacturers and importers who need Fortune 500 compliance capabilities at affordable prices. Plans start at $99/month with professional services from $99-650 per engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Profiles */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Meet the Team</h2>
            <p className="section-header-subtitle">
              Expert collaboration combining SMB operational experience with enterprise logistics expertise
            </p>
          </div>

          <div className="grid-3-cols">
            {/* Founder */}
            <div className="content-card">
              <div className="content-card-icon">F</div>
              <h3 className="content-card-title">Platform Founder</h3>
              <p className="content-card-description">
                <strong>Canadian from Ottawa, living in Mexico</strong>
              </p>
              <p className="text-body">✓ 15+ years high-tech experience</p>
              <p className="text-body">✓ IBM, Cognos, Mitel, LinkedIn, Level Platform</p>
              <p className="text-body">✓ Video production specialist (enterprise-quality)</p>
              <p className="text-body">✓ Platform developer and architect</p>
              <p className="text-body">✓ Marketing strategy and execution</p>
              <p className="text-body">✓ Bilingual: English/French (Quebec market access)</p>
            </div>

            {/* Business Development Specialist */}
            <div className="content-card">
              <div className="content-card-icon">J</div>
              <h3 className="content-card-title">Business Development Specialist</h3>
              <p className="content-card-description">
                <strong>Mexico Trade Expert</strong>
              </p>
              <p className="text-body">✓ B2B sales expert with 7+ years as business owner</p>
              <p className="text-body">✓ Proven SMB operational experience (Art Printing)</p>
              <p className="text-body">✓ Consultative selling methodology</p>
              <p className="text-body">✓ Bilingual: Spanish/English (native speaker)</p>
              <p className="text-body">✓ Mexico supplier relationships and sourcing</p>
              <p className="text-body">✓ Cultural bridge for North American companies</p>
              <p className="content-card-description">
                <strong>Leads: Pathfinder Market Entry, Supply Chain Resilience</strong>
              </p>
            </div>

            {/* Trade Compliance Expert */}
            <div className="content-card">
              <div className="content-card-icon">C</div>
              <h3 className="content-card-title">Trade Compliance Expert</h3>
              <p className="content-card-description">
                <strong>Licensed Compliance Specialist</strong>
              </p>
              <p className="text-body">✓ 17-year logistics expert</p>
              <p className="text-body">✓ Enterprise experience: Motorola, Arris, Tekmovil</p>
              <p className="text-body">✓ International Commerce degree</p>
              <p className="text-body">✓ HTS codes and INCOTERMS specialist</p>
              <p className="text-body">✓ License #4601913 (professional certification)</p>
              <p className="text-body">✓ Native Spanish with advanced English</p>
              <p className="content-card-description">
                <strong>Leads: USMCA Advantage, Supply Chain Optimization, Crisis Navigator</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Scope and Legal Clarity */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Our Service Scope</h2>
            <p className="section-header-subtitle">
              Clear about what we provide and when licensed professionals are required
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <div className="content-card-icon">✓</div>
              <h3 className="content-card-title">What We Provide</h3>
              <p className="text-body">✓ Trade process consulting and optimization guidance</p>
              <p className="text-body">✓ USMCA qualification assessment and recommendations</p>
              <p className="text-body">✓ Logistics planning and strategic recommendations</p>
              <p className="text-body">✓ Supply chain analysis and process improvement</p>
              <p className="text-body">✓ Market entry strategy and business development support</p>
              <p className="text-body">✓ HS code classification guidance (non-binding recommendations)</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">✗</div>
              <h3 className="content-card-title">What We Do Not Provide</h3>
              <p className="text-body">✗ Licensed customs broker services</p>
              <p className="text-body">✗ Official USMCA certificate preparation (legal documents)</p>
              <p className="text-body">✗ Formal legal compliance certifications</p>
              <p className="text-body">✗ Official customs declarations</p>
              <p className="text-body">✗ Binding legal or regulatory advice</p>
              <p className="text-body">✗ Representation before customs authorities</p>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-icon">P</div>
            <h3 className="content-card-title">Partner Network for Official Services</h3>
            <p className="content-card-description">
              For official customs broker services, USMCA certifications, and legal compliance documents, we partner with licensed professionals. Our services provide expert guidance and assessment to prepare you for these official processes, but official certifications require licensed customs brokers.
            </p>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Choose Triangle Trade Intelligence</h2>
            <p className="section-header-subtitle">
              Unique combination of Canadian standards and Mexico market access
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">N</div>
              <h3 className="content-card-title">Complete USMCA Coverage</h3>
              <p className="content-card-description">
                Bilingual team (Spanish + English + French) covers all USMCA markets: United States, Canada, and Mexico. No language barriers, no cultural misunderstandings.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">$</div>
              <h3 className="content-card-title">Enterprise Quality, SMB Prices</h3>
              <p className="content-card-description">
                Fortune 500 best practices from Motorola and IBM combined with real SMB operational experience. Professional deliverables at prices small businesses can afford.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">⊕</div>
              <h3 className="content-card-title">Time Zone Aligned</h3>
              <p className="content-card-description">
                Mexico-based team works same business hours as North American clients. No waiting overnight for responses from overseas consultants.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">M</div>
              <h3 className="content-card-title">Mexico Supplier Network</h3>
              <p className="content-card-description">
                Direct access to Mexico supplier relationships and sourcing capabilities that distant consultants cannot provide. Find qualified alternatives quickly.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">✓</div>
              <h3 className="content-card-title">Honest Approach</h3>
              <p className="content-card-description">
                Clear about consulting scope versus licensed services. Partner with licensed professionals when required. No overpromising or regulatory misrepresentation.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">★</div>
              <h3 className="content-card-title">Professional Deliverables</h3>
              <p className="content-card-description">
                IBM/Cognos-quality documentation and analysis. Enterprise-level video production for onboarding and training. Professional standards throughout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">
              Ready to Work with Our Team?
            </h2>
            <p className="section-header-subtitle">
              Start with our $99 Trade Health Check or subscribe for AI-powered compliance tools
            </p>
            <div className="hero-button-group">
              <Link
                href="/services/request-form"
                className="btn-primary"
                aria-label="Request Trade Health Check"
              >
                Request Trade Health Check
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary"
                aria-label="View subscription plans"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
