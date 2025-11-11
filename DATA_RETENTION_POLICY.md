# Data Retention Policy - 90-Day Grace Period

## Overview

When users cancel their subscription, we implement a **90-day grace period** before permanent data deletion. This gives users time to change their mind and reactivate, while also being GDPR-compliant.

## Timeline

### Day 0: Subscription Canceled
- User's subscription ends via Stripe webhook
- Account status: `trial_expired` (read-only)
- `canceled_at` timestamp set
- User can still:
  - ✅ Log in
  - ✅ View all past workflows
  - ✅ View all certificates
  - ✅ View all alerts
- User cannot:
  - ❌ Create new analyses
  - ❌ Generate new certificates
  - ❌ Get new executive summaries

### Day 60: First Warning Email
- Subject: "⚠️ Data Deletion Warning - 30 Days Remaining"
- Content:
  - Deletion date (Day 90)
  - List of what will be deleted
  - Reactivation link
  - Export data reminder
- `deletion_warning_sent_at` timestamp set

### Day 80: Final Warning Email
- Subject: "🚨 FINAL WARNING - Data Deletion in 10 Days"
- Content:
  - Urgent tone
  - Deletion date countdown
  - Last chance reactivation link
  - Export data instructions
- `final_warning_sent_at` timestamp set

### Day 90: Permanent Deletion
- **All data permanently deleted**:
  - ❌ All USMCA workflows (`workflow_sessions`, `workflow_completions`)
  - ❌ All certificates
  - ❌ All alerts and briefings
  - ❌ Usage tracking (`monthly_usage_tracking`)
  - ❌ User profile (`user_profiles`)
  - ❌ Authentication credentials (`auth.users`)
- **Cannot be recovered**
- GDPR-compliant (right to erasure)

## Database Schema

### New Columns (user_profiles)
```sql
canceled_at TIMESTAMPTZ              -- When subscription was canceled
deletion_warning_sent_at TIMESTAMPTZ -- When 60-day warning was sent
final_warning_sent_at TIMESTAMPTZ    -- When 80-day warning was sent
```

### Indexes
```sql
CREATE INDEX idx_canceled_at ON user_profiles(canceled_at)
WHERE canceled_at IS NOT NULL;
```

## Cron Job Setup

### File: `pages/api/cron/data-retention-manager.js`

**Schedule**: Daily at 09:00 UTC (4 AM EST / 1 AM PST)

**Vercel Cron Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/cron/data-retention-manager",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Environment Variables Required**:
- `CRON_SECRET` - Security token for cron authentication
- `RESEND_API_KEY` - Email sending (already configured)
- `SUPABASE_SERVICE_ROLE_KEY` - Database access (already configured)

## How It Works

### 1. Stripe Webhook (Subscription Canceled)
```javascript
// pages/api/stripe/webhook.js line 571
canceled_at: new Date().toISOString() // Start 90-day countdown
```

### 2. Daily Cron Job
Runs three checks in sequence:

**Check 1: 60-Day Warnings**
```sql
SELECT * FROM user_profiles
WHERE status = 'trial_expired'
AND canceled_at <= NOW() - INTERVAL '60 days'
AND deletion_warning_sent_at IS NULL
```

**Check 2: 80-Day Final Warnings**
```sql
SELECT * FROM user_profiles
WHERE status = 'trial_expired'
AND canceled_at <= NOW() - INTERVAL '80 days'
AND final_warning_sent_at IS NULL
```

**Check 3: 90-Day Deletions**
```sql
SELECT * FROM user_profiles
WHERE status = 'trial_expired'
AND canceled_at <= NOW() - INTERVAL '90 days'
```

### 3. Data Deletion Order
Respects foreign key constraints:
1. `monthly_usage_tracking`
2. `user_alert_tracking`
3. `workflow_sessions`
4. `workflow_completions`
5. `invoices`
6. `user_profiles`
7. `auth.users` (final step)

## User Reactivation

If user reactivates subscription **before Day 90**:
- `canceled_at` reset to `NULL`
- `deletion_warning_sent_at` reset to `NULL`
- `final_warning_sent_at` reset to `NULL`
- All data preserved
- Normal subscription resumes

**Webhook Handler**: `pages/api/stripe/webhook.js`
```javascript
// On invoice.payment_succeeded for reactivation
await supabase
  .from('user_profiles')
  .update({
    canceled_at: null, // Cancel deletion countdown
    deletion_warning_sent_at: null,
    final_warning_sent_at: null
  })
```

## Testing Locally

### 1. Simulate Subscription Cancellation
```bash
# Mark user as canceled (60 days ago for testing)
psql $DATABASE_URL -c "
UPDATE user_profiles
SET canceled_at = NOW() - INTERVAL '60 days',
    status = 'trial_expired'
WHERE email = 'test@example.com';
"
```

### 2. Run Cron Job Manually
```bash
curl -X POST http://localhost:3001/api/cron/data-retention-manager \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 3. Check Results
```sql
SELECT
  email,
  canceled_at,
  deletion_warning_sent_at,
  final_warning_sent_at,
  status
FROM user_profiles
WHERE canceled_at IS NOT NULL;
```

## Monitoring

### Cron Job Logs
```javascript
{
  "success": true,
  "timestamp": "2025-11-11T09:00:00Z",
  "results": {
    "warnings_60d": 5,
    "warnings_80d": 2,
    "deletions_90d": 1,
    "errors": []
  }
}
```

### Error Handling
- Failed emails logged but don't stop other operations
- Database errors logged to `dev_issues` table
- Admin notification if >10 errors in single run

## Compliance

### GDPR Article 17 (Right to Erasure)
✅ Users can request deletion anytime
✅ Automatic deletion after 90 days
✅ All personal data removed
✅ Cannot be recovered after deletion

### Data Retention Best Practices
✅ Clear communication (2 warning emails)
✅ Reasonable grace period (90 days)
✅ Easy reactivation option
✅ Export data option before deletion

## Business Benefits

1. **User Retention**: 90-day grace period allows users to come back
2. **GDPR Compliance**: Automated right to erasure
3. **Cost Savings**: Don't store inactive user data forever
4. **Professional**: Matches industry standards (Stripe, Mailchimp, Salesforce)

## Support Scenarios

### User: "I canceled by mistake!"
- ✅ If within 90 days: Data preserved, reactivate anytime
- ❌ If past 90 days: Data deleted, cannot recover

### User: "Can I export my data?"
- ✅ Yes, log in and manually export from dashboard (before Day 90)
- Future: Add automatic export option in warning emails

### User: "I want immediate deletion (GDPR)"
- ✅ Contact support: triangleintel@gmail.com
- Manual deletion via admin portal
- Completed within 48 hours

## Related Files

- `pages/api/stripe/webhook.js` - Sets `canceled_at` on cancellation
- `pages/api/cron/data-retention-manager.js` - Daily cleanup job
- `database/migrations/*_add_data_retention_fields.sql` - Schema migration
- `DATA_RETENTION_POLICY.md` - This file

---

**Last Updated**: November 11, 2025
**Status**: ✅ Production Ready
**Owner**: Triangle Intelligence Platform
