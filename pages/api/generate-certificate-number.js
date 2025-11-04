/**
 * Generate Unique Certificate Number API
 * Format: USMCA-{YEAR}-{5-DIGIT-SEQUENTIAL}
 * Example: USMCA-2025-10234
 *
 * Uses database sequence to ensure uniqueness across all users
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    try {
      const year = new Date().getFullYear();

      // Get next value from sequence
      const { data, error } = await supabase.rpc('get_next_certificate_number');

      if (error) {
        console.error('Error getting certificate number from sequence:', error);
        // Fallback to timestamp-based if sequence fails
        const fallbackNumber = String(Date.now()).slice(-5);
        const certificateNumber = `USMCA-${year}-${fallbackNumber}`;

        return res.status(200).json({
          certificate_number: certificateNumber,
          fallback: true
        });
      }

      // Format: USMCA-2025-10234 (5 digits, zero-padded)
      const sequenceNumber = String(data).padStart(5, '0');
      const certificateNumber = `USMCA-${year}-${sequenceNumber}`;

      console.log(`✅ Generated certificate number: ${certificateNumber}`);

      return res.status(200).json({
        certificate_number: certificateNumber,
        fallback: false
      });

    } catch (error) {
      console.error('Certificate number generation error:', error);

      // Emergency fallback
      const year = new Date().getFullYear();
      const fallbackNumber = String(Date.now()).slice(-5);
      const certificateNumber = `USMCA-${year}-${fallbackNumber}`;

      return res.status(200).json({
        certificate_number: certificateNumber,
        fallback: true,
        error: error.message
      });
    }
  }
});
