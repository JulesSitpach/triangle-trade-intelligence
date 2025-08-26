# Triangle Intelligence: USMCA Compliance Platform

## Overview
Triangle Intelligence is a focused USMCA compliance platform that provides businesses with essential tools for trade classification, qualification checking, tariff savings calculation, and certificate generation. Following strategic cleanup, the platform has been streamlined from a complex multi-stage system to a single-workflow approach focused on operational compliance needs.

## Core Architecture

### Platform Focus: USMCA Compliance + Regulatory Alerts
- **Primary Function**: HS code classification and USMCA origin qualification
- **Key Differentiator**: Regulatory alert system for compliance changes
- **Target Market**: B2B trade professionals and importers/exporters
- **Revenue Model**: SaaS pricing ($299-799/month) based on alert capabilities

## Technology Stack

### Framework & Runtime
- **Frontend**: Next.js 13.5.6 with React 18.2.0
- **Backend**: Next.js API routes with Node.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready configuration
- **Language Support**: i18next with EN/ES/FR translations

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.54.0",
  "next": "^13.5.6",
  "react": "^18.2.0",
  "i18next": "^25.3.4",
  "lucide-react": "^0.539.0"
}
```

## Build Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code quality check
npm run type-check   # TypeScript validation
```

### Testing
```bash
npm test             # Run Jest test suite
npm run test:watch   # Watch mode for tests
npm run test:coverage # Coverage report
npm run test:ci      # CI-friendly test run
```

## Core System Architecture

### 1. Single Workflow Approach
**File**: `pages/api/simple-usmca-compliance.js`
- Handles complete USMCA compliance workflow in one API call
- Actions: `classify_product`, `check_qualification`, `calculate_savings`, `generate_certificate`
- Eliminates multi-stage complexity while maintaining full functionality

### 2. Core Classification Engine
**File**: `lib/core/simple-usmca-classifier.js`
- `SimpleUSMCAClassifier` class with essential methods:
  - `classifyProduct()`: Product description → HS code classification  
  - `checkUSMCAQualification()`: USMCA rules of origin verification
  - `calculateSavings()`: MFN vs USMCA tariff comparison
  - `generateCertificateData()`: Official certificate form population

### 3. Intelligence APIs
**Directory**: `pages/api/intelligence/`
- `hs-codes.js`: Advanced HS code classification with Census Bureau data
- `routing.js`: Triangle routing analysis with tariff differentials
- `shipping.js`: Shipping cost and logistics calculations
- `tariffs.js`: Comprehensive tariff rate analysis

### 4. Essential UI Components
**Directory**: `components/`
- `TriangleLayout.js`: Main application layout
- `LanguageSwitcher.js`: Multi-language support (EN/ES/FR)
- `TriangleSideNav.js`: Navigation component
- `ErrorBoundary.js`: Error handling wrapper

## Database Schema (Essential Tables)

### USMCA Rules of Origin
```sql
usmca_rules (
    hs_code TEXT PRIMARY KEY,
    product_description TEXT,
    rule_type TEXT, -- 'percentage', 'tariff_shift', 'process'
    regional_content_percentage DECIMAL,
    tariff_shift_rule TEXT,
    specific_process_requirements TEXT,
    certification_required BOOLEAN
);
```

### Customer Alert System
```sql
customer_alerts (
    id UUID PRIMARY KEY,
    user_id UUID,
    alert_type TEXT, -- 'regulatory', 'product_specific', 'deadline', 'operational'
    hs_codes TEXT[], -- Customer's tracked products
    countries TEXT[], -- Customer's trade routes
    alert_priority TEXT, -- 'critical', 'high', 'medium', 'info'
    notification_preferences JSONB, -- email, sms, in-app
    created_at TIMESTAMP,
    is_active BOOLEAN
);

regulatory_updates (
    id UUID PRIMARY KEY,
    source TEXT, -- 'CBP', 'CBSA', 'SAT', 'USMCA_Committee'
    update_type TEXT, -- 'rule_interpretation', 'procedure_change', 'tariff_update'
    affected_hs_codes TEXT[],
    affected_countries TEXT[],
    effective_date DATE,
    update_content TEXT,
    severity TEXT, -- 'critical', 'high', 'medium', 'low'
    created_at TIMESTAMP
);
```

### Tariff Rates
```sql
tariff_rates (
    hs_code TEXT,
    country TEXT, -- US, CA, MX
    mfn_rate DECIMAL,
    usmca_rate DECIMAL,
    effective_date DATE,
    staging_category TEXT
);
```

### HS Code Master Database
```sql
hs_codes (
    hs_code TEXT PRIMARY KEY,
    description TEXT,
    chapter INTEGER,
    section TEXT,
    search_keywords TEXT[]
);
```

## API Endpoints

### Core USMCA Compliance API
**POST** `/api/simple-usmca-compliance`

