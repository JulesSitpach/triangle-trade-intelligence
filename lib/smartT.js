/**
 * SMART TRANSLATION FUNCTION
 * Advanced fallback system with English defaults for rapid development
 * Automatically generates sensible fallbacks from translation keys
 */

import { useSafeTranslation } from '../hooks/useSafeTranslation'

// English fallback mappings for common keys
const ENGLISH_FALLBACKS = {
  // Navigation
  'nav.home': 'Home',
  'nav.about': 'About', 
  'nav.dashboard': 'Dashboard',
  'nav.foundation': 'Foundation',
  'nav.product': 'Product',
  'nav.routing': 'Routing',
  'nav.partnership': 'Partnership',
  'nav.hindsight': 'Hindsight',
  'nav.alerts': 'Alerts',
  'nav.pricing': 'Pricing',
  'nav.contact': 'Contact',
  
  // Actions
  'actions.next': 'Next',
  'actions.back': 'Back',
  'actions.continue': 'Continue',
  'actions.getStarted': 'Get Started',
  'actions.save': 'Save',
  'actions.cancel': 'Cancel',
  'actions.submit': 'Submit',
  'actions.calculate': 'Calculate',
  'actions.analyze': 'Analyze',
  'actions.optimize': 'Optimize',
  
  // Status
  'status.loading': 'Loading...',
  'status.processing': 'Processing...',
  'status.searching': 'Searching...',
  'status.analyzing': 'Analyzing...',
  'status.connected': 'Connected',
  'status.ready': 'Ready',
  'status.active': 'Active',
  'status.complete': 'Complete',
  'status.success': 'Success',
  'status.error': 'Error',
  
  // Common forms
  'form.companyName': 'Company Name',
  'form.businessType': 'Business Type',
  'form.industry': 'Industry',
  'form.email': 'Email Address',
  'form.phone': 'Phone Number',
  'form.location': 'Location',
  'form.zipCode': 'ZIP Code',
  'form.required': 'Required',
  'form.optional': 'Optional',
  
  // Foundation page
  'foundation.title': 'Business Intelligence Foundation',
  'foundation.subtitle': 'Complete your profile to unlock optimization',
  'foundation.businessProfile': 'Business Profile',
  'foundation.companyName': 'Company Name',
  'foundation.industry': 'Industry',
  'foundation.location': 'Business Location',
  'foundation.supplierCountry': 'Primary Supplier Country',
  'foundation.importVolume': 'Annual Import Volume',
  'foundation.optimization': 'Optimization Priority',
  
  // Product page
  'product.title': 'Product Classification Intelligence',
  'product.subtitle': 'HS code mapping with trade flow intelligence',
  'product.description': 'Product Description',
  'product.hsCode': 'HS Code',
  'product.confidence': 'Confidence',
  'product.addProduct': 'Add Product',
  'product.runAnalysis': 'Run Analysis',
  'product.analyzing': 'Analyzing...',
  
  // Routing page
  'routing.title': 'Route Analysis Intelligence',
  'routing.subtitle': 'USMCA triangle routing optimization',
  'routing.analysis': 'Route Analysis',
  'routing.recommendations': 'Recommendations',
  'routing.savings': 'Annual Savings',
  'routing.tariffRate': 'Tariff Rate',
  'routing.transitTime': 'Transit Time',
  'routing.complexity': 'Complexity',
  
  // Partnership page
  'partnership.title': 'Partnership Ecosystem',
  'partnership.subtitle': 'Connect with strategic partners',
  'partnership.canada': 'Canada Opportunities',
  'partnership.mexico': 'Mexico Opportunities',
  'partnership.advantages': 'Advantages',
  'partnership.timeline': 'Timeline',
  'partnership.savings': 'Annual Savings',
  
  // Alerts page
  'alerts.title': 'Intelligent Alerts',
  'alerts.subtitle': 'Pattern-based monitoring and notifications',
  'alerts.addAlert': 'Add Alert',
  'alerts.alertType': 'Alert Type',
  'alerts.priority': 'Priority Level',
  'alerts.frequency': 'Frequency',
  'alerts.configure': 'Configure Alert',
  
  // Dashboard Hub
  'dashboard.title': 'Intelligence Command Center',
  'dashboard.subtitle': 'Live savings tracking and market monitoring',
  'dashboard.businessSetup': 'Business Setup',
  'dashboard.productOptimization': 'Product Optimization',
  'dashboard.triangleAnalysis': 'Triangle Analysis',
  'dashboard.systemStatus': 'System Status',
  'dashboard.liveData': 'Live Data',
  
  // General metrics
  'metrics.savings': 'Savings',
  'metrics.confidence': 'Confidence',
  'metrics.records': 'Records',
  'metrics.success': 'Success Rate',
  'metrics.value': 'Value',
  'metrics.volume': 'Volume',
  
  // Flat status indicators (recently added)
  'intelligence': 'Intelligence',
  'monitoring': 'Monitoring', 
  'database': 'Database',
  'connected': 'Connected',
  'routes': 'Routes',
  'validated': 'Validated'
}

