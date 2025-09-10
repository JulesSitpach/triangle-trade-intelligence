# UN Comtrade API Integration Plan for HS Code Expansion

## Current Gap Analysis
- **Current Coverage**: 5,751 codes (6-digit only)
- **Chapter Coverage**: 21/99 chapters (21% coverage)
- **Missing**: 78 chapters of products

## Implementation Strategy

### Phase 1: Immediate Expansion (Week 1)
1. **Priority Chapters to Add** (High-value trade categories):
   - Chapter 61-62: Apparel and clothing
   - Chapter 27: Mineral fuels and oils  
   - Chapter 30: Pharmaceutical products
   - Chapter 39: Plastics and articles
   - Chapter 73: Articles of iron or steel
   - Chapter 94: Furniture and bedding

2. **API Integration Script**:
```javascript
// scripts/expand-hs-codes-comtrade.js
const fetchMissingChapters = async () => {
  const missingChapters = ['27', '30', '39', '61', '62', '73', '94'];
  
  for (const chapter of missingChapters) {
    const response = await fetch(
      `https://comtradeapi.un.org/data/v1/get/C/A/ALL?cmdCode=${chapter}..&includeDesc=true`,
      { headers: { 'Ocp-Apim-Subscription-Key': process.env.COMTRADE_API_KEY }}
    );
    
    // Process and insert into comtrade_reference table
  }
};
```

### Phase 2: Complete Coverage (Week 2-3)
1. **Systematic Chapter Import**:
   - Query all 99 chapters systematically
   - Use async processing for larger datasets
   - Implement rate limiting (API restrictions)

2. **Data Enhancement**:
   - Add 8-digit and 10-digit codes where available
   - Include trade flow data for intelligence
   - Map to existing tariff_rates table

### Phase 3: Intelligence Layer (Week 4)
1. **Smart Classification**:
   - Use product descriptions for better keyword matching
   - Build similarity index for fuzzy search
   - Implement ML-based classification suggestions

2. **Trade Intelligence**:
   - Import/export volume data
   - Popular trade routes by HS code
   - Seasonal patterns from historical data

## Technical Implementation

### Database Schema Updates
```sql
-- Expand comtrade_reference table
ALTER TABLE comtrade_reference 
ADD COLUMN code_level INTEGER, -- 2, 4, 6, 8, 10 digit indicator
ADD COLUMN parent_code TEXT, -- For hierarchical navigation
ADD COLUMN trade_volume_usd DECIMAL, -- Annual trade volume
ADD COLUMN last_updated TIMESTAMP DEFAULT NOW();

-- Create index for better search
CREATE INDEX idx_product_desc_gin ON comtrade_reference 
USING gin(to_tsvector('english', product_description));
```

### API Integration Service
```javascript
// lib/services/comtrade-expansion-service.js
class ComtradeExpansionService {
  async expandDatabase() {
    // 1. Identify missing chapters
    const missingChapters = await this.identifyGaps();
    
    // 2. Fetch from Comtrade API
    const newCodes = await this.fetchFromComtrade(missingChapters);
    
    // 3. Validate and deduplicate
    const validated = await this.validateCodes(newCodes);
    
    // 4. Insert into database
    await this.bulkInsert(validated);
    
    // 5. Update search indices
    await this.updateSearchIndices();
  }
}
```

## Expected Outcomes

### Coverage Improvements
- **From**: 5,751 codes → **To**: 50,000+ codes
- **From**: 21 chapters → **To**: 99 chapters (100% coverage)
- **From**: 6-digit only → **To**: 2, 4, 6, 8, 10-digit hierarchy

### Classification Accuracy
- Better keyword matching with complete descriptions
- Hierarchical navigation (drill down from 2-digit to 10-digit)
- Industry-specific terminology coverage

### Business Value
- Support more product types
- Higher classification accuracy
- Reduced "product not found" errors
- Better USMCA qualification determinations

## Implementation Timeline
- **Week 1**: Priority chapters + API integration
- **Week 2-3**: Complete chapter coverage
- **Week 4**: Intelligence layer + optimization
- **Week 5**: Testing and validation

## Success Metrics
- HS code coverage: 5,751 → 50,000+ (870% increase)
- Chapter coverage: 21 → 99 (371% increase)  
- Classification success rate: 85% → 98%
- User-provided HS code captures: Track new discoveries

## Next Steps
1. Create API integration script
2. Test with priority chapters
3. Monitor API rate limits
4. Validate data quality
5. Deploy incremental updates