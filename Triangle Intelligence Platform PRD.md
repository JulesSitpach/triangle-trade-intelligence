# PRD.md - TradeFlow Intelligence Platform

**This PRD defines an SLC (Simple, Lovable, Complete) v25.0.1, not an MVP.**

The release has to feel complete, polished, and delightful. Even if the scope is tight. This is the standard for every AI session with Claude or Cursor - every feature ships feeling **done**, not "almost there."

## Project Overview

**TradeFlow Intelligence Platform** - A professional USMCA compliance and certificate generation platform with hybrid SaaS + expert services model.

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
- **📜 USMCA Certificates**: $200/certificate (40/month capacity)
  - *Premium quality*: Thorough expert review vs. rushed completion
  - *Efficient delivery*: Pre-populated from user's app data
  - *Risk mitigation*: Professional completion vs. costly mistakes
- **🔍 HS Classification**: $150/product (60/month capacity)
  - *Accurate classification*: Expert review for complex products
  - *Tariff optimization*: Find best HS codes for duty savings
  - *Audit protection*: Defend classifications with documentation
- **📋 Document Review**: $250/review (25/month capacity)
  - *Pre-audit confidence*: Expert review before customer audits
  - *Error prevention*: Catch issues before submission
  - *Professional polish*: Clean documentation packages
- **📞 Monthly Support**: $99/month (50 client capacity)
  - *Ongoing guidance*: 2 hours monthly Q&A time with expert
  - *Priority support*: Fast response to compliance questions
  - *Virtual team member*: Affordable access to trade expertise
- **🆘 Crisis Response**: $450/incident (15/month capacity)
  - *Emergency resolution*: 24-48 hour response to rejected certificates
  - *Root cause analysis*: Fix problems and prevent recurrence
  - *Cost savings*: Avoid demurrage fees and customer relationship damage

#### Jorge's Mexico/Latin America Services
**Competitive Advantage**: Based in Mexico, native Spanish speaker, local contacts and cultural expertise
- **🔍 Supplier Sourcing**: $500 (5-7 pre-screened supplier contacts with capabilities analysis)
  - *On-ground expertise*: Mexico-based vetting and verification
  - *Quality assurance*: Pre-screened suppliers meeting your standards
  - *Actionable contacts*: Direct introductions to qualified suppliers
- **🏭 Manufacturing Feasibility**: $650 (Location recommendations, regulatory overview, cost analysis)
  - *Location analysis*: Best Mexico regions for your manufacturing needs
  - *Cost modeling*: Labor, logistics, and regulatory cost breakdown
  - *Risk assessment*: Regulatory requirements and compliance roadmap
- **🚀 Market Entry**: $400 (Regulatory requirements, cultural guidance, market entry strategy)
  - *Market intelligence*: Entry strategy and partnership opportunities
  - *Cultural expertise*: Navigate Mexico business culture effectively
  - *Partnership introductions*: Connect with qualified local partners

### Revenue Model Logic
```
Business Plan User: $599/month + 2 free certificates = $799 value
Additional certificates: $200 each (efficient delivery via platform)
Annual value: $7,188 subscription + $2,400 avg services = $9,588/customer
```

## Core User Journey (SLC v25.0.1)

### Primary Path: Subscription-Based Self-Service
1. **Plan Selection & Signup**
   - Choose subscription tier based on certificate volume needs
   - 14-day trial available for all plans
   - Clear feature comparison showing what's included

2. **USMCA Certificate Workflow** 
   - **Step 1**: Company Information (pre-populated from account)
   - **Step 2**: Product & Component Analysis (AI-assisted classification)
   - **Step 3**: Certificate Generation (PDF creation with templates)

3. **Usage Tracking & Limits**
   - Plan-based limits (5/25/unlimited certificates per month)
   - Usage dashboard showing remaining allowances
   - Clear upgrade prompts when approaching limits

### Expert Service Upgrade Path
4. **"Need Help?" Conversion Points**
   - During complex product classification
   - After failed validation attempts  
   - When certificates are rejected by customs
   - Volume needs exceed plan limits

5. **Service Request Flow**
   - One-click request for expert completion
   - Team assignment (Cristina for compliance reports, Jorge for Mexico market reports)
   - Professional delivery with quality guarantees

## Technical Architecture

