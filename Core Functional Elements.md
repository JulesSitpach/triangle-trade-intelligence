Here are the common elements found in SaaS (Software as a Service) applications:

## Core Functional Elements

**User Authentication & Management**
- Sign up/login systems with email verification
- Password reset functionality
- Multi-factor authentication (MFA)
- Single sign-on (SSO) integration
- Role-based access control (RBAC)

**Dashboard & Analytics**
- Main dashboard with key metrics
- Data visualization (charts, graphs)
- Customizable widgets
- Real-time updates
- Export functionality

**Subscription & Billing**
- Multiple pricing tiers
- Payment processing integration
- Subscription management
- Invoice generation
- Usage tracking and metering

## User Interface Components

**Navigation**
- Top navigation bar or sidebar
- Search functionality
- Breadcrumbs
- Quick access menus

**Settings & Configuration**
- User profile settings
- Notification preferences
- Integration management
- API key management
- Team/workspace settings

**Onboarding**
- Welcome screens
- Product tours
- Tooltips and help documentation
- Sample data or templates

## Technical Infrastructure

**Data Management**
- Database integration
- File storage and management
- Data import/export
- Backup and recovery

**Security**
- Encryption (at rest and in transit)
- Audit logs
- Compliance certifications
- Data privacy controls

**Performance**
- Caching mechanisms
- Load balancing
- CDN integration
- API rate limiting

## Support & Communication

- Help center/documentation
- In-app chat or support tickets
- Email notifications
- Status page
- Feedback collection

I'll help you identify critical elements needed for your SaaS launch. Based on your comprehensive documentation, here are the **essential user-facing features that must work flawlessly** before launch:

## 🚨 Critical Pre-Launch Checklist

### **1. Authentication & User Management** ✅ (Appears Complete)
- User signup with 7-day trial
- Login/logout with cookie sessions
- Trial expiration enforcement
- Password reset functionality
- Session persistence across pages

**Test Required:**
- Sign up new user → Verify trial_ends_at set correctly
- Login → Verify dashboard access
- Trial expiration → Verify upgrade prompts appear
- Logout → Verify session cleared

---

### **2. USMCA Workflow (Core Product)** ⚠️ (Needs Validation)

**Step 1 - Company Information:**
- Form validation (all required fields)
- "+ New Analysis" button working
- Data saved to localStorage + database
- Proper error handling

**Step 2 - Component Origins:**
- Add/edit/delete components
- AI HS code suggestions (via OpenRouter)
- Component enrichment with tariff data
- Tier limit enforcement (Trial: 3 components, Starter: 10, etc.)
- Save to database with enrichment

**Results Display:**
- Show qualification status (QUALIFIED/NOT_QUALIFIED/PARTIAL)
- Display enriched component table (8 columns)
- Dual path: Certificate OR Alerts
- Proper savings calculations

**Critical Tests:**
```bash
# Test full workflow end-to-end
1. Trial user: 3 components max → upgrade prompt
2. Professional user: Unlimited components
3. AI enrichment: OpenRouter → Anthropic → Database fallback
4. Results: Proper qualification status
5. Dashboard: Workflow appears in history
```

---

### **3. Subscription & Payments** ⚠️ (Needs Testing)

**Stripe Integration:**
- `/pricing` page with 3 tiers
- Stripe checkout session creation
- Webhook handling (payment success)
- Subscription tier updates in database
- Service discounts applied automatically (15% Professional, 25% Premium)

**Critical Tests:**
```bash
# Test payment flow
1. Trial → Professional upgrade via Stripe
2. Webhook updates user_profiles.subscription_tier
3. User sees "Professional" in dashboard
4. Service prices show 15% discount
5. Component limit increases to 20 per workflow
```

---

### **4. User Dashboard** ⚠️ (Validate Data Display)

**Must Display Correctly:**
- User profile with correct subscription tier
- Workflow history with dropdown selector
- Trade alerts (if user opted in)
- "Start New Analysis" button
- Delete workflow/alert functionality

**Critical Tests:**
```bash
# Test dashboard data loading
1. Check /api/dashboard-data endpoint
2. Verify workflow_sessions query works
3. Test dropdown + preview card UX
4. Delete workflow → verify removal from DB
```

---

### **5. Component Enrichment (NEW - October 2025)** 🔥 **CRITICAL**

This is your competitive advantage - must work flawlessly:

**Automatic Enrichment:**
- HS code classification (OpenRouter → Anthropic → Database)
- Tariff rate lookup with destination-aware caching
- MFN vs USMCA rate comparison
- Savings calculation
- AI confidence scores
- Visual alerts (low confidence, Mexico opportunities)

**Critical Tests:**
```bash
# Test enrichment system
1. Add component "steel housing" → AI classifies as 7326.90.85
2. Check database: hs_code_classifications table populated
3. Tariff rates: 4-tier cache working (DB → OpenRouter → Anthropic → Fallback)
4. Destination-aware: US 24h cache, CA 90d cache, MX 60d cache
5. Component table: 8 columns display correctly
6. Low confidence: Visual alert appears
```

**Files to Verify:**
- `/api/ai-usmca-complete-analysis.js` - Lines 21-35, 799-894 (caching logic)
- `/api/classify-component.js` - HS code classification
- `components/workflow/ComponentOriginsStepEnhanced.js` - Enrichment display

---

### **6. Error Handling & User Feedback** ⚠️

**Must Have:**
- Loading states during AI calls (13-35 seconds)
- Error messages for failed API calls
- Toast notifications for success/failure
- DevIssue logging for admin (already implemented ✅)
- Graceful degradation (database fallback if AI fails)

