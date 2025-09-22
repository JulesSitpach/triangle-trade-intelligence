PRD.md - Triangle Intelligence Platform
This PRD defines an SLC (Simple, Lovable, Complete) v25.0.1, not an MVP.

The release has to feel complete, polished, and delightful. Even if the scope is tight. This is the standard for every AI session with Claude or Cursor - every feature ships feeling done, not "almost there."

Project Overview
Triangle Intelligence Platform - A professional USMCA compliance and trade optimization platform for North American manufacturers and importers.

Core Value Proposition:

Triangle Routing Optimization: US ↔ Canada ↔ Mexico trade route optimization
Full USMCA Benefits: Complete three-country trade advantages analysis
Industry-Agnostic Platform: Works for any business importing/exporting in North America
Problem: Current trade compliance tools are clunky, outdated, and enterprise-focused. SMEs and indie importers need something modern, fast, and actually delightful to use. Most solutions bury critical info 5+ clicks deep or cost $50K+ for enterprise packages.

Solution: A clean, modern web platform that delivers professional-grade USMCA compliance analysis in 2 simple steps, with immediate actionable results and optional professional services.

Target Users:

North American manufacturers (US/Canada/Mexico) doing cross-border trade
Import/export SMEs needing USMCA optimization
Trade compliance managers seeking streamlined workflows
Supply chain professionals optimizing manufacturing locations
Logistics coordinators managing multi-country operations
Technical Foundation
Stack: Next.js 14 (Pages Router), React 18, PostgreSQL via Supabase
Database: 34,476+ HS code records, comprehensive tariff data
AI Integration: Anthropic Claude for intelligent classification
Architecture: 54+ API endpoints, <400ms response time target
Testing: 75% coverage requirement, E2E with Playwright
Core User Journey (SLC v25.0.1)
Primary Workflow: 2-Step USMCA Analysis
Company Information (Step 1)
Company name, business type, trade volume, manufacturing location
Clean form with smart defaults and validation
Auto-saves to localStorage for session persistence
Product & Component Analysis (Step 2)
Product description with AI-enhanced classification
Component origins mapping for USMCA qualification
Real-time qualification preview as user types
USMCA Results (Immediate Display)
Qualification status with clear pass/fail indicators
Tariff savings calculations with dollar amounts
Dual Path Choice:
Path A: "📋 Continue to Certificate →"
Path B: "🚨 Get Crisis Alerts"
Optional: Certificate Generation Flow
Certificate Completion (Standalone Page)
Auto-populated from workflow data (no re-entry)
Professional PDF generation with trust verification
Download/email options with "🚨 Go to Crisis Alerts" CTA
Optional: Trade Risk Monitoring
Trade Risk & Alternatives (/trade-risk-alternatives)
Personalized alerts based on user's actual workflow data
Dynamic team recommendations (Jorge for Latin America, Cristina for logistics)
Crisis monitoring with RSS feed integration
Feature Boundaries & Limits
✅ IN SCOPE (v25.0.1)
Core Workflow: 2-step USMCA compliance analysis
Smart Classification: AI-enhanced HS code suggestions
Real Savings Calculator: Actual dollar impact calculations
Certificate Generation: PDF certificates with trust verification
Crisis Monitoring: Trade risk alerts with personalized recommendations
Team Services: Professional service delivery dashboards
Mobile Responsive: Clean experience on all devices
Dark Mode: Default dark theme with light mode option
Data Persistence: localStorage + optional database sync
❌ OUT OF SCOPE (v25.0.1)
iCloud/Google Drive sync
iPad-specific layouts
CSV/Excel export functionality
Multi-user collaboration features
Advanced reporting dashboards
White-label customization
API rate limiting/quotas
Advanced user roles/permissions
Pricing & Business Model
Core Platform: Free tier with limited analysis

3 USMCA analyses per device
Basic qualification results
No certificate generation
Professional Services: Pay-per-service model

Certificate Generation: $200/certificate (Cristina)
HS Code Classification: $150/classification (Cristina)
Customs Clearance: $300/shipment (Cristina)
Mexico Partnership Services: Custom pricing (Jorge)
Crisis Response: $500/incident (Team)
No Subscriptions: One-time service fees only No Recurring Fees: Platform access remains free No Upselling Pressure: Clean separation between free tools and paid services

