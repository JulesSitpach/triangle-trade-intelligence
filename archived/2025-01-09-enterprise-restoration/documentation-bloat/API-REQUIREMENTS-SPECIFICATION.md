# 🔧 API REQUIREMENTS SPECIFICATION
*Expected Needs for Complete UI Workflow Support*

## **OVERVIEW**

This specification defines the exact API requirements needed to support the Triangle Intelligence UI workflow, ensuring seamless user experience from company information through certificate generation with real USMCA savings.

---

## **🎯 WORKFLOW API SEQUENCE & REQUIREMENTS**

### **Phase 1: Initial Data Loading**
```
User lands on /usmca-workflow
└── API calls triggered for dropdown population
```

### **Phase 2: Company Information Step**
```
User fills company form
└── Form validation and step progression
```

### **Phase 3: Product & Components Step**
```
User enters component details
└── HS code classification triggered
└── USMCA qualification analysis
```

### **Phase 4: Results & Certificate**
```
Complete workflow processing
└── Savings calculations
└── Certificate generation
```

---

## **📋 API-BY-API REQUIREMENTS**

### **1. `/api/database-driven-dropdown-options`**

#### **Purpose**: Populate all form dropdowns with real data
#### **Trigger**: Page load, form initialization

#### **Expected Input**:
```javascript
GET /api/database-driven-dropdown-options?category=all
```

#### **Required Output Structure**:
```javascript
{
  "success": true,
  "category": "all",
  "data": {
    // CRITICAL: Business types with USMCA thresholds
    "business_types": [
      {
        "value": "Automotive",
        "label": "Automotive", 
        "description": "USMCA threshold: 75%"
      },
      {
        "value": "Electronics",
        "label": "Electronics & Technology",
        "description": "USMCA threshold: 75%"
      }
      // ... more types
    ],
    
    // CRITICAL: Countries with USMCA member flags
    "countries": [
      {
        "value": "CN",
        "label": "China",
        "code": "CN", 
        "usmca_member": false
      },
      {
        "value": "MX",
        "label": "Mexico",
        "code": "MX",
        "usmca_member": true
      }
      // ... more countries
    ],
    
    // CRITICAL: Trade volumes with numeric values
    "trade_volumes": [
      {
        "value": "$1M - $5M",
        "label": "$1M - $5M",
        "numeric_value": 3000000,
        "description": "Annual trade volume: $1M - $5M"
      }
      // ... more volumes
    ]
  },
  "processing_time_ms": 286
}
```

#### **UI Dependencies**:
- Company form dropdowns become populated and enabled
- User can select business type, supplier country, trade volume
- Form validation can proceed to next step

#### **Failure Impact**: 
- Form dropdowns show "Loading..." indefinitely
- User cannot proceed past company information step

---

### **2. `/api/simple-hs-search`**

#### **Purpose**: Classify product description into HS codes using intelligent AI classification across all industries
#### **Trigger**: User completes component description with 100% total allocation

#### **Expected Input**:
```javascript
POST /api/simple-hs-search
{
  "searchTerm": "Electronic cables for telecommunications",
  "businessType": "Electronics & Technology",
  "business_type": "Electronics"
}
```

#### **Required Output Structure**:
```javascript
{
  "success": true,
  "results": [
    {
      // CRITICAL: Real HS code with proper formatting
      "hs_code": "8517.12.00",
      "hs_description": "Telephones for cellular networks or wireless",
      
      // CRITICAL: Real tariff rates (not 0% placeholders)
      "mfn_rate": 0,
      "usmca_rate": 0,
      "mfn_tariff_rate": 0,
      "usmca_tariff_rate": 0,
      
      // CRITICAL: Data source attribution
      "data_source": "USMCA_Official", // or "cbp_official"
      "match_type": "exact", // or "tier2_real_data"
      
      // CRITICAL: Business context
      "confidence": 0.95,
      "description": "Telephones for cellular networks or wireless",
      "savings_percent": 0
    }
    // ... more suggestions (up to 10)
  ],
  "total_matches": 10,
  "method": "direct_database_search"
}
```