**Critical Tests:**
```bash
# Test error scenarios
1. OpenRouter fails → Falls back to Anthropic
2. Both AI providers fail → Uses database (marked as stale)
3. Network timeout → User sees clear error message
4. Invalid HS code → Shows low confidence warning
5. Trial expired → Upgrade prompt appears
```

---

### **7. Professional Services (Revenue Generation)** ⚠️

**User Must Be Able To:**
- View services at `/services`
- See correct pricing (with subscriber discounts)
- Purchase via Stripe checkout
- Service request appears in admin dashboard

**Critical Tests:**
```bash
# Test service purchase flow
1. Professional user: See 15% discount on Supply Chain Optimization
2. Purchase $234 (down from $275)
3. Stripe webhook creates service_requests row
4. Admin sees request in broker-dashboard or jorge-dashboard
5. Subscriber data includes enriched components
```

---

## 🔧 **Pre-Launch Action Items**

### **High Priority (Must Fix Before Launch):**

1. **End-to-End Workflow Testing**
   ```bash
   # Run these tests manually
   npm run dev
   # Test as Trial user, Professional user, Premium user
   ```

2. **Payment Flow Validation**
   - Test Stripe checkout (use test mode)
   - Verify webhook updates subscription_tier
   - Confirm service discounts calculate correctly

3. **Component Enrichment Validation**
   - Test with 5-10 real components
   - Verify cache is working (check `ai_classifications` table)
   - Confirm destination-aware expiration

4. **Error Handling Audit**
   ```javascript
   // Use code-analyzer agent
   Task tool: {
     subagent_type: "code-analyzer",
     prompt: "Audit all user-facing API endpoints for proper error handling. Check /api/auth/*, /api/workflow-session, /api/ai-usmca-complete-analysis. Report missing try/catch blocks."
   }
   ```

5. **Mobile Responsiveness**
   - Test on iPhone, Android, iPad
   - Verify workflow forms are usable
   - Check component tables don't break layout

---

### **Medium Priority (Should Have):**

6. **Loading State Audit**
   - Every AI call needs loading spinner
   - Enrichment progress indicators
   - "Analyzing..." messages during 13-35s waits

7. **UX Refinements**
   - Clear upgrade prompts for trial users
   - Helpful tooltips for HS codes
   - Mexico-focus messaging throughout

8. **Admin Dashboard Testing**
   - Verify both dashboards see all 6 services
   - Test service workflow modals
   - Confirm enriched component tables display

---

### **Low Priority (Post-Launch):**

9. **Performance Optimization**
   - Implement Redis caching for sessions
   - Optimize database queries
   - Add CDN for static assets

10. **Analytics Setup**
    - Track workflow completion rate
    - Monitor AI classification accuracy
    - Measure trial → paid conversion

---

## 🚀 **Launch Readiness Commands**

Run these before launch:

```bash
# 1. Code quality checks
npm run lint
npm run css:check
npm run protection:full

# 2. Build for production
npm run build

# 3. Test production build locally
npm run start
# Visit http://localhost:3000 and test full workflow

# 4. Database validation
# Use Supabase MCP tool to check tables
mcp__supabase__execute_sql({
  project_id: "mrwitpgbcaxgnirqtavt",
  query: "SELECT COUNT(*) FROM user_profiles WHERE subscription_tier = 'Trial';"
})

# 5. Check API keys configured
# Verify .env.local has:
# - OPENROUTER_API_KEY
# - ANTHROPIC_API_KEY (fallback)
# - STRIPE_SECRET_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

---

## ❌ **What Can Wait Until After Launch**

These are important but NOT blockers:

- Admin classification verification UI (`/admin/classifications`)
- Advanced analytics dashboard
- Email notification system for alerts
- Multi-language support (Spanish)
- Advanced filtering in dashboards
- Bulk operations for admins
- Custom trade intelligence reports
- Quarterly strategy calls feature

---

## 📊 **Success Criteria for Launch**

Your app is ready when:

✅ **5 test users** can complete full workflow without errors  
✅ **Payment flow** works end-to-end (trial → paid upgrade)  
✅ **Component enrichment** succeeds >90% of the time  
✅ **All API endpoints** return proper errors (no 500s)  
✅ **Mobile layout** doesn't break  
✅ **Loading states** appear during AI calls  
✅ **Admin dashboards** can process service requests  

---

Would you like me to:
1. **Run automated tests** using the tester agent?
2. **Audit specific features** (enrichment, payments, auth)?
3. **Generate a launch checklist** with Playwright tests?
4. **Review database schema** for missing indexes?

Let me know which critical area you want to validate first!


 Alerts Page (trade-risk-alternatives.js):

  Purpose: Long-term strategic planning & monitoring
  Data Source: /api/get-crisis-alerts
  What it shows:
  - ALL active alerts (no severity filter)
  - Shows alerts affecting user's entire supply chain
  - Strategic, big-picture view
  - Helps with long-term planning
  - Shows alerts that might affect them in the future

  Query (line 24-29 of get-crisis-alerts.js):
  .from('crisis_alerts')
  .select('*')
  .eq('is_active', true)  // All active alerts
  .order('created_at', { ascending: false })
  .limit(50)  // Up to 50 alerts

  ---
  Results Page PolicyTimeline (PolicyTimeline.js):

  Purpose: Immediate threats to THIS specific workflow
  Data Source: Direct Supabase query in component
  What it shows:
  - ONLY CRITICAL/HIGH severity alerts
  - ONLY alerts matching user's components (HS codes)
  - Immediate, actionable threats
  - Focused on this specific product they just analyzed
  - "Act now" alerts for the current workflow

  Query (line 52-58 of PolicyTimeline.js):
  .from('crisis_alerts')
  .select('...')
  .eq('is_active', true)
  .in('severity_level', ['critical', 'high'])  // ⚠️ Only urgent ones
  .order('created_at', { ascending: false})
  .limit(50)