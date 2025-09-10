import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  UI_TEXT, 
  STYLE_CONFIG, 
  A11Y_CONFIG, 
  QUALITY_INDICATORS,
  DISPLAY_CONFIG,
  QUALITY_THRESHOLDS 
} from '../config/classificationConfig';

/**
 * ProductInput Component
 * Handles product description input with quality assessment
 * Single responsibility: Product description input and quality feedback
 */
const ProductInput = ({ 
  value = '', 
  onChange, 
  inputQuality = '',
  disabled = false,
  className = '',
  showQualityHelp = true
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Get quality indicator configuration
  const currentQuality = QUALITY_INDICATORS[inputQuality];
  const QualityIcon = currentQuality ? (inputQuality === 'needs_detail' || inputQuality === 'basic' ? AlertTriangle : CheckCircle) : null;

  // Calculate word count for display
  const wordCount = value ? value.trim().split(/\s+/).length : 0;
  const minWords = QUALITY_THRESHOLDS.basicQuality;

  return (
    <div className={`${STYLE_CONFIG.spacing.componentGap} ${className}`}>
      <label className="form-label">
        {UI_TEXT.labels.productDescSection}
      </label>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={UI_TEXT.placeholders.productDescription}
          rows={DISPLAY_CONFIG.textAreaRows}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          aria-label={A11Y_CONFIG.ariaLabels.productInput}
          aria-describedby="product-input-help"
          maxLength={1000} // Prevent excessively long inputs
        />
        
        {/* Word counter */}
        <div className="text-muted">
          {wordCount} words
        </div>
      </div>
      
      {/* Quality Indicator */}
      {currentQuality && QualityIcon && (
        <div 
          className={`flex items-center mt-2 text-sm ${currentQuality.color}`}
          role="status"
          aria-label={A11Y_CONFIG.ariaLabels.qualityIndicator}
        >
          <QualityIcon className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
          <span>{currentQuality.message}</span>
        </div>
      )}

      {/* Help text - conditionally shown */}
      {showQualityHelp && (!value || value.length < QUALITY_THRESHOLDS.aiTriggerLength) && (
        <div id="product-input-help" className="text-muted form-help">
          <p className="font-medium mb-1">For accurate AI classification, include:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li><strong>Materials:</strong> leather, cotton, rubber, metal, plastic, etc.</li>
            <li><strong>Construction:</strong> stitched, molded, woven, assembled, etc.</li>
            <li><strong>Intended use:</strong> athletic, industrial, decorative, protective, etc.</li>
            <li><strong>Key features:</strong> waterproof, adjustable, rechargeable, etc.</li>
          </ul>
          <p className="text-muted">
            Current: {wordCount} words | Recommended: {minWords}+ words for good classification
          </p>
        </div>
      )}

      {/* Progressive enhancement message */}
      {value.length >= QUALITY_THRESHOLDS.aiTriggerLength && (
        <div className="text-xs text-blue-600 mt-1" role="status">
          AI analysis will begin automatically...
        </div>
      )}
    </div>
  );
};

export default ProductInput;