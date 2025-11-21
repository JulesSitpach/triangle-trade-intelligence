/**
 * USER-FRIENDLY ERROR MESSAGES
 *
 * PURPOSE:
 * Convert technical errors into helpful, actionable messages for users.
 * Instead of "Error loading data", tell users WHAT happened and WHAT to do.
 *
 * PRINCIPLES:
 * 1. Explain what went wrong (in plain English)
 * 2. Tell user what action to take
 * 3. Provide contact info if they need help
 * 4. Include technical details (for support/debugging)
 *
 * USAGE:
 * import { TariffError, HSCodeError, DatabaseError } from '@/lib/utils/user-friendly-errors';
 *
 * throw new TariffError.NotFound('73269070', 'CN', {
 *   suggestion: 'Contact customs broker for classification'
 * });
 *
 * Created: November 20, 2025
 */

/**
 * Base error class with user-friendly messaging
 */
export class UserFriendlyError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = options.userMessage || message;
    this.action = options.action || 'Please try again or contact support.';
    this.technicalDetails = options.technicalDetails || null;
    this.severity = options.severity || 'error'; // error, warning, info
    this.supportContact = options.supportContact || 'support@triangleintelligence.com';
  }

  toJSON() {
    return {
      error: this.name,
      message: this.userMessage,
      action: this.action,
      severity: this.severity,
      technicalDetails: this.technicalDetails,
      support: this.supportContact
    };
  }
}

/**
 * Tariff-related errors
 */
export class TariffError extends UserFriendlyError {
  static NotFound(hsCode, originCountry, options = {}) {
    return new TariffError(
      `No tariff rate found for HS code ${hsCode} from ${originCountry}`,
      {
        userMessage: `We couldn't find a tariff rate for HS code ${hsCode} from ${originCountry}.`,
        action: `Please verify:
1. HS code is correct (should be 6-8 digits)
2. Origin country is correct (${originCountry})
3. Consider contacting a licensed customs broker for classification

Licensed customs brokers: https://www.cbp.gov/trade/programs-administration/customs-brokers`,
        technicalDetails: {
          hs_code: hsCode,
          origin_country: originCountry,
          database_queried: true,
          fallback_attempted: true
        },
        severity: 'warning',
        ...options
      }
    );
  }

  static RateOutOfRange(hsCode, rate, field, options = {}) {
    return new TariffError(
      `Tariff rate ${rate} is outside valid range (0%-100%)`,
      {
        userMessage: `The ${field} rate for HS code ${hsCode} appears invalid (${rate * 100}%).`,
        action: `This may indicate:
1. Database corruption (rate stored incorrectly)
2. Data import error (percentage vs decimal confusion)

Recommended action:
- Do NOT use this rate for customs forms
- Contact support to report this issue
- Use a customs broker to verify the correct rate`,
        technicalDetails: {
          hs_code: hsCode,
          field,
          invalid_rate: rate,
          valid_range: '0.0 to 1.0'
        },
        severity: 'error',
        ...options
      }
    );
  }

  static StaleData(hsCode, verifiedDate, daysSinceUpdate, options = {}) {
    return new TariffError(
      `Tariff data for ${hsCode} is stale (${daysSinceUpdate} days old)`,
      {
        userMessage: `The tariff rate for HS code ${hsCode} was last verified ${daysSinceUpdate} days ago (${verifiedDate}).`,
        action: `Policy tariffs (Section 301/232) change frequently.

Recommended action:
1. For China imports: Verify Section 301 rate is current (changes with 30-day notice)
2. For steel/aluminum: Verify Section 232 rate (can change quarterly)
3. Check USTR announcements: https://ustr.gov/issue-areas/enforcement/section-301-investigations

For critical shipments, contact customs broker for current rates.`,
        technicalDetails: {
          hs_code: hsCode,
          verified_date: verifiedDate,
          days_since_update: daysSinceUpdate,
          recommended_max_age: 90
        },
        severity: 'warning',
        ...options
      }
    );
  }

  static LowConfidence(hsCode, confidence, source, options = {}) {
    return new TariffError(
      `Low confidence rate for HS code ${hsCode} (${confidence}% confidence)`,
      {
        userMessage: `The tariff rate for HS code ${hsCode} has ${confidence}% confidence (source: ${source}).`,
        action: `Low confidence means:
- ${confidence >= 70 ? 'Using heading-level rate (4-digit code)' : ''}
- ${confidence >= 50 && confidence < 70 ? 'Using chapter-level estimate (2-digit prefix)' : ''}
- ${confidence < 50 ? 'Rate not found in database' : ''}

For customs forms and official declarations:
1. Contact licensed customs broker for verification
2. Consider filing CBP Form 29 for binding ruling (90-day processing)
3. Do NOT rely on low-confidence rates for high-value shipments

Binding rulings: https://www.cbp.gov/trade/rulings`,
        technicalDetails: {
          hs_code: hsCode,
          confidence,
          source,
          recommended_min_confidence: 85
        },
        severity: 'warning',
        ...options
      }
    );
  }
}

/**
 * HS Code classification errors
 */
