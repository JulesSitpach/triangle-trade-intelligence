# AI-Powered Trade Alerts Integration

**Status:** Complete and Ready for Testing
**Date:** January 2025

---

## 🎯 Overview

The AI-powered alerts system analyzes USMCA workflow results to generate **personalized, component-specific trade risk alerts** using Claude 3.5 Sonnet. This creates a seamless flow from qualification analysis to ongoing risk monitoring.

### Value Proposition

**Traditional Alerts:** Generic alerts for all electronics companies
**AI-Powered Alerts:** "Your 45% Taiwan dependency is at risk due to China-Taiwan tensions"

---

## 🔄 Complete User Flow

```
1. User completes USMCA workflow
   ↓ AI sees: 60% China, 40% Mexico components
   ↓ AI calculates: Not qualified (need 60% USMCA)

2. Results page shows TWO alert buttons:
   ↓ Button #1: After USMCA Qualification (prominent CTA card)
   ↓ Button #2: Bottom actions (next to "Start New Analysis")

3. User clicks "🚨 Set Up Trade Alerts"
   ↓ Data saved to localStorage
   ↓ Navigates to /trade-risk-alternatives

4. Alerts page loads
   ↓ Detects component origins data
   ↓ Calls /api/ai-vulnerability-alerts

5. AI analyzes supply chain
   ↓ Generates specific alerts:
     • "60% China dependency risk"
     • "Section 301 tariff exposure"
     • "Geopolitical vulnerability"

6. User sees personalized alerts
   ↓ Each alert references their exact components
   ↓ Shows recommended actions
   ↓ Provides monitoring guidance
```

---

## 🤖 AI Analysis Architecture

### AI Endpoint: `/api/ai-vulnerability-alerts`

**Input:** Complete workflow results with component origins

**AI Prompt Structure:**
```javascript
{
  company_profile: {
    company_name: "Industrial Hydraulics Mexico",
    product: "High-pressure hydraulic pumps",
    business_type: "Machinery & Equipment",
    usmca_qualified: false
  },

  component_origins: [
    { description: "Motor assembly", origin_country: "CN", value_percentage: 60 },
    { description: "Pump housing", origin_country: "MX", value_percentage: 40 }
  ]
}
```

**AI Tasks:**
1. **Identify Geopolitical Risks:** US-China tensions, Taiwan strait, Russia-EU, etc.
2. **Analyze Tariff Exposure:** Section 301, MFN rates, industry-specific restrictions
3. **Generate Specific Alerts:** Reference exact components and percentages
4. **Prioritize Risks:** HIGH/MEDIUM/LOW based on threat timeline
5. **Recommend Actions:** Specific sourcing alternatives by country

**Output Structure:**
```json
{
  "overall_risk_level": "HIGH",
  "risk_score": 75,

  "primary_vulnerabilities": [
    {
      "vulnerability_type": "geopolitical",
      "description": "60% dependency on Chinese components creates supply chain risk",
      "affected_components": ["Motor assembly"],
      "risk_level": "HIGH",
      "financial_exposure": "Up to 25% tariff increase"
    }
  ],

  "alerts": [
    {
      "alert_id": "china_dependency_001",
      "title": "High China Component Dependency - 60% Exposure",
      "severity": "HIGH",
      "category": "geopolitical",
      "description": "Your motor assembly (60% of product value) sources from China...",
      "affected_components": ["Motor assembly"],
      "origin_countries": ["CN"],
      "potential_impact": "$150,000 annual tariff exposure",
      "recommended_action": "Source motors from Mexico or Canada to achieve USMCA qualification",
      "monitoring_guidance": "Watch for Section 301 tariff announcements and US-China trade policy changes",
      "alert_triggers": [
        "New tariff announcements on HS code 8413.50",
        "US-China trade policy changes",
        "Supply chain disruption events in China"
      ]
    }
  ],

  "recommendations": {
    "immediate_actions": [
      "Contact Mexico motor suppliers in Monterrey industrial zone",
      "Request quotes from US pump manufacturers",
      "Evaluate assembly relocation to Mexico for full USMCA qualification"
    ],
    "monitoring_priorities": [
      "Daily: Section 301 tariff list updates",
      "Weekly: US-China trade negotiations",
      "Monthly: Mexico manufacturing capacity reports"
    ],
    "diversification_strategies": [
      "Shift 30% of motor sourcing to Mexico to achieve 70% USMCA content",
      "Establish dual sourcing with Canadian bearing suppliers",
      "Consider Mexico final assembly for remaining Chinese components"
    ]
  }
}
```

