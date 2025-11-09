/**
 * CLEANUP SCRIPT: Keep only the NEWEST active subscription, cancel everything else
 *
 * Run with: node -r dotenv/config scripts/cleanup-subscriptions.js dotenv_config_path=.env.local
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function cleanupSubscriptions() {
  try {
    console.log('🔍 Finding your Stripe customer...\n');

    const userEmail = 'nature098@icloud.com';

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      console.error('❌ Customer not found with email:', userEmail);
      return;
    }

    const customer = customers.data[0];
    console.log(`✅ Found customer: ${customer.id}\n`);

    // Get ALL subscriptions (active, canceled, everything)
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100
    });

    console.log(`📋 Total subscriptions: ${allSubscriptions.data.length}\n`);

    // Separate active from canceled/past
    const activeSubscriptions = allSubscriptions.data.filter(sub => sub.status === 'active');
    const canceledSubscriptions = allSubscriptions.data.filter(sub =>
      sub.status === 'canceled' || sub.cancel_at_period_end === true
    );

    console.log(`✅ Active subscriptions: ${activeSubscriptions.length}`);
    console.log(`🗑️  Canceled/Ending subscriptions: ${canceledSubscriptions.length}\n`);

    if (activeSubscriptions.length === 0) {
      console.log('⚠️ No active subscriptions found!');
      return;
    }

    // Sort active subscriptions by created date (newest first)
    const sortedActive = activeSubscriptions.sort((a, b) => b.created - a.created);

    console.log('📋 Active subscriptions (newest first):');
    sortedActive.forEach((sub, index) => {
      const planName = sub.items.data[0]?.price?.nickname || 'Unknown';
      const amount = (sub.items.data[0]?.price?.unit_amount / 100).toFixed(2);
      const created = new Date(sub.created * 1000).toISOString();
      console.log(`  ${index + 1}. ${planName} - $${amount}/mo (ID: ${sub.id}, Created: ${created})`);
    });

    console.log('\n🎯 Strategy: Keep NEWEST subscription, cancel all others\n');

    const keepSubscription = sortedActive[0];
    const cancelSubscriptions = sortedActive.slice(1);

    const keepPlan = keepSubscription.items.data[0]?.price?.nickname || 'Unknown';
    const keepAmount = (keepSubscription.items.data[0]?.price?.unit_amount / 100).toFixed(2);

    console.log(`✅ KEEPING: ${keepPlan} - $${keepAmount}/mo (${keepSubscription.id})\n`);

    if (cancelSubscriptions.length > 0) {
      console.log(`🗑️  CANCELING ${cancelSubscriptions.length} extra active subscription(s):\n`);

      for (const sub of cancelSubscriptions) {
        const planName = sub.items.data[0]?.price?.nickname || 'Unknown';
        const amount = (sub.items.data[0]?.price?.unit_amount / 100).toFixed(2);

        try {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`   ✅ Canceled: ${planName} - $${amount}/mo (${sub.id})`);
        } catch (error) {
          console.error(`   ❌ Failed to cancel ${sub.id}:`, error.message);
        }
      }
    } else {
      console.log('✅ No extra active subscriptions to cancel');
    }

    // Show canceled subscriptions that are still visible (until end date)
    if (canceledSubscriptions.length > 0) {
      console.log(`\n📌 Note: ${canceledSubscriptions.length} canceled subscription(s) will remain visible until their end dates:`);
      canceledSubscriptions.forEach(sub => {
        const planName = sub.items.data[0]?.price?.nickname || 'Unknown';
        const amount = (sub.items.data[0]?.price?.unit_amount / 100).toFixed(2);
        let endDate = 'Unknown';

        if (sub.cancel_at) {
          endDate = new Date(sub.cancel_at * 1000).toLocaleDateString();
        } else if (sub.current_period_end) {
          endDate = new Date(sub.current_period_end * 1000).toLocaleDateString();
        }

        console.log(`   • ${planName} - $${amount}/mo (ends ${endDate})`);
      });
      console.log('\n   ℹ️  These will disappear from Stripe UI after their end dates.');
    }

    console.log('\n✅ CLEANUP COMPLETE!');
    console.log(`\n💰 Your billing: $${keepAmount}/month (${keepPlan})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

cleanupSubscriptions();
