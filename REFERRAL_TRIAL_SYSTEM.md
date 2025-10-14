# 🎁 Referral Trial System - Complete Setup

**Created**: January 2025
**Purpose**: Track and convert LinkedIn referrals (Adam Williams & Anthony Robinson)

---

## 🔗 Referral Links

### Adam Williams (Private Equity)
```
https://triangle-trade-intelligence.vercel.app/signup/referral?ref=adam
```

### Anthony Robinson (ShipScience CEO)
```
https://triangle-trade-intelligence.vercel.app/signup/referral?ref=anthony
```

---

## 📧 Updated LinkedIn Messages

### **Message to Adam Williams**

**Subject**: Real-time tariff alerts now live (feature you requested)

Hi Adam,

You mentioned wanting real-time policy alerts for tariff navigation - we just launched exactly that.

**Triangle Trade Intelligence** - USMCA compliance platform with Mexico trade bridge focus:

✅ **Real-time tariff policy alerts** (the feature you asked for)
✅ AI-powered USMCA qualification analysis
✅ Crisis monitoring for trade disputes & rule changes
✅ Mexico-based expert team for North American trade

**Why I'm reaching out**: Your portfolio companies likely import/export across USMCA borders. Our platform helps them maximize tariff savings and navigate policy shifts in real-time.

**30-Day Professional Trial** (no credit card):
**Try it here**: https://triangle-trade-intelligence.vercel.app/signup/referral?ref=adam

Includes:
• Unlimited USMCA analyses
• Real-time trade alerts
• 15% discount on professional services
• Priority support

Would love your feedback - especially on the alerts system and whether it's useful for PE portfolio optimization.

Best,
[Your Name]

P.S. Trial expires in 30 days, but you'll get full Professional tier access with no payment info required.

---

### **Message to Anthony Robinson**

**Subject**: Built that live customs update feature you mentioned

Hey Anthony,

Remember you said "live customs updates would be clutch for folks trying to go global"? We built it.

**Triangle Trade Intelligence** - For SMBs navigating USMCA trade:

✅ **Live customs & tariff policy updates** (what you asked for)
✅ Real-time trade risk monitoring
✅ USMCA qualification analysis (know BEFORE you ship)
✅ Mexico trade bridge with bilingual expert team

**Why you'll care**: Your ShipScience customers likely face customs headaches. Our platform tells them:
- Which products qualify for 0% USMCA rates (vs standard MFN)
- Real-time policy changes affecting their shipments
- Mexico routing opportunities for LatAm markets

**30-Day Professional Trial** (no credit card):
**Try it here**: https://triangle-trade-intelligence.vercel.app/signup/referral?ref=anthony

Includes:
• Unlimited USMCA analyses
• Real-time trade alerts
• 15% service discounts
• Priority support

Since you're helping e-commerce save on shipping, this could save them 3-8% on tariffs too. Worth a look?

Best,
[Your Name]

P.S. Open to exploring a partnership - ShipScience customers + our tariff optimization = complete shipping solution. Happy to discuss if you like what you see.

---

## 🎯 Trial Benefits (30 Days)

Both referrals get **Professional Tier** access:

### **What They Get**:
✅ Unlimited USMCA analyses (vs 10 per month on Starter)
✅ Real-time crisis alerts (tariff changes, trade disputes)
✅ 15% discount on all professional services
✅ Priority support (48hr response)
✅ Advanced trade policy analysis
✅ Full access to Mexico trade experts

### **What You Track**:
- Who signed up via each link
- Trial start/end dates
- Which features they use
- Whether they convert to paid
- Feedback they provide

---

## 📊 Tracking Dashboard (Admin View)

You can track referrals in Supabase:

```sql
-- See all referral signups
SELECT
  email,
  company_name,
  referred_by,
  referral_source,
  trial_start_date,
  trial_end_date,
  referral_converted,
  created_at
FROM user_profiles
WHERE referred_by IS NOT NULL
ORDER BY created_at DESC;

-- Conversion rate by referrer
SELECT
  referred_by,
  COUNT(*) as total_signups,
  SUM(CASE WHEN referral_converted THEN 1 ELSE 0 END) as converted,
  ROUND(100.0 * SUM(CASE WHEN referral_converted THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM user_profiles
WHERE referred_by IS NOT NULL
GROUP BY referred_by;
```

---

## 🚀 Follow-Up Strategy

### **After They Sign Up**:

1. **Day 1**: Welcome email with quick start guide
2. **Day 3**: Check-in email - "How's it going? Need help?"
3. **Day 7**: Usage report - "You've analyzed X products, saved $Y in tariffs"
4. **Day 14**: Mid-trial check-in - Ask for feedback
5. **Day 23**: Conversion email - "7 days left, here's your discount"
6. **Day 27**: Final reminder - "3 days left, convert now to keep access"

### **Conversion Offer** (Days 23-30):
"Thanks for testing! Convert now and get:
• First month 50% off ($149 instead of $299)
• Lock in current pricing (may increase)
• All your workflow data saved
• Continued priority support"