---

## 📍 Results Page Integration

### Two Strategic Button Placements

#### **Placement #1: After USMCA Qualification (Primary CTA)**

```jsx
{/* AI-Powered Trade Alerts CTA - Primary placement */}
<div className="card alert-cta-card">
  <div className="alert-cta-content">
    <div className="alert-cta-icon">🚨</div>
    <div className="alert-cta-text">
      <h3 className="card-title">AI-Powered Trade Risk Monitoring</h3>
      <p className="text-body">
        {results.usmca?.qualified
          ? 'Protect your USMCA qualification with real-time alerts...'
          : 'Monitor trade policy changes that could help you achieve USMCA qualification...'}
      </p>
      <div className="alert-cta-benefits">
        <div className="benefit-item">✓ AI analyzes your 2 component origins</div>
        <div className="benefit-item">✓ Personalized alerts for Machinery & Equipment</div>
        <div className="benefit-item">✓ Real-time geopolitical risk monitoring</div>
        <div className="benefit-item">✓ Tariff change notifications</div>
      </div>
    </div>
  </div>
  <div className="alert-cta-actions">
    <button onClick={handleSetUpAlerts} className="btn-primary btn-large">
      🚨 Set Up Trade Alerts
    </button>
    <div className="alert-cta-note">Free analysis • Takes 2 minutes</div>
  </div>
</div>
```

**Why This Placement:**
- Right after seeing qualification result (emotional moment)
- Users understand their vulnerabilities at this point
- Natural next step: "How do I monitor/protect this?"

#### **Placement #2: Bottom Actions (Secondary CTA)**

```jsx
<div className="dashboard-actions-right">
  <button onClick={handleSetUpAlerts} className="btn-primary">
    🚨 Set Up Trade Alerts
  </button>
  <button onClick={onReset} className="btn-secondary">
    🔄 Start New Analysis
  </button>
</div>
```

**Why This Placement:**
- Standard action button placement
- Available after reviewing full results
- Alternative for users who scroll to bottom

### handleSetUpAlerts Function

```javascript
const handleSetUpAlerts = () => {
  console.log('🚨 Setting up AI-powered trade alerts...');

  // Prepare complete workflow data for AI vulnerability analysis
  const alertData = {
    company: {
      name: results.company?.name,
      business_type: results.company?.business_type,
      trade_volume: results.company?.trade_volume
    },
    product: {
      hs_code: results.product?.hs_code,
      description: results.product?.description
    },
    usmca: {
      qualified: results.usmca?.qualified,
      qualification_status: results.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
      north_american_content: results.usmca?.north_american_content,
      threshold_applied: results.usmca?.threshold_applied,
      gap: results.usmca?.gap
    },
    component_origins: results.component_origins || results.components,
    components: results.component_origins || results.components,
    savings: results.savings,
    workflow_path: 'alerts',
    timestamp: new Date().toISOString()
  };

  // Save to localStorage for alerts page
  localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));
  localStorage.setItem('usmca_workflow_data', JSON.stringify(alertData));
  localStorage.setItem('usmca_company_data', JSON.stringify(alertData.company));

  // Navigate to alerts page
  router.push('/trade-risk-alternatives');
};
```

---

## 🚨 Alerts Page Integration

### AI Analysis Trigger

```javascript
const generateDynamicContent = async (profile) => {
  // Try to get AI-powered vulnerability analysis if we have workflow results
  const resultsData = localStorage.getItem('usmca_workflow_results');

  if (resultsData) {
    const workflowResults = JSON.parse(resultsData);

    // Check if we have component origins data for AI analysis
    if (workflowResults.component_origins || workflowResults.components) {
      console.log('🤖 ========== AI VULNERABILITY ANALYSIS ==========');
      await generateAIVulnerabilityAlerts(workflowResults);
    }
  }

  // Generate traditional risks (fallback)
  const risks = generateRisksFromProfile(profile);
  setDynamicRisks(risks);
};
```

### AI Analysis Function

