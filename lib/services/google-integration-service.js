/**
 * GOOGLE WORKSPACE INTEGRATION SERVICE
 * Real integrations with triangleintel@gmail.com Google Workspace
 * Gmail, Calendar, Drive, Contacts integration for Mexico Trade Bridge
 */

class GoogleIntegrationService {
  constructor() {
    this.companyEmail = 'triangleintel@gmail.com';
    this.companyName = 'Triangle Trade Intelligence';
  }

  // Gmail Integration - Open Gmail compose with pre-filled content
  async composeEmail(client, templateType = 'follow_up') {
    const clientName = client.company || client.client || 'Valued Client';
    const clientEmail = client.email || '';

    const templates = {
      follow_up: {
        subject: `Follow-up: Mexico Trade Opportunities for ${clientName}`,
        body: `Dear ${clientName} team,

I hope this email finds you well. I wanted to follow up on our recent discussion about optimizing your trade routes through Mexico.

As we discussed, Triangle Trade Intelligence specializes in USMCA triangle routing that can provide significant cost savings for companies like ${clientName}. Our Mexico-focused approach has helped similar companies achieve 8-18% cost reductions.

Key benefits for ${clientName}:
• USMCA preferential tariff rates through Mexico
• Triangle routing optimization (Canada → Mexico → US)
• Streamlined compliance and documentation
• Direct access to Mexico trade networks

I'd love to schedule a brief call to discuss your specific trade volumes and how we can help optimize your supply chain through Mexico.

Would you be available for a 15-minute call this week?

Best regards,
Jorge Martinez
Sales Manager
Triangle Trade Intelligence
triangleintel@gmail.com
Phone: [Your Phone Number]

P.S. We're currently offering a complimentary trade route analysis for qualified prospects. I'd be happy to prepare one for ${clientName}.`
      },
      proposal: {
        subject: `Mexico Trade Optimization Proposal for ${clientName}`,
        body: `Dear ${clientName} team,

Thank you for your interest in optimizing your trade operations through Mexico. Based on our initial discussion, I've prepared a customized proposal for ${clientName}.

EXECUTIVE SUMMARY:
Triangle Trade Intelligence can help ${clientName} achieve significant cost savings through our specialized Mexico triangle routing services under the USMCA agreement.

PROPOSED SOLUTION:
• Triangle routing via Mexico for optimal tariff rates
• USMCA compliance documentation and support
• Access to our established Mexico logistics network
• Real-time tracking and trade intelligence

ESTIMATED SAVINGS:
Based on preliminary analysis, we project ${clientName} could save 10-15% on current trade costs through optimized Mexico routing.

NEXT STEPS:
1. Detailed trade volume analysis
2. Route optimization planning
3. Implementation timeline discussion

I've attached our detailed proposal and would welcome the opportunity to discuss this further.

Best regards,
Jorge Martinez
Sales Manager
Triangle Trade Intelligence
triangleintel@gmail.com`
      },
      introduction: {
        subject: `Mexico Trade Optimization Solutions for ${clientName}`,
        body: `Dear ${clientName} team,

I hope this email finds you well. My name is Jorge Martinez, and I'm reaching out from Triangle Trade Intelligence, a specialized Mexico trade optimization firm.

We help companies like ${clientName} reduce trade costs by 8-18% through strategic Mexico triangle routing under the USMCA agreement.

WHY MEXICO ROUTING?
• Preferential USMCA tariff rates
• Strategic location for North American trade
• Established logistics infrastructure
• Cost-effective alternative to direct routes

TRIANGLE INTELLIGENCE ADVANTAGE:
• Deep expertise in Mexico trade regulations
• Established network of Mexico partners
• Proven track record with similar companies
• End-to-end compliance support

I'd love to offer ${clientName} a complimentary 15-minute consultation to explore how Mexico routing could benefit your trade operations.

Would you be interested in a brief call this week?

Best regards,
Jorge Martinez
Sales Manager
Triangle Trade Intelligence
triangleintel@gmail.com

P.S. We're currently offering a free trade route analysis for qualified prospects.`
      }
    };

    const template = templates[templateType] || templates.follow_up;

    // Create Gmail compose URL
    const gmailUrl = this.createGmailComposeUrl({
      to: clientEmail,
      subject: template.subject,
      body: template.body
    });

    // Open Gmail in new tab
    window.open(gmailUrl, '_blank');

    return {
      success: true,
      action: 'gmail_compose',
      client: clientName,
      template: templateType,
      email: clientEmail
    };
  }