Technical Specifications
Database Schema (Supabase PostgreSQL)
hs_master_rebuild - Primary tariff source (34,476 records)
usmca_tariff_rates - USMCA-specific rates (48 records)
tariff_rates - Fallback source (14,486 records, many 0% rates)
workflow_completions - User analysis results
user_profiles - User accounts (empty = sample data)
rss_feeds - Crisis monitoring sources
API Architecture Pattern
javascript
// All admin APIs use this fallback pattern
const { data, error } = await supabase.from('table').select('*');
if (error || !data || data.length === 0) {
  console.log('Using sample data for demo');
  return sampleData;
}
Critical Performance Targets
API Response Time: <400ms for all endpoints
Database Queries: <200ms average
Page Load Speed: <3s first contentful paint
Classification Accuracy: 85%+ for HS code suggestions
Mobile Performance: 90+ Lighthouse score
Key UX Flows & States
Main Navigation Flow
Homepage → Start USMCA Analysis → 2-Step Workflow → Results
                                                    ├─ Certificate Path → PDF Generation → Trade Alerts
                                                    └─ Direct to Trade Alerts
Error States (Must be Friendly)
No HS Code Found: "We couldn't find that specific code. Here are similar matches..."
API Timeout: "Analysis taking longer than usual. Retrying..."
Invalid Input: "Please check your product description and try again"
Database Error: "Service temporarily unavailable. Please try again in a moment."
Success States
Qualification Pass: Green indicator with savings amount
Qualification Fail: Orange indicator with alternatives
Certificate Generated: "Your USMCA certificate is ready for download"
Alerts Activated: "You'll receive trade alerts for [specific products]"
Team & Service Delivery
Jorge - Mexico Partnership Services
Service Queue: Partnership opportunity management
Supplier Vetting: 4-stage verification workflow
Market Entry: Consultation tracking system
Intelligence: RSS feed monitoring dashboard
Cristina - Trade Compliance Services
Certificate Generation: $200/cert, 32/40 monthly capacity
HS Classification: $150/code, 45/60 monthly capacity
Customs Clearance: $300/shipment, 22/30 monthly capacity
Crisis Response: $500/incident, 8/15 monthly capacity
Revenue Tracking
Current Monthly Revenue: $23,750
Capacity Utilization: Real-time tracking per service
Service Quality: Completion time and client satisfaction metrics
Development Standards
Code Quality Requirements
No Hardcoding: All business values must be configuration-driven
CSS Compliance: No inline styles, use existing classes only
Database Fallbacks: Sample data when tables empty
Error Handling: Friendly messages, no technical jargon
Performance: All APIs <400ms response time
Testing Requirements
Unit Tests: 75% coverage minimum
Integration Tests: All API endpoints
E2E Tests: Complete user workflows
Visual Testing: Mobile and desktop viewports
AI Agent Integration
Context Awareness: This PRD should be referenced in all Claude/Cursor sessions
Configuration-Driven: AI should never suggest hardcoded values
Workflow Understanding: AI should understand the 2-step → results → optional paths flow
Quality Standards: AI should maintain SLC standards, not MVP shortcuts
Version Control & Updates
This PRD is a living document. Every feature change, user feedback integration, or workflow modification should be reflected here immediately.

Update Triggers:

User workflow changes
New API endpoints
Pricing model adjustments
Service capacity changes
Team structure updates
AI Sync Process: When this PRD updates, sync to:

CLAUDE.md for technical context
Cursor rules for development sessions
Team dashboards for service delivery alignment
Success Metrics (v25.0.1)
User Engagement
Workflow Completion Rate: >80% (Step 1 → Results)
Certificate Conversion: >25% (Results → Certificate)
Alerts Signup: >40% (Results → Trade Alerts)
Technical Performance
API Response Time: <400ms average
Error Rate: <2% across all endpoints
Mobile Performance: 90+ Lighthouse score
Business Metrics
Service Revenue: $25,000+ monthly recurring
Capacity Utilization: >70% across all services
Client Satisfaction: >90% completion satisfaction
Remember: This is SLC v25.0.1 - every feature ships feeling complete and delightful, not "good enough." The platform should feel modern, fast, and professional from the very first interaction.