export class HSCodeError extends UserFriendlyError {
  static InvalidFormat(hsCode, options = {}) {
    return new HSCodeError(
      `Invalid HS code format: ${hsCode}`,
      {
        userMessage: `The HS code "${hsCode}" is not in a valid format.`,
        action: `HS codes should be:
- 6 digits (category-level): Example: 732690
- 8 digits (product-level): Example: 73269070
- No periods, spaces, or dashes
- Only numbers

Valid formats:
✓ 73269070 (8-digit)
✓ 732690 (6-digit parent)
✗ 73.26.90.70 (remove periods)
✗ 7326-90-70 (remove dashes)
✗ ABC73269 (no letters)

If unsure of your HS code, consult:
- USITC HTS Search: https://hts.usitc.gov/
- Licensed customs broker`,
        technicalDetails: {
          input: hsCode,
          expected_format: '6 or 8 digits, numbers only'
        },
        severity: 'error',
        ...options
      }
    );
  }

  static AmbiguousClassification(description, suggestions, options = {}) {
    return new HSCodeError(
      `Multiple HS code classifications possible for: ${description}`,
      {
        userMessage: `We found multiple possible HS codes for "${description}".`,
        action: `AI found ${suggestions.length} possible classifications:

${suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s.hs_code} - ${s.description} (${s.confidence}% confidence)`).join('\n')}

Recommended action:
1. Review each classification's description
2. Choose the one that best matches your product
3. If unsure, contact customs broker for classification
4. Consider filing CBP Form 29 for binding ruling

Classification guidance: https://www.cbp.gov/trade/basic-import-export/importing-basics`,
        technicalDetails: {
          product_description: description,
          suggestions,
          ai_confidence: 'medium'
        },
        severity: 'info',
        ...options
      }
    );
  }
}

/**
 * Database errors
 */
export class DatabaseError extends UserFriendlyError {
  static ConnectionFailed(options = {}) {
    return new DatabaseError(
      'Database connection failed',
      {
        userMessage: 'We\'re having trouble connecting to our database.',
        action: `Please try again in a moment.

If the problem persists:
1. Check your internet connection
2. Try refreshing the page
3. Contact support if issue continues

Our team has been notified of this issue.`,
        technicalDetails: {
          service: 'Supabase',
          retry_recommended: true
        },
        severity: 'error',
        ...options
      }
    );
  }

  static QueryTimeout(query, timeout, options = {}) {
    return new DatabaseError(
      `Database query timed out after ${timeout}ms`,
      {
        userMessage: 'Your request is taking longer than expected.',
        action: `This usually happens when:
1. Querying a large amount of data
2. Database is under heavy load
3. Network connection is slow

Recommended action:
1. Try again (may work on second attempt)
2. Simplify your query (fewer components)
3. Contact support if problem persists`,
        technicalDetails: {
          query_type: query,
          timeout_ms: timeout,
          retry_recommended: true
        },
        severity: 'warning',
        ...options
      }
    );
  }
}

/**
 * USMCA qualification errors
 */
export class USMCAError extends UserFriendlyError {
  static InsufficientRVC(actualRVC, requiredRVC, industry, options = {}) {
    return new USMCAError(
      `RVC ${actualRVC}% below threshold ${requiredRVC}% for ${industry}`,
      {
        userMessage: `Your product has ${actualRVC}% Regional Value Content, but ${industry} requires ${requiredRVC}%.`,
        action: `You're ${(requiredRVC - actualRVC).toFixed(1)}% short of USMCA qualification.

Options to increase RVC:
1. **Source from USMCA region**: Replace non-USMCA components with US/CA/MX suppliers
2. **Increase value-added**: More manufacturing/assembly in USMCA region
3. **Review calculation**: Ensure all USMCA content is counted
4. **Consider alternative criteria**: Check if you qualify under Preference Criterion B (Tariff Shift)

USMCA rules: https://www.cbp.gov/trade/priority-issues/trade-agreements/free-trade-agreements/USMCA

For help optimizing RVC, contact a customs broker or trade consultant.`,
        technicalDetails: {
          actual_rvc: actualRVC,
          required_rvc: requiredRVC,
          industry,
          shortfall: requiredRVC - actualRVC
        },
        severity: 'warning',
        ...options
      }
    );
  }
}

/**
 * Subscription/usage limit errors
 */
export class SubscriptionError extends UserFriendlyError {
  static LimitReached(tier, limit, used, options = {}) {
    return new SubscriptionError(
      `${tier} plan limit reached (${used}/${limit} analyses)`,
      {
        userMessage: `You've used all ${limit} analyses in your ${tier} plan this month.`,
        action: `Options:
1. **Upgrade plan**: Get more analyses + advanced features
   - Professional: 100 analyses/month ($299)
   - Premium: 500 analyses/month ($799)

2. **Wait for reset**: Your usage resets on the 1st of each month

3. **Contact sales**: Custom enterprise plans available

View plans: /pricing
Contact sales: sales@triangleintelligence.com`,
        technicalDetails: {
          current_tier: tier,
          limit,
          used,
          reset_date: 'First day of next month'
        },
        severity: 'warning',
        ...options
      }
    );
  }
}

/**
 * Helper function to format errors for API responses
 */
export function formatErrorResponse(error) {
  if (error instanceof UserFriendlyError) {
    return {
      success: false,
      error: error.toJSON()
    };
  }

  // Generic error (not user-friendly)
  return {
    success: false,
    error: {
      error: 'UnknownError',
      message: 'An unexpected error occurred.',
      action: 'Please try again. If the problem persists, contact support@triangleintelligence.com',
      severity: 'error',
      technicalDetails: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }
  };
}

/**
 * Export all error classes
 */
export default {
  UserFriendlyError,
  TariffError,
  HSCodeError,
  DatabaseError,
  USMCAError,
  SubscriptionError,
  formatErrorResponse
};
