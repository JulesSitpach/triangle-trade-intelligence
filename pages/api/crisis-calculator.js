/**
 * Crisis Calculator
 * POST /api/crisis-calculator
 *
 * ✅ Calculates tariff policy impact (Section 301, 232) on user's imports
 * ✅ Estimates annual financial burden from tariff rate increases
 * ✅ Identifies supply chain vulnerabilities and mitigation strategies
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';

// Section 301 tariff rates by origin country (2024)
const SECTION_301_RATES = {
  'CN': 0.25,    // China: 25% additional tariff
  'China': 0.25,
  'default': 0    // No additional tariff for other countries
};

// Section 232 tariff rates (steel/aluminum safeguards)
const SECTION_232_RATES = {
  'steel': 0.25,      // Steel products: 25%
  'aluminum': 0.10    // Aluminum products: 10%
};

// HS code chapters susceptible to tariffs
const VULNERABLE_CHAPTERS = {
  'steel': ['72', '73'],           // Iron/steel articles
  'aluminum': ['76'],               // Aluminum articles
  'electronics': ['84', '85'],      // Machinery & electronics (Section 301 target)
  'machinery': ['84'],              // Machinery
};

function estimateSection301Impact(tradeVolume, hsCode, originCountry) {
  const section301Rate = SECTION_301_RATES[originCountry] || SECTION_301_RATES.default;

  if (section301Rate === 0) {
    return {
      rate: 0,
      exposure: false,
      annual_burden: 0,
      explanation: `${originCountry} is not subject to Section 301 tariffs`
    };
  }

  const annualBurden = tradeVolume * section301Rate;

  return {
    rate: section301Rate * 100, // As percentage
    exposure: true,
    annual_burden: annualBurden,
    explanation: `${originCountry}-origin products subject to ${section301Rate * 100}% Section 301 tariff`
  };
}

function estimateSection232Impact(tradeVolume, hsCode) {
  const chapter = hsCode?.substring(0, 2);

  // Check if product is steel or aluminum
  if (VULNERABLE_CHAPTERS.steel.includes(chapter)) {
    const burden = tradeVolume * SECTION_232_RATES.steel;
    return {
      rate: SECTION_232_RATES.steel * 100,
      category: 'steel',
      annual_burden: burden,
      exposure: burden > 0
    };
  }

  if (VULNERABLE_CHAPTERS.aluminum.includes(chapter)) {
    const burden = tradeVolume * SECTION_232_RATES.aluminum;
    return {
      rate: SECTION_232_RATES.aluminum * 100,
      category: 'aluminum',
      annual_burden: burden,
      exposure: burden > 0
    };
  }

  return {
    rate: 0,
    category: null,
    annual_burden: 0,
    exposure: false
  };
}

export default protectedApiHandler({
  POST: async (req, res) => {
    try {
      const { action, data } = req.body;

      // ✅ VALIDATION: Fail loudly
      if (!action || action !== 'calculate_crisis_penalty') {
        return res.status(400).json({
          success: false,
          error: 'action must be "calculate_crisis_penalty"'
        });
      }

      const { tradeVolume, hsCode, originCountry, businessType, sessionId } = data || {};

      // Validate required fields
      if (!tradeVolume || tradeVolume <= 0) {
        return res.status(400).json({
          success: false,
          error: 'tradeVolume is required and must be > 0'
        });
      }

      if (!hsCode) {
        return res.status(400).json({
          success: false,
          error: 'hsCode is required'
        });
      }

      if (!originCountry) {
        return res.status(400).json({
          success: false,
          error: 'originCountry is required'
        });
      }

      // Calculate tariff impacts
      const section301Impact = estimateSection301Impact(tradeVolume, hsCode, originCountry);
      const section232Impact = estimateSection232Impact(tradeVolume, hsCode);

      // Total annual burden
      const totalAnnualBurden = section301Impact.annual_burden + section232Impact.annual_burden;

      // Generate mitigation recommendations
      const recommendations = [];

      if (section301Impact.exposure) {
        recommendations.push({
          strategy: 'Mexico Nearshoring',
          description: 'Move sourcing from China to Mexico to eliminate Section 301 tariffs',
          estimated_savings: section301Impact.annual_burden,
          implementation_months: 4,
          payback_months: Math.round(section301Impact.annual_burden / (tradeVolume * 0.02)) // Assuming 2% cost increase
        });
      }

      if (section232Impact.exposure) {
        recommendations.push({
          strategy: 'Domestic Sourcing',
          description: `Source ${section232Impact.category} from US suppliers to qualify for Section 232 exemptions`,
          estimated_savings: section232Impact.annual_burden,
          implementation_months: 3
        });
      }

      recommendations.push({
        strategy: 'Binding Ruling',
        description: 'File CBP Form 29 for binding HS classification to lock in tariff treatment for 3 years',
        estimated_savings: totalAnnualBurden * 0.1, // 10% average savings from optimized classification
        implementation_months: 3
      });

      return res.status(200).json({
        success: true,
        crisis_analysis: {
          product: hsCode,
          origin_country: originCountry,
          annual_trade_volume: tradeVolume,

          tariff_impacts: {
            section_301: {
              rate: section301Impact.rate,
              annual_burden: Math.round(section301Impact.annual_burden),
              exposure: section301Impact.exposure,
              explanation: section301Impact.explanation
            },
            section_232: {
              rate: section232Impact.rate,
              category: section232Impact.category,
              annual_burden: Math.round(section232Impact.annual_burden),
              exposure: section232Impact.exposure
            },
            total_annual_burden: Math.round(totalAnnualBurden)
          },

          supply_chain_vulnerability: {
            level: totalAnnualBurden > tradeVolume * 0.20 ? 'HIGH' :
                   totalAnnualBurden > tradeVolume * 0.10 ? 'MEDIUM' : 'LOW',
            at_risk_components: [originCountry],
            policy_risk: 'Section 301 can escalate with 30 days notice'
          },

          strategic_recommendations: recommendations,

          immediate_actions: [
            'Audit supplier documentation and certificates of origin',
            'Verify freight forwarder USMCA compliance claims',
            'Evaluate nearshoring costs vs current tariff burden',
            'Consider filing CBP Form 29 binding ruling'
          ]
        },
        session_id: sessionId,
        calculated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Crisis calculation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate crisis impact'
      });
    }
  }
});