#### **UI Dependencies**:
- HS code suggestions appear in component step
- User can select from classified options
- Confidence and data source displayed to user
- Next step becomes available

#### **Data Quality Requirements**:
- **MUST use 3-tier cascade**: usmca_tariff_rates → tariff_rates → hs_master_rebuild
- **MUST prioritize real data**: Filter out 0% placeholder rates when possible
- **MUST attribute data source**: Clear indication of data tier/quality
- **MUST provide confidence**: Business-friendly confidence levels

#### **Failure Impact**:
- No HS code suggestions appear
- User cannot proceed to qualification step
- Workflow breaks at component classification

---

### **3. `/api/simple-usmca-compliance`**

#### **Purpose**: Check USMCA qualification for selected HS code using cascaded service
#### **Trigger**: User selects HS code and clicks "Process USMCA Compliance"

#### **Expected Input**:
```javascript
POST /api/simple-usmca-compliance
{
  "action": "check_qualification",
  "data": {
    "hs_code": "8517120000", 
    "component_origins": ["Mexico", "Canada"],
    "manufacturing_location": "Mexico"
  }
}
```

#### **Required Output Structure**:
```javascript
{
  "success": true,
  "qualification": {
    // CRITICAL: Clear qualification status
    "qualified": true,
    "reason": "Product qualifies for USMCA preferential rate of 0% vs MFN rate of 18.8%",
    "rule_applied": "Chapter 85 regional content rule",
    
    // CRITICAL: Documentation requirements
    "documentation_required": [
      "Certificate of Origin",
      "Production records", 
      "Component origin documentation"
    ],
    
    // CRITICAL: Regional content threshold
    "regional_content_threshold": 75,
    
    // CRITICAL: Tariff data with cascade attribution
    "tariff_data": {
      "hs_code": "8517120000",
      "mfn_rate": 18.8,
      "usmca_rate": 0
    },
    
    // CRITICAL: Data quality indicators
    "data_source": "usmca_official", // or "cbp_official", "coverage_fallback" 
    "data_quality": "real_data", // or "placeholder"
    "tier": 1 // or 2, 3
  },
  "hsCode": {
    "original": "8517120000",
    "normalized": "8517120000",
    "validation": {
      "valid": true,
      "specificity": "statistical_suffix"
    }
  },
  "next_step": "calculate_savings" // or "review_requirements"
}
```

#### **UI Dependencies**:
- Qualification status displayed prominently
- USMCA eligibility clearly indicated
- Documentation requirements listed
- Savings calculation can proceed

#### **Business Logic Requirements**:
- **MUST use cascaded tariff service**: Access all 3 data tiers
- **MUST calculate regional content**: Based on component origins
- **MUST provide clear guidance**: Next steps for user
- **MUST indicate data quality**: User understands data reliability

#### **Failure Impact**:
- User cannot determine USMCA eligibility
- No guidance on required documentation
- Savings calculation cannot proceed

---

### **4. `/api/simple-savings`**

#### **Purpose**: Calculate annual USMCA savings using real tariff data
#### **Trigger**: Qualified products proceed to savings calculation

#### **Expected Input**:
```javascript
POST /api/simple-savings
{
  "hs_code": "8517120000",
  "import_volume": 3000000, // from trade volume selection
  "supplier_country": "China"
}
```

#### **Required Output Structure**:
```javascript
{
  "success": true,
  "savings": {
    // CRITICAL: Meaningful dollar amounts (6-figure for large volumes)
    "annual_savings": 158400,
    "monthly_savings": 13200,
    
    // CRITICAL: Real tariff rates from cascade
    "mfn_rate": 18.8, // China → US direct
    "usmca_rate": 0,   // China → Mexico → US
    "savings_percentage": 84.1,
    
    // CRITICAL: Business context
    "import_volume": 3000000,
    "supplier_country": "China",
    "destination_country": "US",
    
    // CRITICAL: Triangle routing details
    "triangle_routing": {
      "route": "China → Mexico → US",
      "processing_costs": 30000,
      "net_savings": 128400,
      "implementation_complexity": "Medium",
      "estimated_timeline": "12-18 months"
    },
    
    // CRITICAL: Data source attribution
    "data_source": "usmca_official",
    "data_quality": "real_data", 
    "calculation_basis": "government_rates"
  },
  "disclaimer": "Professional verification recommended for implementation",
  "processing_time_ms": 234
}
```