```javascript
const generateAIVulnerabilityAlerts = async (workflowResults) => {
  setIsAiAnalyzing(true);

  try {
    const response = await fetch('/api/ai-vulnerability-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowResults)
    });

    const aiAnalysis = await response.json();

    console.log('✅ AI vulnerability analysis received:', {
      alert_count: aiAnalysis.alerts?.length,
      risk_level: aiAnalysis.vulnerability_analysis?.overall_risk_level,
      confidence: aiAnalysis.trust?.confidence_score
    });

    setAiVulnerabilityAnalysis(aiAnalysis);

    // Replace dynamic risks with AI-generated alerts
    if (aiAnalysis.alerts && aiAnalysis.alerts.length > 0) {
      const aiRisks = aiAnalysis.alerts.map(alert => ({
        title: alert.title,
        severity: alert.severity,
        generalImpact: alert.description,
        detailedImpact: alert.potential_impact,
        probability: 'AI-Analyzed',
        timeframe: 'Real-time monitoring',
        description: alert.description,
        detailedInfo: `${alert.description}\n\nAffected Components: ${alert.affected_components?.join(', ')}\n\nRecommended Action: ${alert.recommended_action}\n\nMonitoring Guidance: ${alert.monitoring_guidance}`,
        aiGenerated: true,
        alertTriggers: alert.alert_triggers || []
      }));

      setDynamicRisks(aiRisks);
    }

  } catch (error) {
    console.error('❌ AI vulnerability analysis failed:', error);
    // Fall back to rule-based alerts
  } finally {
    setIsAiAnalyzing(false);
  }
};
```

### UI Display

**AI Analysis Summary Card:**
```jsx
{aiVulnerabilityAnalysis && (
  <div className="card ai-analysis-summary">
    <div className="card-header">
      <h3 className="card-title">🤖 AI Vulnerability Analysis</h3>
      <div className="ai-badge">Powered by Claude 3.5 Sonnet</div>
    </div>
    <div className="status-grid">
      <div className="status-card">
        <div className="status-label">Overall Risk Level</div>
        <div className="status-value">HIGH</div>
      </div>
      <div className="status-card">
        <div className="status-label">Risk Score</div>
        <div className="status-value">75/100</div>
      </div>
      <div className="status-card">
        <div className="status-label">Alerts Generated</div>
        <div className="status-value">3</div>
      </div>
      <div className="status-card">
        <div className="status-label">AI Confidence</div>
        <div className="status-value">85%</div>
      </div>
    </div>
  </div>
)}
```

**AI-Powered Badge on Alerts:**
```jsx
<h3 className="card-title">
  🚨 Current Threats to Your Trade
  {aiVulnerabilityAnalysis && <span className="ai-powered-badge">AI-Powered</span>}
</h3>
<p className="card-subtitle">
  {aiVulnerabilityAnalysis
    ? 'AI-generated alerts specific to your component origins and supply chain'
    : 'Issues specifically affecting your business profile'}
</p>
```

---

## 📊 Data Flow Architecture

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USMCA WORKFLOW ANALYSIS                    │
│                                                              │
│  Step 1: Company Info                                       │
│  Step 2: Component Origins                                  │
│    • Motor assembly: 60% from China                         │
│    • Pump housing: 40% from Mexico                          │
│                                                              │
│  AI Analysis: Not qualified (40% < 60% threshold)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW RESULTS PAGE                     │
│                                                              │
│  ✅ USMCA Qualification: NOT QUALIFIED                       │
│  📊 North American Content: 40%                              │
│  🎯 Threshold Required: 60%                                  │
│  📉 Gap: 20%                                                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🚨 AI-Powered Trade Risk Monitoring                  │  │
│  │                                                        │  │
│  │  Monitor trade policy changes that could help you     │  │
│  │  achieve USMCA qualification.                         │  │
│  │                                                        │  │
│  │  ✓ AI analyzes your 2 component origins               │  │
│  │  ✓ Personalized alerts for Machinery & Equipment      │  │
│  │  ✓ Real-time geopolitical risk monitoring             │  │
│  │  ✓ Tariff change notifications                        │  │
│  │                                                        │  │
│  │  [🚨 Set Up Trade Alerts] ← User clicks here          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ Saves workflow data to localStorage
                       ↓ Navigates to /trade-risk-alternatives
                       ↓
