# Instructions for AI Agent: Building a Tariff Information API Integration

## Task Overview
Help the user build an API integration that queries US import tariff rates for specific HS codes and countries of origin. The system should return current, comprehensive tariff information in a structured format.

## What the User Needs

**Goal**: Create an automated system that:
1. Takes input: HS code, product name, origin country
2. Calls an AI API (Claude) to research current tariff rates
3. Returns structured, machine-readable tariff data
4. Includes all applicable tariff types and rates

**Use Case**: They need to check tariff rates for semiconductors (HS 8542) programmatically, not manually ask each time.

## System Architecture

```
User Application
    ↓
    [API Call with HS code + country]
    ↓
Claude API (with web search enabled)
    ↓
    [Searches current tariff data]
    ↓
    [Returns structured JSON]
    ↓
User Application receives tariff data
```

## Implementation Steps

### Step 1: Craft the System Prompt
This tells Claude how to behave:

```
System Prompt:
"You are a US customs and import tariff specialist. 

When asked about tariff rates:
1. ALWAYS use web_search tool to find current information - tariffs change frequently
2. Search for: base MFN rates, Section 301, Section 232, IEEPA, and reciprocal tariffs
3. Include country-specific rates (especially China vs other countries)
4. Explain how multiple tariffs stack/combine
5. Note any exemptions or pending changes
6. Provide the as-of date

Respond ONLY in valid JSON format with no additional text."
```

**Why this matters**: Without explicit instructions to search the web, Claude might use outdated knowledge. The tariff situation is extremely dynamic in 2025.

### Step 2: Structure the User Query

The query should include:
- **HS Code** (required) - the classification code
- **Product Description** (helpful for context)
- **Origin Country** (required) - tariffs vary dramatically by country
- **Date** (helpful) - indicates we want current info

**Example query format**:
```
"What are the current US import tariff rates for [PRODUCT] 
(HS code [CODE]) from [COUNTRY]?

Respond in this JSON structure:
{
  "hsCode": "",
  "baseMFNRate": "",
  "additionalTariffs": [],
  "totalEffectiveRate": "",
  "exemptions": [],
  "lastUpdated": ""
}"
```

### Step 3: Enable Required Tools

**Critical**: The API call MUST include tool definitions so Claude can search the web:

```javascript
tools: [
  {
    "name": "web_search",
    "description": "Search the web for current information",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        }
      },
      "required": ["query"]
    }
  }
]
```

**Without this**: Claude cannot access current tariff data and will only use knowledge from its training cutoff.

### Step 4: Desired JSON Output Structure

Help the user define what data they need:

```json
{
  "hsCode": "8542",
  "product": "electronic integrated circuits",
  "originCountry": "China",
  "baseMFNRate": "0%",
  "additionalTariffs": [
    {
      "type": "Section 301",
      "rate": "50%",
      "description": "China-specific trade tariffs",
      "applicableCountries": ["China", "Hong Kong"]
    },
    {
      "type": "IEEPA", 
      "rate": "20%",
      "description": "Emergency economic powers",
      "applicableCountries": ["China", "Hong Kong"]
    }
  ],
  "totalEffectiveRate": "70%",
  "calculationMethod": "Base + Section 301 + IEEPA",
  "exemptions": [
    "Currently exempt from reciprocal tariffs per EO 14257"
  ],
  "pendingChanges": "New semiconductor tariffs expected within 1-2 months",
  "lastUpdated": "2025-10-16",
  "sources": ["url1", "url2"],
  "notes": "Rates subject to change; verify with customs broker"
}
```

### Step 5: Handle the Response

**Challenge**: Claude might return JSON wrapped in markdown:
```
```json
{...}
```
```

**Solution**: Strip markdown before parsing:
```javascript
responseText = responseText
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();
```

### Step 6: Error Handling

**Common issues**:
1. **Invalid JSON**: Claude sometimes adds explanatory text
   - Solution: Use stronger prompts emphasizing "ONLY JSON, NO OTHER TEXT"
   
2. **Missing data**: Some tariff info may not be available
   - Solution: Include error fields in JSON structure
   
3. **Outdated info**: Web search might miss very recent changes
   - Solution: Include "lastUpdated" field and confidence level

4. **Rate limiting**: Web searches take time and cost more
   - Solution: Implement caching (12-24 hour TTL)

## Key Technical Decisions for the User

**Ask them these questions:**

1. **What programming language?** (JavaScript/Python/etc.)
   - This determines the exact API client code

2. **Where will this run?** (Frontend/Backend/Serverless)
   - Affects where API keys are stored

3. **How often do they need fresh data?**
   - Determines caching strategy
   - Tariffs change weekly/monthly, not real-time

4. **Do they need historical tracking?**
   - Should you store results in a database?

5. **What's their error handling strategy?**
   - Retry logic? Fallback to cached data? Alert user?

6. **Response time requirements?**
   - Web search adds 5-15 seconds latency
   - Can they use async processing?

## Recommended Implementation Pattern

```javascript
// Pseudo-code structure

async function getTariffRate(hsCode, product, originCountry) {
  // 1. Check cache first
  const cached = checkCache(hsCode, originCountry);
  if (cached && !isExpired(cached)) {
    return cached.data;
  }
  
  // 2. Build API request
  const request = {
    model: "claude-sonnet-4-20250514",
    system: [SYSTEM_PROMPT],
    messages: [{
      role: "user",
      content: [USER_QUERY_TEMPLATE]
    }],
    tools: [WEB_SEARCH_TOOL],
    max_tokens: 4096
  };
  
  // 3. Call API
  const response = await callClaudeAPI(request);
  
  // 4. Parse response
  const tariffData = parseJSON(response);
  
  // 5. Validate
  if (!tariffData.hsCode || !tariffData.totalEffectiveRate) {
    throw new Error("Incomplete tariff data");
  }
  
  // 6. Cache result
  saveToCache(hsCode, originCountry, tariffData);
  
  // 7. Return
  return tariffData;
}
```

## Important Warnings for the User

⚠️ **API Keys**: Never expose Anthropic API keys in frontend code

⚠️ **Costs**: Each call with web search costs ~$0.05-0.15 depending on token usage

⚠️ **Legal Disclaimer**: AI-generated tariff info should not replace official customs broker advice - include disclaimer

⚠️ **Rate Limits**: Anthropic has rate limits; implement exponential backoff

⚠️ **Data Freshness**: Even with web search, very recent changes (within hours) might be missed

## Testing Strategy

Suggest they test with:
1. **Known cases**: HS 8542 from China (should return 70%+ with stacked tariffs)
2. **Edge cases**: HS 8542 from Taiwan (should return 0% base, exempt from reciprocal)
3. **Invalid inputs**: Non-existent HS codes (should handle gracefully)
4. **Multiple rapid calls**: Test caching and rate limiting

## Next Steps to Discuss with User

1. Which programming language/framework?
2. Do they have an Anthropic API key?
3. Where will this be deployed?
4. Do they need a UI or just backend API?
5. What's their expected query volume?
6. Should you build a minimal prototype first?

---

**Summary**: This is about building a system that programmatically queries Claude to research and return current tariff data in structured format, with web search enabled to ensure accuracy. The key challenges are ensuring Claude searches the web, returns clean JSON, and handles the complexity of multiple stacked tariffs.