#### **UI Dependencies**:
- Annual savings prominently displayed
- Triangle routing recommendations shown
- Implementation guidance provided
- Certificate generation enabled

#### **Calculation Requirements**:
- **MUST use real tariff rates**: From cascaded service, not placeholders
- **MUST calculate triangle routing**: Mexico processing route
- **MUST show net savings**: After processing costs
- **MUST provide implementation guidance**: Timeline and complexity

#### **Failure Impact**:
- No savings calculations available
- User cannot see business value
- Certificate generation may fail

---

### **5. `/api/trust/complete-certificate`**

#### **Purpose**: Generate professional PDF certificate with workflow results
#### **Trigger**: User requests certificate download

#### **Expected Input**:
```javascript
POST /api/trust/complete-certificate
{
  "workflow_results": {
    "company": {
      "name": "Tech Cable Import Corp",
      "business_type": "Electronics"
    },
    "product": {
      "description": "Electronic cables for telecommunications",
      "hs_code": "8517120000",
      "classification_confidence": 95
    },
    "usmca": {
      "qualified": true,
      "savings": 158400,
      "data_source": "usmca_official"
    }
  }
}
```

#### **Required Output Structure**:
```javascript
{
  "success": true,
  "certificate": {
    // CRITICAL: Certificate metadata
    "certificate_id": "TI-2025010812-A7B9C2",
    "generated_date": "2025-01-08T12:30:45Z",
    
    // CRITICAL: Company information
    "company_info": {
      "name": "Tech Cable Import Corp",
      "business_type": "Electronics & Technology"
    },
    
    // CRITICAL: Product classification
    "product_classification": {
      "description": "Electronic cables for telecommunications", 
      "hs_code": "8517.12.00",
      "confidence_level": "High Confidence (95%)"
    },
    
    // CRITICAL: USMCA analysis
    "usmca_analysis": {
      "qualification_status": "QUALIFIED",
      "annual_savings": "$158,400",
      "tariff_reduction": "84.1%",
      "data_source": "USMCA Official Database"
    },
    
    // CRITICAL: Professional validation
    "professional_notes": {
      "data_quality": "Government-sourced tariff rates",
      "verification_status": "Professional review recommended",
      "compliance_note": "Certificate based on AI analysis - verify with customs professional"
    }
  },
  
  // CRITICAL: PDF download capability
  "pdf_download": {
    "available": true,
    "download_url": "/download/certificate/TI-2025010812-A7B9C2.pdf",
    "file_size_kb": 245
  },
  
  "processing_time_ms": 1230
}
```

#### **UI Dependencies**:
- Certificate summary displayed
- PDF download button enabled
- Professional disclaimer shown
- Workflow completion indicated

#### **Content Requirements**:
- **MUST include all workflow results**: Company, product, USMCA analysis
- **MUST show data sources**: Government database attribution
- **MUST provide professional disclaimers**: AI analysis limitations
- **MUST generate downloadable PDF**: Formatted certificate

#### **Failure Impact**:
- User cannot obtain certificate
- No audit trail of analysis
- Workflow feels incomplete

---

## **🔄 API INTEGRATION PATTERNS**

### **Sequential Dependency Chain**:
```
Dropdown Options → Company Form → Classification → Compliance → Savings → Certificate
      ↓                ↓              ↓             ↓           ↓            ↓
 Form populated → Validation → HS Codes → Qualification → $ Amounts → PDF Ready
```

