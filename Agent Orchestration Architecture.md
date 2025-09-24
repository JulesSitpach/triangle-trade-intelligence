# Agent Orchestration Architecture - Triangle Intelligence Platform

**Phase 1 Implementation Plan**
**Version:** 1.0.0
**Date:** September 2025
**Branch:** agent-orchestration-phase1

---

## 🎯 Executive Summary

Transform Triangle Intelligence from human-capacity-limited to AI-scaled professional services platform through intelligent agent orchestration. Phase 1 targets **3x user success rate** and **2x expert service conversion** through user-facing agents.

### Business Impact Goals
- **User Success Rate:** 50% → 95% (certificate acceptance)
- **Expert Service Conversion:** 10% → 20% (smart escalation)
- **Support Cost Reduction:** -50% (proactive agent guidance)
- **Revenue Impact:** $99K/mo → $160K/mo (2.3x increase)

---

## 🏗️ Three-Layer Agent Architecture

### **Layer 1: User-Facing Agents** (Phase 1 - Current)
**Purpose:** Guide users to success, prevent errors, escalate complexity

**Agents:**
1. **Form Assistant Agent** - Auto-populate, suggest completions
2. **Classification Agent** - Real-time HS code suggestions with confidence
3. **Validation Agent** - Pre-submission compliance checks
4. **Document Agent** - Extract data from uploads (Phase 2)

### **Layer 2: Service Delivery Agents** (Phase 2)
**Purpose:** Scale Cristina/Jorge's expert capacity 10x

**Agents:**
1. **Research Agent** - Automated supplier/market discovery
2. **Analysis Agent** - Cost/feasibility calculations
3. **Compliance Agent** - USMCA rule validation
4. **Report Generation Agent** - Professional deliverable creation

### **Layer 3: Admin Intelligence Agents** (Phase 3)
**Purpose:** Business optimization and capacity planning

**Agents:**
1. **Revenue Optimization Agent** - Dynamic pricing, capacity allocation
2. **Quality Assurance Agent** - Cross-agent validation
3. **Learning Agent** - Continuous improvement from outcomes

---

## 📐 Phase 1 Technical Architecture

### **Core Components**

#### **1. Agent Base Class** (`lib/agents/base-agent.js`)
```javascript
export class BaseAgent {
  constructor(config) {
    this.name = config.name;
    this.model = config.model || 'claude-3-haiku-20240307';
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async execute(prompt, context = {}) {
    // Retry logic with exponential backoff
    // Response parsing and validation
    // Error handling and logging
  }

  async getConfidenceScore(response) {
    // Calculate confidence based on response quality
    // Return 0-100 score
  }
}
```

#### **2. Form Assistant Agent** (`lib/agents/form-assistant-agent.js`)
```javascript
export class FormAssistantAgent extends BaseAgent {
  constructor() {
    super({ name: 'FormAssistant', model: 'claude-3-haiku-20240307' });
  }

  async suggestFieldValue(fieldName, userContext, previousCertificates) {
    // Analyze user history
    // Suggest most relevant value
    // Return { suggestion, confidence, explanation }
  }

  async autoPopulateForm(certificateData, userHistory) {
    // Fill all possible fields from history
    // Return completed fields with confidence scores
  }
}
```

#### **3. Classification Agent** (`lib/agents/classification-agent.js`)
```javascript
export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({ name: 'Classification', model: 'claude-3-haiku-20240307' });
  }

  async suggestHSCode(productDescription, componentOrigins) {
    // Query hs_master_rebuild table (34,476 codes)
    // AI analysis of product description
    // Return { hsCode, confidence, explanation, alternates }
  }

  async validateHSCode(hsCode, productDescription) {
    // Check if HS code matches product
    // Return validation result with confidence
  }
}
```

#### **4. Validation Agent** (`lib/agents/validation-agent.js`)
```javascript
export class ValidationAgent extends BaseAgent {
  constructor() {
    super({ name: 'Validation', model: 'claude-3-haiku-20240307' });
  }

  async validateCertificate(certificateData) {
    // USMCA compliance checks
    // Required field validation
    // Common error detection
    // Return { valid, errors, warnings, confidence }
  }

  async shouldEscalateToExpert(validationResult) {
    // Analyze complexity and confidence scores
    // Return { escalate: boolean, reason, recommendedService }
  }
}
```

