# PRD.md - Triangle Intelligence Platform

**This PRD defines an SLC (Simple, Lovable, Complete) v25.0.1, not an MVP.**

The release has to feel complete, polished, and delightful. Even if the scope is tight. This is the standard for every AI session with Claude or Cursor - every feature ships feeling **done**, not "almost there."

## Project Overview

**Triangle Intelligence Platform** - A professional USMCA compliance and certificate generation platform with hybrid SaaS + expert services model.

**Core Value Proposition**: 
- **Self-Service Certificate Creation**: DIY USMCA certificates through guided workflows
- **Expert Service Layer**: Professional completion when users need help
- **Complete Trade Intelligence**: Crisis monitoring, supplier vetting, market entry services

**Problem**: 
USMCA certificate creation is complex and risky. Users need the option to try self-service first, but with expert backup when stakes are high. Current solutions force users into either expensive consulting or risky DIY with no middle ground.

**Solution**: 
Tiered subscription platform that lets users start with templates and self-service, then seamlessly upgrade to expert completion and professional services as needed.

**Target Users**:
- **SME importers/exporters** ($3-15M revenue) needing affordable, tactical trade support
- **Growing manufacturers** expanding into Mexico market with local expertise needs
- **Trade compliance managers** seeking concrete deliverables vs. expensive consulting
- **Small logistics companies** needing crisis response and supplier diversification

## Business Model: SaaS + Expert Services Hybrid

### Subscription Tiers (Primary Revenue)
- **Starter Plan**: $99/month - Certificate templates, basic workflow
- **Professional Plan**: $299/month - Certificate wizard, guided completion
- **Business Plan**: $599/month - Full wizard + validation + 2 expert-completed certificates included

### Expert Services (Value-Add Revenue)
**Positioned as upgrades for complex cases or volume needs:**

#### Cristina's Compliance Services
**Competitive Advantage**: USMCA compliance expertise, document accuracy, crisis response
- **📜 USMCA Certificates**: $250/certificate (40/month capacity)
  - *Premium quality*: Same-day expert completion using subscriber workflow data
  - *Efficient delivery*: Pre-populated from user's comprehensive profile
  - *Risk mitigation*: Professional completion vs. costly mistakes

- **🔍 HS Classification**: $200/product (60/month capacity)
  - *Accurate classification*: Web search verification + expert validation
  - *Tariff optimization*: Find best HS codes for duty savings
  - *Audit protection*: Defend classifications with documentation

- **🆘 Crisis Response**: $400/incident (15/month capacity)
  - *Emergency resolution*: 24-48 hour response to trade crises
  - *Impact analysis*: Using subscriber's complete trade profile
  - *Action plan*: Specific steps to resolve and prevent recurrence

#### Jorge's Mexico/Latin America Services
**Competitive Advantage**: Based in Mexico, native Spanish speaker, local contacts and cultural expertise
- **🔍 Supplier Sourcing**: $500 (2-3 pre-screened supplier contacts with capabilities analysis)
  - *On-ground expertise*: Mexico-based vetting and verification
  - *Quality assurance*: Pre-screened suppliers meeting your standards
  - *Actionable contacts*: Direct introductions to qualified suppliers

- **🏭 Manufacturing Feasibility**: $650 (Location recommendations, cost analysis, go/no-go decision)
  - *Location analysis*: Best Mexico regions for your manufacturing needs
  - *Cost modeling*: Rough setup costs and annual savings estimates
  - *Risk assessment*: Top 3 risks with simple mitigation approaches

- **🚀 Market Entry**: $450 (Market viability assessment, partnership introductions)
  - *Market intelligence*: Entry strategy and partnership opportunities
  - *Cultural expertise*: Navigate Mexico business culture effectively
  - *Partnership introductions*: Connect with qualified local partners

### Revenue Model Logic
```
Business Plan User: $599/month + 2 free certificates = $799 value
Additional certificates: $250 each (efficient delivery via platform)
Annual value: $7,188 subscription + $3,000 avg services = $10,188/customer
```

## Core User Journey (SLC v25.0.1)

### Primary Path: Subscription-Based Self-Service
1. **Plan Selection & Signup**
   - Choose subscription tier based on certificate volume needs
   - 14-day trial available for all plans
   - Clear feature comparison showing what's included

