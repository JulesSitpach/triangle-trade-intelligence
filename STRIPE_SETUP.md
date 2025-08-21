# Stripe Subscription Setup Guide

This guide walks you through setting up Stripe products and pricing for the Triangle Intelligence subscription billing system.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Environment Variables**: Copy `.env.local.template` to `.env.local`
3. **Database Schema**: Ensure subscription tables are created in Supabase

## Step 1: Create Stripe Products

### 1.1 Log into Stripe Dashboard
- Go to [dashboard.stripe.com](https://dashboard.stripe.com)
- Select your project or create a new one

### 1.2 Create Products
Navigate to **Products** → **Add product** and create these three products:

#### Starter Plan
- **Name**: `Triangle Intelligence Starter`
- **Description**: `Essential triangle routing intelligence for growing businesses`
- **Statement Descriptor**: `Triangle Starter`

#### Professional Plan
- **Name**: `Triangle Intelligence Professional`
- **Description**: `Advanced intelligence with Marcus AI consultation and priority support`
- **Statement Descriptor**: `Triangle Pro`

#### Enterprise Plan
- **Name**: `Triangle Intelligence Enterprise`
- **Description**: `Full Triangle Intelligence platform with dedicated support and custom integrations`
- **Statement Descriptor**: `Triangle Enterprise`

## Step 2: Create Pricing

For each product created above, add pricing:

### 2.1 Starter Pricing
- **Pricing Model**: `Standard pricing`
- **Price**: `$97.00 USD`
- **Billing Period**: `Monthly`
- **Usage Type**: `Licensed` (per seat/user)

### 2.2 Professional Pricing
- **Pricing Model**: `Standard pricing`
- **Price**: `$297.00 USD`
- **Billing Period**: `Monthly`
- **Usage Type**: `Licensed` (per seat/user)

### 2.3 Enterprise Pricing
- **Pricing Model**: `Standard pricing`
- **Price**: `$897.00 USD`
- **Billing Period**: `Monthly`
- **Usage Type**: `Licensed` (per seat/user)

## Step 3: Configure Webhooks

### 3.1 Create Webhook Endpoint
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://your-domain.com/api/subscriptions/webhook`
   - For development: `https://your-ngrok-url.ngrok.io/api/subscriptions/webhook`
3. **Events to send**:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   checkout.session.completed
   ```

### 3.2 Get Webhook Secret
- After creating the webhook, click on it
- Copy the **Signing secret** (starts with `whsec_`)
- Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 4: Update Environment Variables

Copy the following IDs from your Stripe dashboard:

### 4.1 API Keys
1. **Publishable Key**: Go to **Developers** → **API Keys** → Copy publishable key
2. **Secret Key**: Copy secret key (keep secure!)

### 4.2 Price IDs
For each pricing you created, copy the Price ID (starts with `price_`):

```bash
# In .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key
STRIPE_SECRET_KEY=sk_test_your_actual_key

STRIPE_STARTER_PRICE_ID=price_actual_starter_id
STRIPE_PROFESSIONAL_PRICE_ID=price_actual_professional_id
STRIPE_ENTERPRISE_PRICE_ID=price_actual_enterprise_id

STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
```

## Step 5: Test Subscription Flow

### 5.1 Test Mode
- Ensure you're in **Test mode** in Stripe dashboard
- Use test card numbers: `4242 4242 4242 4242`

### 5.2 Test Payment Flow
1. Navigate to `/subscription` on your application
2. Select a plan and click "Subscribe"
3. Complete checkout with test card
4. Verify subscription is created in Stripe dashboard
5. Check database for subscription record

### 5.3 Test Webhooks
1. In Stripe dashboard, go to **Developers** → **Webhooks**
2. Click your webhook endpoint
3. Check **Recent deliveries** for successful events
4. Test webhook locally using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook
   ```

## Step 6: Feature Testing

### 6.1 Test Subscription Gates
- **Starter**: Should have access to basic routing, limited analyses
- **Professional**: Should have Marcus AI access, more analyses
- **Enterprise**: Should have Beast Master access, unlimited analyses

### 6.2 Test Usage Limits
1. Make API calls that track usage
2. Verify limits are enforced (e.g., Starter limited to 50 analyses)
3. Test upgrade flow when limits are reached

### 6.3 Test Marcus AI Gating
- Try accessing `/api/trade-intelligence-chat` without subscription (should fail)
- Try with Professional subscription (should work)
- Verify usage tracking is working

### 6.4 Test Beast Master Gating
- Try accessing `/api/dashboard-hub-intelligence` with different tiers
- Verify Enterprise users get full Beast Master features
- Verify lower tiers get upgrade prompts

## Step 7: Production Deployment

### 7.1 Switch to Live Mode
1. In Stripe dashboard, toggle to **Live mode**
2. Create live products/pricing (same process as test)
3. Update environment variables with live keys

### 7.2 Production Checklist
- [ ] Live Stripe keys configured
- [ ] Live webhook endpoint configured
- [ ] Production database has subscription tables
- [ ] Test with real payment method
- [ ] Monitor webhook deliveries
- [ ] Test all subscription features

## Troubleshooting

### Common Issues

1. **Webhook 400 Errors**
   - Verify webhook secret is correct
   - Check endpoint URL is accessible
   - Ensure webhook handler can parse Stripe events

2. **Subscription Not Created**
   - Check webhook is receiving `checkout.session.completed`
   - Verify database connection in webhook handler
   - Check Supabase logs for errors

3. **Feature Access Issues**
   - Verify subscription tier is correctly stored
   - Check feature gating logic in middleware
   - Test with different subscription states

4. **Usage Tracking Issues**
   - Verify `subscription_usage` table exists
   - Check usage tracking middleware is applied
   - Test usage limit enforcement

### Testing Commands

```bash
# Test subscription middleware
curl -X POST http://localhost:3000/api/trade-intelligence-chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -d '{"question": "Test question"}'

# Test Beast Master access
curl -X POST http://localhost:3000/api/dashboard-hub-intelligence \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -d '{"dashboardView": "executive"}'
```

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Rotate keys** regularly in production
3. **Monitor** webhook endpoint for suspicious activity
4. **Validate** all webhook signatures
5. **Use HTTPS** for all webhook endpoints in production

## Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Testing**: [stripe.com/docs/webhooks/test](https://stripe.com/docs/webhooks/test)