---

## 🔄 Agent Orchestration Flow

### **Certificate Creation Workflow**

```
User Enters Data
    ↓
Form Assistant Agent:
  - Auto-populates from history
  - Suggests completions
  - Confidence: 92%
    ↓
Classification Agent (on product description):
  - Suggests HS code: 8517.62.00
  - Confidence: 88%
  - Explanation: "Electronics component matching HTS criteria"
    ↓
Validation Agent (pre-submission):
  - Checks USMCA compliance
  - Validates required fields
  - Confidence: 95%
    ↓
Decision Point:
  IF confidence > 85% → Submit with confidence
  IF confidence 70-85% → Suggest expert review ($50)
  IF confidence < 70% → Recommend expert completion ($200)
    ↓
Escalation Agent (if needed):
  - Routes to appropriate expert (Cristina)
  - Includes full context for expert
  - Creates service request automatically
```

---

## 🛠️ Implementation Strategy

### **Week 1: Foundation**
- ✅ Create BaseAgent class with retry logic
- ✅ Build Form Assistant Agent
- ✅ Build Classification Agent
- ✅ Database integration (user history, HS codes)

### **Week 2: Integration**
- ✅ Add agent hooks to certificate completion page
- ✅ Real-time UI updates with agent suggestions
- ✅ Confidence score display
- ✅ Testing with real user data

### **Week 3: Validation & Escalation**
- ✅ Build Validation Agent
- ✅ Smart escalation logic
- ✅ Integration with expert service dashboards
- ✅ End-to-end testing

### **Week 4: Monitoring & Optimization**
- ✅ Agent performance monitoring
- ✅ Confidence score calibration
- ✅ User feedback collection
- ✅ A/B testing (with/without agents)

---

## 📊 Success Metrics

### **Agent Performance Metrics**

**Form Assistant Agent:**
- **Auto-populate accuracy:** >90%
- **User acceptance rate:** >80% of suggestions accepted
- **Time saved per certificate:** 5-7 minutes

**Classification Agent:**
- **HS code accuracy:** >85% vs customs acceptance
- **Confidence calibration:** High confidence (>85%) = >95% accuracy
- **Alternative suggestions:** Provide 2-3 alternates when confidence <80%