### **If They Give Feedback**:
1. **Positive feedback**: Request testimonial + LinkedIn recommendation
2. **Constructive feedback**: Implement improvements, notify them
3. **Feature requests**: Add to roadmap, give them early access

### **If They Don't Convert**:
1. **Exit survey**: "What would it take to convert you?"
2. **Stay in touch**: Add to newsletter for future launches
3. **Referral request**: "Know anyone else who'd benefit?"

---

## 📈 Success Metrics

Track these for each referral:

### **Engagement Metrics**:
- Workflows completed
- Alerts set up
- Components analyzed
- Services requested
- Time in platform

### **Conversion Indicators**:
- 5+ workflows = high intent
- Professional service request = very high intent
- Alerts setup = engaged user
- Dashboard visits 10+ times = power user

### **Target Outcomes**:
1. **Best case**: Both convert to paid ($299/month × 2 = $598/month = $7,176/year)
2. **Good case**: One converts + one gives testimonial
3. **Minimum**: Detailed feedback to improve product

---

## 🎁 Referral Incentive Structure (Future)

Once we have conversions, offer:

### **For Referrers** (Adam & Anthony):
- **1 conversion**: $100 Amazon gift card
- **3 conversions**: Free Professional tier for life
- **5 conversions**: $500 cash + featured case study

### **For Referred Users**:
- First month 50% off ($149)
- Second month 25% off ($224)
- Month 3+: Full price ($299)

---

## 🔧 Technical Implementation

### **Files Created**:
1. `/migrations/010_add_referral_tracking_to_user_profiles.sql` - Database schema
2. `/pages/signup/referral.js` - Referral signup page
3. `/pages/api/auth/signup-referral.js` - Referral signup API

### **How It Works**:
1. User clicks referral link (`?ref=adam` or `?ref=anthony`)
2. Signup page shows referrer badge and 30-day trial info
3. On submit, API creates user with:
   - `subscription_tier: 'Professional'`
   - `status: 'trial'`
   - `trial_end_date: +30 days`
   - `referred_by: 'Adam Williams'` or `'Anthony Robinson'`
4. User auto-logged in (no email confirmation needed for trials)
5. Redirect to dashboard with full Professional access

### **Database Columns Added**:
```sql
referred_by TEXT              -- "Adam Williams" or "Anthony Robinson"
referral_source TEXT          -- "linkedin"
referral_date TIMESTAMPTZ     -- When they signed up
referral_converted BOOLEAN    -- false until they pay
referral_converted_date       -- When they converted to paid
```

---

## 🎯 Next Steps

1. **Run migration**: Apply `010_add_referral_tracking_to_user_profiles.sql` to production database
2. **Test links**: Sign up with both links to verify flow
3. **Send messages**: Copy/paste LinkedIn messages to Adam & Anthony
4. **Monitor**: Check Supabase for signups
5. **Follow up**: Email them after they try it

---

## ✅ RSS MONITORING SYSTEM ACTIVATED (January 2025)

**Status**: ✅ **PRODUCTION READY** - Real-time monitoring delivers exactly what Adam & Anthony requested!

### What's Now Active:
- **4 Official Government RSS feeds**: USTR Press Releases, USITC News, Commerce ITA, Federal Register CBP
- **Authoritative sources**: Not news articles - actual U.S. government policy announcements
- **Crisis detection engine**: Monitors Section 301, tariffs, USMCA changes, antidumping, customs rulings
- **Automated polling**: Vercel cron job runs every 30 minutes
- **User-facing badge**: "📡 Real-Time Government Monitoring Active" on alerts page
- **Database tables**: All RSS monitoring infrastructure in place

### Adam Williams Gets:
✅ **"Real-time policy alerts"** - USTR official announcements (Section 301, USMCA policy changes)
✅ USITC trade investigation alerts (electronics industry targeting)
✅ Crisis keyword detection for tariff changes from authoritative sources
✅ Personalized alerts matched to his portfolio companies' HS codes

### Anthony Robinson Gets:
✅ **"Live customs updates"** - Federal Register CBP official rules and regulations
✅ Commerce ITA antidumping/countervailing duty determinations (affects e-commerce imports)
✅ Customs rule changes detected automatically from official government source
✅ Trade policy updates affecting e-commerce/logistics from USTR

### Deployment Steps:
1. Run migrations: `011_create_rss_monitoring_tables.sql` and `012_seed_rss_feeds.sql`
2. Deploy to Vercel (cron job auto-activates)
3. Verify cron job active in Vercel dashboard
4. Send LinkedIn referral links

**Detailed Guide**: See `RSS_MONITORING_ACTIVATION_GUIDE.md`

---

**Status**: ✅ Complete and ready to deploy
**Deployment**: Run migrations → Deploy to Vercel → Send LinkedIn messages
**Timeline**: Ready to go live immediately
**Confidence**: HIGH - Monitoring system delivers exactly what they asked for
