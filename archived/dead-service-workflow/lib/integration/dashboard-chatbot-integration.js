/**
 * Dashboard Chatbot Integration Guide
 * How to add the intelligent team chatbot to admin dashboards
 */

// STEP 1: Import the TeamChatWidget in your admin dashboard files
// Add this import to the top of each dashboard:

import TeamChatWidget from '../../components/admin/TeamChatWidget';

// STEP 2: Add the widget to your dashboard JSX
// Place this just before the closing </> tag in your dashboard return:

const BrokerDashboardWithChat = () => {
  return (
    <>
      {/* Your existing dashboard content */}
      <div className="admin-container">
        {/* Dashboard content... */}
      </div>

      {/* Team AI Chatbot - Context-aware for this dashboard */}
      <TeamChatWidget
        dashboardContext="broker"
        userName="cristina" // or get from user state
        minimized={true}
      />
    </>
  );
};

// STEP 3: Dashboard-specific context settings

const dashboardContexts = {
  // Broker Dashboard
  'broker': {
    context: 'broker',
    suggestedQueries: [
      "Check SAM registration for [company name]",
      "Show trade volume for HS [code] from Mexico",
      "Verify supplier compliance status",
      "Analyze customs clearance delays"
    ],
    preferredAgents: ['ComplianceBot', 'MarketBot']
  },

  // Collaboration Workspace
  'collaboration': {
    context: 'collaboration',
    suggestedQueries: [
      "Analyze Mexico trade opportunities for HS [code]",
      "Research USMCA certificate requirements",
      "Show triangle routing benefits",
      "Generate compliance report for [company]"
    ],
    preferredAgents: ['MarketBot', 'ResearchBot']
  },

  // Dev Dashboard
  'dev': {
    context: 'dev',
    suggestedQueries: [
      "Analyze system performance trends",
      "Research API optimization strategies",
      "Generate technical documentation",
      "Troubleshoot database performance"
    ],
    preferredAgents: ['ResearchBot', 'CoordinatorBot']
  },

  // Client Portfolio
  'client': {
    context: 'client',
    suggestedQueries: [
      "Research lead qualification criteria",
      "Analyze customer usage patterns",
      "Generate market entry strategy",
      "Show customer trade volume analysis"
    ],
    preferredAgents: ['MarketBot', 'ResearchBot']
  }
};

// STEP 4: Advanced integration - Connect chatbot to dashboard actions

const connectChatbotToActions = (dashboardType) => {
  // When user clicks dashboard buttons, provide context to chatbot
  const dashboardActions = {
    'track_shipment': (record) => ({
      context: `User is tracking shipment for ${record.company}`,
      suggestedQuery: `Check compliance status and trade volume for ${record.company}`
    }),

    'renew_certificate': (record) => ({
      context: `User is renewing USMCA certificate ${record.certificate_number}`,
      suggestedQuery: `Research renewal requirements for certificate ${record.certificate_number}`
    }),

    'verify_supplier': (record) => ({
      context: `User is verifying supplier ${record.company_name}`,
      suggestedQuery: `Check SAM registration and compliance status for ${record.company_name}`
    })
  };

  return dashboardActions;
};

export { dashboardContexts, connectChatbotToActions };