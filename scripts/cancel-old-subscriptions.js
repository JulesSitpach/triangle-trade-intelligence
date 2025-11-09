/**
 * EMERGENCY SCRIPT: Cancel old subscriptions for double-billed user
 *
 * Run with: node scripts/cancel-old-subscriptions.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function cancelOldSubscriptions() {
  try {
    console.log('🔍 Finding your Stripe customer...\n');

    // Get your user email (replace with your actual email)
    const userEmail = 'macproductions010@gmail.com';

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

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 100
    });

    console.log(`📋 Active subscriptions: ${subscriptions.data.length}\n`);

    if (subscriptions.data.length === 0) {
      console.log('✅ No active subscriptions to cancel');
      return;
    }

    // Sort by created date (newest first)
    const sortedSubs = subscriptions.data.sort((a, b) => b.created - a.created);

    console.log('Subscriptions (newest first):');
    sortedSubs.forEach((sub, index) => {
      const planName = sub.items.data[0]?.price?.nickname || 'Unknown';
      const amount = (sub.items.data[0]?.price?.unit_amount / 100).toFixed(2);
      const created = new Date(sub.created * 1000).toISOString();
      console.log(`  ${index + 1}. ${planName} - $${amount}/mo (ID: ${sub.id}, Created: ${created})`);
    });

    console.log('\n🎯 Strategy: Keep the NEWEST subscription, cancel all others\n');

    const newestSub = sortedSubs[0];
    const oldSubs = sortedSubs.slice(1);

    console.log(`✅ KEEPING: ${newestSub.items.data[0]?.price?.nickname || 'Unknown'} (${newestSub.id})\n`);

    if (oldSubs.length === 0) {
      console.log('✅ No old subscriptions to cancel');
      return;
    }

    console.log(`🗑️  CANCELING ${oldSubs.length} old subscription(s):\n`);

    for (const oldSub of oldSubs) {
      const planName = oldSub.items.data[0]?.price?.nickname || 'Unknown';
      const amount = (oldSub.items.data[0]?.price?.unit_amount / 100).toFixed(2);

      try {
        await stripe.subscriptions.cancel(oldSub.id);
        console.log(`   ✅ Canceled: ${planName} - $${amount}/mo (${oldSub.id})`);
      } catch (error) {
        console.error(`   ❌ Failed to cancel ${oldSub.id}:`, error.message);
      }
    }

    console.log('\n✅ DONE! Refresh your billing page to verify.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run it
cancelOldSubscriptions();
