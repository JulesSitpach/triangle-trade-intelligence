/**
 * USMCA Qualification Calculator
 * POST /api/trust/calculate-qualification
 *
 * ✅ Validates component origins and calculates USMCA regional value content (RVC)
 * ✅ Determines if product qualifies under USMCA agreement
 * ✅ Fails loudly with validation errors for missing/invalid data
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';

// USMCA thresholds by industry (from USMCA Agreement Annex 4-B)
const THRESHOLDS = {
  default: 60,
  automotive: 75,
  textiles: 55,
  electronics: 65,
  machinery: 60,
  chemicals: 60,
  metals: 60,
  agriculture: 50
};

// Map HS chapters to industries
const CHAPTER_TO_INDUSTRY = {
  '01': 'agriculture', '02': 'agriculture', '03': 'agriculture', '04': 'agriculture',
  '05': 'agriculture', '06': 'agriculture', '07': 'agriculture', '08': 'agriculture',
  '87': 'automotive',
  '84': 'machinery',   '85': 'electronics',
  '50': 'textiles',    '51': 'textiles',    '52': 'textiles',    '53': 'textiles',
  '54': 'textiles',    '55': 'textiles',    '56': 'textiles',    '57': 'textiles',
  '58': 'textiles',    '59': 'textiles',    '60': 'textiles',    '61': 'textiles',
  '62': 'textiles',    '63': 'textiles',
  '28': 'chemicals',   '29': 'chemicals',   '30': 'chemicals',   '31': 'chemicals',
  '32': 'chemicals',   '33': 'chemicals',   '34': 'chemicals',   '35': 'chemicals',
  '36': 'chemicals',   '37': 'chemicals',   '38': 'chemicals',   '39': 'chemicals',
  '40': 'chemicals',
  '72': 'metals',      '73': 'metals',      '74': 'metals',      '75': 'metals',
  '76': 'metals',      '78': 'metals',      '79': 'metals',      '80': 'metals',
  '81': 'metals',      '82': 'metals',      '83': 'metals'
};

const USMCA_COUNTRIES = ['US', 'CA', 'MX'];

function getIndustryThreshold(hsCode) {
  if (!hsCode || hsCode.length < 2) return THRESHOLDS.default;

  const chapter = hsCode.substring(0, 2);
  const industry = CHAPTER_TO_INDUSTRY[chapter];

  return industry ? (THRESHOLDS[industry] || THRESHOLDS.default) : THRESHOLDS.default;
}

export default protectedApiHandler({
  POST: async (req, res) => {
    try {
      const { component_origins, manufacturing_location, hs_code } = req.body;

      // ✅ VALIDATION: Fail loudly with missing required data
      if (!component_origins || !Array.isArray(component_origins) || component_origins.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'component_origins is required and must be a non-empty array',
          qualified: false
        });
      }

      if (!manufacturing_location) {
        return res.status(400).json({
          success: false,
          error: 'manufacturing_location is required (must be a specific country like US, CA, MX, CN, etc.)',
          qualified: false
        });
      }

      // Validate each component has required fields
      for (let i = 0; i < component_origins.length; i++) {
        const component = component_origins[i];
        if (!component.origin_country) {
          return res.status(400).json({
            success: false,
            error: `Component ${i + 1} missing origin_country`,
            qualified: false
          });
        }
        if (component.value_percentage === undefined || component.value_percentage === null) {
          return res.status(400).json({
            success: false,
            error: `Component ${i + 1} missing value_percentage`,
            qualified: false
          });
        }
      }

      // Calculate regional value content (RVC)
      const rvc = component_origins.reduce((total, component) => {
        if (USMCA_COUNTRIES.includes(component.origin_country)) {
          return total + parseFloat(component.value_percentage || 0);
        }
        return total;
      }, 0);

      // Validate total percentages sum to 100
      const totalPercentage = component_origins.reduce((total, c) =>
        total + parseFloat(c.value_percentage || 0), 0
      );

      // Get threshold for this HS code
      const threshold = hs_code ? getIndustryThreshold(hs_code) : THRESHOLDS.default;

      // Determine qualification status
      const qualified = rvc >= threshold;

      // Determine preference criterion
      let preference_criterion = null;
      if (qualified) {
        if (rvc === 100) {
          preference_criterion = 'A'; // Wholly originating
        } else if (rvc >= threshold) {
          preference_criterion = 'B'; // Regional value content
        }
      }

      return res.status(200).json({
        success: true,
        qualified: qualified,
        regional_value_content: rvc,
        rvc_percentage: rvc,
        threshold_percentage: threshold,
        preference_criterion: preference_criterion,
        component_origins: component_origins,
        manufacturing_location: manufacturing_location,
        total_value_percentage: totalPercentage,
        qualification_details: {
          is_wholly_originating: rvc === 100,
          meets_rvc_threshold: rvc >= threshold,
          usmca_countries_represented: [...new Set(
            component_origins
              .filter(c => USMCA_COUNTRIES.includes(c.origin_country))
              .map(c => c.origin_country)
          )]
        }
      });

    } catch (error) {
      console.error('USMCA qualification calculation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate USMCA qualification',
        qualified: false
      });
    }
  }
});