**Validation Agent:**
- **Error detection rate:** Catch >95% of issues before submission
- **False positive rate:** <10% (don't flag valid certificates)
- **Smart escalation accuracy:** >80% of recommended escalations convert

### **Business Metrics**

**User Success:**
- **Certificate acceptance rate:** 50% → 95%
- **Completion time:** 20 min → 8 min
- **Support tickets:** -50% reduction

**Revenue Impact:**
- **Expert service conversion:** 10% → 20%
- **Monthly recurring revenue:** $99K → $160K
- **Customer lifetime value:** +35% (higher retention)

---

## 🔐 Security & Privacy

### **Data Handling**
- **User data:** Encrypted at rest, anonymized for agent training
- **Agent context:** Limited to user's own certificate history
- **Expert escalation:** Full data transfer only after user consent

### **Compliance**
- **USMCA compliance:** Validation against latest rules
- **Customs regulations:** Updated monthly from official sources
- **Liability protection:** Human expert sign-off required for final submission

---

## 🚀 API Endpoints

### **New Agent APIs**

**1. Form Assistant API** (`/api/agents/form-assistant`)
```javascript
POST /api/agents/form-assistant
Request: {
  fieldName: string,
  userContext: object,
  certificateHistory: array
}
Response: {
  suggestion: string,
  confidence: number,
  explanation: string
}
```

**2. Classification API** (`/api/agents/classification`)
```javascript
POST /api/agents/classification
Request: {
  productDescription: string,
  componentOrigins: array
}
Response: {
  hsCode: string,
  confidence: number,
  explanation: string,
  alternates: array
}
```

**3. Validation API** (`/api/agents/validation`)
```javascript
POST /api/agents/validation
Request: {
  certificateData: object
}
Response: {
  valid: boolean,
  errors: array,
  warnings: array,
  confidence: number,
  escalationRecommendation: {
    recommended: boolean,
    service: string,
    reason: string
  }
}
```

---

## 🎨 User Interface Integration

### **Certificate Completion Page Enhancements**

**Real-time Agent Suggestions:**
```jsx
// Inline agent assistance
<div className="form-field">
  <label>Product Description</label>
  <textarea
    value={formData.product_description}
    onChange={handleChange}
  />

  {/* Classification Agent suggestion appears here */}
  {classificationSuggestion && (
    <div className="agent-suggestion">
      <span className="agent-icon">🤖</span>
      <div className="suggestion-content">
        <strong>Suggested HS Code: {classificationSuggestion.hsCode}</strong>
        <span className="confidence-badge">
          {classificationSuggestion.confidence}% confidence
        </span>
        <p className="explanation">{classificationSuggestion.explanation}</p>
        <button onClick={() => acceptSuggestion()}>Use This Code</button>
      </div>
    </div>
  )}
</div>
```

**Pre-submission Validation Display:**
```jsx
// Validation results panel
<div className="validation-panel">
  <h3>Certificate Validation</h3>

  {validationResult.valid ? (
    <div className="validation-success">
      <span className="check-icon">✅</span>
      <strong>Ready to Submit</strong>
      <p>{validationResult.confidence}% acceptance probability</p>
      <button className="btn-primary">Submit Certificate</button>
    </div>
  ) : (
    <div className="validation-warning">
      <span className="warning-icon">⚠️</span>
      <strong>Issues Detected</strong>
      <ul>
        {validationResult.errors.map(error => (
          <li key={error.field}>{error.message}</li>
        ))}
      </ul>
      {validationResult.escalationRecommendation.recommended && (
        <div className="escalation-suggestion">
          <p>Complex case detected - expert review recommended</p>
          <button className="btn-expert">
            Get Expert Help (${validationResult.escalationRecommendation.price})
          </button>
        </div>
      )}
    </div>
  )}
</div>
```

---

## 🔄 Agent Learning & Improvement

### **Continuous Learning Loop**

**1. Outcome Tracking:**
- Track certificate acceptance/rejection rates
- Correlate with agent confidence scores
- Identify patterns in successful vs failed certificates

**2. Expert Feedback:**
- When expert reviews agent suggestion, capture corrections
- Feed corrections back to agent training data
- Improve future suggestions based on expert knowledge

**3. Confidence Calibration:**
- Monitor: "High confidence (>85%) → How often correct?"
- Adjust thresholds based on real-world accuracy
- Goal: High confidence = >95% accuracy

**4. Agent Performance Dashboard:** (`/admin/agent-performance`)
- Agent-by-agent accuracy metrics
- Confidence score calibration charts
- Expert escalation conversion rates
- User satisfaction scores

---

## 📈 Scaling Roadmap

### **Phase 1 (Current): User-Facing Agents**
- Form Assistant, Classification, Validation agents
- Certificate completion flow integration
- **Target:** 3x user success rate

### **Phase 2 (Q1 2026): Service Delivery Agents**
- Multi-agent collaboration for expert services
- Jorge/Cristina capacity scaling to 10x
- **Target:** $200K+ monthly revenue

### **Phase 3 (Q2 2026): Full Orchestration**
- Admin intelligence layer
- Self-optimizing agent ecosystem
- **Target:** $500K+ monthly revenue

---

## 🎯 Next Actions

1. ✅ **Build BaseAgent class** - Foundation with retry logic
2. ✅ **Implement Form Assistant Agent** - Auto-populate proof of concept
3. ✅ **Implement Classification Agent** - Real-time HS code suggestions
4. ✅ **Integrate into certificate page** - User sees agent suggestions
5. ✅ **Test with real users** - Measure success rate improvement

---

**Document Owner:** Triangle Intelligence Development Team
**Last Updated:** September 2025
**Status:** Phase 1 Implementation In Progress