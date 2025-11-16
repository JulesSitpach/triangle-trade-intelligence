/**
 * AUTO-APPLY POLICY TARIFF CHANGES CRON JOB
 * ==========================================
 * Reads tariff_changes_log (AI-detected White House announcements)
 * Auto-applies high-confidence changes to policy_tariffs_cache
 *
 * Runs: Weekly (Sundays at 2 AM UTC)
 * Safety: Only applies changes with >90% AI confidence
 *
 * This fills the gap between:
 * - USITC sync (base MFN rates) ✅
 * - Policy tariffs (Section 301, reciprocal, etc.) ❌ <- This fixes it
 */

import { createClient } from '@supabase/supabase-js';
import { queueEmail } from '../../../lib/utils/emailQueue.js';

export default async function handler(req, res) {
  // Verify cron authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Cron secret required'
      });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const startTime = Date.now();
  let appliedCount = 0;
  let skippedCount = 0;
  const appliedChanges = [];
  const errors = [];

  try {
    console.log('🔄 [AUTO-APPLY] Starting policy tariff auto-update...');

    // Step 1: Get unprocessed high-confidence changes
    const { data: pendingChanges, error: fetchError } = await supabase
      .from('tariff_changes_log')
      .select('*')
      .eq('is_processed', false)
      .gte('confidence', 0.90)  // ✅ SAFETY: Only >90% confidence
      .order('detected_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!pendingChanges || pendingChanges.length === 0) {
      console.log('✅ No pending high-confidence changes to apply');
      return res.status(200).json({
        success: true,
        message: 'No changes to apply',
        applied: 0,
        skipped: 0,
        execution_time_ms: Date.now() - startTime
      });
    }

    console.log(`📊 Found ${pendingChanges.length} high-confidence changes to review`);

    // Step 2: Apply each change
    for (const change of pendingChanges) {
      try {
        // Validate required fields
        if (!change.hs_code || change.new_rate === null || change.new_rate === undefined) {
          console.warn(`⚠️ Skipping invalid change: ${change.id} (missing hs_code or new_rate)`);
          skippedCount++;
          continue;
        }

        // Determine which column to update based on change_type
        let updateColumn = 'section_301';  // Default
        if (change.change_type?.includes('232')) {
          updateColumn = 'section_232';
        } else if (change.change_type?.includes('reciprocal')) {
          updateColumn = 'reciprocal_tariff';
        }

        console.log(`🔄 Applying: ${change.hs_code} → ${updateColumn} = ${change.new_rate}% (confidence: ${(change.confidence * 100).toFixed(1)}%)`);

        // Step 2a: Check if record exists in policy_tariffs_cache
        const { data: existing } = await supabase
          .from('policy_tariffs_cache')
          .select('id, hs_code')
          .eq('hs_code', change.hs_code)
          .single();

        if (existing) {
          // UPDATE existing record
          const { error: updateError } = await supabase
            .from('policy_tariffs_cache')
            .update({
              [updateColumn]: change.new_rate,
              last_updated: new Date().toISOString(),
              data_source: `Auto-applied from: ${change.source?.substring(0, 100)}`
            })
            .eq('hs_code', change.hs_code);

          if (updateError) throw updateError;
        } else {
          // INSERT new record
          const { error: insertError } = await supabase
            .from('policy_tariffs_cache')
            .insert({
              hs_code: change.hs_code,
              [updateColumn]: change.new_rate,
              last_updated: new Date().toISOString(),
              data_source: `Auto-applied from: ${change.source?.substring(0, 100)}`
            });

          if (insertError) throw insertError;
        }

        // Step 2b: Mark change as processed
        await supabase
          .from('tariff_changes_log')
          .update({
            is_processed: true,
            processed_at: new Date().toISOString(),
            processed_by: 'auto-apply-cron'
          })
          .eq('id', change.id);

        appliedCount++;
        appliedChanges.push({
          hs_code: change.hs_code,
          column: updateColumn,
          old_rate: change.old_rate,
          new_rate: change.new_rate,
          confidence: change.confidence,
          source: change.source
        });

        console.log(`✅ Applied: ${change.hs_code} (${updateColumn}: ${change.old_rate || 0}% → ${change.new_rate}%)`);

      } catch (error) {
        console.error(`❌ Failed to apply change for HS ${change.hs_code}:`, error.message);
        skippedCount++;
        errors.push({
          hs_code: change.hs_code,
          error: error.message
        });
      }
    }

    // Step 3: Send email summary
    if (appliedCount > 0) {
      await sendSummaryEmail(appliedChanges, errors);
    }

    const executionTime = Date.now() - startTime;

    console.log(`✅ [AUTO-APPLY] Complete: ${appliedCount} applied, ${skippedCount} skipped in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      message: `Auto-applied ${appliedCount} policy tariff changes`,
      applied: appliedCount,
      skipped: skippedCount,
      changes: appliedChanges,
      errors: errors.length > 0 ? errors : null,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AUTO-APPLY] Cron job failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Auto-apply failed',
      message: error.message,
      applied: appliedCount,
      skipped: skippedCount,
      execution_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Send email summary to admin
 */
async function sendSummaryEmail(appliedChanges, errors) {
  try {
    const changesHtml = appliedChanges.map(c => `
      <tr>
        <td>${c.hs_code}</td>
        <td>${c.column}</td>
        <td>${c.old_rate || 0}%</td>
        <td><strong>${c.new_rate}%</strong></td>
        <td>${(c.confidence * 100).toFixed(1)}%</td>
        <td><a href="${c.source}">Source</a></td>
      </tr>
    `).join('');

    const errorsHtml = errors.length > 0 ? `
      <h3>⚠️ Errors (${errors.length})</h3>
      <ul>
        ${errors.map(e => `<li>HS ${e.hs_code}: ${e.error}</li>`).join('')}
      </ul>
    ` : '';

    await queueEmail({
      to: process.env.ADMIN_EMAIL || 'admin@triangletradeintelligence.com',
      subject: `✅ Auto-Applied ${appliedChanges.length} Policy Tariff Changes`,
      html: `
        <h2>Weekly Policy Tariff Auto-Update Summary</h2>
        <p>The following changes were automatically applied to <code>policy_tariffs_cache</code> based on AI-detected policy announcements (>90% confidence):</p>

        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th>HS Code</th>
              <th>Column</th>
              <th>Old Rate</th>
              <th>New Rate</th>
              <th>AI Confidence</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${changesHtml}
          </tbody>
        </table>

        ${errorsHtml}

        <hr>
        <p><small>Automated by: <code>/api/cron/apply-policy-tariff-changes</code></small></p>
      `
    });

    console.log('📧 Summary email queued');
  } catch (emailError) {
    console.error('Failed to send summary email:', emailError);
  }
}

// Vercel Cron Config
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
    externalResolver: true
  }
};
