/**
 * Jorge's Clean Service Management Dashboard
 * Essential tabs only - no bloat
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function JorgeDashboardClean() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service-queue');

  // Service data states
  const [serviceRequests, setServiceRequests] = useState([]);
  const [supplierVettingQueue, setSupplierVettingQueue] = useState([]);
  const [marketEntryConsultations, setMarketEntryConsultations] = useState([]);
  const [partnershipIntelligence, setPartnershipIntelligence] = useState([]);

  // Workflow Tools states
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');

  // Service Request form state
  const [serviceRequestForm, setServiceRequestForm] = useState({
    service_type: '',
    client_company: '',
    contact_name: '',
    email: '',
    phone: '',
    industry: '',
    trade_volume: '',
    service_details: ''
  });

  // Timer functionality
  useEffect(() => {
    let interval;
    if (activeTimer && selectedProject) {
      interval = setInterval(() => {
        setTimerDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, selectedProject]);

  // Format timer display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load dashboard data
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [authLoading, user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge');
      const data = await response.json();

      if (data.success && data.requests) {
        const allRequests = data.requests;

        // Convert to Jorge's service categories
        setServiceRequests(allRequests);
        setSupplierVettingQueue(allRequests.filter(req => req.service_type === 'supplier-vetting'));
        setMarketEntryConsultations(allRequests.filter(req => req.service_type === 'market-entry'));
        setPartnershipIntelligence(allRequests.filter(req => req.service_type === 'partnership-intelligence'));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Timer handlers
  const handleStartTimer = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    if (activeTimer) {
      setActiveTimer(null);
      const hours = (timerDuration / 3600).toFixed(2);
      alert(`Timer stopped. Total time: ${formatTime(timerDuration)} (${hours} hours)\nProject: ${selectedProject}\nBillable amount: $${(hours * 400).toFixed(2)}`);
    } else {
      setActiveTimer(Date.now());
      setTimerDuration(0);
    }
  };

  const handleProjectChange = (project) => {
    if (activeTimer) {
      alert('Stop the current timer before switching projects');
      return;
    }
    setSelectedProject(project);
  };

  // Workflow step handlers
  const handleSupplierVettingStep = (step) => {
    const steps = {
      1: '📋 Document Collection Checklist\n\n✓ Business registration certificate\n✓ Tax ID/RFC number\n✓ Financial statements (last 2 years)\n✓ Industry certifications\n✓ Quality management certificates\n✓ Insurance documentation\n✓ References from existing clients\n\nNext: Collect these documents from the supplier',
      2: '🔍 Legal & Financial Verification\n\n✓ Verify business registration with government database\n✓ Check tax compliance status\n✓ Run credit check\n✓ Verify ownership structure\n✓ Check for legal disputes\n✓ Validate banking information\n\nNext: Complete verification forms',
      3: '🏭 Production Capacity Assessment\n\n✓ Manufacturing equipment audit\n✓ Quality control systems review\n✓ USMCA compliance check\n✓ Production volume capability\n✓ Delivery timeline assessment\n✓ Workforce evaluation\n\nNext: Schedule facility visit or virtual assessment',
      4: '📊 Risk Scoring & Report Generation\n\n✓ Calculate overall risk score (1-100)\n✓ Generate supplier profile report\n✓ Provide 3 verified supplier recommendations\n✓ Include risk mitigation strategies\n✓ Format professional deliverable\n\nDeliverable: $750 supplier vetting report ready for client'
    };
    alert(steps[step]);
  };

  const handleMarketEntryStep = (step) => {
    const steps = {
      1: '📝 Client Intake & Analysis\n\n✓ Industry background assessment\n✓ Budget and timeline analysis\n✓ Current market presence evaluation\n✓ Goals and objectives clarification\n✓ Regulatory requirements review\n✓ Competitive landscape overview\n\nNext: Schedule detailed consultation call',
      2: '🔬 Mexico Market Research\n\n✓ Industry size and growth analysis\n✓ Regulatory environment mapping\n✓ Competitive landscape assessment\n✓ Distribution channel analysis\n✓ Customer behavior insights\n✓ Pricing strategy research\n\nNext: Compile research findings into strategic framework',
      3: '💡 Strategy Development\n\n✓ Market entry approach recommendation\n✓ Partnership strategy formulation\n✓ Risk assessment and mitigation\n✓ Regulatory compliance roadmap\n✓ Investment requirements analysis\n✓ Success metrics definition\n\nNext: Create implementation roadmap',
      4: '🗺️ Implementation Roadmap\n\n✓ 90-day action plan creation\n✓ Milestone and timeline mapping\n✓ Resource allocation planning\n✓ Success metrics tracking setup\n✓ Risk monitoring framework\n✓ Review and adjustment process\n\nDeliverable: Complete market entry strategy ready for implementation'
    };
    alert(steps[step]);
  };

  const handlePartnershipIntelStep = (step) => {
    const steps = {
      1: '📚 Research Source Setup\n\n✓ Government database access setup\n✓ Trade publication subscriptions\n✓ Industry report source identification\n✓ News monitoring system configuration\n✓ Contact network establishment\n✓ Information verification protocols\n\nNext: Begin monthly intelligence gathering',
      2: '📄 Monthly Report Creation\n\n✓ 2-page executive briefing template\n✓ Key opportunities identification\n✓ Market trends analysis\n✓ Regulatory updates summary\n✓ Partnership recommendations\n✓ Action items for follow-up\n\nNext: Customize content for each client',
      3: '🏷️ Opportunity Classification\n\n✓ Manufacturing partnership opportunities\n✓ Logistics and distribution partnerships\n✓ Regulatory compliance partnerships\n✓ Technology transfer opportunities\n✓ Joint venture possibilities\n✓ Strategic alliance recommendations\n\nNext: Prioritize opportunities by client relevance',
      4: '📬 Client Distribution\n\n✓ Personalized briefing customization\n✓ Client-specific opportunity matching\n✓ Automated delivery system setup\n✓ Follow-up call scheduling\n✓ Engagement tracking\n✓ Feedback collection\n\nDeliverable: $300/month intelligence service delivered'
    };
    alert(steps[step]);
  };

  // Enhanced service request handling with calendar integration for all 3 service types
  const handleScheduleConsultation = (request) => {
    const serviceConfig = {
      'supplier-vetting': {
        duration: 15,
        description: 'Mexico Supplier Vetting Consultation',
        focus: 'Understanding supplier sourcing needs and product requirements',
        preparation: 'Review: product specifications, target volumes, quality standards, sourcing timeline',
        price: '$750 project fee'
      },
      'market-entry': {
        duration: 15,
        description: 'Mexico Market Entry Strategy Consultation',
        focus: 'Assessing market entry readiness and strategic approach',
        preparation: 'Review: target products/services, market presence, regional focus, budget',
        price: '$400/hour consulting'
      },
      'partnership-intelligence': {
        duration: 15,
        description: 'Mexico Partnership Intelligence Consultation',
        focus: 'Understanding partnership goals and intelligence requirements',
        preparation: 'Review: partnership types sought, focus areas, company size preferences, frequency needs',
        price: '$300/month subscription'
      }
    };

    const config = serviceConfig[request.service_type] || serviceConfig['supplier-vetting'];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    startDate.setHours(10, 0, 0, 0); // 10 AM

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + config.duration);

    const eventTitle = `${config.description} - ${request.company_name}`;

    // Build detailed service-specific notes
    let serviceNotes = '';
    if (request.service_type === 'supplier-vetting') {
      serviceNotes = `
SUPPLIER VETTING CONSULTATION PREP:
• Product(s): ${request.project_description}
• Target Volume: ${request.volume || 'Not specified'}
• Quality Standards: ${request.quality_standards || 'Not specified'}
• Timeline: ${request.timeline || 'Not specified'}
• Budget Range: ${request.budget_range || 'Not specified'}
• Challenges: ${request.challenges || 'None specified'}`;
    } else if (request.service_type === 'market-entry') {
      serviceNotes = `
MARKET ENTRY CONSULTATION PREP:
• Products/Services: ${request.project_description}
• Current Presence: ${request.market_presence || 'Not specified'}
• Target Regions: ${request.target_regions || 'Not specified'}
• Timeline: ${request.timeline || 'Not specified'}
• Budget Range: ${request.budget_range || 'Not specified'}
• Main Concerns: ${request.concerns || 'None specified'}`;
    } else if (request.service_type === 'partnership-intelligence') {
      serviceNotes = `
PARTNERSHIP INTELLIGENCE CONSULTATION PREP:
• Partnership Types: ${request.project_description}
• Focus Areas: ${request.focus_areas || 'Not specified'}
• Company Size Preference: ${request.company_size || 'Not specified'}
• Frequency Needed: ${request.frequency || 'Not specified'}
• Geographic Focus: ${request.geographic_focus || 'Not specified'}
• Intelligence Priorities: ${request.intelligence_priorities || 'Not specified'}`;
    }

    const eventDescription = `${config.description} with ${request.contact_name}
Company: ${request.company_name}
Industry: ${request.industry || 'Not specified'}

CONSULTATION FOCUS: ${config.focus}
PRICING: ${config.price}
PREPARATION NOTES: ${config.preparation}

${serviceNotes}

CONTACT INFORMATION:
• Email: ${request.email}
• Phone: ${request.phone || 'Not provided'}
• Referral Source: ${request.referral_source || 'Not specified'}

---
Request ID: ${request.id}
Submitted: ${new Date(request.created_at).toLocaleDateString()}
Source: Mexico Trade Services Portal`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(eventTitle)}` +
      `&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z` +
      `&details=${encodeURIComponent(eventDescription)}` +
      `&location=${encodeURIComponent('Zoom Meeting - Link to be sent to ' + request.email)}`;

    window.open(googleCalendarUrl, '_blank');

    // Mark as scheduled in local state
    setServiceRequests(prev => prev.map(req =>
      req.id === request.id
        ? { ...req, status: 'consultation_scheduled', notes: `Consultation scheduled for ${startDate.toLocaleString()}` }
        : req
    ));
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status: newStatus,
          updated_by: 'Jorge'
        })
      });

      if (response.ok) {
        // Reload dashboard data to reflect changes
        loadDashboardData();
        alert('✅ Request status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('❌ Failed to update request status');
    }
  };

  // Send consultation confirmation email with service-specific details
  const handleSendConsultationConfirmation = (request) => {
    const serviceDetails = {
      'supplier-vetting': {
        serviceName: 'Mexico Supplier Vetting & Introduction',
        price: '$750 project fee',
        deliverable: '3 verified supplier introductions with comprehensive risk assessment',
        timeline: '2-3 weeks from consultation to delivery',
        questions: [
          'Product specifications and quality requirements',
          'Target sourcing volumes and timeline',
          'Current supplier challenges and pain points',
          'Budget parameters and payment preferences'
        ]
      },
      'market-entry': {
        serviceName: 'Mexico Market Entry Strategy Consulting',
        price: '$400/hour',
        deliverable: 'Complete market entry strategy with 90-day implementation roadmap',
        timeline: '4-6 weeks for full strategy development',
        questions: [
          'Products/services you want to bring to Mexico',
          'Current market presence and business model',
          'Target regions and customer segments',
          'Investment budget and timeline expectations'
        ]
      },
      'partnership-intelligence': {
        serviceName: 'Mexico Partnership Intelligence Briefing',
        price: '$300/month subscription',
        deliverable: 'Monthly 2-page intelligence briefings with partnership opportunities',
        timeline: 'Ongoing monthly delivery with 48-hour setup',
        questions: [
          'Types of partnerships you\'re seeking',
          'Target business focus areas and industries',
          'Company size preferences for partnerships',
          'Geographic focus within Mexico'
        ]
      }
    };

    const service = serviceDetails[request.service_type] || serviceDetails['supplier-vetting'];

    const subject = `Consultation Scheduled - ${service.serviceName}`;
    const body = `Hi ${request.contact_name},

Thank you for requesting a consultation for our ${service.serviceName} service.

🗓️ CONSULTATION SCHEDULED
I've scheduled our 15-minute consultation call for tomorrow at 10:00 AM. You should receive a calendar invitation shortly with the Zoom meeting details.

💼 SERVICE OVERVIEW
• Service: ${service.serviceName}
• Investment: ${service.price}
• Deliverable: ${service.deliverable}
• Timeline: ${service.timeline}

🎯 CONSULTATION AGENDA
During our call, we'll discuss:
${service.questions.map(q => `• ${q}`).join('\n')}

📋 NEXT STEPS AFTER CONSULTATION
1. I'll provide you with a custom service proposal
2. Upon agreement, we'll begin work within 24-48 hours
3. You'll receive regular progress updates throughout the project

📞 NEED TO RESCHEDULE?
Simply reply to this email or call me directly.

Looking forward to helping ${request.company_name} succeed in Mexico!

Best regards,
Jorge Cervantes
Mexico Trade Specialist
Triangle Intelligence
📧 jorge@triangleintelligence.com
📱 Direct line available upon request

P.S. I've been helping North American companies navigate Mexico markets for over 8 years. Your project is in experienced hands.`;

    const mailtoUrl = `mailto:${request.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Research capabilities for each service type
  const handleResearchRequest = (request) => {
    const researchGuides = {
      'supplier-vetting': {
        title: '🔍 Supplier Vetting Research Guide',
        steps: [
          '1. 🏭 PRODUCT RESEARCH',
          `   • Product: ${request.project_description}`,
          `   • Volume needed: ${request.volume || 'Ask client'}`,
          `   • Quality standards: ${request.quality_standards || 'Ask client'}`,
          '   • Research Mexico manufacturers in this category',
          '   • Check IMMEX program eligibility',
          '',
          '2. 📋 SUPPLIER DATABASE SEARCH',
          '   • Search ProMexico supplier directory',
          '   • Check CANACINTRA member companies',
          '   • Review export-ready suppliers list',
          `   • Focus on ${request.industry || 'specified'} industry`,
          '',
          '3. 🏆 PRELIMINARY VETTING',
          '   • Business registration verification',
          '   • Export certification status',
          '   • Production capacity assessment',
          '   • Quality management systems',
          '',
          '4. 📞 CONSULTATION PREP',
          `   • Timeline: ${request.timeline || 'Ask client'}`,
          `   • Budget: ${request.budget_range || 'Ask client'}`,
          `   • Challenges: ${request.challenges || 'General supplier concerns'}`,
          '   • Prepare 3-5 initial supplier candidates'
        ]
      },
      'market-entry': {
        title: '🌍 Market Entry Research Guide',
        steps: [
          '1. 🎯 MARKET ANALYSIS',
          `   • Product/Service: ${request.project_description}`,
          `   • Target regions: ${request.target_regions || 'Ask client'}`,
          `   • Current presence: ${request.market_presence || 'Ask client'}`,
          '   • Market size and growth in Mexico',
          '   • Competitive landscape analysis',
          '',
          '2. 📋 REGULATORY RESEARCH',
          `   • Industry: ${request.industry || 'specified'} regulations`,
          '   • Import/export requirements',
          '   • USMCA trade benefits available',
          '   • Local business registration requirements',
          '',
          '3. 💰 INVESTMENT & COSTS',
          `   • Budget range: ${request.budget_range || 'Ask client'}`,
          '   • Setup costs (legal, registration, etc.)',
          '   • Operational cost estimates',
          '   • Tax implications and incentives',
          '',
          '4. 📞 CONSULTATION PREP',
          `   • Timeline: ${request.timeline || 'Ask client'}`,
          `   • Concerns: ${request.concerns || 'General market entry concerns'}`,
          '   • Partnership opportunities',
          '   • Success metrics definition'
        ]
      },
      'partnership-intelligence': {
        title: '🤝 Partnership Intelligence Research Guide',
        steps: [
          '1. 🎯 PARTNERSHIP FOCUS',
          `   • Partnership types: ${request.project_description}`,
          `   • Focus areas: ${request.focus_areas || 'Ask client'}`,
          `   • Company size pref: ${request.company_size || 'Ask client'}`,
          `   • Geographic focus: ${request.geographic_focus || 'Ask client'}`,
          '',
          '2. 📊 INTELLIGENCE SOURCES',
          '   • ProMexico partnership database',
          '   • Mexican business chamber directories',
          '   • Government trade promotion programs',
          `   • Industry: ${request.industry || 'specified'} associations`,
          '',
          '3. 🔍 OPPORTUNITY IDENTIFICATION',
          `   • Frequency needed: ${request.frequency || 'Ask client'}`,
          `   • Intelligence priorities: ${request.intelligence_priorities || 'Ask client'}`,
          '   • Joint venture opportunities',
          '   • Strategic alliance possibilities',
          '',
          '4. 📞 CONSULTATION PREP',
          '   • Current partnership strategy',
          '   • Success metrics for partnerships',
          '   • Preferred partnership models',
          '   • Timeline for partnership development'
        ]
      }
    };

    const guide = researchGuides[request.service_type] || researchGuides['supplier-vetting'];

    const researchContent = `${guide.title}

CLIENT: ${request.company_name}
CONTACT: ${request.contact_name}
EMAIL: ${request.email}
SUBMITTED: ${new Date(request.created_at).toLocaleDateString()}

${guide.steps.join('\n')}

🎯 CONSULTATION GOAL:
Gather enough information to provide immediate value and demonstrate expertise within the first 15 minutes.

⏰ RESEARCH TIME BUDGET: 30-45 minutes before consultation
💰 BILLABLE: This research counts toward the project fee/hourly rate

📋 NEXT ACTIONS:
□ Complete preliminary research (30-45 min)
□ Schedule consultation call
□ Send consultation confirmation email
□ Prepare consultation notes and questions`;

    // Display research guide
    alert(researchContent);
  };

  // Form submission
  const handleSubmitServiceRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceRequestForm,
          assigned_to: 'Jorge',
          status: 'pending_consultation',
          priority: 'high'
        })
      });

      if (response.ok) {
        alert('Service request submitted successfully!');
        setServiceRequestForm({
          service_type: '',
          client_company: '',
          contact_name: '',
          email: '',
          phone: '',
          industry: '',
          trade_volume: '',
          service_details: ''
        });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">Loading Jorge's Dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Service Dashboard | Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">Jorge's Mexico Trade Services</h1>
          <p className="admin-subtitle">Supplier Vetting • Market Entry • Partnership Intelligence</p>
          <div className="credentials-badge">
            🇲🇽 Mexico Trade Specialist
            <span className="license-number">JORGE-2024</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-nav-tabs">
          <button
            className={`admin-btn jorge ${activeTab === 'service-queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('service-queue')}
          >
            📋 Jorge's Service Request Queue
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'supplier-vetting' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier-vetting')}
          >
            🏭 Supplier Vetting Process ($750)
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'market-entry' ? 'active' : ''}`}
            onClick={() => setActiveTab('market-entry')}
          >
            🌍 Market Entry Strategy ($400/hour)
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'partnership-intel' ? 'active' : ''}`}
            onClick={() => setActiveTab('partnership-intel')}
          >
            🤝 Partnership Intelligence ($300/month)
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'revenue-tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue-tracking')}
          >
            💰 Revenue Tracking
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'new-request' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-request')}
          >
            ➕ New Service Request
          </button>
        </div>

        {/* Service Request Queue Tab */}
        {activeTab === 'service-queue' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">☀️ Good Morning Jorge - Today's Service Queue</h1>
              <p className="admin-subtitle">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - Your daily action plan
              </p>
            </div>

            {/* Quick Status Cards */}
            <div className="revenue-cards">
              <div className="revenue-card jorge">
                <div className="revenue-amount">{serviceRequests?.length || 0}</div>
                <div className="revenue-label">🔥 Urgent Items Today</div>
              </div>
              <div className="revenue-card cristina">
                <div className="revenue-amount">${((supplierVettingQueue?.length || 0) * 750 + (marketEntryConsultations?.length || 0) * 400 * 8 + (partnershipIntelligence?.length || 0) * 300).toLocaleString()}</div>
                <div className="revenue-label">💰 Pipeline Value</div>
              </div>
              <div className="revenue-card joint">
                <div className="revenue-amount">{activeTimer ? '🔴 TIMING' : '⏱️ READY'}</div>
                <div className="revenue-label">Timer Status</div>
              </div>
            </div>

            {/* Today's Work Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client Company</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request, index) => (
                    <tr key={index} className="admin-row">
                      <td className="company-name">{request.company_name}</td>
                      <td>
                        <span className={`service-badge service-${request.service_type}`}>
                          {request.service_type === 'supplier-vetting' && '🏭 Supplier Vetting'}
                          {request.service_type === 'market-entry' && '🌍 Market Entry'}
                          {request.service_type === 'partnership-intelligence' && '🤝 Partnership Intel'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-indicator status-${request.status?.replace('_', '-')}`}>
                          {request.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-revenue">
                        {request.service_type === 'supplier-vetting' && '$750'}
                        {request.service_type === 'market-entry' && '$400/hr'}
                        {request.service_type === 'partnership-intelligence' && '$300/mo'}
                      </td>
                      <td>{request.timeline || 'TBD'}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn info"
                            onClick={() => handleResearchRequest(request)}
                            title="Get research guide for this service type"
                          >
                            🔍 Research
                          </button>
                          <button
                            className="admin-btn primary"
                            onClick={() => handleScheduleConsultation(request)}
                            title="Schedule 15-minute consultation call"
                          >
                            📅 Schedule Call
                          </button>
                          <button
                            className="admin-btn secondary"
                            onClick={() => handleSendConsultationConfirmation(request)}
                            title="Send consultation confirmation email"
                          >
                            📧 Send Email
                          </button>
                          <button
                            className="admin-btn success"
                            onClick={() => setActiveTab(request.service_type === 'supplier-vetting' ? 'supplier-vetting' :
                                                       request.service_type === 'market-entry' ? 'market-entry' : 'partnership-intel')}
                            title="Go to service workflow"
                          >
                            🛠️ Start Work
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {serviceRequests.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center p-20 text-muted">
                        No service requests today. Great job staying on top of everything! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Supplier Vetting Workflow Tab */}
        {activeTab === 'supplier-vetting' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">🏭 Supplier Vetting Process ($750)</h1>
              <p className="admin-subtitle">Complete 2-3 week process with 3 verified supplier introductions</p>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Process</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">1</span></td>
                    <td>
                      <strong>Document Collection</strong><br/>
                      <span className="text-muted">Business registration, tax ID, certifications, financial statements</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(1)}>Start Checklist</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">2</span></td>
                    <td>
                      <strong>Legal & Financial Verification</strong><br/>
                      <span className="text-muted">Credit check, regulatory compliance, ownership structure</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(2)}>Verification Form</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">3</span></td>
                    <td>
                      <strong>Production Capacity Assessment</strong><br/>
                      <span className="text-muted">Manufacturing capability, quality systems, USMCA compliance</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(3)}>Assessment Tool</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-success">4</span></td>
                    <td>
                      <strong>Risk Scoring & Report</strong><br/>
                      <span className="text-muted">Final scoring, recommendations, professional report generation</span>
                    </td>
                    <td><button className="admin-btn success" onClick={() => handleSupplierVettingStep(4)}>Generate Report</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Time Tracker */}
            <div className="card-header">
              <h3 className="content-card-title">⏱️ Time Tracker for Market Entry</h3>
            </div>
            <div className="revenue-cards">
              <div className="revenue-card jorge">
                <div className="revenue-amount">{formatTime(timerDuration)}</div>
                <div className="revenue-label">Current Session</div>
              </div>
              <div className="revenue-card cristina">
                <button
                  className={`admin-btn ${activeTimer ? 'danger' : 'success'}`}
                  onClick={handleStartTimer}
                >
                  {activeTimer ? 'Stop Timer' : 'Start Timer'}
                </button>
              </div>
              <div className="revenue-card joint">
                <select
                  className="filter-select"
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">Select Project...</option>
                  <option value="supplier-vetting">Supplier Vetting</option>
                  <option value="market-entry">Market Entry Strategy</option>
                  <option value="partnership-intel">Partnership Intelligence</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Market Entry Strategy Tab */}
        {activeTab === 'market-entry' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">🌍 Market Entry Strategy ($400/hour)</h1>
              <p className="admin-subtitle">4-6 week strategic consulting with implementation roadmap</p>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Process</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">1</span></td>
                    <td>
                      <strong>Client Intake & Analysis</strong><br/>
                      <span className="text-muted">Industry assessment, budget analysis, timeline planning</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(1)}>Intake Form</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">2</span></td>
                    <td>
                      <strong>Mexico Market Research</strong><br/>
                      <span className="text-muted">Industry analysis, regulatory requirements, competitive landscape</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(2)}>Research Template</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">3</span></td>
                    <td>
                      <strong>Strategy Development</strong><br/>
                      <span className="text-muted">Entry strategy, partnership recommendations, risk mitigation</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(3)}>Strategy Builder</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-success">4</span></td>
                    <td>
                      <strong>Implementation Roadmap</strong><br/>
                      <span className="text-muted">90-day action plan, milestone tracking, success metrics</span>
                    </td>
                    <td><button className="admin-btn success" onClick={() => handleMarketEntryStep(4)}>Roadmap Generator</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Partnership Intelligence Tab */}
        {activeTab === 'partnership-intel' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">🤝 Partnership Intelligence ($300/month)</h1>
              <p className="admin-subtitle">Monthly briefings with trade opportunities and market insights</p>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Process</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">1</span></td>
                    <td>
                      <strong>Research Source Setup</strong><br/>
                      <span className="text-muted">Government databases, trade publications, industry reports</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(1)}>Source Tracker</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">2</span></td>
                    <td>
                      <strong>Monthly Report Creation</strong><br/>
                      <span className="text-muted">2-page briefing template with opportunities and trends</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(2)}>Report Template</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-info">3</span></td>
                    <td>
                      <strong>Opportunity Classification</strong><br/>
                      <span className="text-muted">Manufacturing, logistics, regulatory opportunities</span>
                    </td>
                    <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(3)}>Classification Tool</button></td>
                  </tr>
                  <tr className="admin-row">
                    <td><span className="badge badge-success">4</span></td>
                    <td>
                      <strong>Client Distribution</strong><br/>
                      <span className="text-muted">Automated delivery system with personalized insights</span>
                    </td>
                    <td><button className="admin-btn success" onClick={() => handlePartnershipIntelStep(4)}>Distribution Manager</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Tracking Tab */}
        {activeTab === 'revenue-tracking' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">💰 Jorge's Revenue Tracking</h1>
              <p className="admin-subtitle">Monthly capacity and earnings overview</p>
            </div>

            <div className="revenue-cards">
              <div className="revenue-card jorge">
                <div className="revenue-amount">${(supplierVettingQueue?.length || 0) * 750}</div>
                <div className="revenue-label">🏭 Supplier Vetting Revenue</div>
              </div>
              <div className="revenue-card cristina">
                <div className="revenue-amount">${(marketEntryConsultations?.length || 0) * 400 * 8}</div>
                <div className="revenue-label">🌍 Market Entry Revenue (8hr avg)</div>
              </div>
              <div className="revenue-card joint">
                <div className="revenue-amount">${(partnershipIntelligence?.length || 0) * 300}</div>
                <div className="revenue-label">🤝 Partnership Intel Revenue</div>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Active Projects</th>
                    <th>Monthly Capacity</th>
                    <th>Rate</th>
                    <th>This Month Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="admin-row">
                    <td>🏭 Supplier Vetting</td>
                    <td>{supplierVettingQueue?.length || 0}</td>
                    <td>10 suppliers</td>
                    <td>$750 each</td>
                    <td className="text-revenue">${(supplierVettingQueue?.length || 0) * 750}</td>
                  </tr>
                  <tr className="admin-row">
                    <td>🌍 Market Entry</td>
                    <td>{marketEntryConsultations?.length || 0}</td>
                    <td>15 hours</td>
                    <td>$400/hour</td>
                    <td className="text-revenue">${(marketEntryConsultations?.length || 0) * 400 * 8}</td>
                  </tr>
                  <tr className="admin-row">
                    <td>🤝 Partnership Intelligence</td>
                    <td>{partnershipIntelligence?.length || 0}</td>
                    <td>20+ clients</td>
                    <td>$300/month</td>
                    <td className="text-revenue">${(partnershipIntelligence?.length || 0) * 300}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Service Request Tab */}
        {activeTab === 'new-request' && (
          <div className="admin-card">
            <div className="card-header">
              <h1 className="admin-title">➕ New Service Request</h1>
              <p className="admin-subtitle">Quick intake for new clients</p>
            </div>

            <form onSubmit={handleSubmitServiceRequest} className="grid-2-cols">
              <div className="content-card">
                <h3 className="content-card-title">Client Information</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Client Company"
                    className="filter-select"
                    value={serviceRequestForm.client_company}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, client_company: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Contact Name"
                    className="filter-select"
                    value={serviceRequestForm.contact_name}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, contact_name: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="filter-select"
                    value={serviceRequestForm.email}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="filter-select"
                    value={serviceRequestForm.phone}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="content-card">
                <h3 className="content-card-title">Service Details</h3>
                <div className="form-group">
                  <select
                    className="filter-select"
                    value={serviceRequestForm.service_type}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, service_type: e.target.value})}
                    required
                  >
                    <option value="">Select Service Type</option>
                    <option value="supplier-vetting">🏭 Supplier Vetting ($750)</option>
                    <option value="market-entry">🌍 Market Entry ($400/hour)</option>
                    <option value="partnership-intelligence">🤝 Partnership Intelligence ($300/month)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Industry"
                    className="filter-select"
                    value={serviceRequestForm.industry}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, industry: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Trade Volume (e.g., $1M annually)"
                    className="filter-select"
                    value={serviceRequestForm.trade_volume}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, trade_volume: e.target.value})}
                  />
                  <textarea
                    placeholder="Additional Details"
                    className="filter-select"
                    rows="4"
                    value={serviceRequestForm.service_details}
                    onChange={(e) => setServiceRequestForm({...serviceRequestForm, service_details: e.target.value})}
                  />
                  <button type="submit" className="admin-btn success">
                    ➕ Create Service Request
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </>
  );
}