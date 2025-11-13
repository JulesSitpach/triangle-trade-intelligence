# Broker Chat Help System Update - November 2025

## Summary
Added 5 new help topics to the BrokerChatbot system to cover recently implemented platform features.

**Total Topics:** 22 → 27 (+5 new)

## New Topics Added

### 1. **Subscription Tiers & Usage Limits** (Platform)
- **Keywords:** subscription limits, usage limits, analyses left, monthly limit, analyze button disabled
- **Difficulty:** Beginner
- **Why:** Users need to understand the 3-layer enforcement system (Nov 5, 2025)
- **Covers:**
  - What counts as an analysis
  - Tier limits (Trial: 1, Starter: 15, Professional: 100, Premium: 500)
  - What happens when limit reached
  - Billing cycle resets

### 2. **Daily Tariff Digest** (Platform)
- **Keywords:** daily digest, tariff alerts, email notifications, daily email
- **Difficulty:** Beginner
- **Why:** Feature ready to activate (Nov 1, 2025) - users need to understand it
- **Covers:**
  - How daily bundling works (8 AM UTC)
  - What's included in digest
  - Opt-in/opt-out settings
  - RSS feed monitoring sources

### 3. **Portfolio Briefing vs Executive Alert** (Platform)
- **Keywords:** portfolio briefing, executive alert, difference between alerts
- **Difficulty:** Intermediate
- **Why:** Two similar features with different purposes (Oct-Nov 2025)
- **Covers:**
  - Portfolio Briefing = Strategic planning (quarterly)
  - Executive Alert = Tactical response (policy-specific)
  - When to use each
  - Real vs template alerts

### 4. **Component Alert Badges** (Platform)
- **Keywords:** alert badges, color codes, critical high medium low
- **Difficulty:** Beginner
- **Why:** Visual feature users see constantly (fixed Nov 2, 2025)
- **Covers:**
  - Severity colors (CRITICAL/HIGH/MEDIUM/LOW)
  - Status badges (NEW/UPDATED/RESOLVED)
  - 3-tier matching logic (HS code, country, industry)
  - Click-through to alert details

### 5. **USMCA 2026 Renegotiation** (Compliance)
- **Keywords:** 2026 renegotiation, usmca review, cumulation rules
- **Difficulty:** Advanced
- **Why:** Appears in Portfolio Briefing - users need context
- **Covers:**
  - What might change (cumulation, RVC thresholds, labor)
  - Timeline (Q1 2026 proposals → Q3-Q4 finalization)
  - Decision gate (Q3 2025 - before proposals)
  - Supplier qualification lead time (12-18 months)

## Categories Distribution

**Before (22 topics):**
- Tariff: 3
- Classification: 1
- Qualification: 1
- General: 1
- Cost Benefit: 1
- Mexico Strategy: 5
- Compliance: 4
- Services: 6

**After (27 topics):**
- Tariff: 3
- Classification: 1
- Qualification: 1
- General: 1
- Cost Benefit: 1
- Mexico Strategy: 5
- Compliance: 5 (+1: USMCA 2026)
- Services: 6
- **Platform: 4 (NEW)** - Subscription limits, Daily digest, Briefing vs Alert, Alert badges

## How to Seed Database

```bash
# From project root
node scripts/seed-broker-chat.js
```

**Expected output:**
```
🌱 Seeding broker chat responses...
📊 Current responses in database: 22
✅ Inserted: Subscription Tiers & Usage Limits
✅ Inserted: Daily Tariff Digest
✅ Inserted: Portfolio Briefing vs Executive Alert
✅ Inserted: Component Alert Badges
✅ Inserted: USMCA 2026 Renegotiation
🎉 Seeding complete! Total responses: 27
```

## Testing Checklist

After seeding, test these queries in the chatbot:

- [ ] "What happens when I hit my subscription limit?"
- [ ] "How do daily tariff alerts work?"
- [ ] "What's the difference between portfolio briefing and executive alert?"
- [ ] "What do the red alert badges mean?"
- [ ] "What is the 2026 USMCA renegotiation?"

All should return the new help content with broker personality intact.

## Notes

- All new topics follow existing format (broker_response, quick_tip, real_example, encouragement, related_questions, next_steps)
- Maintained friendly broker personality ("Let me break this down...", "Real talk:", etc.)
- Added practical examples for each topic
- Difficulty levels assigned based on complexity (3 beginner, 1 intermediate, 1 advanced)
- Keywords optimized for natural user queries

## Related Files

- `scripts/seed-broker-chat.js` - Seed script (updated)
- `database/seeds/broker_chat_seed.sql` - SQL version (needs manual sync if used)
- `components/chatbot/BrokerChatbot.js` - Chat UI component
- `pages/api/broker-chat.js` - Backend API endpoint

## Next Steps

1. ✅ Validate JavaScript syntax
2. ⏳ Seed database with new topics
3. ⏳ Test queries in chatbot UI
4. ⏳ Update SQL seed file if needed
5. ⏳ Commit and deploy

---

**Created:** November 13, 2025
**Author:** Claude Code Agent
**Project:** Triangle Trade Intelligence Platform
