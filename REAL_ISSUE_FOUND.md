# 🔴 ROOT CAUSE IDENTIFIED - Data Source Mismatch

## The Real Problem

### Database Structure (Actual):
```json
{
  "id": "SR5877382",
  "company_name": "ElectroTech Solutions",
  "trade_volume": 950000,
  "service_details": {
    "volume": "$950K annually",
    "product_description": "Smart home IoT devices and controllers",
    "manufacturing_location": "Shenzhen, China"
  },
  "workflow_data": null  // ❌ MISSING for most services!
}
```

### What Components Expect:
```javascript
subscriberData.component_origins  // ❌ Doesn't exist
subscriberData.trade_volume       // ❌ Not in service_details
subscriberData.qualification_status // ❌ Doesn't exist
```

## Why It Works for USMCA Certificates But Not Others

**USMCA Certificates** have full `service_details` with nested `component_origins`:
```json
{
  "service_type": "USMCA Certificates",
  "service_details": {
    "component_origins": [...],  // ✅ EXISTS
    "trade_volume": 1800000,     // ✅ EXISTS
    "qualification_status": "..." // ✅ EXISTS
  }
}
```

**HS Classification** only has basic service_details:
```json
{
  "service_type": "HS Classification",
  "service_details": {
    "volume": "$950K annually",         // ❌ Wrong field name
    "product_description": "...",       // ✅ OK
    "manufacturing_location": "..."     // ✅ OK
    // ❌ NO component_origins
    // ❌ NO qualification_status
  }
}
```

## The Fix Required

Components need to:
1. Check `request.workflow_data` first
2. Then check `request.service_details`
3. Handle missing data gracefully
4. Map field names correctly (`volume` → `trade_volume`)

### Example Fix:
```javascript
// CURRENT (BROKEN):
const tradeVolume = subscriberData?.trade_volume;

// SHOULD BE:
const tradeVolume =
  request?.workflow_data?.trade_volume ||
  request?.workflow_data?.annual_trade_volume ||
  request?.service_details?.trade_volume ||
  request?.trade_volume ||
  parseVolume(request?.service_details?.volume); // Parse "$950K annually"
```

## Action Items

1. ✅ Fix field name mapping (`volume` → `trade_volume`)
2. ✅ Add fallback chain for all data fields
3. ❌ Parse string volumes like "$950K annually" to numbers
4. ❌ Handle missing `component_origins` gracefully
5. ❌ Show appropriate message when data truly missing

## Current Status

**Working**:
- USMCACertificateTab (has full service_details with component_origins)

**Broken**:
- HSClassificationTab (missing component_origins, wrong volume field)
- CrisisResponseTab (missing workflow data)
- SupplierSourcingTab (missing workflow data)
- ManufacturingFeasibilityTab (wrong volume field)
- MarketEntryTab (missing workflow data)

---

**Next Step**: Add helper functions to parse and map data correctly across all possible field locations.