### **Data Flow Requirements**:
```javascript
// Each API must pass context to next step
const workflowContext = {
  company: dropdownOptions.selections,
  classification: classificationAPI.results,
  qualification: complianceAPI.qualification,
  savings: savingsAPI.calculations,
  certificate: certificateAPI.metadata
};
```

### **Error Handling Chain**:
- **Dropdown Failure**: Block form progression
- **Classification Failure**: Show manual HS code entry
- **Compliance Failure**: Show "unable to determine" status  
- **Savings Failure**: Show "calculation unavailable"
- **Certificate Failure**: Show "download unavailable"

---

## **📊 PERFORMANCE REQUIREMENTS**

### **Response Time Targets**:
- **Dropdown Options**: <500ms (critical for page load)
- **Classification**: <1000ms (user waits during typing)
- **Compliance**: <800ms (immediate feedback needed)
- **Savings**: <600ms (quick calculation expected)
- **Certificate**: <2000ms (acceptable for PDF generation)

### **Data Quality Standards**:
- **Real Data Usage**: >80% of results from Tier 1/Tier 2
- **Placeholder Rate**: <20% fallback to Tier 3
- **Accuracy Target**: 95% confidence for suggestions
- **Source Attribution**: 100% of results show data source

### **Reliability Requirements**:
- **Uptime**: 99.9% availability during business hours
- **Error Rate**: <1% failed API calls
- **Fallback Behavior**: Graceful degradation if data unavailable
- **User Feedback**: Clear error messages for failures

---

## **🛡️ VALIDATION & TESTING**

### **API Health Check**:
```bash
# Test complete API chain
curl -X GET http://localhost:3000/api/database-driven-dropdown-options?category=all
curl -X POST http://localhost:3000/api/simple-hs-search -d '{"searchTerm":"steel pipes","businessType":"Machinery & Equipment"}'
curl -X POST http://localhost:3000/api/simple-usmca-compliance -d '{"action":"check_qualification","data":{"hs_code":"7208510000"}}'
curl -X POST http://localhost:3000/api/simple-savings -d '{"hs_code":"7208510000","import_volume":3000000}'
```

### **Data Quality Validation**:
```javascript
// Each API response should include
const requiredDataQuality = {
  data_source: ["USMCA_Official", "cbp_official", "government_real_data"],
  data_quality: ["real_data", "substantial_data"], // NOT "placeholder"
  tier: [1, 2], // Tier 3 acceptable but should be <20%
  confidence: ">= 75%" // Business-acceptable confidence
};
```

### **Business Value Validation**:
```javascript
// Savings calculations must show
const businessValueIndicators = {
  annual_savings: ">= $50000", // Meaningful amounts
  savings_percentage: ">= 50%", // Substantial savings
  implementation_guidance: "present", // Actionable next steps
  professional_disclaimers: "present" // Appropriate caveats
};
```

---

## **🚨 CRITICAL SUCCESS FACTORS**

### **Must-Have API Behaviors**:
1. **Real Data Priority**: APIs must use 3-tier cascade, not default to placeholders
2. **Source Attribution**: Every result must show government data source
3. **Business Context**: Results must be relevant to user's industry/volume
4. **Error Recovery**: Graceful failure with clear user guidance
5. **Professional Quality**: Results suitable for business decision-making

### **User Experience Dependencies**:
- **Progressive Disclosure**: Information revealed as user completes steps
- **Validation Gates**: Prevent premature actions (like HS classification)
- **Clear Feedback**: Loading states, error messages, success indicators
- **Data Quality Indicators**: User understands reliability of information

### **Business Credibility Requirements**:
- **Government Sources**: CBP, CBSA, SAT data attribution
- **Professional Disclaimers**: AI analysis limitations clearly stated
- **Audit Trail**: Certificate provides documentation of analysis
- **Implementation Guidance**: Clear next steps for users

---

*These API requirements ensure the UI delivers a complete, professional USMCA compliance workflow with real business value and appropriate professional disclaimers.*