### Platform Foundation
- **Stack**: Next.js 14 (Pages Router), React 18, PostgreSQL via Supabase
- **Database**: 34,476+ HS code records, comprehensive tariff data
- **AI Integration**: Anthropic Claude for intelligent classification
- **Performance**: 54+ API endpoints, <400ms response time target

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
  price: 200,
  estimated_delivery: '24-48 hours'
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

### Service Upgrade Flow
```
Certificate Attempt → Complexity/Error → "Need Expert Help?" → Service Request → Expert Completion
```

### Error States (Must Convert to Services)
- **Complex Classification**: "This looks complex. Want expert help for $150?"
- **Validation Failures**: "Certificate has issues. Get expert completion for $200?"
- **Plan Limits Hit**: "You've used your monthly certificates. Upgrade plan or request expert completion?"

## Team Service Delivery Standards

### Cristina's Compliance Services (3-Stage Expert Validation Pattern)
**Workflow**: Client Docs → Expert Review → Deliverable Generation

#### Service Delivery KPIs
- **📜 USMCA Certificates** (3-Stage Validation)
  - Capacity: 40/month | Revenue: $8,000/month
  - Turnaround: 24 hours | Pattern: Doc Collection → Expert Validation → Certificate PDF
  - Quality: 99%+ accuracy, zero customs rejections

- **🔍 HS Classification** (3-Stage Validation)
  - Capacity: 60/month | Revenue: $9,000/month
  - Turnaround: 1-2 days | Pattern: Product Docs → Classification Analysis → Validated Report
  - Quality: Audit-proof classifications with supporting documentation

- **📋 Document Review** (3-Stage Validation)
  - Capacity: 25/month | Revenue: $6,250/month
  - Turnaround: 1-2 days | Pattern: Doc Upload → Expert Review → Gap Analysis Report
  - Quality: Pre-audit confidence, error prevention

- **📞 Monthly Support** (2-Stage Direct Service)
  - Capacity: 50 clients | Revenue: $4,950/month
  - Delivery: 2 hours monthly | Pattern: Live Session → Summary Report
  - Quality: Ongoing guidance, priority support

- **🆘 Crisis Response** (2-Stage Direct Service)
  - Capacity: 15/month | Revenue: $6,750/month
  - Turnaround: 24-48 hours | Pattern: Emergency Resolution → Prevention Plan
  - Quality: Root cause fixes, recurrence prevention

**Monthly Revenue Potential**: $34,950 (quality-focused SMB delivery)

### Jorge's Mexico Services (4-Stage Complex Research Pattern)
**Workflow**: Client Intake → AI Discovery → Jorge Validation → AI Report

#### Service Delivery KPIs
- **🔍 Supplier Sourcing** (4-Stage Complex) ✅ Working
  - Capacity: 8/month | Revenue: $4,000/month
  - Turnaround: 3-5 days | Pattern: Requirements → AI Discovery → Network Validation → Report
  - Quality: 5-7 pre-screened contacts with direct introductions

- **🏭 Manufacturing Feasibility** (4-Stage Complex)
  - Capacity: 4/month | Revenue: $2,600/month
  - Turnaround: 5-7 days | Pattern: Requirements → Facility Discovery → Analysis → Feasibility Report
  - Quality: Location recommendations, cost analysis, regulatory overview

- **🚀 Market Entry** (4-Stage Complex)
  - Capacity: 6/month | Revenue: $2,400/month
  - Turnaround: 3-5 days | Pattern: Market Goals → Partner Discovery → Evaluation → Entry Strategy
  - Quality: Partnership intros, market intelligence, cultural guidance

**Monthly Revenue Potential**: $9,000 (Mexico-focused research services)

### Workflow Efficiency Improvements
**Information Procurement Model** (vs Manual Data Entry):
- Stage 1: Client completes intake forms (not Jorge/Cristina typing)
- Stage 2: AI discovers contacts/experts (automated research)
- Stage 3: Expert validates findings (value-add review, not recreation)
- Stage 4: AI generates reports (professional deliverables)

**Time Savings**: 67% reduction per service (15 min → 5 min delivery time)
**Quality Improvement**: Uploaded docs > manual typing (higher accuracy)
**Capacity Increase**: 3x services with same staff (automation leverage)

## Revenue Targets & Metrics

