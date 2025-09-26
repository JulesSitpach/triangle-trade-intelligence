/**
 * Professional Services - Expert Completion
 * Clear service cards with benefits, deliverables, pricing, and payment buttons
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function ProfessionalServices() {
  const { user, loading: authLoading } = useSimpleAuth();
  const [isProcessing, setIsProcessing] = useState({});

  const services = [
    // Cristina's Services
    {
      id: 'usmca-certificate',
      icon: '📜',
      title: 'USMCA Certificate Generation',
      price: 250,
      expert: 'Cristina Martinez - Licensed Customs Broker',
      benefits: [
        'Avoid 35% tariffs with proper USMCA compliance',
        'Professional liability coverage',
        'Zero risk of customs rejection',
        'Expert validation of North American content'
      ],
      deliverables: [
        'Complete USMCA Certificate of Origin',
        'Supporting documentation package',
        'Compliance verification report',
        'Delivered within 24-48 hours'
      ],
      whyNeed: 'With new 35% tariffs on non-compliant goods, a proper USMCA certificate can save thousands per shipment'
    },
    {
      id: 'hs-classification',
      icon: '🔍',
      title: 'HS Code Classification',
      price: 200,
      expert: 'Cristina Martinez - Licensed Customs Broker',
      benefits: [
        'Audit-proof classifications',
        'Minimize duty payments legally',
        'Avoid costly reclassification penalties',
        'Expert research and documentation'
      ],
      deliverables: [
        'Verified HS code with supporting rationale',
        'Classification ruling documentation',
        'Alternative code analysis if applicable',
        'Delivered within 1-2 business days'
      ],
      whyNeed: 'Wrong HS codes lead to penalties, duty overpayments, and shipment delays'
    },
    {
      id: 'crisis-response',
      icon: '🚨',
      title: 'Crisis Response Management',
      price: 400,
      expert: 'Cristina Martinez - Licensed Customs Broker',
      benefits: [
        'Emergency 24-48 hour response',
        'Immediate action plan to minimize damage',
        'Root cause analysis and prevention',
        'Direct expert consultation'
      ],
      deliverables: [
        'Emergency compliance analysis',
        'Step-by-step action plan',
        'Prevention strategy for future issues',
        'Direct expert support until resolved'
      ],
      whyNeed: 'When tariffs change suddenly or shipments are held, every hour costs money'
    },

    // Jorge's Services
    {
      id: 'supplier-sourcing',
      icon: '🔍',
      title: 'Supplier Sourcing',
      price: 500,
      expert: 'Jorge - Mexico-Based Trade Specialist',
      benefits: [
        'Pre-screened, verified suppliers',
        'Local Mexico expertise and contacts',
        'Cultural and language advantages',
        'Direct introductions to decision makers'
      ],
      deliverables: [
        '5-7 qualified supplier contacts',
        'Capabilities assessment for each supplier',
        'Direct introductions and warm handoffs',
        'Delivered within 3-5 business days'
      ],
      whyNeed: 'Finding reliable Mexico suppliers is time-consuming and risky without local connections'
    },
    {
      id: 'manufacturing-feasibility',
      icon: '🏭',
      title: 'Manufacturing Feasibility',
      price: 500,
      expert: 'Jorge - Mexico-Based Trade Specialist',
      benefits: [
        'Location recommendations based on your needs',
        'Regulatory compliance roadmap',
        'Cost analysis and labor market insights',
        'Risk assessment and mitigation strategies'
      ],
      deliverables: [
        'Detailed feasibility report',
        'Location recommendations with rationale',
        'Cost breakdown and regulatory overview',
        'Delivered within 5-7 business days'
      ],
      whyNeed: 'Manufacturing in Mexico requires understanding of local regulations, costs, and logistics'
    },
    {
      id: 'market-entry',
      icon: '🚀',
      title: 'Market Entry Strategy',
      price: 450,
      expert: 'Jorge - Mexico-Based Trade Specialist',
      benefits: [
        'Market intelligence and entry strategy',
        'Partnership introduction opportunities',
        'Cultural guidance for business success',
        'Regulatory requirements navigation'
      ],
      deliverables: [
        'Market entry strategy document',
        'Partnership introduction opportunities',
        'Cultural and business practice guidance',
        'Delivered within 3-5 business days'
      ],
      whyNeed: 'Entering Mexico/Latin America markets requires local expertise to avoid costly mistakes'
    }
  ];

  const handleServiceRequest = async (serviceId) => {
    setIsProcessing(prev => ({ ...prev, [serviceId]: true }));

    try {
      console.log(`Requesting service: ${serviceId}`);

      // Get user's workflow data from localStorage
      const workflowData = JSON.parse(localStorage.getItem('usmca_workflow_results') || '{}');
      const userProfile = JSON.parse(localStorage.getItem('triangleUserData') || '{}');

      // Prepare service request data
      const serviceRequest = {
        service_type: serviceId,
        company_name: workflowData.company?.name || userProfile.company?.name || 'Unknown Company',
        client_info: {
          company: workflowData.company?.name || userProfile.company?.name || 'Unknown Company',
          email: user?.email || 'client@example.com',
          contact_name: userProfile.contact_name || 'Client Contact',
          phone: userProfile.phone || 'Not provided'
        },
        service_details: {
          product_description: workflowData.product?.description || userProfile.product_description || 'Manufacturing project',
          business_type: workflowData.company?.business_type || userProfile.business_type || 'Manufacturing',
          trade_volume: workflowData.company?.trade_volume || userProfile.trade_volume || 'Standard volume',
          manufacturing_location: workflowData.company?.manufacturing_location || 'To be determined',
          timeline: 'Standard delivery (5-7 business days)',
          urgency: 'Standard'
        },
        status: 'intake_form_completed', // Skip form step - data already collected
        price: services.find(s => s.id === serviceId)?.price || 500,
        assigned_to: serviceId.includes('manufacturing') || serviceId.includes('supplier') || serviceId.includes('market') ? 'Jorge' : 'Cristina',
        created_at: new Date().toISOString(),
        intake_form_completed: true,
        intake_form_data: {
          // Manufacturing feasibility specific data
          product_description: workflowData.product?.description || 'Manufacturing project',
          industry: workflowData.company?.business_type || 'Manufacturing',
          volume: workflowData.company?.trade_volume || 'Standard volume',
          quality_standards: 'ISO 9001 certification required',
          target_price_range: '$10-25 per unit',
          geographic_preference: 'Mexico regions with USMCA advantages',
          timeline: '5-7 business days analysis'
        }
      };

      // Save to database
      const response = await fetch('/api/admin/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceRequest)
      });

      if (response.ok) {
        alert(`✅ Service request submitted successfully! Your ${serviceId.replace(/[-_]/g, ' ')} request has been sent to our expert team with all your workflow data.`);
      } else {
        throw new Error('Failed to submit service request');
      }

    } catch (error) {
      console.error('Service request error:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsProcessing(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Professional Services - Triangle Intelligence</title>
        <meta name="description" content="Expert USMCA compliance, HS classification, and Mexico trade services" />
      </Head>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#134169', marginBottom: '16px' }}>
            Professional Services
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Expert completion by licensed professionals. Avoid 35% tariffs and compliance risks.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '2rem', marginRight: '12px' }}>{service.icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#134169', margin: '0' }}>
                    {service.title}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    {service.expert}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#134169' }}>
                    ${service.price}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '1rem' }}>Why You Need This:</h4>
                <p style={{ margin: '0', color: '#92400e', fontSize: '0.9rem' }}>{service.whyNeed}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#134169', fontSize: '1rem' }}>Benefits:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
                  {service.benefits.map((benefit, index) => (
                    <li key={index} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#134169', fontSize: '1rem' }}>What You'll Receive:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
                  {service.deliverables.map((deliverable, index) => (
                    <li key={index} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{deliverable}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleServiceRequest(service.id)}
                disabled={isProcessing[service.id]}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: isProcessing[service.id] ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isProcessing[service.id] ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isProcessing[service.id]) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isProcessing[service.id]) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
              >
                {isProcessing[service.id]
                  ? 'Processing...'
                  : `Request Service - $${service.price}`
                }
              </button>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#134169', marginBottom: '16px' }}>Need Multiple Services?</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Contact us for package pricing on multiple services or ongoing support needs.
          </p>
          <a
            href="mailto:support@triangleintelligence.com"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Contact for Custom Pricing
          </a>
        </div>
      </div>
    </>
  );
}