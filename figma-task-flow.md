# Triangle Intelligence Platform - Figma Task Flow

## Project Overview
**Triangle Intelligence Platform** - Professional USMCA compliance and certificate generation platform with hybrid SaaS + expert services model.

---

## 🎯 Primary User Journeys

### **Journey 1: New User Onboarding & Certificate Creation**

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LANDING PAGE (/)                            │
│  • Value proposition: Self-service + Expert backup                  │
│  • Three subscription tiers visible                                  │
│  • CTA: "Start Free Trial" or "View Pricing"                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    Decision Point       │
                    │  New or Existing User?  │
                    └─────────────────────────┘
                              │       │
                    ┌─────────┘       └─────────┐
                    ▼                             ▼
        ┌───────────────────────┐     ┌───────────────────────┐
        │   SIGNUP (/signup)    │     │   LOGIN (/login)      │
        │  • Email + Password   │     │  • Email + Password   │
        │  • Plan Selection     │     │  • Forgot Password    │
        │  • 14-day Trial       │     └───────────────────────┘
        └───────────────────────┘                 │
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │   DASHBOARD (/dashboard)     │
                    │  • Certificate Overview      │
                    │  • Quick Actions             │
                    │  • Service Recommendations   │
                    │  • Usage Statistics          │
                    └──────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Start USMCA Analysis         │
                    │ CTA: "Create Certificate"    │
                    └──────────────────────────────┘
```

---

### **Journey 2: USMCA Certificate Workflow (Core Feature)**

```
┌─────────────────────────────────────────────────────────────────────┐
│            USMCA WORKFLOW (/usmca-workflow) - Multi-Step            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃         STEP 1: COMPANY INFORMATION           ┃
        ┃  • Company Name, Address, Tax ID              ┃
        ┃  • Auto-populated from localStorage/profile   ┃
        ┃  • Import/Export role selection               ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃    STEP 2: PRODUCT & COMPONENT ANALYSIS       ┃
        ┃  • Product description                        ┃
        ┃  • Component breakdown                        ┃
        ┃  • AI-enhanced HS classification              ┃
        ┃  • Web search verification                    ┃
        ┃  • Origin tracking for each component         ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃      STEP 3: USMCA QUALIFICATION RESULTS      ┃
        ┃  • Pass/Fail determination                    ┃
        ┃  • Qualification criteria breakdown           ┃
        ┃  • Regional Value Content (RVC) calculation   ┃
        ┃  • Rule of Origin assessment                  ┃
        ┃  • Basic certificate preview/generation       ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        ┌───────────────────────┐   ┌───────────────────────────┐
        │   SELF-SERVICE PATH   │   │   PROFESSIONAL UPGRADE    │
        │  • Generate Basic     │   │  • Expert-completed cert  │
        │    Certificate        │   │  • $250/certificate       │
        │  • Download PDF       │   │  • Same-day delivery      │
        │  • Save for later     │   │  • Quality guarantee      │
        └───────────────────────┘   └───────────────────────────┘
                    │                           │
                    │                           ▼
                    │           ┌──────────────────────────────────┐
                    │           │ CERTIFICATE COMPLETION           │
                    │           │ (/usmca-certificate-completion)  │
                    │           │  • Pre-populated from workflow   │
                    │           │  • Additional verification       │
                    │           │  • Payment processing            │
                    │           │  • Expert assignment             │
                    │           └──────────────────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌──────────────────────────────┐
                    │   CERTIFICATE DELIVERED      │
                    │  • Download final document   │
                    │  • Save to account history   │
                    │  • Share/Export options      │
                    └──────────────────────────────┘
```

---

### **Journey 3: Expert Services Discovery & Purchase**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE DISCOVERY                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
        ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
        │   Via Dashboard │ │ Via Pricing │ │ Via Risk Alert  │
        │   Quick Actions │ │    Page     │ │ in Workflow     │
        └─────────────────┘ └─────────────┘ └─────────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                    ┌──────────────────────────────┐
                    │   SERVICES PAGE (/services)  │
                    │  • Cristina's Compliance     │
                    │  • Jorge's Mexico Services   │
                    │  • Service cards with prices │
                    │  • Clear CTAs                │
                    └──────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Select Service Type   │
                    └─────────────────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
┌────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ COMPLIANCE SERVICES│ │ HS CLASSIFICATION│ │  MEXICO SERVICES     │
│  • USMCA Cert      │ │  • Product Class │ │  • Supplier Sourcing │
│  • Crisis Response │ │  • Tariff Opt    │ │  • Mfg Feasibility   │
│  • Custom Support  │ │  • Audit Defense │ │  • Market Entry      │
└────────────────────┘ └──────────────────┘ └──────────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  ▼
                    ┌──────────────────────────────┐
                    │   SERVICE INTAKE FORM        │
                    │  • Auto-populated user data  │
                    │  • Specific requirements     │
                    │  • File uploads              │
                    │  • Timeline selection        │
                    └──────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   PAYMENT & CONFIRMATION     │
                    │  • Service summary           │
                    │  • Pricing breakdown         │
                    │  • Payment processing        │
                    │  • Expert assignment         │
                    └──────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   SERVICE TRACKING           │
                    │  • Status updates            │
                    │  • Expert communication      │
                    │  • Deliverable preview       │
                    │  • Final delivery            │
                    └──────────────────────────────┘
```