2. **USMCA Analysis Workflow** (`/usmca-workflow`)
   - **Step 1**: Company Information (auto-populated from localStorage/account)
   - **Step 2**: Product & Component Analysis (AI-enhanced classification with web search)
   - **Step 3**: USMCA Qualification Results (analysis + basic certificate generation)
   - **Step 4**: Professional Certificate Completion (optional upgrade via `/usmca-certificate-completion`)

3. **Hybrid Self-Service + Professional Model** (No Usage Limits During Trial)
   - **Self-Service Path**: Complete analysis and generate basic certificates
   - **Professional Upgrade**: Expert-completed certificates with trust verification
   - **Data Pre-Population**: Workflow results auto-fill professional completion forms
   - **Conversion Points**: Trade risk alerts → team service requests

### Conversion Funnel (Implemented)
4. **Analysis → Risk Alerts → Team Services**
   ```
   USMCA Workflow → Results → "Get Crisis Alerts" → /trade-risk-alternatives
                                                    ↓
   Personalized Risks → Team Recommendations → Service Requests
   ```

5. **Trade Risk Alerts Page** ✅ **IMPLEMENTED** (`/trade-risk-alternatives`)
   - **Data Source**: User's completed workflow (localStorage with privacy controls)
   - **Personalization**: Dynamic risks based on actual company profile
   - **Team Matching**: Jorge (Latin America expertise) | Cristina (logistics/compliance)
   - **Privacy Model**: Progressive disclosure - detailed impacts require opt-in consent
   - **Conversion**: Risk alerts → direct team consultation requests

6. **Service Request Integration** ✅ **IMPLEMENTED**
   - **Jorge Services**: Mexico/Latin America (supplier sourcing, market entry, manufacturing feasibility)
   - **Cristina Services**: Compliance/logistics (USMCA certificates, HS classification, crisis response)
   - **Direct Contact**: One-click email and service request buttons
   - **Professional Delivery**: Expert completion with quality guarantees

## Technical Architecture

### Platform Foundation
- **Stack**: Next.js 14 (Pages Router), React 18, PostgreSQL via Supabase
- **Database**: 34,476+ HS code records, comprehensive tariff data
- **AI Integration**: Anthropic Claude for intelligent classification + web search verification
- **Performance**: 54+ API endpoints, <400ms response time target

### ✅ Enhanced Agent Architecture (IMPLEMENTED - Sept 2025)
**Web Search + Database Integration**: Real-time verification and freshness tracking

**Core Implementation Files:**
- `lib/agents/enhanced-classification-agent.js` - 6-step workflow with web search
- `lib/services/automated-trade-research.js` - Policy monitoring & research automation
- `components/AdminNavigation.js` - Agent performance dashboard access
- `pages/api/agents/classification-upgraded.js` - Enhanced API endpoints

```javascript
// Enhanced Classification Agent Workflow (6 Steps) ✅ WORKING
Step 1: Database First → Query 34K+ HS codes (hs_master_rebuild table)
Step 2: Web Verification → Real-time tariff rate validation via web search
Step 3: Compare & Flag → Database vs web discrepancy analysis
Step 4: Update Database → tariff_rates_staging table for review
Step 5: Context-Aware Response → User-friendly vs Admin-technical responses
Step 6: Proactive Maintenance → Automated data freshness monitoring

// Enhanced API Response Structure ✅ IMPLEMENTED
classification: {
  hs_code: "8517.62.00.00",
  description: "Set-top boxes...",
  confidence: "95%"
},
enhanced_features: {
  web_verification: { performed: true, sources_consulted: 4 },
  data_quality: { verification_status: "web_verified", freshness: "current" }
}
```

**✅ Admin Intelligence Dashboard Integration**:
- 🤖 **Agent Performance** (`/admin/agent-performance`) - Web search metrics, confidence scores
- 🔬 **Research Automation** (`/admin/research-automation-dashboard`) - Policy monitoring dashboard
- **Auto-Context Detection** - User vs Admin mode responses (no manual switching required)
- **Database Health** - Automated freshness scoring, staging table management

### Subscription Management System
```javascript
// User session tracking
const userPlan = {
  tier: 'business', // starter|professional|business
  certificates_used: 3,
  certificates_limit: 25,
  trial_days_remaining: 0,
  expert_certificates_included: 2
}
```

