/**
 * Professional Service Request Form
 * Clean, professional form that uses existing USMCA workflow data
 * No repeated information, direct service selection
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function ServiceRequest() {
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();
  const { service } = router.query;

  const [workflowData, setWorkflowData] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = {
    'usmca-certificate': {
      name: 'USMCA Certificate Generation',
      price: 250,
      nonSubscriberPrice: 300,
      expert: 'Licensed Customs Broker',
      description: 'Professional USMCA certificate with regulatory compliance validation'
    },
    'hs-classification': {
      name: 'HS Code Classification',
      price: 200,
      nonSubscriberPrice: 240,
      expert: 'Licensed Customs Broker',
      description: 'Audit-proof HS code classification with supporting documentation'
    },
    'crisis-response': {
      name: 'Crisis Response Management',
      price: 400,
      nonSubscriberPrice: 480,
      expert: 'Licensed Customs Broker',
      description: 'Emergency compliance analysis and action plan'
    },
    'supplier-sourcing': {
      name: 'Supplier Sourcing',
      price: 450,
      nonSubscriberPrice: 540,
      expert: 'Mexico Trade Specialist',
      description: 'AI-powered supplier discovery validated by Mexico expert'
    },
    'manufacturing-feasibility': {
      name: 'Manufacturing Feasibility',
      price: 650,
      nonSubscriberPrice: 780,
      expert: 'Mexico Trade Specialist',
      description: 'Comprehensive manufacturing feasibility analysis'
    },
    'market-entry': {
      name: 'Market Entry Strategy',
      price: 550,
      nonSubscriberPrice: 660,
      expert: 'Mexico Trade Specialist',
      description: 'Market intelligence and entry strategy'
    }
  };

  useEffect(() => {
    // Load USMCA workflow data from localStorage
    const storedData = localStorage.getItem('workflowData');
    if (storedData) {
      setWorkflowData(JSON.parse(storedData));
    }

    // Set service from URL parameter
    if (service && services[service]) {
      setSelectedService(service);
    }
  }, [service]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService,
          service_name: services[selectedService].name,
          price: workflowData ? services[selectedService].price : services[selectedService].nonSubscriberPrice,
          subscriber_data: workflowData || {},
          additional_info: additionalInfo,
          has_workflow_data: !!workflowData
        })
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create service request');
      }
    } catch (error) {
      console.error('Service request error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="content-card">
            <h2 className="content-card-title">Sign In Required</h2>
            <p className="content-card-description">
              Please sign in to request professional services
            </p>
            <div className="hero-buttons">
              <Link href="/api/auth/login" className="btn-primary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasWorkflowData = !!workflowData;
  const isSubscriber = !!user; // Logged in users are subscribers
  const currentService = selectedService ? services[selectedService] : null;
  const servicePrice = isSubscriber
    ? currentService?.price
    : currentService?.nonSubscriberPrice;

  return (
    <>
      <Head>
        <title>Request Professional Service - Triangle Trade Intelligence</title>
        <meta name="description" content="Request expert USMCA compliance and trade services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/services" className="nav-menu-link">Services</Link>
            <Link href="/pricing" className="nav-menu-link">Pricing</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="container-app">

          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">Request Professional Service</h1>
            <p className="section-header-subtitle">
              Expert assistance from licensed customs broker or Mexico trade specialist
            </p>
          </div>

          {/* Workflow Data Status */}
          {hasWorkflowData && (
            <div className="content-card" style={{border: '2px solid #10b981', backgroundColor: '#f0fdf4', marginBottom: '2rem'}}>
              <h3 className="content-card-title">✅ Subscriber Pricing Applied</h3>
              <p className="text-body">
                <strong>{workflowData.company?.name || 'Your company'}</strong> - {workflowData.product?.description}
              </p>
              <p className="content-card-description">
                We have your USMCA workflow data. You qualify for subscriber pricing with no additional information needed.
              </p>
            </div>
          )}

          {!hasWorkflowData && (
            <div className="content-card" style={{border: '2px solid #f59e0b', backgroundColor: '#fffbeb', marginBottom: '2rem'}}>
              <h3 className="content-card-title">⚠️ Non-Subscriber Pricing</h3>
              <p className="content-card-description">
                Complete our <Link href="/usmca-workflow" className="nav-link">USMCA workflow</Link> to qualify for 20% subscriber discount and skip this form.
              </p>
            </div>
          )}

          {/* Service Selection Form */}
          <form onSubmit={handleSubmit} className="content-card">

            {/* Service Selection */}
            <div className="form-group">
              <label className="form-label">Select Service *</label>
              <select
                className="form-input"
                value={selectedService || ''}
                onChange={(e) => setSelectedService(e.target.value)}
                required
              >
                <option value="">Choose a service...</option>
                <optgroup label="Compliance Services (Licensed Customs Broker)">
                  <option value="usmca-certificate">
                    USMCA Certificate - ${hasWorkflowData ? services['usmca-certificate'].price : services['usmca-certificate'].nonSubscriberPrice}
                  </option>
                  <option value="hs-classification">
                    HS Classification - ${hasWorkflowData ? services['hs-classification'].price : services['hs-classification'].nonSubscriberPrice}
                  </option>
                  <option value="crisis-response">
                    Crisis Response - ${hasWorkflowData ? services['crisis-response'].price : services['crisis-response'].nonSubscriberPrice}
                  </option>
                </optgroup>
                <optgroup label="Mexico Trade Services (B2B Expert)">
                  <option value="supplier-sourcing">
                    Supplier Sourcing - ${hasWorkflowData ? services['supplier-sourcing'].price : services['supplier-sourcing'].nonSubscriberPrice}
                  </option>
                  <option value="manufacturing-feasibility">
                    Manufacturing Feasibility - ${hasWorkflowData ? services['manufacturing-feasibility'].price : services['manufacturing-feasibility'].nonSubscriberPrice}
                  </option>
                  <option value="market-entry">
                    Market Entry Strategy - ${hasWorkflowData ? services['market-entry'].price : services['market-entry'].nonSubscriberPrice}
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Service Details */}
            {currentService && (
              <div className="content-card" style={{backgroundColor: '#f9fafb', marginTop: '1rem'}}>
                <h3 className="content-card-title">{currentService.name}</h3>
                <p className="text-body">
                  <strong>Expert:</strong> {currentService.expert}
                </p>
                <p className="content-card-description">
                  {currentService.description}
                </p>
                <div className="price-display">
                  <div className="text-bold" style={{fontSize: '1.5rem', color: '#134169'}}>
                    ${servicePrice}
                  </div>
                  {hasWorkflowData && (
                    <div className="text-small" style={{color: '#16a34a'}}>
                      Subscriber pricing (save ${currentService.nonSubscriberPrice - currentService.price})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Context */}
            <div className="form-group">
              <label className="form-label">
                Additional Context <span style={{color: '#6b7280'}}>(Optional)</span>
              </label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Any specific concerns, questions, or requirements for our expert?"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
              <p className="text-small" style={{marginTop: '0.5rem', color: '#6b7280'}}>
                Examples: "Need urgent turnaround", "Facing customs audit", "Looking for suppliers in Monterrey"
              </p>
            </div>

            {/* Company Info Preview (if available) */}
            {hasWorkflowData && (
              <div className="content-card" style={{backgroundColor: '#f9fafb', marginTop: '1rem'}}>
                <h4 className="content-card-title">Your Information</h4>
                <div className="grid-2-cols">
                  <div>
                    <p className="text-small" style={{color: '#6b7280'}}>Company</p>
                    <p className="text-body">{workflowData.company?.name}</p>
                  </div>
                  <div>
                    <p className="text-small" style={{color: '#6b7280'}}>Product</p>
                    <p className="text-body">{workflowData.product?.description}</p>
                  </div>
                  <div>
                    <p className="text-small" style={{color: '#6b7280'}}>Current Status</p>
                    <p className="text-body">{workflowData.results?.qualification_status || 'Analyzed'}</p>
                  </div>
                  <div>
                    <p className="text-small" style={{color: '#6b7280'}}>Trade Volume</p>
                    <p className="text-body">${workflowData.company?.trade_volume || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="hero-buttons" style={{marginTop: '2rem'}}>
              <button
                type="submit"
                disabled={isSubmitting || !selectedService}
                className="btn-primary"
                style={{width: '100%', padding: '1rem'}}
              >
                {isSubmitting ? 'Processing...' : `Continue to Payment ($${servicePrice})`}
              </button>
            </div>

            {/* Security Note */}
            <p className="text-small" style={{textAlign: 'center', marginTop: '1rem', color: '#6b7280'}}>
              🔒 Secure payment via Stripe • Expert assigned within 24 hours
            </p>
          </form>

          {/* Why Professional Services */}
          <div className="content-card" style={{marginTop: '2rem'}}>
            <h3 className="content-card-title">Why Professional Services?</h3>
            <div className="grid-2-cols">
              <div>
                <p className="text-body"><strong>Licensed Expertise</strong></p>
                <p className="content-card-description">
                  Customs broker license #4601913 with 17 years experience
                </p>
              </div>
              <div>
                <p className="text-body"><strong>Mexico Advantage</strong></p>
                <p className="content-card-description">
                  Bilingual team with direct Mexico business networks
                </p>
              </div>
              <div>
                <p className="text-body"><strong>Fast Turnaround</strong></p>
                <p className="content-card-description">
                  24-48 hours for most services, emergency available
                </p>
              </div>
              <div>
                <p className="text-body"><strong>AI + Human</strong></p>
                <p className="content-card-description">
                  AI research validated by professional expertise
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
