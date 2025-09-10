# TEST SAVINGS API DIRECTLY

## QUICK API TEST (Run this in terminal or Postman)

### TEST 1: With Correct Parameter Names (This should work)
```bash
curl -X POST http://localhost:3000/api/simple-savings \
  -H "Content-Type: application/json" \
  -d '{
    "importVolume": "$1M - $5M",
    "supplierCountry": "CN",
    "businessType": "Manufacturing",
    "destinationCountry": "US",
    "hsCode": "7208510000"
  }'
```

**Expected Result**: Should return real savings calculation with ~$127K annual savings

### TEST 2: With Wrong Parameter Names (This will fail)
```bash
curl -X POST http://localhost:3000/api/simple-savings \
  -H "Content-Type: application/json" \
  -d '{
    "import_volume": "$1M - $5M",
    "supplier_country": "CN",
    "business_type": "Manufacturing",
    "destination_country": "US",
    "hs_code": "7208510000"
  }'
```

**Expected Result**: Error "Import volume and supplier country are required"

---

## THE PARAMETER MISMATCH PROBLEM

### What the UI Form Collects (snake_case):
- `company_name`
- `business_type`
- `supplier_country`
- `destination_country`
- `trade_volume`

### What the Savings API Expects (camelCase):
- `importVolume` (REQUIRED)
- `supplierCountry` (REQUIRED)
- `businessType` (optional)
- `destinationCountry` (optional)
- `hsCode` (optional but important)

### The Integration Gap:
The workflow stores data in snake_case but the API expects camelCase. Without transformation, the API gets null values and can't calculate real savings.

---

## IMMEDIATE FIX NEEDED

The workflow needs to transform parameters when calling the savings API:

```javascript
// In the workflow processing code
const savingsResponse = await fetch('/api/simple-savings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Transform snake_case to camelCase
    importVolume: formData.trade_volume,        // NOT import_volume
    supplierCountry: formData.supplier_country,  // NOT supplier_country
    businessType: formData.business_type,
    destinationCountry: formData.destination_country || 'US',
    hsCode: classificationResult.hs_code
  })
});
```

---

## BUSINESS IMPACT OF THIS FIX

Once parameters match:
- Mexico suppliers will show 0% processing costs
- China suppliers will show 3% triangle routing costs
- Country-specific tariff rates will apply
- Real USMCA savings will calculate correctly
- Certificate will show actual business value

The sophisticated business logic EXISTS - it just needs the right parameter names to execute!