### Subscription Revenue (Primary)
- **Target**: $50,000 MRR from subscriptions
- **Current Gap**: Need stronger trial conversion and plan upgrades
- **Key Metrics**: Trial-to-paid conversion, plan upgrade rates, churn

### Service Revenue (Workflow-Optimized Delivery)
- **Cristina's Services**: $34,950/month potential (3-stage validation + 2-stage direct)
- **Jorge's Services**: $9,000/month potential (4-stage complex research)
- **Combined Service Potential**: $43,950/month from expert services
- **Efficiency Model**: AI discovery + automated workflows = 3x capacity vs manual
- **Growth Strategy**: Proven supplier sourcing pattern applied to all services

### Combined Target: $93,950 MRR
- **Subscription Base**: 167 customers at $299 avg = $50K MRR
- **Service Layer**: Workflow-optimized expert services = $44K MRR
- **Efficiency Multiplier**: Same team, 3x output via automation

## Development Priorities

### Phase 1: Complete Service Dashboard Implementations (In Progress)
**Reference**: Working Supplier Sourcing dashboard pattern
- **✅ Supplier Sourcing** - 4-stage complex research (COMPLETE)
- **🔄 USMCA Certificates** - 3-stage expert validation (HIGH PRIORITY)
- **🔄 HS Classification** - 3-stage expert validation (HIGH PRIORITY)
- **Crisis Response** - 2-stage direct service (QUICK WIN)
- **Monthly Support** - 2-stage direct service (QUICK WIN)
- **Manufacturing Feasibility** - 4-stage complex research
- **Market Entry** - 4-stage complex research
- **Document Review** - 3-stage expert validation

### Phase 2: Subscription Foundation
- **Plan Selection UI**: Clear tier comparison and signup flow
- **Usage Tracking**: Certificate limits and usage dashboards
- **Billing Integration**: Stripe/payment processing
- **Trial Management**: 14-day trial with conversion optimization

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
- 4-Stage Complex → Manufacturing Feasibility, Market Entry
- 3-Stage Validation → USMCA Certs, HS Classification, Doc Review
- 2-Stage Direct → Monthly Support, Crisis Response
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

## Service Workflow Architecture (Technical Implementation)

### Workflow Pattern Categories

#### **Pattern 1: Complex Research (4 Stages)**
**Services**: Manufacturing Feasibility, Market Entry, Supplier Sourcing ✅
```
Stage 1: Client Requirements → IntakeFormModal
Stage 2: AI Contact Discovery → /api/ai-[service]-discovery
Stage 3: Expert Validation → Jorge's network + analysis
Stage 4: AI Report Generation → Professional deliverable
```

#### **Pattern 2: Expert Validation (3 Stages)**
**Services**: USMCA Certificates, HS Classification, Document Review
```
Stage 1: Client Documentation → Document upload modal
Stage 2: Expert Review → Cristina's validation workflow
Stage 3: Deliverable Generation → Certificate/Report PDF
```

#### **Pattern 3: Direct Service (2 Stages)**
**Services**: Monthly Support, Crisis Response
```
Stage 1: Service Delivery → Live session/crisis resolution
Stage 2: Summary & Follow-up → AI-generated summary
```

### Technical Components (Reusable)
- **IntakeFormModal**: All client data collection
- **AI Discovery APIs**: Contact/expert finding
- **WorkflowModal**: 2/3/4 stage progression tracking
- **Report Generator**: AI deliverable creation
- **Document Upload**: Client evidence collection

### Efficiency Architecture
**Information Procurement vs Data Entry:**
- ❌ Old Way: Jorge/Cristina type everything manually
- ✅ New Way: Clients upload forms, AI discovers contacts, experts validate
- **Result**: 67% time reduction, 3x capacity increase

---

**Key Insight**: This is a sophisticated hybrid model where the SaaS platform creates qualified leads for high-value expert services. Users start with self-service and naturally graduate to expert completion when they encounter complexity or risk. The $200 certificate pricing makes perfect sense as an upgrade from DIY attempts, especially when the platform pre-populates all the user's data to make expert delivery efficient.

**Technical Advantage**: Working supplier sourcing pattern (4-stage complex research) serves as proven template for all other services. Simple copy-paste with service-specific field changes = rapid dashboard deployment.