**Actions**:
- `classify_product`: Product description → HS code
- `check_qualification`: USMCA rules of origin verification  
- `calculate_savings`: Tariff savings calculation
- `generate_certificate`: Certificate of Origin generation
- `complete_workflow`: End-to-end processing

**Request Format**:
```json
{
  "action": "complete_workflow",
  "data": {
    "company_name": "Example Corp",
    "business_type": "Electronics",
    "supplier_country": "CN", 
    "trade_volume": 1000000,
    "product_description": "Smartphone components",
    "component_origins": [
      {"origin_country": "CN", "value_percentage": 60},
      {"origin_country": "MX", "value_percentage": 40}
    ],
    "manufacturing_location": "MX"
  }
}
```

### Intelligence APIs
**POST** `/api/intelligence/hs-codes` - Advanced HS classification
**POST** `/api/intelligence/routing` - Triangle routing analysis
**POST** `/api/intelligence/shipping` - Shipping calculations
**POST** `/api/intelligence/tariffs` - Tariff analysis

### Support APIs
**POST** `/api/simple-classification` - Basic HS code mapping
**GET** `/api/simple-dropdown-options` - UI dropdown data
**POST** `/api/simple-savings` - Quick savings calculator
**GET** `/api/status` - System health check

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Next.js Configuration
**File**: `next.config.js`
- Configured for Vercel deployment
- Static export capabilities
- Asset optimization settings

### TypeScript Configuration
**File**: `tsconfig.json`
- Strict mode enabled for type safety
- JSX preserve for React components
- Path mapping for lib imports

## Strategic Business Model

### Revenue Streams
- **Professional**: $299/month - Basic compliance + regulatory alerts
- **Enterprise**: $799/month - Priority alerts + API access + compliance audit trail
- **Enterprise+**: Custom pricing - Dedicated monitoring + white-label options

### Value Proposition
1. **Risk Mitigation**: Avoid $25,000+ compliance penalties
2. **Audit Protection**: Documentation of regulatory awareness  
3. **Operational Efficiency**: Proactive regulatory updates
4. **Competitive Advantage**: Early awareness of rule changes

### Key Differentiators
- **Regulatory Alert System**: Real-time monitoring of CBP/CBSA/SAT feeds
- **Single Workflow**: Complete compliance process in minutes
- **Professional Integration**: Built for customs brokers and trade professionals
- **USMCA Expertise**: Deep knowledge of trilateral agreement rules

## Development Guidelines

### Code Organization
- **`lib/core/`**: Essential business logic and calculations
- **`pages/api/`**: API endpoints with clear, focused responsibilities
- **`components/`**: Reusable UI components with consistent patterns
- **`styles/`**: Organized CSS with component-specific styles

### Key Principles
1. **No Hardcoding**: All data dynamic, configurable through database
2. **Single Workflow**: Eliminate multi-stage complexity
3. **Professional Focus**: Build for trade professionals, not general consumers
4. **Authentic Data**: Use verified sources (Census Bureau, UN Comtrade)
5. **Compliance First**: Every calculation includes proper disclaimers

### Testing Strategy
- **Unit Tests**: Core business logic in `lib/core/`
- **API Tests**: Endpoint functionality and response formats
- **Integration Tests**: Database connectivity and data consistency
- **Error Handling**: Graceful degradation with professional fallback guidance

## Deployment & Operations

### Vercel Deployment
- **Config**: `vercel.json` configured for Next.js optimization
- **Environment**: Production environment variables managed through Vercel dashboard
- **Domains**: Support for custom domain configuration

### Database Management
- **Supabase**: Managed PostgreSQL with real-time capabilities
- **Migrations**: SQL schema files in `lib/database/`
- **Seeding**: Dynamic data population scripts in `scripts/`

### Monitoring & Logging
- **File**: `lib/production-logger.js` - Structured logging system
- **Performance**: Response time tracking for API endpoints
- **Errors**: Comprehensive error logging with stack traces
- **Business Metrics**: Classification accuracy and user workflow completion rates

## Success Metrics

### Operational Metrics
- Classification accuracy rate >95%
- Certificate acceptance rate by customs >98%
- Average workflow completion time <3 minutes
- API response time <500ms for core operations

### Business Metrics  
- Customer LTV >$15,000 (5x annual subscription cost)
- Net Revenue Retention >120%
- Partner referral conversion >25%
- Alert engagement rate >60%

## Strategic Roadmap

### Phase 1: Core Platform (Complete)
- HS code classification system
- USMCA rules of origin engine  
- Basic certificate generation
- Tariff savings calculator

### Phase 2: Regulatory Alerts (Current Focus)
- Real-time regulatory feed integration
- Customer alert subscription system
- Notification delivery (email/SMS/in-app)
- Alert management dashboard