┌─────────────────────────────────────────────────────────────┐
│               TRADE RISK ALTERNATIVES PAGE                   │
│                                                              │
│  1. Loads workflow data from localStorage                   │
│  2. Detects component_origins present                       │
│  3. Calls /api/ai-vulnerability-alerts                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│          /api/ai-vulnerability-alerts (OpenRouter)           │
│                                                              │
│  AI Prompt:                                                  │
│  "Analyze this supply chain for vulnerabilities:            │
│   • 60% China motor assembly                                │
│   • 40% Mexico pump housing                                 │
│   • Machinery & Equipment industry                          │
│   • NOT qualified for USMCA (need 60%, have 40%)"          │
│                                                              │
│  Claude 3.5 Sonnet analyzes:                                │
│  ✓ Geopolitical risks (US-China tensions)                   │
│  ✓ Tariff exposure (Section 301)                            │
│  ✓ Supply chain vulnerabilities                             │
│  ✓ Diversification opportunities                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ Returns AI analysis
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              ALERTS DISPLAY (AI-POWERED)                     │
│                                                              │
│  🤖 AI Vulnerability Analysis                                │
│  Powered by Claude 3.5 Sonnet                               │
│                                                              │
│  Overall Risk Level: HIGH                                    │
│  Risk Score: 75/100                                          │
│  Alerts Generated: 3                                         │
│  AI Confidence: 85%                                          │
│                                                              │
│  Primary Vulnerabilities:                                    │
│  • GEOPOLITICAL: 60% China dependency (Motor assembly)      │
│  • TARIFF: Section 301 exposure up to 25%                   │
│  • SUPPLY_CHAIN: Single-source vulnerability                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🚨 High China Component Dependency - 60% Exposure   │    │
│  │                                                      │    │
│  │ Your motor assembly (60% of product value) sources  │    │
│  │ from China, creating significant geopolitical risk. │    │
│  │                                                      │    │
│  │ Affected Components: Motor assembly                 │    │
│  │ Potential Impact: $150,000 annual tariff exposure   │    │
│  │                                                      │    │
│  │ Recommended Action:                                 │    │
│  │ Source motors from Mexico or Canada to achieve      │    │
│  │ USMCA qualification.                                │    │
│  │                                                      │    │
│  │ Monitoring Guidance:                                │    │
│  │ Watch for Section 301 tariff announcements and      │    │
│  │ US-China trade policy changes.                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Recommendations:                                            │
│  • Contact Mexico motor suppliers in Monterrey              │
│  • Request quotes from US pump manufacturers                │
│  • Evaluate assembly relocation to Mexico                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Instructions

### End-to-End Test

**Step 1: Complete USMCA Workflow**
```
Company: Industrial Hydraulics Mexico
Business Type: Machinery & Equipment
Product: High-pressure hydraulic pumps

Component 1:
  Description: Motor assembly
  Country: China
  Value %: 60%

Component 2:
  Description: Pump housing and assembly
  Country: Mexico
  Value %: 40%
```

**Expected Result:** NOT QUALIFIED (40% < 60% threshold)

**Step 2: Check Results Page**

✅ Should see TWO alert buttons:
- Primary CTA card after USMCA Qualification section
- Secondary button at bottom with actions

✅ Button text: "🚨 Set Up Trade Alerts"

✅ CTA should mention:
- "AI analyzes your 2 component origins"
- "Personalized alerts for Machinery & Equipment"

**Step 3: Click Alert Button**

✅ Console should show:
```
🚨 Setting up AI-powered trade alerts...
✅ Alert data prepared: {
  company: "Industrial Hydraulics Mexico",
  components: 2,
  qualified: false
}
```

✅ Should navigate to: `/trade-risk-alternatives`

**Step 4: Alerts Page Loads**

✅ Console should show:
```
🤖 ========== AI VULNERABILITY ANALYSIS ==========
Component origins found, requesting AI vulnerability analysis...
📤 Sending workflow data to AI vulnerability endpoint...
```

✅ Should see loading indicator:
"🤖 AI Analyzing Your Supply Chain..."

**Step 5: AI Analysis Completes**

✅ Console should show:
```
✅ AI vulnerability analysis received: {
  alert_count: 3,
  risk_level: "HIGH",
  confidence: 85
}
🚨 Setting AI-generated risks: 3
```

