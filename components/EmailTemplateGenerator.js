/**
 * TRIANGLE INTELLIGENCE EMAIL TEMPLATE GENERATOR
 * Professional B2B email templates for sales follow-up
 * 
 * Supports multiple email types:
 * - Post-demo follow-up
 * - Executive summary emails
 * - ROI analysis emails  
 * - Crisis response emails
 * - Proposal and next steps emails
 */

import React, { useState, useEffect } from 'react';
import { Mail, Copy, Download, Send, Edit } from 'lucide-react';

import {
  SALES_MESSAGING,
  SALES_STATISTICS,
  PRICING_TIERS,
  CASE_STUDIES,
  EMAIL_TEMPLATES
} from '../config/sales-presentation-config.js';

/**
 * Main Email Template Generator Component
 */
export default function EmailTemplateGenerator({ 
  prospectInfo = {},
  presentationType = 'executiveSummary',
  customization = {},
  onEmailGenerated = () => {}
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('executiveSummary');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [customFields, setCustomFields] = useState({
    recipientName: '',
    recipientTitle: '',
    companyName: '',
    specificChallenges: '',
    customROI: '',
    nextMeetingDate: '',
    senderName: '',
    senderTitle: '',
    senderEmail: '',
    senderPhone: ''
  });

  // Email template types
  const templateTypes = [
    {
      id: 'executiveSummary',
      name: 'Executive Summary',
      description: '2-page professional overview',
      timing: 'Send within 4 hours of meeting',
      audience: 'C-level executives, decision makers'
    },
    {
      id: 'postDemo',
      name: 'Post-Demo Follow-up',
      description: 'Technical demo recap and next steps',
      timing: 'Send within 2 hours of demo',
      audience: 'Technical teams, operations managers'
    },
    {
      id: 'roiAnalysis', 
      name: 'Custom ROI Analysis',
      description: 'Detailed cost-benefit breakdown',
      timing: 'Send after executive meeting',
      audience: 'CFOs, finance teams, procurement'
    },
    {
      id: 'crisisResponse',
      name: 'Crisis Response',
      description: 'Urgent tariff situation response',
      timing: 'Send immediately during crisis',
      audience: 'All decision makers in crisis'
    },
    {
      id: 'proposal',
      name: 'Formal Proposal',
      description: 'Contract terms and implementation plan',
      timing: 'Send after budget approval',
      audience: 'Procurement, legal, operations'
    },
    {
      id: 'checkIn',
      name: 'Check-in Follow-up',
      description: 'Gentle reminder and value reinforcement',
      timing: 'Send 1 week after last contact',
      audience: 'All prospects in pipeline'
    }
  ];

  // Generate email content based on template type
  useEffect(() => {
    generateEmailContent();
  }, [selectedTemplate, customFields, prospectInfo]);

  const generateEmailContent = () => {
    let emailContent = '';

    switch (selectedTemplate) {
      case 'executiveSummary':
        emailContent = generateExecutiveSummaryEmail();
        break;
      case 'postDemo':
        emailContent = generatePostDemoEmail();
        break;
      case 'roiAnalysis':
        emailContent = generateROIAnalysisEmail();
        break;
      case 'crisisResponse':
        emailContent = generateCrisisResponseEmail();
        break;
      case 'proposal':
        emailContent = generateProposalEmail();
        break;
      case 'checkIn':
        emailContent = generateCheckInEmail();
        break;
      default:
        emailContent = generateExecutiveSummaryEmail();
    }

    setGeneratedEmail(emailContent);
  };

  // Template generation functions
  const generateExecutiveSummaryEmail = () => {
    const template = EMAIL_TEMPLATES.executiveSummary;
    
    return `Subject: ${template.subject}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

Thank you for taking the time to meet with our team today. As promised, here's a comprehensive overview of how Triangle Intelligence can help ${customFields.companyName || '[COMPANY NAME]'} reduce tariff costs and streamline USMCA compliance.

EXECUTIVE SUMMARY
${template.sections[0].content}

CRISIS OPPORTUNITY & TIMING
${template.sections[1].content}

${customFields.specificChallenges ? `ADDRESSING YOUR SPECIFIC CHALLENGES
Based on our discussion about ${customFields.specificChallenges}, Triangle Intelligence directly addresses these issues through:
• AI-powered classification eliminates manual classification delays
• Verified government data prevents costly compliance errors
• Mexico supplier network provides immediate alternative sourcing
• Professional certificates expedite customs clearance

` : ''}PROVEN RESULTS FROM SIMILAR COMPANIES
${template.sections[2].content}

Key success metrics:
• AutoParts Mexico SA: ${CASE_STUDIES.autoPartsMexico.results.savings} saved in ${CASE_STUDIES.autoPartsMexico.results.timeframe}
• TechFlow Electronics: ${CASE_STUDIES.techFlowElectronics.results.savings} annual savings
• Average implementation time: ${CASE_STUDIES.autoPartsMexico.results.implementationTime}
• Typical ROI payback: ${SALES_STATISTICS.impact.roiTimeframe}

PLATFORM CAPABILITIES
${template.sections[3].content}

Technical highlights:
• ${SALES_STATISTICS.platform.databaseRecords} verified government HS codes
• ${SALES_STATISTICS.platform.accuracy} AI classification accuracy
• ${SALES_STATISTICS.platform.responseTime} response time
• Professional USMCA certificates in 60 seconds

INVESTMENT & ROI
${template.sections[4].content}

${customFields.customROI ? `CUSTOM ROI FOR ${customFields.companyName?.toUpperCase() || '[YOUR COMPANY]'}
Based on your annual trade volume, Triangle Intelligence could deliver approximately ${customFields.customROI} in annual savings through Mexico routing, with platform costs of ${PRICING_TIERS.enterprise.price}/month delivering positive ROI within ${SALES_STATISTICS.impact.roiTimeframe}.

` : ''}RECOMMENDED NEXT STEPS
${template.sections[5].content}

${customFields.nextMeetingDate ? `I've reserved time for our follow-up discussion on ${customFields.nextMeetingDate}. During this session, we'll:` : 'I recommend we schedule a follow-up within the next week to:'}
• Conduct detailed ROI analysis using your specific trade data
• Demonstrate platform capabilities with your actual products
• Discuss implementation timeline and support options
• Address any questions from your finance and operations teams

${customFields.specificChallenges ? `Given your current challenges with ${customFields.specificChallenges}, I believe Triangle Intelligence can provide immediate value. The platform is designed specifically for companies facing these exact issues.` : ''}

I'm confident Triangle Intelligence can help ${customFields.companyName || '[COMPANY NAME]'} navigate the current tariff environment successfully while building long-term competitive advantages through Mexico routing.

Please let me know your availability for a follow-up discussion. I'm also happy to connect with your finance and operations teams directly to address their specific questions.

Best regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}
Triangle Intelligence
${customFields.senderEmail || '[YOUR EMAIL]'}
${customFields.senderPhone || '[YOUR PHONE]'}

---
Triangle Intelligence - Professional USMCA Compliance Platform
Website: triangle-intelligence.com
Platform Demo: [DEMO LINK]
ROI Calculator: [CALCULATOR LINK]`;
  };

  const generatePostDemoEmail = () => {
    return `Subject: Triangle Intelligence Demo Follow-up - ${customFields.companyName || '[COMPANY NAME]'}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

Thank you for joining today's technical demonstration of the Triangle Intelligence platform. I hope you found the AI classification engine and Mexico routing capabilities as compelling as we do.

KEY DEMO HIGHLIGHTS
• AI-powered HS classification with ${SALES_STATISTICS.platform.accuracy} accuracy
• Live classification of your products in real-time
• Mexico supplier network integration
• Professional USMCA certificate generation in 60 seconds
• ${SALES_STATISTICS.platform.responseTime} API response time demonstrated

SPECIFIC RESULTS FOR YOUR PRODUCTS
During the demo, we successfully classified:
${customFields.specificChallenges ? `• ${customFields.specificChallenges}` : '• [LIST SPECIFIC PRODUCTS DEMONSTRATED]'}
• All classifications achieved high confidence scores (85%+)
• Identified USMCA qualification opportunities
• Calculated potential tariff savings through Mexico routing

TECHNICAL INTEGRATION DISCUSSION
As requested, here are the key technical specifications:
• RESTful API with comprehensive documentation
• Webhook support for real-time updates
• Bulk processing capabilities for high-volume operations
• Enterprise security standards (SOC 2, GDPR compliant)
• White-label deployment options available

IMMEDIATE NEXT STEPS
1. Technical Integration Review: Schedule with your IT team to discuss API integration requirements
2. Pilot Program Setup: Configure platform with 50-100 of your key products
3. ROI Validation: Run parallel testing against current classification methods
4. Team Training: Onboard key users with our customer success team

PILOT PROGRAM PROPOSAL
I'd like to propose a 30-day pilot program:
• Configure platform with your top product categories
• Process real classification requests
• Measure accuracy and time savings
• Calculate actual ROI based on your specific use cases
• Full support from our implementation team

${customFields.customROI ? `Based on our discussion, the potential savings of ${customFields.customROI} annually make this pilot extremely valuable for validating our projections.` : ''}

QUESTIONS FROM THE DEMO
Please don't hesitate to reach out with any follow-up questions from today's session. Common questions we address:
• Security and compliance requirements
• Integration timelines and technical resources needed
• Pricing for different usage volumes
• Support and training options

I'm available ${customFields.nextMeetingDate ? `for our scheduled follow-up on ${customFields.nextMeetingDate}` : 'this week'} to discuss implementation details and address any concerns from your team.

Looking forward to moving forward with the pilot program.

Best regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}
Triangle Intelligence - Technical Solutions
${customFields.senderEmail || '[YOUR EMAIL]'}
${customFields.senderPhone || '[YOUR PHONE]'}

Attachments:
- Technical Specifications Document
- API Documentation
- Security & Compliance Overview
- Pilot Program Terms`;
  };

  const generateROIAnalysisEmail = () => {
    return `Subject: Custom ROI Analysis - Triangle Intelligence for ${customFields.companyName || '[COMPANY NAME]'}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

As requested, I've prepared a detailed ROI analysis specific to ${customFields.companyName || '[COMPANY NAME]'}'s trade operations and compliance requirements.

EXECUTIVE SUMMARY
Triangle Intelligence delivers measurable value through tariff savings, operational efficiency, and risk reduction. Our analysis shows positive ROI within ${SALES_STATISTICS.impact.roiTimeframe} with substantial ongoing benefits.

CURRENT STATE COST ANALYSIS
Your existing compliance costs (estimated):
• Traditional broker fees: $2,000-5,000 per classification
• Processing delays: 2-3 weeks average (opportunity cost)
• Error-related penalties: $10,000-50,000 per incident
• Missed USMCA savings: 15-25% of applicable tariff costs
• Manual process labor: [CALCULATE BASED ON VOLUME]

${customFields.customROI ? `TRIANGLE INTELLIGENCE VALUE PROPOSITION
Based on your annual trade volume of [VOLUME], Triangle Intelligence provides:
• Annual savings: ${customFields.customROI}
• Monthly platform cost: ${PRICING_TIERS.enterprise.price}
• Net annual benefit: ${customFields.customROI} - ${parseInt(PRICING_TIERS.enterprise.price.replace('$', '')) * 12} = [NET BENEFIT]
• ROI: [ROI PERCENTAGE]%
• Payback period: ${SALES_STATISTICS.impact.roiTimeframe}

` : ''}DETAILED SAVINGS BREAKDOWN
1. Tariff Reduction Savings (Primary Value)
   • Average USMCA savings: ${SALES_STATISTICS.impact.avgSavingsPercent}% of eligible tariffs
   • Mexico routing opportunities: 25% additional savings
   • Estimated annual benefit: $[CALCULATE BASED ON VOLUME]

2. Operational Efficiency Savings
   • Eliminated broker delays: 2-3 weeks → 60 seconds
   • Reduced manual processing: 80% time savings
   • Prevented compliance errors: Zero penalty risk
   • Estimated annual benefit: $[CALCULATE LABOR SAVINGS]

3. Risk Mitigation Value
   • Compliance penalty prevention: $50,000+ potential savings
   • Supply chain continuity: Priceless during trade disruptions
   • Professional validation: Reduced audit risk

IMPLEMENTATION TIMELINE & COSTS
Month 1: Platform setup and initial integration
• Setup fee: Included in subscription
• Training: 2 days (included)
• Initial product classification: Bulk upload included

Month 2-3: Full deployment and optimization
• Team training completion
• API integration (if required)
• Performance monitoring and optimization

Month 4+: Full operational benefits
• Complete tariff savings realization
• Operational efficiency gains
• Risk mitigation benefits

COMPARISON WITH ALTERNATIVES
vs. Traditional Brokers:
• Cost: 60% lower (${PRICING_TIERS.enterprise.price}/month vs $2,000+ per classification)
• Speed: 2000x faster (60 seconds vs 2-3 weeks)
• Accuracy: Higher (AI + government data vs manual process)

vs. Generic Software:
• Focus: Mexico USMCA routing vs generic classification
• Data Quality: Government-verified vs crowdsourced
• Support: Professional compliance vs basic software support

FINANCIAL PROJECTIONS (3-YEAR)
Year 1: ${customFields.customROI ? customFields.customROI : '$[YEAR 1 SAVINGS]'}
Year 2: [COMPOUND SAVINGS WITH VOLUME GROWTH]
Year 3: [ADDITIONAL BENEFITS FROM EXPANDED USE]

Total 3-year benefit: $[TOTAL SAVINGS]
Total 3-year cost: $[TOTAL PLATFORM COST]
Net 3-year value: $[NET VALUE]

RISK ANALYSIS
Low Risk Investment:
• Month-to-month subscription (no long-term commitment)
• 30-day pilot program available
• Proven ROI with existing customers
• Professional support included

High Risk of Inaction:
• Continued exposure to tariff increases
• Manual process errors and penalties
• Missed USMCA savings opportunities
• Competitive disadvantage

NEXT STEPS & BUDGET APPROVAL
To proceed with implementation:
1. Budget approval for ${PRICING_TIERS.enterprise.price}/month Enterprise subscription
2. IT team engagement for integration planning
3. 30-day pilot program initiation
4. Success metrics definition and monitoring setup

I'm available to present this analysis to your finance team and answer any questions about our ROI methodology or assumptions.

The current trade environment makes this investment both urgent and highly valuable. I recommend we begin the pilot program within the next two weeks to capture immediate tariff savings.

Best regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}
Triangle Intelligence - Business Development
${customFields.senderEmail || '[YOUR EMAIL]'}
${customFields.senderPhone || '[YOUR PHONE]'}

Attachments:
- Detailed ROI Spreadsheet
- Customer Success Stories
- Implementation Timeline
- Pilot Program Agreement`;
  };

  const generateCrisisResponseEmail = () => {
    return `Subject: URGENT: Triangle Intelligence Crisis Response for ${customFields.companyName || '[COMPANY NAME]'}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

Following today's discussion about the immediate impact of new tariff increases on your supply chain, I want to provide you with an actionable crisis response plan.

IMMEDIATE THREAT ASSESSMENT
• ${SALES_STATISTICS.market.trumpTariffIncrease} tariff increases are affecting your China suppliers
• Current supply chain costs have increased by [PERCENTAGE]%
• Q4 operations at risk without immediate action
• Competitive position threatened by companies already using Mexico routing

TRIANGLE INTELLIGENCE CRISIS SOLUTION
We can have you operational with Mexico routing within 48 hours:

Hour 0-24: Emergency Platform Access
• Immediate platform activation
• Crisis support team assigned
• Priority customer success manager
• 24/7 emergency hotline access

Hour 24-48: Mexico Routing Implementation  
• Verified Mexico supplier network activation
• USMCA qualification analysis for your key products
• Professional certificate generation ready
• Supply chain transition plan

${customFields.specificChallenges ? `ADDRESSING YOUR SPECIFIC CRISIS: ${customFields.specificChallenges.toUpperCase()}
Based on your immediate needs:
• Emergency classification of affected products
• Alternative supplier identification in Mexico
• Rush USMCA documentation preparation
• Customs broker coordination if needed

` : ''}IMMEDIATE SAVINGS CALCULATION
Your crisis response savings (estimated for affected products):
• Current tariff impact: +${SALES_STATISTICS.market.trumpTariffIncrease} on China goods
• Mexico routing savings: -25% through USMCA qualification
• Net improvement: 85%+ cost reduction on affected products
• ${customFields.customROI ? `Estimated monthly savings: ${customFields.customROI}/12 = $${Math.round(parseInt(customFields.customROI.replace(/[$,]/g, '')) / 12).toLocaleString()}` : 'Immediate cost relief for affected products'}

CRISIS SUPPORT PACKAGE (INCLUDED)
• Dedicated crisis response team
• 24/7 emergency support hotline  
• Expedited processing for urgent requests
• Real-time tariff monitoring and alerts
• Direct customs broker consultation if needed
• Daily progress updates during crisis period

PROVEN CRISIS SUCCESS
Other companies in similar situations:
• AutoParts Mexico SA: Avoided $685K in tariff increases
• TechFlow Electronics: Maintained competitive pricing during trade war
• Implementation time: 48 hours average
• Success rate: 100% for emergency deployments

IMMEDIATE ACTION REQUIRED
To activate crisis response:

TODAY (within 4 hours):
• Verbal approval to proceed with emergency deployment
• List of your 10 most critical affected products
• Current supplier and volume information
• Primary contact for crisis coordination

TOMORROW:
• Platform access credentials delivered
• Crisis team begins product classification
• Mexico supplier network search initiated
• Emergency documentation preparation

WITHIN 48 HOURS:
• Full platform operational
• Mexico routing options identified
• USMCA certificates ready for key products
• Supply chain transition plan delivered

INVESTMENT DECISION
Crisis response package: ${PRICING_TIERS.enterprise.price}/month (Enterprise level)
• All crisis support included
• No setup fees during emergency
• Month-to-month flexibility
• Cancel anytime after crisis resolution

Cost of inaction: Continue paying ${SALES_STATISTICS.market.trumpTariffIncrease} premium on affected products

The math is simple: every day of delay costs more than a month of Triangle Intelligence.

URGENT NEXT STEPS
I need your decision within 4 hours to begin crisis response:
1. Approval to proceed with emergency deployment
2. Emergency contact information
3. List of affected products and volumes
4. Preferred communication method during crisis

I'm standing by for your immediate response. Our crisis team is ready to begin working on your situation today.

Time is critical. Let's protect your Q4 operations.

Urgent regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}  
Triangle Intelligence - Crisis Response Team
Emergency Line: ${customFields.senderPhone || '[EMERGENCY PHONE]'}
${customFields.senderEmail || '[YOUR EMAIL]'}

CALL OR TEXT FOR IMMEDIATE RESPONSE: ${customFields.senderPhone || '[PHONE]'}

---
This is a time-sensitive business opportunity. Please respond within 4 hours.`;
  };

  const generateProposalEmail = () => {
    return `Subject: Triangle Intelligence Implementation Proposal - ${customFields.companyName || '[COMPANY NAME]'}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

Thank you for your continued interest in Triangle Intelligence. Based on our discussions and the positive results from your evaluation, I'm pleased to present our formal implementation proposal.

EXECUTIVE SUMMARY
Triangle Intelligence will provide ${customFields.companyName || '[COMPANY NAME]'} with a comprehensive USMCA compliance platform, delivering immediate tariff savings and long-term competitive advantages through professional Mexico routing capabilities.

PROPOSED SOLUTION
Enterprise Platform Subscription:
• Monthly investment: ${PRICING_TIERS.enterprise.price}
• Contract term: 12 months (month-to-month available)
• Included capabilities: All Enterprise features plus premium support
• Performance guarantee: ${SALES_STATISTICS.platform.accuracy} accuracy, ${SALES_STATISTICS.platform.responseTime} response time

${customFields.customROI ? `PROJECTED RETURN ON INVESTMENT
Based on your trade volume and current compliance costs:
• Annual platform cost: $${parseInt(PRICING_TIERS.enterprise.price.replace('$', '')) * 12}
• Projected annual savings: ${customFields.customROI}
• Net annual benefit: $${parseInt(customFields.customROI.replace(/[$,]/g, '')) - (parseInt(PRICING_TIERS.enterprise.price.replace('$', '')) * 12)}
• ROI: ${Math.round(((parseInt(customFields.customROI.replace(/[$,]/g, '')) / (parseInt(PRICING_TIERS.enterprise.price.replace('$', '')) * 12)) - 1) * 100)}%
• Payback period: ${SALES_STATISTICS.impact.roiTimeframe}

` : ''}IMPLEMENTATION PLAN

Phase 1: Platform Setup (Days 1-7)
• Account creation and security configuration
• Initial team training (2-day session included)
• Basic product catalog upload and classification
• API integration planning (if required)

Phase 2: Full Deployment (Days 8-21) 
• Complete product classification and USMCA analysis
• Mexico supplier network integration
• Advanced features training
• Custom workflow configuration

Phase 3: Optimization (Days 22-30)
• Performance monitoring and fine-tuning
• Advanced feature adoption
• Success metrics validation
• Ongoing optimization recommendations

INCLUDED SERVICES
Professional Services (No additional charge):
• Dedicated customer success manager
• 2-day on-site or virtual training
• Bulk product classification (up to 5,000 products)
• API integration support
• Monthly business reviews
• Priority technical support

Ongoing Support:
• Phone and email support (business hours)
• Online knowledge base and documentation
• Regular platform updates and enhancements
• Quarterly business reviews
• Access to webinars and training materials

PERFORMANCE GUARANTEES
We guarantee:
• ${SALES_STATISTICS.platform.accuracy} minimum classification accuracy
• ${SALES_STATISTICS.platform.responseTime} maximum API response time
• ${SALES_STATISTICS.platform.uptime} platform uptime
• Professional USMCA certificates accepted by customs authorities
• Positive ROI within ${SALES_STATISTICS.impact.roiTimeframe} or extended pilot

TERMS AND CONDITIONS
Subscription Terms:
• Monthly billing: ${PRICING_TIERS.enterprise.price} per month
• Annual billing: 10% discount (${Math.round(parseInt(PRICING_TIERS.enterprise.price.replace('$', '')) * 12 * 0.9)} annually)
• Contract length: 12 months recommended (month-to-month available)
• Automatic renewal unless 30-day notice provided

Payment Terms:
• Net 30 payment terms
• Major credit cards and ACH accepted
• Invoice sent monthly on anniversary date
• No setup fees or hidden charges

Cancellation Policy:
• 30-day written notice required
• Data export provided upon request
• No cancellation fees
• Prorated refund for unused subscription time

NEXT STEPS
To proceed with implementation:

Immediate (This Week):
1. Contract execution and purchase order processing
2. Initial platform setup and team introductions
3. Training session scheduling
4. Product data gathering and classification begins

Month 1 Milestones:
• Platform fully operational
• Team trained and productive
• Key products classified and USMCA-qualified
• Initial savings validation

${customFields.nextMeetingDate ? `I've reserved time on ${customFields.nextMeetingDate} for contract review and any final questions.` : 'I recommend we schedule a contract review session this week to address any final questions and begin implementation.'}

APPROVAL PROCESS
For your procurement team:
• Vendor information packet attached
• References from similar companies available
• Security and compliance documentation provided
• Standard enterprise contract terms (modifications welcome)

I'm confident this partnership will deliver substantial value to ${customFields.companyName || '[COMPANY NAME]'}. The combination of immediate tariff savings and long-term competitive advantages makes Triangle Intelligence an essential investment in your trade operations.

Thank you for choosing Triangle Intelligence. I look forward to a successful partnership.

Best regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}
Triangle Intelligence - Enterprise Sales
${customFields.senderEmail || '[YOUR EMAIL]'}
${customFields.senderPhone || '[YOUR PHONE]'}

Attachments:
- Service Agreement
- Statement of Work
- Vendor Information Packet
- Customer References
- Security Documentation
- Implementation Timeline`;
  };

  const generateCheckInEmail = () => {
    return `Subject: Following up on Triangle Intelligence for ${customFields.companyName || '[COMPANY NAME]'}

Dear ${customFields.recipientName || '[RECIPIENT NAME]'},

I hope this email finds you well. It's been about a week since our last conversation about Triangle Intelligence's USMCA compliance platform, and I wanted to check in on your evaluation process.

QUICK RECAP
During our discussion, we covered:
• Your current challenges with ${customFields.specificChallenges || 'USMCA compliance and Mexico routing'}
• Triangle Intelligence's AI-powered classification system
• Potential savings of ${customFields.customROI || '$[ESTIMATED SAVINGS]'} through Mexico routing
• Implementation timeline and support options

MARKET DEVELOPMENTS
Since we last spoke, there have been some relevant developments:
• Additional tariff announcements affecting China imports
• New USMCA qualification opportunities identified
• Updated Mexico supplier network partnerships
• Enhanced platform features based on customer feedback

${customFields.specificChallenges ? `ADDRESSING YOUR SPECIFIC NEEDS
I've been thinking about your challenges with ${customFields.specificChallenges}. Here are some additional thoughts on how Triangle Intelligence can help:

• [SPECIFIC SOLUTION 1]
• [SPECIFIC SOLUTION 2]  
• [SPECIFIC SOLUTION 3]

` : ''}WHAT OTHERS ARE SAYING
Recent customer feedback:
• "Triangle Intelligence saved us $255K in the first 6 months" - TechFlow Electronics
• "Implementation was seamless and support is excellent" - AutoParts Mexico SA
• "The AI classification is incredibly accurate for our industry" - [SIMILAR COMPANY]

NO PRESSURE CHECK-IN
I know you're evaluating multiple options and have many priorities. I simply wanted to:
• Answer any questions that have come up since our discussion
• Provide updated information if your requirements have changed
• Offer additional resources if helpful for your evaluation
• Understand your timeline and decision-making process

QUICK QUESTIONS
If you have 2 minutes, I'd love to know:
• What additional information would be helpful?
• Have there been any changes in your requirements or timeline?
• Would it be valuable to connect with a similar company using our platform?
• Is there anyone else who should be involved in the evaluation?

VALUE REMINDER
Just as a quick reminder, Triangle Intelligence offers:
• ${SALES_STATISTICS.platform.accuracy} AI classification accuracy
• ${SALES_STATISTICS.platform.responseTime} response time
• Professional USMCA certificates in 60 seconds
• ${SALES_STATISTICS.impact.avgSavingsPercent}% average tariff savings
• ${SALES_STATISTICS.impact.roiTimeframe} typical ROI payback

NO COMMITMENT OPTIONS
If you'd like to move forward without full commitment:
• 30-day pilot program available
• Month-to-month subscription options
• Free technical consultation with your IT team
• Customer reference calls with similar companies

I respect your time and evaluation process. Please don't feel obligated to respond if you're still in evaluation mode. I simply wanted you to know I'm here to help when you're ready.

If Triangle Intelligence isn't the right fit, I completely understand and wish you success with whatever solution you choose.

Best regards,

${customFields.senderName || '[YOUR NAME]'}
${customFields.senderTitle || '[YOUR TITLE]'}
Triangle Intelligence
${customFields.senderEmail || '[YOUR EMAIL]'}
${customFields.senderPhone || '[YOUR PHONE]'}

P.S. If your priorities have changed or this is no longer relevant, just let me know and I'll remove you from my follow-up list. No hard feelings!

---
This is a no-pressure follow-up. Respond only if helpful for your evaluation.`;
  };

  // Handle custom field changes
  const handleFieldChange = (field, value) => {
    setCustomFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Copy email to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail).then(() => {
      alert('Email copied to clipboard!');
      onEmailGenerated('copied', generatedEmail);
    });
  };

  // Download as text file
  const downloadEmail = () => {
    const blob = new Blob([generatedEmail], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Triangle-Intelligence-Email-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    onEmailGenerated('downloaded', a.download);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Template Generator</h3>
      
      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Template Type
        </label>
        <div className="grid md:grid-cols-2 gap-3">
          {templateTypes.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`text-left p-3 border rounded-lg transition-colors ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Timing:</span> {template.timing}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Customize Email Content</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Name
            </label>
            <input
              type="text"
              value={customFields.recipientName}
              onChange={(e) => handleFieldChange('recipientName', e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={customFields.companyName}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              placeholder="e.g., AutoParts Manufacturing Inc"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom ROI Amount
            </label>
            <input
              type="text"
              value={customFields.customROI}
              onChange={(e) => handleFieldChange('customROI', e.target.value)}
              placeholder="e.g., $255,000"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={customFields.senderName}
              onChange={(e) => handleFieldChange('senderName', e.target.value)}
              placeholder="e.g., Sarah Johnson"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Challenges/Topics Discussed
            </label>
            <textarea
              value={customFields.specificChallenges}
              onChange={(e) => handleFieldChange('specificChallenges', e.target.value)}
              placeholder="e.g., rising China tariffs, manual compliance processes, broker delays"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Generated Email Preview */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Generated Email</h4>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </button>
            <button
              onClick={downloadEmail}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
          </div>
        </div>
        
        <textarea
          value={generatedEmail}
          onChange={(e) => setGeneratedEmail(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
          placeholder="Generated email will appear here..."
        />
      </div>

      {/* Usage Tips */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <p className="text-yellow-800">
          <strong>Usage Tips:</strong> Customize the template fields above, then copy the generated email to your email client. 
          Remember to replace any remaining [PLACEHOLDER] text with specific information before sending.
        </p>
      </div>
    </div>
  );
}