---

### **Journey 4: Intelligence & Research Features**

```
┌─────────────────────────────────────────────────────────────────────┐
│              INTELLIGENCE PAGE (/intelligence)                       │
│  • Trade news monitoring                                            │
│  • Crisis alerts                                                     │
│  • Market intelligence                                               │
│  • Supplier research tools                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
        ┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
        │  Trade Alerts   │ │   Supplier  │ │  Market Reports  │
        │  • Tariff news  │ │   Vetting   │ │  • Industry data │
        │  • Policy chgs  │ │   Tools     │ │  • Trend analysis│
        │  • Crisis feed  │ │             │ │  • Entry guides  │
        └─────────────────┘ └─────────────┘ └──────────────────┘
                    │             │             │
                    │             ▼             │
                    │   ┌─────────────────────┐ │
                    │   │ SUPPLIER CAPABILITY │ │
                    │   │    ASSESSMENT       │ │
                    │   │ • Assessment tool   │ │
                    │   │ • Scoring system    │ │
                    │   │ • Reports           │ │
                    │   └─────────────────────┘ │
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                    ┌──────────────────────────────┐
                    │   ACTIONABLE INTELLIGENCE    │
                    │  • Upgrade to expert service │
                    │  • Save research             │
                    │  • Generate reports          │
                    └──────────────────────────────┘
```

---

### **Journey 5: Subscription Management**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRICING PAGE (/pricing)                           │
│  • Starter: $99/mo - Templates & basic workflow                     │
│  • Professional: $299/mo - Certificate wizard                       │
│  • Business: $599/mo - Full wizard + 2 free expert certs           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Plan Selection        │
                    │  • Compare features     │
                    │  • Calculate savings    │
                    │  • Start trial          │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   CHECKOUT PROCESS           │
                    │  • Billing information       │
                    │  • Payment method            │
                    │  • Trial confirmation        │
                    └──────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   ACCOUNT DASHBOARD          │
                    │  • Subscription status       │
                    │  • Usage tracking            │
                    │  • Upgrade/Downgrade         │
                    │  • Billing history           │
                    └──────────────────────────────┘
```

---

## 🎨 Key UI Components & Interactions

### **Navigation Structure**
```
┌─────────────────────────────────────────────────────────────┐
│                     TOP NAVIGATION BAR                       │
│  Logo | Dashboard | Certificates | Services | Intelligence  │
│       | Pricing | Account | Logout                          │
└─────────────────────────────────────────────────────────────┘
```

### **Dashboard Layout**
```
┌──────────────────────────────────────────────────────────────┐
│  Welcome Back, [User Name]                    [Profile Icon] │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Certificates   │  │  Active Orders │  │  Quick Actions │ │
│  │  Created: 12   │  │  In Progress:3 │  │  [New Cert]   │ │
│  │  This Month    │  │  Completed: 8  │  │  [Get Service]│ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Recent Certificates                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Certificate #001 | Product X | Created: Jan 15 | [View]│ │
│  │ Certificate #002 | Product Y | Created: Jan 10 | [View]│ │
│  └────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Service Recommendations                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔍 Consider HS Classification for accurate tariffs     │ │
│  │ 🏭 Explore Mexico Manufacturing Services               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### **USMCA Workflow Progress Indicator**
```
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Company Info → Step 2: Product → Step 3: Results   │
│    ✓ Complete          ✓ Complete       ⏳ In Progress      │
└──────────────────────────────────────────────────────────────┘
```

### **Service Cards (Services Page)**
```
┌─────────────────────────────────────────┐
│  📜 USMCA Certificate Completion        │
│  Expert-completed certificate           │
│  Same-day delivery | Quality guarantee  │
│                                         │
│  $250 per certificate                   │
│  [Request Service]                      │
└─────────────────────────────────────────┘
```