  // Create Gmail compose URL with pre-filled data
  createGmailComposeUrl({ to = '', subject = '', body = '' }) {
    const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
    const params = new URLSearchParams({
      to: to,
      su: subject,
      body: body
    });

    return `${baseUrl}&${params.toString()}`;
  }

  // Google Calendar Integration - Schedule calls
  async scheduleCall(client, callType = 'follow_up') {
    const clientName = client.company || client.client || 'Client';
    const clientEmail = client.email || '';

    const callTemplates = {
      follow_up: {
        title: `Follow-up Call: ${clientName} - Mexico Trade Discussion`,
        description: `Follow-up call with ${clientName} to discuss Mexico trade optimization opportunities.

AGENDA:
• Review current trade routes and volumes
• Discuss USMCA triangle routing benefits
• Explore potential cost savings through Mexico
• Address any questions or concerns
• Discuss next steps

PREPARATION:
• Review ${clientName} trade profile
• Prepare Mexico routing analysis
• Have USMCA documentation ready

Client Contact: ${clientEmail}
Meeting Type: Sales Follow-up
Focus: Mexico Trade Optimization`,
        duration: 30
      },
      joint_call: {
        title: `Joint Team Call: ${clientName} - Collaboration Meeting`,
        description: `Joint call between Jorge (Sales) and Cristina (Operations) with ${clientName}.

AGENDA:
• Sales presentation by Jorge
• Technical implementation by Cristina
• Q&A session
• Next steps planning

ATTENDEES:
• Jorge Martinez (Sales) - triangleintel@gmail.com
• Cristina Rodriguez (Operations) - triangleintel@gmail.com
• ${clientName} team

Client Contact: ${clientEmail}
Meeting Type: Joint Sales/Operations Call`,
        duration: 45
      },
      proposal_presentation: {
        title: `Proposal Presentation: ${clientName} - Mexico Trade Solution`,
        description: `Formal presentation of Mexico trade optimization proposal to ${clientName}.

AGENDA:
• Triangle Trade Intelligence overview
• Mexico routing solution presentation
• Cost savings analysis
• Implementation timeline
• Contract discussion

DELIVERABLES:
• Detailed proposal document
• Cost-benefit analysis
• Implementation roadmap

Client Contact: ${clientEmail}
Meeting Type: Proposal Presentation`,
        duration: 60
      }
    };

    const template = callTemplates[callType] || callTemplates.follow_up;

    // Create Google Calendar event URL
    const calendarUrl = this.createGoogleCalendarUrl({
      title: template.title,
      description: template.description,
      duration: template.duration,
      attendees: [clientEmail, this.companyEmail].filter(Boolean)
    });

    // Open Google Calendar in new tab
    window.open(calendarUrl, '_blank');

    return {
      success: true,
      action: 'calendar_event',
      client: clientName,
      callType: callType,
      duration: template.duration
    };
  }

