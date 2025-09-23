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
- **USMCA Certificate Generation**: $200/certificate (40/month capacity)
  - *Premium quality*: Thorough expert review vs. rushed completion
  - *Efficient delivery*: Pre-populated from user's app data
  - *Risk mitigation*: Professional completion vs. costly mistakes
- **HS Code Classification**: $150/product (60/month capacity)
- **Document Review & Validation**: $250/review (25/month capacity)
  - *Pre-audit confidence*: Expert review before customer audits
  - *Error prevention*: Catch issues before submission
  - *Professional polish*: Clean documentation packages
- **Monthly Compliance Support**: $99/month (50 client capacity)
  - *Ongoing guidance*: 2 hours monthly Q&A time with expert
  - *Priority support*: Fast response to compliance questions
  - *Virtual team member*: Affordable access to trade expertise
- **Compliance Crisis Response**: $450/incident (15/month capacity)
  - *Emergency resolution*: 24-48 hour response to rejected certificates
  - *Root cause analysis*: Fix problems and prevent recurrence
  - *Cost savings*: Avoid demurrage fees and customer relationship damage

#### Jorge's Mexico/Latin America Services
**Competitive Advantage**: Based in Mexico, native Spanish speaker, local contacts and cultural expertise
- **Mexico Supplier Sourcing Report**: $500 (5-7 pre-screened supplier contacts with capabilities analysis)
- **Mexico Manufacturing Feasibility Report**: $650 (Location recommendations, regulatory overview, cost analysis)
- **Compliance Crisis Assessment Report**: $400 (Emergency response for rejected certificates, audit preparation)
- **Mexico Market Entry Report**: $400 (Regulatory requirements, cultural guidance, market entry strategy)

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

### Cristina's Service KPIs
- **USMCA Certificate Generation**: 24-hour turnaround, 99%+ accuracy (40/month capacity)
- **Document Review & Validation**: 1-2 day turnaround, pre-audit confidence (25/month capacity)
- **Monthly Compliance Support**: Ongoing Q&A support (50 client capacity)
- **Crisis Response**: 24-48 hour emergency resolution (15/month capacity)
- **Monthly Revenue Potential**: $34,950/month from all services (quality-focused delivery)
- **Quality Standard**: Zero customs rejections on expert-completed certificates

### Jorge's Mexico/Latin America Service KPIs
- **Mexico Supplier Sourcing Reports**: $500 each, 3-5 day delivery, 8 reports/month capacity
- **Mexico Manufacturing Feasibility Reports**: $650 each, 5-7 day delivery, 4 reports/month capacity
- **Compliance Crisis Assessment Reports**: $400 each, 24-48 hour emergency delivery, 6 reports/month capacity
- **Mexico Market Entry Reports**: $400 each, 3-5 day delivery, 6 reports/month capacity
- **Quality Standard**: Professional PDF reports with actionable recommendations and contact lists

## Revenue Targets & Metrics

### Subscription Revenue (Primary)
- **Target**: $50,000 MRR from subscriptions
- **Current Gap**: Need stronger trial conversion and plan upgrades
- **Key Metrics**: Trial-to-paid conversion, plan upgrade rates, churn

### Service Revenue (SMB-Focused Quality)
- **Cristina's Services**: $34,950/month potential (SMB compliance expertise)
- **Jorge's Services**: $12,000/month potential (Mexico market intelligence)
- **Combined Service Potential**: $46,950/month from expert services
- **Growth Strategy**: SMB-focused pricing with scalable capacity management

### Combined Target: $96,950 MRR
- **Subscription Base**: 167 customers at $299 avg = $50K MRR
- **Service Layer**: SMB-optimized expert services = $47K MRR

## Development Priorities

### Phase 1: Subscription Foundation (Current Gap)
- **Plan Selection UI**: Clear tier comparison and signup flow
- **Usage Tracking**: Certificate limits and usage dashboards  
- **Billing Integration**: Stripe/payment processing
- **Trial Management**: 14-day trial with conversion optimization

### Phase 2: Service Integration Enhancement
- **In-App Service Requests**: One-click upgrade from DIY to expert
- **Team Assignment Logic**: Route requests to Cristina vs Jorge automatically
- **Service Delivery Tracking**: Status updates and completion notifications

### Phase 3: Conversion Optimization
- **Smart Upgrade Prompts**: Context-aware service recommendations
- **Usage Analytics**: Track where users struggle and offer help
- **Success Metrics**: Certificate acceptance rates, user satisfaction scores

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

**Key Insight**: This is a sophisticated hybrid model where the SaaS platform creates qualified leads for high-value expert services. Users start with self-service and naturally graduate to expert completion when they encounter complexity or risk. The $200 certificate pricing makes perfect sense as an upgrade from DIY attempts, especially when the platform pre-populates all the user's data to make expert delivery efficient.