---

## 🔄 Key Conversion Points

### **1. Trial to Paid Conversion**
- **Trigger**: End of 14-day trial
- **Location**: Dashboard banner, email notifications
- **CTA**: "Upgrade Now - Continue Your Success"

### **2. Self-Service to Expert Upgrade**
- **Trigger**: Complex product analysis, risk alerts
- **Location**: Within USMCA workflow Step 3
- **CTA**: "Get Expert Help - $250"

### **3. Certificate to Full Service**
- **Trigger**: Multiple certificates created, high-risk products
- **Location**: Post-certificate completion
- **CTA**: "Explore Mexico Services - Start Sourcing"

### **4. Dashboard to Services**
- **Trigger**: Service recommendations based on activity
- **Location**: Dashboard service cards
- **CTA**: "Learn More" → Services page

---

## 📱 Mobile Considerations

### **Responsive Breakpoints**
- **Desktop**: 1920px, 1440px, 1024px
- **Tablet**: 768px
- **Mobile**: 375px, 390px (iPhone), 360px (Android)

### **Mobile-First Features**
- Simplified navigation (hamburger menu)
- Stacked service cards
- Single-column workflow steps
- Touch-optimized buttons (44px minimum)
- Simplified tables with expandable rows

---

## 🎯 Success Metrics to Track in UI

1. **Workflow Completion Rate**
   - Display progress bars
   - Save progress indicators
   - Time-to-complete estimates

2. **Service Discovery**
   - Service card click-through
   - CTA engagement rates
   - Upgrade conversion points

3. **User Engagement**
   - Dashboard visits
   - Certificate creation frequency
   - Service purchase rate

---

## 🚀 Implementation Priority (SLC v25.0.1)

### **Phase 1: Core Flows (MUST HAVE)**
✅ Landing → Signup → Dashboard
✅ USMCA Workflow (3 steps)
✅ Self-service certificate generation
✅ Professional certificate upgrade path

### **Phase 2: Service Integration (SHOULD HAVE)**
✅ Services page with pricing
✅ Service intake forms
✅ Payment processing
✅ Expert assignment workflow

### **Phase 3: Intelligence Features (NICE TO HAVE)**
🔲 Trade alerts dashboard
🔲 Supplier vetting tools
🔲 Market intelligence reports

---

## 📐 Design System Elements

### **Color Palette**
- **Primary**: Blue (#0066CC) - Trust, reliability
- **Secondary**: Green (#00A651) - Growth, compliance
- **Alert**: Orange (#FF9500) - Warnings, attention
- **Error**: Red (#DC3545) - Critical issues
- **Success**: Green (#28A745) - Completed actions

### **Typography**
- **Headings**: Inter Bold (H1: 32px, H2: 24px, H3: 20px)
- **Body**: Inter Regular (16px)
- **Small**: Inter Regular (14px)
- **Labels**: Inter Medium (12px)

### **Spacing System**
- Base unit: 8px
- Common spacing: 8px, 16px, 24px, 32px, 48px

---

## 🔗 Key Page Routes

| Route | Purpose | Priority |
|-------|---------|----------|
| `/` | Landing page | High |
| `/signup` | User registration | High |
| `/login` | User authentication | High |
| `/dashboard` | User home | High |
| `/usmca-workflow` | Certificate creation | High |
| `/usmca-certificate-completion` | Expert upgrade | High |
| `/services` | Service catalog | Medium |
| `/pricing` | Plan comparison | Medium |
| `/intelligence` | Trade intelligence | Medium |
| `/supplier-capability-assessment` | Supplier vetting | Low |
| `/admin` | Admin management | Low |

---

## 🎭 User Personas for Flow Testing

### **Persona 1: First-Time User (Sarah)**
- Small business owner, first USMCA certificate
- Needs: Clear guidance, confidence in self-service
- Path: Landing → Trial signup → Dashboard → Workflow → Self-service cert

### **Persona 2: Experienced User (Mike)**
- Regular user, multiple certificates
- Needs: Fast workflow, expert backup for complex cases
- Path: Login → Dashboard → Quick action → Workflow → Expert upgrade

### **Persona 3: Service Buyer (Jennifer)**
- Trade compliance manager, values expertise
- Needs: Professional services, crisis support
- Path: Landing → Services → Mexico sourcing → Intake → Payment

---

This Figma task flow document provides a comprehensive view of all user journeys, interactions, and design considerations for the Triangle Intelligence Platform. Use this as your source of truth when creating wireframes, prototypes, and final designs in Figma.
