/**
 * USMCA Qualification Thresholds
 * GET /api/trust/usmca-thresholds
 *
 * Returns the industry-specific regional content thresholds and qualification rules
 * for USMCA Certificate of Origin
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';

/**
 * USMCA Qualification Thresholds by Industry
 * Regional Content (RVC) requirements as percentage
 * Source: USMCA agreement Annex 4-B
 */
const USMCA_THRESHOLDS = {
  default: 60, // Default requirement: 60% regional content

  // Industry-specific thresholds (higher requirements for strategic products)
  automotive: 75,           // Vehicles & automotive parts
  textiles: 55,             // Apparel & textiles
  electronics: 65,          // Electronics & electrical machinery
  machinery: 60,            // Machinery & mechanical appliances
  chemicals: 60,            // Chemicals & plastics
  metals: 60,               // Metals & articles
  agriculture: 50,          // Agricultural products (lower requirement)

  // HS code chapter mapping to industry
  chapter_mapping: {
    '01': 'agriculture',  '02': 'agriculture',  '03': 'agriculture',  '04': 'agriculture',
    '05': 'agriculture',  '06': 'agriculture',  '07': 'agriculture',  '08': 'agriculture',
    '09': 'agriculture',  '10': 'agriculture',  '11': 'agriculture',  '12': 'agriculture',
    '13': 'agriculture',  '14': 'agriculture',  '15': 'agriculture',  '16': 'agriculture',
    '17': 'agriculture',  '18': 'agriculture',  '19': 'agriculture',  '20': 'agriculture',
    '21': 'agriculture',  '22': 'agriculture',  '23': 'agriculture',  '24': 'agriculture',

    '28': 'chemicals',    '29': 'chemicals',    '30': 'chemicals',    '31': 'chemicals',
    '32': 'chemicals',    '33': 'chemicals',    '34': 'chemicals',    '35': 'chemicals',
    '36': 'chemicals',    '37': 'chemicals',    '38': 'chemicals',    '39': 'chemicals',
    '40': 'chemicals',

    '50': 'textiles',     '51': 'textiles',     '52': 'textiles',     '53': 'textiles',
    '54': 'textiles',     '55': 'textiles',     '56': 'textiles',     '57': 'textiles',
    '58': 'textiles',     '59': 'textiles',     '60': 'textiles',     '61': 'textiles',
    '62': 'textiles',     '63': 'textiles',

    '72': 'metals',       '73': 'metals',       '74': 'metals',       '75': 'metals',
    '76': 'metals',       '78': 'metals',       '79': 'metals',       '80': 'metals',
    '81': 'metals',       '82': 'metals',       '83': 'metals',

    '84': 'machinery',    '85': 'electronics',

    '87': 'automotive'
  }
};

/**
 * USMCA Preference Criteria
 * Requirement: Product must qualify under at least ONE criterion
 */
const PREFERENCE_CRITERIA = {
  A: {
    name: 'Wholly Originating',
    description: 'Product wholly produced/obtained in USMCA territory',
    requirement: 'All materials originate from US, Canada, or Mexico'
  },
  B: {
    name: 'Regional Value Content',
    description: 'Product meets RVC threshold and other requirements',
    requirement: 'RVC ≥ industry threshold (60% default)'
  },
  C: {
    name: 'Intermediate Materials',
    description: 'Product produced from USMCA-originating intermediate materials',
    requirement: 'Intermediate materials originate from USMCA territory'
  },
  D: {
    name: 'Accumulation',
    description: 'Eligible articles produced in one USMCA country used in another',
    requirement: 'Value added in all USMCA countries accumulates toward RVC'
  }
};

/**
 * Get threshold for a specific HS code
 */
function getThresholdByHSCode(hsCode) {
  if (!hsCode || hsCode.length < 2) {
    return USMCA_THRESHOLDS.default;
  }

  const chapter = hsCode.substring(0, 2);
  const industry = USMCA_THRESHOLDS.chapter_mapping[chapter];

  if (industry && USMCA_THRESHOLDS[industry]) {
    return USMCA_THRESHOLDS[industry];
  }

  return USMCA_THRESHOLDS.default;
}

export default protectedApiHandler({
  GET: async (req, res) => {
    try {
      const { hs_code } = req.query;

      // If HS code provided, return specific threshold
      if (hs_code) {
        const threshold = getThresholdByHSCode(hs_code);
        return res.status(200).json({
          success: true,
          hs_code: hs_code,
          threshold_percentage: threshold,
          preference_criteria: PREFERENCE_CRITERIA,
          all_thresholds: USMCA_THRESHOLDS
        });
      }

      // Return all thresholds
      return res.status(200).json({
        success: true,
        thresholds: USMCA_THRESHOLDS,
        preference_criteria: PREFERENCE_CRITERIA,
        default_threshold: USMCA_THRESHOLDS.default
      });

    } catch (error) {
      console.error('Error retrieving USMCA thresholds:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve USMCA thresholds'
      });
    }
  }
});
