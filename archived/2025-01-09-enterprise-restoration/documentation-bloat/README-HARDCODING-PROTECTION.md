# 🛡️ Triangle Intelligence Hardcoding Protection System

## **CRITICAL: Why This Matters**
Hardcoded values destroy your project's enterprise value. One hardcoded country code or tariff rate makes the entire platform useless for real business deployment.

## **Protection Active** ✅

The Triangle Intelligence project is now protected by automated hardcoding detection that prevents commits containing:

- **Hardcoded Countries**: `'CN'`, `'US'`, `'MX'`, `'CA'` in business logic
- **Hardcoded HS Codes**: `420221`, `420212`, `851712`, `620520` etc.  
- **Hardcoded Tariff Rates**: `12.5`, `17.6`, `96.8%` etc.
- **Hardcoded Business Rules**: USMCA thresholds, percentages

## **Commands**

```bash
# Check current project for hardcoding
npm run check-hardcoding

# Validate project is enterprise-ready  
npm run validate-enterprise

# Setup protection (one time)
npm run setup-protection
```

## **What Gets Blocked**

❌ **These commits will be BLOCKED:**
```javascript
const countries = ['US', 'CA', 'MX'];  // Hardcoded countries
const hsCode = '420221';               // Hardcoded HS code
const tariffRate = 12.5;              // Hardcoded rate
```

✅ **These commits are ALLOWED:**
```javascript  
const countries = await getCountriesFromDB();
const hsCode = await classifyProduct(description);
const tariffRate = await getTariffFromDB(hsCode, country);
```

## **Current Status**

⚠️ **HARDCODING DETECTED** - Project currently has hardcoded values that need fixing:
- Multiple files contain hardcoded country codes
- Test files and components have hardcoded HS codes  
- Configuration files have hardcoded defaults

## **How to Fix**

1. **Move to Environment Variables**:
   ```javascript
   // Bad
   const defaultCountry = 'CN';
   
   // Good  
   const defaultCountry = process.env.DEFAULT_SUPPLIER_COUNTRY;
   ```

2. **Use Database Queries**:
   ```javascript
   // Bad
   if (hsCode === '420221') { ... }
   
   // Good
   const productData = await db.getProductByHSCode(hsCode);
   ```

3. **Configuration Files**:
   ```javascript
   // Bad - in component
   const usmcaThreshold = 75.0;
   
   // Good - in config
   const usmcaThreshold = CONFIG.usmca.thresholds[businessType];
   ```

## **Enterprise Value Protection**

This protection ensures Triangle Intelligence remains:
- ✅ **Deployable** to any market without code changes
- ✅ **Scalable** across different countries and regulations  
- ✅ **Maintainable** with configurable business rules
- ✅ **Professional** grade for enterprise customers

## **For Developers**

Before every commit, the hook automatically runs and checks for hardcoding. If found:

1. **Commit is blocked**
2. **Specific violations are shown**  
3. **Fix suggestions are provided**
4. **Project value is preserved**

**Remember: One hardcoded value = Useless for enterprise deployment**