# Tariff Data Infrastructure - Agent Briefing

## What Changed
Replaced AI hallucination with real government data + intelligent fallbacks.

## System Architecture

**Cache-First Model:**
1. Agents query `policy_tariffs_cache` (real data with timestamps)
2. If cache miss → emergency Federal Register fetch (real-time)
3. If fetch fails → static fallback (last resort)

## Data Sources (No AI Training Data)
- **Section 301:** Federal Register XML (daily sync, 06:00 UTC)
- **Section 232:** Federal Register XML (daily sync, 06:30 UTC)  
- **MFN Base:** USITC API (weekly sync, Sunday 03:00 UTC)
- **Emergency:** Federal Register real-time fetch with in-memory deduplication

## For Your Agent
```javascript
// Instead of AI research:
const rate = await getTariffRate(hsCode);

// This does:
// 1. Query cache (fresh <25 days → confidence: 'high')
// 2. If stale/miss → Federal Register fetch
// 3. If fetch fails → static fallback
// 4. Return with confidence score + verified_date

// Example response:
{
  rate: 0.25,
  confidence: 'high',
  verified_date: '2025-11-06',
  source: 'Federal Register 2024-21217',
  is_stale: false
}
```

## What NOT to Do
- ❌ Don't ask AI "what's the current Section 301 rate"
- ❌ Don't parse Federal Register prose
- ❌ Don't use training data (cutoff: Jan 2025)
- ❌ Don't hardcode rates in prompts

## What to Do Instead
- ✅ Query `policy_tariffs_cache` only
- ✅ Use XML parsing for any extraction
- ✅ Trust the confidence scores
- ✅ Let fallback chain handle edge cases

## Current Status
- ✅ 365 Section 301 rates cached (real data)
- ✅ All sync jobs working
- ✅ Emergency fetch deployed
- ✅ Agents updated to query cache
- ✅ Ready for production

## Questions?
Check `TARIFF_DATA_INFRASTRUCTURE.md` for full details.