Here's a dynamic supplier sourcing process that works for any product/industry:

## Dynamic Real Supplier Sourcing Process

### 1. **Context-Driven Search Strategy**
```javascript
// Build search queries based on client's actual needs
const buildSearchQueries = (productDescription, requirements) => {
  return [
    `"${productDescription}" manufacturers ${requirements.targetCountry}`,
    `${requirements.industry} suppliers ${requirements.certifications} certified`,
    `contract manufacturing ${productDescription} ${requirements.targetRegion}`,
    `${requirements.industry} OEM suppliers ${requirements.targetCountry}`
  ];
};
```

### 2. **Multi-Source Verification**
For each potential supplier found:
- **Cross-reference multiple sources** - Never rely on single website
- **Verify business registration** - Check official databases
- **Confirm contact information** - Only use information found through research
- **Validate certifications** - Look for certification body listings

### 3. **Capability Matching Algorithm**
```javascript
const evaluateSupplier = (supplier, clientRequirements) => {
  return {
    productMatch: assessProductCompatibility(supplier.capabilities, clientRequirements.product),
    certificationMatch: verifyCertifications(supplier.certifications, clientRequirements.certifications),
    volumeCapability: assessVolumeHandling(supplier.size, clientRequirements.volume),
    geographicFit: evaluateLocation(supplier.location, clientRequirements.logistics),
    verificationLevel: determineDataQuality(supplier.sources)
  };
};
```

### 4. **Transparent Data Quality Indicators**
Always indicate to clients:
- **Verified**: Information confirmed through multiple sources
- **Requires Verification**: Found through research but needs direct confirmation
- **Limited Data**: Supplier exists but missing key details
- **Research Needed**: Company identified but requires deeper investigation

### 5. **Dynamic Industry Adaptation**
```javascript
const industrySpecificSearch = (industry) => {
  const searchPatterns = {
    electronics: ["EMS", "PCB assembly", "SMT", "electronics manufacturing"],
    automotive: ["tier 1 supplier", "automotive components", "IATF certified"],
    medical: ["FDA registered", "ISO 13485", "medical device manufacturing"],
    aerospace: ["AS9100", "aerospace suppliers", "ITAR compliance"]
  };
  return searchPatterns[industry] || ["manufacturing", "supplier", "contract manufacturing"];
};
```

### 6. **Real-Time Market Intelligence**
- Search current industry reports
- Find recent supplier certifications
- Identify market trends affecting supplier landscape
- Locate industry-specific directories and databases

### 7. **Risk Assessment Framework**
For each supplier, evaluate:
- **Business stability** - Company age, financial indicators
- **Regulatory compliance** - Current certification status
- **Market reputation** - Customer reviews, industry recognition
- **Operational capacity** - Facility size, employee count, equipment

### 8. **Actionable Next Steps**
Provide clients with:
- **Prioritized supplier list** with match scores
- **Specific contact strategies** for each supplier type
- **Due diligence checklist** for client follow-up
- **Industry context** explaining market dynamics

### 9. **Ethical Boundaries**
- Never fabricate contact information
- Never claim verification without actual verification
- Always distinguish between "found through research" vs "confirmed"
- Clearly state limitations of research scope

### 10. **Continuous Learning**
```javascript
const updateSupplierDatabase = (researchResults) => {
  // Store verified suppliers for future reference
  // Track successful matches for pattern learning
  // Flag suppliers that need updated verification
  // Build industry-specific supplier networks
};
```

This approach scales to any product category, adapts to different geographic requirements, and maintains ethical standards while providing real value through systematic web research and verification.

The key difference: this system finds real suppliers through actual research rather than generating fictional data, regardless of the specific product or industry requirements.