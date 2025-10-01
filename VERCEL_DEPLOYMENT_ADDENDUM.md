# VERCEL DEPLOYMENT - Implementation Guide Addendum

**For use with:** IMPLEMENTATION_GUIDE.md
**Stack:** Vercel + Supabase + Stripe + Next.js 14

---

## 🚀 Deployment Strategy

This platform will be deployed on **Vercel** with integrations to **Supabase** (database) and **Stripe** (payments). This addendum provides Vercel-specific implementation details for all stages in the main implementation guide.

---

## 📋 Prerequisites Setup

### 1. Vercel Account Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

### 2. Environment Variables Configuration

**Vercel Dashboard → Project → Settings → Environment Variables**

Add these for all environments (Development, Preview, Production):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_... (test) or sk_live_... (production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
JWT_SECRET=your_secure_random_string

# Email (if using Resend)
RESEND_API_KEY=re_...
```

### 3. Vercel Project Configuration

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

---

## 🔧 Stage-Specific Vercel Optimizations

### Stage 1: Foundation - Vercel Adaptations

#### JWT Authentication with Vercel Serverless

**Key Consideration:** Vercel functions are stateless - use httpOnly cookies for session management.

**Update `/api/auth/login.js`:**
```javascript
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // ... authentication logic ...

  // Create JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set httpOnly cookie (works in Vercel serverless)
  res.setHeader(
    'Set-Cookie',
    serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
  );

  return res.status(200).json({
    success: true,
    user: { id: user.id, email: user.email }
  });
}
```

#### Supabase Connection Pooling for Serverless

**Problem:** Vercel functions create new database connections on every request.

**Solution:** Use Supabase's built-in connection pooling.

**/lib/supabase-server.js:**
```javascript
import { createClient } from '@supabase/supabase-js';

// Connection pooling enabled by default with Supabase client
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Use connection pooling endpoint
    db: {
      schema: 'public'
    }
  }
);

// For API routes that need user auth
export const supabaseServerWithAuth = (token) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};
```

---

### Stage 2: Payment & Billing - Vercel + Stripe

#### Stripe Webhook Configuration

**Critical:** Vercel webhook endpoints must be publicly accessible.

**Production Webhook URL:**
```
https://your-domain.vercel.app/api/stripe/webhook
```

**Stripe Dashboard Setup:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to Vercel environment variables

**Testing Webhooks Locally:**
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger checkout.session.completed
```

#### Vercel-Optimized Webhook Handler

**/api/stripe/webhook.js:**
```javascript
import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CRITICAL: Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle event in Vercel serverless function
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      // ... other events
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
```

---

### Stage 3: User Experience - Vercel Edge Functions

#### Use Edge Runtime for Static Pages

For fast user-facing pages like `/profile` and `/certificates`:

**/pages/profile.js:**
```javascript
export const config = {
  runtime: 'edge', // Use Vercel Edge Runtime for faster response
};

export default function ProfilePage({ user }) {
  // ... component code
}

export async function getServerSideProps() {
  // Fetch user data from Supabase
  // Edge runtime is fast for database queries
}
```

---

## 🗄️ Supabase Configuration for Vercel

### Row Level Security (RLS) Policies

Enable RLS for all user-facing tables:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Users can view their own service requests
CREATE POLICY "Users can view own service requests"
  ON service_requests FOR SELECT
  USING (user_id = auth.uid());

-- Service role can bypass RLS (for admin operations)
ALTER TABLE service_requests FORCE ROW LEVEL SECURITY;
```

### Database Indexes for Performance

```sql
-- Index for user lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for subscription lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Index for service request queries
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_assigned_to ON service_requests(assigned_to);
```

---

## 📊 Vercel Analytics & Monitoring

### Enable Vercel Analytics

**vercel.json:**
```json
{
  "analytics": {
    "enable": true
  },
  "speed-insights": {
    "enable": true
  }
}
```

**Add to _app.js:**
```javascript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### Error Tracking with Sentry

```bash
npm install @sentry/nextjs
```

