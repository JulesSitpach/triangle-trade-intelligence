# API Response Formats - ACTUAL CURRENT STRUCTURE

**This document contains the REAL API response formats currently implemented.**
**Use this instead of outdated documentation for testing and integration.**

## Core Classification API

### `/api/simple-classification` (POST)

**Request:**
```json
{
  "product_description": "automotive electrical wire harness",
  "business_type": "manufacturing"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "hs_code": "8544429000",
      "description": "Other electric conductors, for a voltage not exceeding 1000V, fitted with connectors",
      "product_description": "Other electric conductors, for a voltage not exceeding 1000V, fitted with connectors",
      "mfn_tariff_rate": 6.8,
      "usmca_tariff_rate": 0,
      "savings_percent": 6.8,
      "confidence": 0.85,
      "matchedTerm": "exact",
      "business_context_applied": true,
      "chapter": 85,
      "country_source": "US"
    }
  ],
  "total_matches": 5,
  "method": "direct_database_search"
}
```

## USMCA Compliance API

### `/api/simple-usmca-compliance` (POST)

#### Action: check_qualification

**Request:**
```json
{
  "action": "check_qualification",
  "data": {
    "hs_code": "8544429000",
    "component_origins": "Mexico,Canada",
    "manufacturing_location": "Mexico"
  }
}
```

**Response:**
```json
{
  "success": true,
  "qualification": {
    "qualified": true,
    "reason": "Product meets USMCA regional content requirements with Mexico manufacturing and North American component origins",
    "rule_applied": "Chapter 85 - Electrical Machinery",
    "documentation_required": [
      "Certificate of Origin",
      "Manufacturing Declaration",
      "Component Origin Documentation"
    ],
    "regional_content_percentage": 75
  }
}
```

#### Action: calculate_savings

**Request:**
```json
{
  "action": "calculate_savings",
  "data": {
    "hs_code": "8544429000",
    "annual_import_value": 500000,
    "supplier_country": "China"
  }
}
```

**Response:**
```json
{
  "success": true,
  "savings": {
    "annual_savings": 34000,
    "monthly_savings": 2833.33,
    "savings_percentage": 6.8,
    "mfn_rate": 6.8,
    "usmca_rate": 0,
    "annual_import_value": 500000
  }
}
```

#### Action: generate_certificate

**Request:**
```json
{
  "action": "generate_certificate",
  "data": {
    "companyName": "Test Manufacturing Corp",
    "hsCode": "8544429000",
    "productDescription": "electrical wire harness",
    "manufacturingLocation": "Mexico",
    "componentOrigins": "Mexico,Canada",
    "qualified": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "certificateId": "USMCA-20250905-ABC123",
    "usmcaQualified": true,
    "regionalContent": 75,
    "companyName": "Test Manufacturing Corp",
    "productDescription": "electrical wire harness",
    "hsCode": "8544429000",
    "manufacturingLocation": "Mexico",
    "componentOrigins": "Mexico,Canada",
    "generatedDate": "2025-09-05T16:45:23.456Z"
  }
}
```

## Admin APIs

### `/api/admin/users` (GET)

**Response:**
```json
{
  "users": [
    {
      "id": "user123",
      "email": "user@example.com",
      "name": "Test User",
      "subscription": "Professional",
      "lastActivity": "2025-09-05T10:30:00Z"
    }
  ],
  "summary": {
    "totalUsers": 45,
    "activeUsers": 23,
    "subscriptionBreakdown": {
      "Professional": 30,
      "Enterprise": 15
    }
  }
}
```

### `/api/admin/suppliers` (GET)

**Response:**
```json
{
  "suppliers": [
    {
      "id": "sup123",
      "name": "Mexico Manufacturing Co",
      "country": "Mexico",
      "riskScore": 2.1,
      "lastAudit": "2025-08-15T00:00:00Z"
    }
  ],
  "summary": {
    "totalSuppliers": 156,
    "averageRiskScore": 2.3,
    "countryBreakdown": {
      "Mexico": 45,
      "Canada": 23,
      "China": 88
    }
  }
}
```

### `/api/admin/rss-feeds` (GET)

**Response:**
```json
{
  "rss_feeds": [
    {
      "id": "feed123",
      "name": "Trump Tariff Updates",
      "url": "https://example.com/rss",
      "status": "active",
      "lastCheck": "2025-09-05T16:00:00Z",
      "itemCount": 45
    }
  ],
  "summary": {
    "totalFeeds": 12,
    "activeFeeds": 9,
    "totalItems": 234
  }
}
```

## Error Response Format

**All APIs return errors in this format:**
```json
{
  "success": false,
  "error": "Error message description",
  "message": "Additional context if available"
}
```

## Testing Commands

### Correct API Testing Commands
```bash
# Test Classification
curl -X POST http://localhost:3000/api/simple-classification \
  -H "Content-Type: application/json" \
  -d '{"product_description": "electrical wire harness", "business_type": "manufacturing"}'

# Test USMCA Qualification
curl -X POST http://localhost:3000/api/simple-usmca-compliance \
  -H "Content-Type: application/json" \
  -d '{"action": "check_qualification", "data": {"hs_code": "8544429000", "component_origins": "Mexico,Canada", "manufacturing_location": "Mexico"}}'

# Test Savings Calculation  
curl -X POST http://localhost:3000/api/simple-usmca-compliance \
  -H "Content-Type: application/json" \
  -d '{"action": "calculate_savings", "data": {"hs_code": "8544429000", "annual_import_value": 500000, "supplier_country": "China"}}'

# Test Certificate Generation
curl -X POST http://localhost:3000/api/simple-usmca-compliance \
  -H "Content-Type: application/json" \
  -d '{"action": "generate_certificate", "data": {"companyName": "Test Corp", "hsCode": "8544429000", "productDescription": "wire harness", "manufacturingLocation": "Mexico", "componentOrigins": "Mexico,Canada", "qualified": true}}'

# Test Admin APIs
curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/admin/suppliers
curl http://localhost:3000/api/admin/rss-feeds
```

## Common Testing Mistakes

### ❌ Wrong Expectations (Old Documentation)
```javascript
// DON'T expect this structure:
const data = await response.json();
const hsCode = data.hs_code;  // WRONG - this doesn't exist at root level
const qualified = data.qualifies;  // WRONG - property name is different
```

### ✅ Correct Expectations (Actual Implementation)
```javascript
// DO expect this structure:
const data = await response.json();
if (data.success && data.results && data.results.length > 0) {
  const hsCode = data.results[0].hs_code;  // CORRECT - results array structure
}

if (data.success && data.qualification) {
  const qualified = data.qualification.qualified;  // CORRECT - qualification object
}
```

---

**Last Updated:** September 5, 2025  
**Source:** Extracted from actual working API implementation  
**Status:** Current and validated