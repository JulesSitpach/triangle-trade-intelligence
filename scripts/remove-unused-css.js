const fs = require('fs');

// List of unused classes to remove
const unusedClasses = [
  'agent-green', 'agent-red', 'agent-yellow', 'ai-explanation-inline',
  'ai-suggestion-actions', 'ai-suggestion-box', 'ai-suggestion-header',
  'ai-suggestion-main', 'alt-code', 'alt-reason', 'alternative-codes-section',
  'alternative-codes-title', 'alternative-item', 'alternative-option',
  'alternatives-list', 'article-content', 'bg-white', 'btn-accept-code',
  'btn-expert', 'btn-google', 'btn-group', 'chat-message-user',
  'component-breakdown-table', 'confidence-bar', 'confidence-fill',
  'confidence-green', 'confidence-label', 'confidence-red', 'confidence-text',
  'confidence-value', 'confidence-yellow', 'confirm-icon-danger',
  'confirm-icon-info', 'confirm-icon-warning', 'consent-modal-button',
  'consent-modal-description', 'consent-modal-options', 'consent-modal-privacy',
  'consent-modal-title', 'consent-option', 'consent-option-content',
  'consent-option-details', 'consent-option-list', 'consent-option-radio',
  'consent-option-title', 'country-badge', 'error-suggestion',
  'expert-recommendation', 'filter-section', 'flex-between', 'flex-center',
  'flex-col-gap', 'flex-gap-2', 'flex-gap-3', 'hero-gradient-text',
  'hero-sub-title', 'hs-code-details-grid', 'hs-code-option',
  'hs-code-option-header', 'hs-code-result', 'hs-description',
  'input-prefix', 'input-toggle-btn', 'input-with-prefix', 'input-wrapper',
  'insights-button-group', 'insights-image', 'insights-layout',
  'list-simple', 'metric-urgent', 'modal-footer-text',
  'nav-cta-button', 'orchestration-error', 'orchestration-info',
  'orchestration-loading', 'orchestration-status', 'orchestration-success',
  'orchestration-warning', 'pagination-btn', 'pagination-controls',
  'percentage-badge', 'privacy-info-box', 'privacy-info-checkbox',
  'privacy-info-content', 'privacy-info-disclaimer', 'privacy-info-label',
  'privacy-info-list', 'privacy-info-text', 'privacy-info-title',
  'professional-services-cta', 'professional-services-cta-description',
  'professional-services-cta-title', 'progress-bar-text',
  'progress-bar-threshold', 'qualification-badge', 'recommendation-details',
  'recommendation-header', 'recommendation-icon', 'recommendation-item',
  'recommendation-reason', 'recommendation-title', 'screenshot-caption',
  'search-section', 'service-price', 'service-type', 'status-confidence',
  'status-content', 'status-high', 'status-icon', 'status-medium',
  'status-message', 'status-next-step', 'status-not-qualified',
  'status-qualified', 'suggestion-alternatives', 'suggestion-source',
  'table-controls', 'tariff-comparison', 'tariff-info-inline',
  'tariff-item', 'tariff-note', 'text-danger', 'text-left', 'text-navy',
  'urgency-badge', 'urgency-high', 'urgency-low', 'urgency-medium',
  'validation-body', 'validation-confidence', 'validation-footer',
  'validation-header', 'validation-panel', 'validation-success',
  'validation-title', 'validation-warning', 'validation-warnings',
  'warning-content', 'warning-item', 'warning-list', 'warning-suggestion',
  'warning-title', 'mt-3', 'mt-4', 'mt-6', 'mt-8', 'p-2', 'p-3', 'p-6', 'p-8'
];

console.log(`Will remove ${unusedClasses.length} unused CSS classes...`);
console.log('This is a DRY RUN - creates globals-cleaned.css for review\n');

let cssContent = fs.readFileSync('styles/globals.css', 'utf8');
const originalLength = cssContent.length;
let removedCount = 0;

unusedClasses.forEach(className => {
  // Pattern to match the entire CSS rule block
  const pattern = new RegExp(`\\.${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*\\}\\s*`, 'g');
  const beforeLength = cssContent.length;
  cssContent = cssContent.replace(pattern, '');
  const afterLength = cssContent.length;

  if (beforeLength !== afterLength) {
    removedCount++;
    console.log(`✓ Removed .${className} (${beforeLength - afterLength} bytes)`);
  }
});

const savedBytes = originalLength - cssContent.length;
console.log(`\nRemoved ${removedCount} classes`);
console.log(`Total bytes saved: ${savedBytes} (${(savedBytes / 1024).toFixed(2)} KB)`);
console.log(`Original: ${(originalLength / 1024).toFixed(2)} KB`);
console.log(`New size: ${(cssContent.length / 1024).toFixed(2)} KB`);

// Write to a new file for review
fs.writeFileSync('styles/globals-cleaned.css', cssContent);
console.log('\n✓ Written to styles/globals-cleaned.css for review');
console.log('If it looks good, run: mv styles/globals-cleaned.css styles/globals.css');