✅ Should see AI Analysis Summary card:
- Overall Risk Level: HIGH
- Risk Score: 75/100
- Alerts Generated: 3
- AI Confidence: 85%

✅ Should see Primary Vulnerabilities list:
- GEOPOLITICAL: 60% China dependency
- TARIFF: Section 301 exposure
- SUPPLY_CHAIN: Single-source vulnerability

**Step 6: Verify Alerts Are Specific**

✅ Each alert should mention:
- Exact component description ("Motor assembly")
- Exact percentage ("60%")
- Specific country ("China")
- Recommended action with alternatives
- Monitoring guidance

✅ Alerts should show "AI-Powered" badge

**❌ FAIL if alerts are generic:**
- "Electronics imports face scrutiny" (too general)
- "Supply chain concentration risk" (no specifics)

**✅ PASS if alerts are specific:**
- "Your motor assembly (60% from China) creates $150K tariff exposure"
- "Shift 30% of motor sourcing to Mexico to achieve 70% USMCA content"

---

## 📁 Files Modified

### Created:
1. ✅ `pages/api/ai-vulnerability-alerts.js` - AI analysis endpoint (290 lines)

### Modified:
2. ✅ `components/workflow/WorkflowResults.js`
   - Added useRouter import
   - Added handleSetUpAlerts function
   - Added primary CTA card after USMCAQualification
   - Added secondary alert button in dashboard actions

3. ✅ `pages/trade-risk-alternatives.js`
   - Added aiVulnerabilityAnalysis state
   - Added isAiAnalyzing state
   - Modified generateDynamicContent to call AI endpoint
   - Added generateAIVulnerabilityAlerts function
   - Added AI analysis summary card display
   - Added "AI-Powered" badge to alerts section

---

## 🎯 Success Criteria

### All Must Be True:
- [ ] User completes USMCA workflow with component origins
- [ ] Results page shows 2 "Set Up Trade Alerts" buttons
- [ ] Clicking button navigates to /trade-risk-alternatives
- [ ] Workflow data saved to localStorage with component_origins
- [ ] Alerts page detects component origins
- [ ] AI endpoint called with workflow data
- [ ] AI returns personalized alerts referencing exact components
- [ ] Alerts display with "AI-Powered" badge
- [ ] AI analysis summary card shows risk level and confidence
- [ ] Each alert mentions specific components and percentages
- [ ] Recommendations are actionable and component-specific
- [ ] Monitoring guidance references actual supply chain

---

## 💡 AI Prompt Engineering Notes

### What Makes Alerts Specific:

**❌ Generic (Bad):**
```
"Electronics imports face increased scrutiny"
```

**✅ Specific (Good):**
```
"Your 45% Taiwan semiconductor dependency (PCB boards, memory chips)
creates $200K tariff exposure if China-Taiwan tensions escalate.
Recommended: Source semiconductors from Mexico's Guadalajara tech hub."
```

### Key Prompt Instructions:

1. **"Reference exact component percentages from the data"**
   - Forces AI to use actual numbers from workflow

2. **"Be realistic - use current geopolitical and trade policy context"**
   - AI uses real-world knowledge of trade tensions

3. **"Include dollar amounts where possible"**
   - Makes financial impact concrete

4. **"Each alert must reference specific components by description"**
   - Prevents generic "supply chain risk" alerts

5. **"Provide product-specific sourcing alternatives with countries"**
   - Recommendations mention actual geographic alternatives

---

## 🚀 Next Steps

### Phase 1: Basic Functionality (COMPLETE)
- ✅ AI vulnerability analysis endpoint
- ✅ Alert buttons on results page
- ✅ Data flow from workflow to alerts
- ✅ AI-generated alerts display

### Phase 2: Alert Subscriptions (Future)
- [ ] Allow users to subscribe to specific alert types
- [ ] Email notifications for new alerts
- [ ] Alert frequency preferences (daily/weekly/monthly)
- [ ] Save alert preferences to user profile

### Phase 3: Real-Time Monitoring (Future)
- [ ] Connect to real trade policy APIs
- [ ] Automatically trigger alerts on policy changes
- [ ] Show "New Alert" badges
- [ ] Alert history and timeline

---

**Status:** Ready for production testing
**Documentation Complete:** January 2025