### Service Delivery Integration
```javascript
// Expert service request flow
const serviceRequest = {
  type: 'certificate_completion',
  user_data: workflowData, // Pre-populated from app
  assigned_expert: 'cristina',
  price: 250,
  estimated_delivery: 'same-day'
}
```

## Feature Boundaries & Scope

### ✅ IN SCOPE (v25.0.1)
- **Subscription Management**: Plan selection, billing, usage tracking
- **Self-Service Certificates**: Templates, wizard, validation
- **Expert Service Integration**: Seamless upgrade flow from DIY to professional
- **Team Dashboards**: Service delivery management for Cristina & Jorge
- **Usage Analytics**: Plan utilization, conversion tracking
- **Trial Management**: 14-day trials with conversion optimization

### ❌ OUT OF SCOPE (v25.0.1)
- White-label/multi-tenant architecture
- Advanced team collaboration features
- Integration with external ERP systems
- Multi-language support
- Advanced reporting/analytics dashboard
- API access for enterprise integrations

## Critical UX Flows

### Subscription Onboarding Flow
```
Homepage → Pricing → Plan Selection → Payment → Account Setup → First Certificate
```

### Certificate Creation Flow (By Plan)
**Starter**: Basic template → User completes → Download
**Professional**: Guided wizard → Validation → Download
**Business**: Full wizard → Expert validation → Download + 2 expert completions available

### Primary Conversion Flow (Trade Risk Alerts)
```
Trial USMCA Analysis → Results → "Get Crisis Alerts" → /trade-risk-alternatives → Team Service Requests
```

### Service Upgrade Flow
```
Certificate Attempt → Complexity/Error → "Need Expert Help?" → Service Request → Expert Completion
OR
Risk Alerts Page → Personalized Threats → Team Recommendations → Service Consultation
```

### Error States (Must Convert to Services)
- **Complex Classification**: "This looks complex. Want expert help for $200?"
- **Validation Failures**: "Certificate has issues. Get expert completion for $250?"
- **Plan Limits Hit**: "You've used your monthly certificates. Upgrade plan or request expert completion?"

## Team Service Delivery Standards

### Cristina's Compliance Services (Simplified SMB-Focused Workflows)
**Workflow**: Subscriber Data Review → AI Processing → Expert Validation → Delivery

#### Service Delivery KPIs
- **📜 USMCA Certificates** ($250) - 2-Stage Workflow
  - Capacity: 40/month | Revenue: $10,000/month
  - Turnaround: Same day | Pattern: Data Review → AI Certificate Generation + Expert Validation
  - Quality: 99%+ accuracy, zero customs rejections

- **🔍 HS Classification** ($200) - 2-Stage Workflow
  - Capacity: 60/month | Revenue: $12,000/month
  - Turnaround: Same day | Pattern: Product Review → Web Search Classification + Expert Validation
  - Quality: Audit-proof classifications with supporting documentation

- **🆘 Crisis Response** ($400) - 3-Stage Workflow
  - Capacity: 15/month | Revenue: $6,000/month
  - Turnaround: 24-48 hours | Pattern: Crisis Description → Impact Analysis → Action Plan Creation
  - Quality: Root cause fixes, recurrence prevention

**Monthly Revenue Potential**: $28,000 (SMB-focused delivery)

### Jorge's Mexico Services (Simplified Research Workflows)
**Workflow**: Subscriber Data + Requirements → AI Discovery → Jorge Validation → Focused Recommendation

#### Service Delivery KPIs
- **🔍 Supplier Sourcing** ($500) - 3-Stage Research ✅ Working
  - Capacity: 8/month | Revenue: $4,000/month
  - Turnaround: 3-5 days | Pattern: Requirements → AI Discovery → Network Validation + Recommendation
  - Quality: 2-3 best supplier contacts with direct introductions

- **🏭 Manufacturing Feasibility** ($650) - 3-Stage Research
  - Capacity: 4/month | Revenue: $2,600/month
  - Turnaround: 2-3 days | Pattern: Context Collection → Location Analysis → Go/No-Go Recommendation
  - Quality: Location recommendation, rough cost estimate, top 3 risks + next steps

- **🚀 Market Entry** ($450) - 3-Stage Research
  - Capacity: 6/month | Revenue: $2,700/month
  - Turnaround: 3-5 days | Pattern: Market Goals → Market Research → Strategy + Partnership Contacts
  - Quality: Market viability assessment, partnership introductions, entry approach