/**
 * Smart translation function with intelligent English fallbacks
 * Note: This is a factory function that should be used with translation context
 * @param {Function} t - Translation function from useSafeTranslation hook
 * @returns {Function} - Smart translation function bound to translation context
 */
export function createSmartT(t) {
  return function smartT(key, customFallback = null) {
    try {
      // First try the translation system
      const translation = t(key)
      if (translation && translation !== key) {
        return translation
      }
      
      // If custom fallback provided, use it
      if (customFallback) {
        return customFallback
      }
      
      // Check predefined English fallbacks
      if (ENGLISH_FALLBACKS[key]) {
        return ENGLISH_FALLBACKS[key]
      }
      
      // Generate smart fallback from key structure
      return generateSmartFallback(key)
      
    } catch (error) {
      console.warn(`smartT fallback for key: ${key}`, error)
      return customFallback || generateSmartFallback(key)
    }
  }
}

/**
 * Legacy smartT function - DEPRECATED
 * Use createSmartT with translation context instead
 * @param {string} key - Translation key (e.g., 'foundation.title')
 * @param {string} customFallback - Optional custom fallback text
 * @returns {string} - Fallback text only (cannot access live translations)
 */
export function smartT(key, customFallback = null) {
  console.warn('smartT: Using legacy mode without translation context. Consider using createSmartT() instead.')
  
  // If custom fallback provided, use it
  if (customFallback) {
    return customFallback
  }
  
  // Check predefined English fallbacks
  if (ENGLISH_FALLBACKS[key]) {
    return ENGLISH_FALLBACKS[key]
  }
  
  // Generate smart fallback from key structure
  return generateSmartFallback(key)
}

/**
 * Generate intelligent fallback from translation key
 * @param {string} key - Translation key
 * @returns {string} - Human-readable fallback
 */
function generateSmartFallback(key) {
  if (!key || typeof key !== 'string') {
    return 'Text'
  }
  
  // Split by dots and take the last part
  const parts = key.split('.')
  const lastPart = parts[parts.length - 1]
  
  // Convert camelCase/snake_case to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1') // camelCase -> camel Case
    .replace(/_/g, ' ') // snake_case -> snake case
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/\b\w/g, str => str.toUpperCase()) // Title Case
    .trim()
}

/**
 * React hook version of smartT for use in components
 * Properly integrates with i18n translation system
 */
export function useSmartT() {
  const { t } = useSafeTranslation('common')
  const smartT = createSmartT(t)
  return { smartT, t }
}

/**
 * Add new fallback mappings at runtime
 * @param {Object} mappings - Key-value pairs for fallbacks
 */
export function addFallbackMappings(mappings) {
  Object.assign(ENGLISH_FALLBACKS, mappings)
}

export default smartT