**sentry.client.config.js:**
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 1.0,
});
```

---

## 🚀 Deployment Workflow

### Development → Staging → Production

**1. Development (Local):**
```bash
npm run dev
# Test on localhost:3000
```

**2. Preview Deployment (Every PR):**
```bash
git push origin feature-branch
# Vercel automatically creates preview deployment
# Test at: https://triangle-simple-git-feature-branch.vercel.app
```

**3. Production Deployment:**
```bash
git push origin main
# Vercel automatically deploys to production
# Live at: https://your-domain.com
```

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🔒 Security Best Practices on Vercel

### 1. Environment Variable Security

- **Never commit** `.env.local` to git
- Use Vercel Dashboard for production secrets
- Rotate keys quarterly
- Use different keys for preview vs production

### 2. API Rate Limiting

**Use Vercel Edge Config for rate limiting:**

```javascript
import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
  // Check rate limit
  const rateLimit = await get('rateLimits');
  // ... implement rate limiting logic
}
```

### 3. CORS Configuration

**Already configured in vercel.json above** - allows controlled cross-origin requests.

---

## 💰 Cost Optimization on Vercel

### Vercel Pricing Tiers

**Pro Plan ($20/month per member):**
- Unlimited bandwidth
- 1000 GB-hours serverless function execution
- Advanced analytics
- Team collaboration

**Estimated Monthly Costs:**
- Vercel Pro: $20
- Supabase Pro: $25
- Stripe: 2.9% + $0.30 per transaction
- **Total Infrastructure:** ~$45/month base

### Optimization Tips

1. **Use Edge Runtime** for static pages (faster, cheaper)
2. **Cache API responses** with `Cache-Control` headers
3. **Optimize images** with Next.js Image component
4. **Minimize serverless function duration**

---

## 📋 Pre-Launch Checklist

### Vercel Configuration
- [ ] Environment variables set for production
- [ ] Custom domain configured
- [ ] SSL certificates auto-provisioned (Vercel handles this)
- [ ] Analytics enabled
- [ ] Speed Insights enabled

### Supabase Configuration
- [ ] Production database created
- [ ] Row Level Security enabled on all tables
- [ ] Database indexes created
- [ ] Backup enabled (automatic on Supabase Pro)

### Stripe Configuration
- [ ] Production keys added to Vercel
- [ ] Webhook endpoint configured with production URL
- [ ] Products and prices created in Stripe Dashboard
- [ ] Customer Portal enabled

### Testing
- [ ] Preview deployment tested end-to-end
- [ ] Stripe test mode transactions working
- [ ] Webhooks receiving events
- [ ] Email notifications sending
- [ ] Database queries performing under 200ms

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Vercel Analytics tracking page views
- [ ] Stripe Dashboard monitoring transactions

---

## 🆘 Troubleshooting Common Vercel Issues

### Issue: Serverless Function Timeout

**Error:** Function execution timed out after 10s

**Solution:**
- Optimize database queries (add indexes)
- Move long-running tasks to background jobs
- Use Vercel Pro for 60s timeout limit

### Issue: Cold Start Latency

**Problem:** First request is slow (1-2s)

**Solution:**
- Use Edge Runtime for static pages
- Implement caching strategy
- Consider Vercel Edge Middleware for auth checks

### Issue: Environment Variables Not Loading

**Problem:** `process.env.VAR_NAME` is undefined

**Solution:**
- Redeploy after adding environment variables
- Verify variable names match exactly (case-sensitive)
- Check that variable is set for correct environment

### Issue: Stripe Webhook Not Receiving Events

**Problem:** Webhooks timing out or not receiving

**Solution:**
- Verify webhook URL is publicly accessible
- Check Stripe Dashboard → Webhooks for failed attempts
- Ensure `bodyParser: false` in webhook API route

---

## 📚 Additional Resources

**Vercel Documentation:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

**Supabase + Vercel:**
- [Supabase Vercel Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)

**Stripe + Vercel:**
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Maintainer:** Triangle Intelligence Development Team
