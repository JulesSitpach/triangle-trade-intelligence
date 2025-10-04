# Page Cleanup Plan - Remove Confusing SMB Pages

**Current:** 24 pages
**Goal:** Keep only essential SMB pages

---

## ✅ KEEP - Essential SMB Pages (6)

1. **index.js** - Homepage
2. **usmca-workflow.js** - "Check if I qualify"
3. **usmca-certificate-completion.js** - "Get certificate"
4. **services.js** - "Get help" (professional services)
5. **pricing.js** - Pricing plans
6. **dashboard.js** - User dashboard after login

---

## ✅ KEEP - Auth Pages (4)

7. **login.js** - User login
8. **signup.js** - User registration
9. **profile.js** - Account settings
10. **my-services.js** - View purchased services

---

## ✅ KEEP - Legal Pages (3)

11. **privacy-policy.js** - Privacy policy
12. **terms-of-service.js** - Terms of service
13. **contact.js** - Contact form/info

---

## ✅ KEEP - System Pages (5)

14. **_app.js** - Next.js app wrapper (required)
15. **_error.js** - Error handling (required)
16. **404.js** - Not found page
17. **500.js** - Server error page
18. **sitemap.xml.js** - SEO sitemap

---

## ✅ KEEP - Trade Features (1)

19. **trade-risk-alternatives.js** - Trade risk alerts and alternatives (from workflow results)

---

## ❌ DELETE - Confusing/Redundant Pages (5)

### 1. **supplier-capability-assessment.js** ❌
**Why delete:** Sounds enterprise-y, confuses SMBs
**What it does:** Assesses supplier capabilities
**Alternative:** This should be part of supplier-sourcing service (Jorge's work)
**Action:** DELETE

### 2. **sales-presentations.js** ❌
**Why delete:** Internal use, not for SMB customers
**What it does:** Sales team presentations
**Alternative:** Keep as internal tool, not public page
**Action:** DELETE

### 3. **system-status.js** ❌
**Why delete:** SMBs don't need to check system status
**What it does:** Shows if platform is up/down
**Alternative:** Use third-party status page if needed (status.triangleintelligence.com)
**Action:** DELETE

### 4. **simple-certificate.js** ❌
**Why delete:** Redundant with usmca-certificate-completion.js
**What it does:** Simple certificate view
**Alternative:** Use usmca-certificate-completion.js for all certificate needs
**Action:** DELETE

### 5. **certificates.js** ❌
**Why delete:** Confusing plural, SMBs wonder "how many certificates?"
**What it does:** Lists user's certificates
**Alternative:** Show certificates in dashboard or my-services
**Action:** DELETE

---

## Summary

**BEFORE:** 24 pages (confusing)
**AFTER:** 19 pages (clear)

**Pages remaining:**
- 6 essential SMB pages
- 4 auth pages
- 3 legal pages
- 5 system pages
- 1 trade feature page

**Total: 19 pages** (20% reduction)

**SMB sees:**
- Homepage
- USMCA Workflow
- Services
- Pricing
- Dashboard
- My Services
- Contact

**That's the core SMB journey. Everything else is support infrastructure.**