**Monthly Revenue Potential**: $9,300 (Mexico-focused research services)

### Final 6 Services (3 Cristina + 3 Jorge)
- **USMCA Certificates** ($250) - Same day delivery
- **HS Classification** ($200) - Same day delivery
- **Crisis Response** ($400) - 24-48 hours
- **Supplier Sourcing** ($500) - 3-5 days  
- **Manufacturing Feasibility** ($650) - 2-3 days
- **Market Entry** ($450) - 3-5 days

### Combined Target: $37,300 MRR
- **Subscription Base**: 167 customers at $299 avg = $50K MRR
- **Service Layer**: Streamlined expert services = $37K MRR
- **Total Platform Potential**: $87K MRR with optimized delivery

## Development Priorities

### Phase 1: Complete Service Dashboard Implementations (In Progress)
**Reference**: Working Supplier Sourcing dashboard pattern
- **✅ Supplier Sourcing** - 3-stage research workflow (COMPLETE)
- **✅ Admin UI Integration** - Agent dashboards fully accessible (COMPLETE)
- **✅ Enhanced Classification Agent** - Web search + database updates (COMPLETE)
- **🔄 USMCA Certificates** - 2-stage validation (HIGH PRIORITY)
- **🔄 HS Classification** - 2-stage validation (HIGH PRIORITY)
- **🔄 Crisis Response** - 3-stage crisis workflow (HIGH PRIORITY)
- **Manufacturing Feasibility** - 3-stage research workflow
- **Market Entry** - 3-stage research workflow

### Phase 2: Subscription Foundation
- **Plan Selection UI**: Clear tier comparison and signup flow
- **Usage Tracking**: Certificate limits and usage dashboards
- **Billing Integration**: Stripe/payment processing
- **Trial Management**: 14-day trials with conversion optimization

### Phase 3: Service Integration Enhancement
- **In-App Service Requests**: One-click upgrade from DIY to expert
- **Team Assignment Logic**: Route requests to Cristina vs Jorge automatically
- **Service Delivery Tracking**: Status updates and completion notifications

### Phase 4: Conversion Optimization
- **Smart Upgrade Prompts**: Context-aware service recommendations
- **Usage Analytics**: Track where users struggle and offer help
- **Success Metrics**: Certificate acceptance rates, user satisfaction scores

### Implementation Strategy
**Copy Working Pattern**: Use Supplier Sourcing dashboard as template
- 3-Stage Research → Manufacturing Feasibility, Market Entry
- 2-Stage Validation → USMCA Certs, HS Classification
- 3-Stage Crisis → Crisis Response
- **Time to Build**: 1-2 days per dashboard (pattern reuse)

## Quality Standards (SLC v25.0.1)

### User Experience Standards
- **Plan Selection**: Clear value proposition, no confusion about what's included
- **Certificate Creation**: Feels professional and reliable, not "DIY risky"
- **Service Upgrades**: Natural progression, not pushy upselling
- **Expert Delivery**: Premium quality that justifies the price premium

### Technical Performance
- **Subscription Management**: Instant plan changes, accurate usage tracking
- **Payment Processing**: Secure, reliable billing with clear invoicing
- **Service Integration**: Seamless data flow from app to expert teams
- **Mobile Experience**: Full functionality on all devices

### Business Performance
- **Trial Conversion**: >25% trial-to-paid conversion rate
- **Service Attachment**: >40% of subscribers use expert services
- **Customer Satisfaction**: >90% satisfaction with expert completions
- **Revenue Growth**: 15% month-over-month growth in combined revenue

---

**Key Insight**: This is a sophisticated hybrid model where the SaaS platform creates qualified leads for high-value expert services. Users start with self-service and naturally graduate to expert completion when they encounter complexity or risk. The pricing makes perfect sense as an upgrade from DIY attempts, especially when the platform pre-populates all the user's data to make expert delivery efficient.

**Technical Advantage**: Working supplier sourcing pattern serves as proven template for all other services. Simple copy-paste with service-specific field changes = rapid dashboard deployment.

**Intelligence Advantage**: Enhanced agents with web search verification provide real-time accuracy and freshness that traditional classification tools can't match, justifying premium positioning and expert service pricing.