### Phase 3: Professional Integration
- Partner commission tracking
- White-label options for customs brokers
- API access for enterprise clients
- Advanced compliance audit trails

### Phase 4: Market Expansion
- Additional trade agreements (CPTPP, EU-UK TCA)
- Multi-language regulatory content
- Regional compliance expertise
- Advanced analytics and reporting

## Important Notes for Future Development

### Data Authenticity Requirements
- All tariff calculations must include disclaimers
- Professional verification required for implementation
- No fabricated metrics or artificial confidence scores
- Census Bureau and UN Comtrade are primary data sources

### Compliance Focus
- Build for operational use by trade professionals
- Generate documents customs authorities accept
- Calculate savings customs will recognize
- Classifications that pass audit scrutiny

### Platform Positioning
- This is operational compliance software, not a lead generation tool
- Target customers are businesses with existing trade operations
- Value proposition is compliance accuracy and regulatory awareness
- Revenue model based on professional-grade alert capabilities

---

*Last Updated: Based on strategic cleanup and master plan analysis*
*Platform Status: Core functionality complete, regulatory alerts in development*
*Next Priority: Customer alert subscription system implementation*
- Rule 1: No Inline Styles

NEVER: style={{marginTop: '20px', color: 'red'}}
ALWAYS: Use CSS classes or styled components
USE: Tailwind classes, CSS modules, or external stylesheets
WHY: Maintainability, consistency, theme-ability
- Rule 2: No Hard Coding Values

NEVER: Hard-coded strings, numbers, URLs, or configuration
ALWAYS: Use constants, config files, or environment variables
CENTRALIZE: All business logic constants in config files
- Rule 3: Maximum Flexibility

DESIGN: Every component should accept props for customization
AVOID: Components that only work in one specific context
BUILD: Reusable, composable components
- Rule 4: No Over-Engineering

KEEP: Components under 150 lines
AVOID: Abstract factories, complex inheritance, meta-programming
PREFER: Simple, direct solutions over clever ones
ASK: "Is this the simplest thing that works?"
- Rule 5: Configuration Management
jsx// ✅ Create config files for all constants
// config/usmca-rules.js
export const USMCA_CONFIG = {
  COUNTRIES: ['US', 'CA', 'MX'],
  DEFAULT_TARIFF_RATES: {
    US: 0.15,
    CA: 0.12,
    MX: 0.10
  },
  CERTIFICATE_VALIDITY_DAYS: 365
};

// ✅ Use throughout application
import { USMCA_CONFIG } from '../config/usmca-rules';
- Rule 6: Styling Architecture
jsx// ✅ Use consistent class naming
<div className="usmca-form__container">
  <div className="usmca-form__field">
    <label className="usmca-form__label">
    <input className="usmca-form__input" />
  </div>
</div>

// ✅ Or use Tailwind with custom classes
<div className="form-container">
  <div className="form-field">
    <label className="form-label">
    <input className="form-input" />
  </div>
</div>
- Rule 7: Component Flexibility
jsx// ✅ Flexible, reusable components
function AlertCard({ 
  type = 'info', 
  title, 
  message, 
  action, 
  dismissible = true,
  className = '' 
}) {
  return (
    <div className={`alert alert--${type} ${className}`}>
      <h3 className="alert__title">{title}</h3>
      <p className="alert__message">{message}</p>
      {action && <div className="alert__action">{action}</div>}
      {dismissible && <button className="alert__dismiss">×</button>}
    </div>
  );
}
- Rule 8: API Design Principles
javascript// ✅ Flexible API endpoints
export default async function handler(req, res) {
  const {
    hsCode,
    originCountry,
    destinationCountry,
    format = 'json',
    language = 'en'
  } = req.query;

  // Flexible response format
  const result = await calculateUSMCACompliance({
    hsCode,
    originCountry,
    destinationCountry,
    options: { language }
  });

  if (format === 'pdf') {
    return res.pdf(result);
  }
  
  res.json(result);
}
- Rule 9: Don't Build These Things

No custom CSS frameworks (use Tailwind)
No complex state management (use React hooks)
No over-abstracted utilities (write direct code)
No "future-proofing" (build for current needs)
- Rule 10: Complexity Indicators (RED FLAGS)

Files over 200 lines
Functions with >5 parameters
Nested ternary operators
Magic numbers or strings
Components that do >1 thing
- Rule 11: Code Review Checklist

 No inline styles?
 No hard-coded values?
 Component accepts props for flexibility?
 Under 150 lines?
 Single responsibility?
 Can this be simpler?
- SUMMARY CHECKLIST
Before committing any code, verify:

 No inline styles used
 No hard-coded values
 Component is flexible and reusable
 Under complexity thresholds
 Follows naming conventions
 Self-documenting
 Performance conscious

Remember: Simple, flexible, maintainable code beats clever code every time.