  // Create Google Calendar event URL
  createGoogleCalendarUrl({ title, description, duration = 30, attendees = [] }) {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const formatDateTime = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatDateTime(startTime)}/${formatDateTime(endTime)}`,
      details: description,
      add: attendees.join(',')
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Google Drive Integration - Create proposal documents
  async createProposal(client, proposalType = 'mexico_routing') {
    const clientName = client.company || client.client || 'Client';

    // Create a new Google Doc with proposal template
    const docTitle = `Mexico Trade Proposal - ${clientName} - ${new Date().toISOString().split('T')[0]}`;

    const proposalContent = this.generateProposalContent(client, proposalType);

    // Option 1: Copy to clipboard and open Google Docs
    const docsUrl = this.createGoogleDocsUrl(docTitle, proposalContent);

    // Option 2: Also create a downloadable text file as backup
    this.createDownloadableProposal(docTitle, proposalContent);

    window.open(docsUrl, '_blank');

    return {
      success: true,
      action: 'create_proposal',
      client: clientName,
      documentTitle: docTitle,
      proposalType: proposalType,
      instructions: 'Content copied to clipboard - paste into Google Docs'
    };
  }

  // Create downloadable proposal file
  createDownloadableProposal(title, content) {
    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.txt`;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      console.log(`Proposal downloaded as ${title}.txt`);
    }
  }

  // Generate proposal content
  generateProposalContent(client, proposalType) {
    const clientName = client.company || client.client || 'Client';
    const currentDate = new Date().toLocaleDateString();

    return `TRIANGLE INTELLIGENCE
Mexico Trade Optimization Proposal

Client: ${clientName}
Date: ${currentDate}
Prepared by: Jorge Martinez, Sales Manager

EXECUTIVE SUMMARY
Triangle Trade Intelligence proposes to optimize ${clientName}'s trade operations through strategic Mexico triangle routing under the USMCA agreement.

PROPOSED SOLUTION
• USMCA-compliant triangle routing via Mexico
• Dedicated Mexico logistics coordination
• Real-time trade documentation and tracking
• Ongoing compliance support

BENEFITS FOR ${clientName.toUpperCase()}
• Estimated 10-15% cost reduction on trade operations
• Access to preferential USMCA tariff rates
• Streamlined customs and documentation processes
• Risk mitigation through diversified routing

IMPLEMENTATION TIMELINE
Phase 1 (Week 1-2): Trade route analysis and planning
Phase 2 (Week 3-4): Documentation and compliance setup
Phase 3 (Week 5-6): Initial shipment pilot
Phase 4 (Week 7-8): Full implementation and optimization

INVESTMENT
[To be discussed based on trade volumes and specific requirements]

NEXT STEPS
1. Detailed trade volume analysis
2. Route optimization planning
3. Contract negotiation
4. Implementation kickoff

Contact Information:
Jorge Martinez
Sales Manager
Triangle Trade Intelligence
Email: triangleintel@gmail.com
Phone: [Phone Number]

This proposal is valid for 30 days from the date above.`;
  }

  // Create Google Docs URL and handle content
  createGoogleDocsUrl(title, content) {
    // Copy content to clipboard for easy pasting
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        console.log('Proposal content copied to clipboard');
        // Show notification that content is ready to paste
        this.showClipboardNotification();
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        // Fallback: store in sessionStorage
        sessionStorage.setItem('proposalContent', content);
        this.showManualCopyNotification();
      });
    } else {
      // Fallback for older browsers
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('proposalContent', content);
        this.showManualCopyNotification();
      }
    }

    // Open Google Docs with the title
    return `https://docs.google.com/document/create`;
  }

  // Show notification that content is copied to clipboard
  showClipboardNotification() {
    if (typeof window !== 'undefined') {
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      `;
      notification.innerHTML = `
        ✅ <strong>Proposal Content Copied!</strong><br>
        📄 Google Docs will open - just paste (Ctrl+V) to add content
      `;

      document.body.appendChild(notification);

      // Remove notification after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    }
  }

  // Show notification for manual copy
  showManualCopyNotification() {
    if (typeof window !== 'undefined') {
      alert(`📄 Google Docs will open with the correct title.\n\n📋 The proposal content has been prepared.\n\n✅ After Google Docs opens, check your browser console or sessionStorage for the content to copy and paste.`);
    }
  }

  // Google Contacts Integration - Add/update client contacts
  async manageContact(client, action = 'view') {
    const clientName = client.company || client.client || 'Client';
    const clientEmail = client.email || '';

    if (action === 'add') {
      // Open Google Contacts to add new contact
      const contactsUrl = 'https://contacts.google.com/person/c';
      window.open(contactsUrl, '_blank');
    } else {
      // Search for existing contact
      const searchUrl = `https://contacts.google.com/search/${encodeURIComponent(clientName)}`;
      window.open(searchUrl, '_blank');
    }

    return {
      success: true,
      action: 'manage_contact',
      client: clientName,
      contactAction: action
    };
  }

  // Create comprehensive client view with all Google tools
  async openClientWorkspace(client) {
    const clientName = client.company || client.client || 'Client';

    // Open multiple Google tools for comprehensive client management
    const actions = [
      this.composeEmail(client, 'follow_up'),
      this.scheduleCall(client, 'follow_up'),
      this.manageContact(client, 'view')
    ];

    return {
      success: true,
      action: 'open_workspace',
      client: clientName,
      toolsOpened: ['gmail', 'calendar', 'contacts']
    };
  }
}

// Export singleton instance
const googleIntegrationService = new GoogleIntegrationService();
export default googleIntegrationService;