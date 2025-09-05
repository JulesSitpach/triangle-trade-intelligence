import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  UI_TEXT, 
  A11Y_CONFIG 
} from '../config/classificationConfig';

/**
 * CategorySelector Component
 * Handles manual category selection with loading states and validation
 * Single responsibility: Manual product category selection
 */
const CategorySelector = ({ 
  categories = [], 
  selectedCategory = '', 
  isLoading = false, 
  error = null,
  businessType = '',
  aiSuggestions = [],
  onCategoryChange,
  className = '',
  showAISuggestionStatus = true
}) => {
  const handleSelectChange = (e) => {
    const categoryValue = e.target.value;
    if (onCategoryChange) {
      onCategoryChange(categoryValue, 'manual');
    }
  };

  const hasDynamicHSCodes = aiSuggestions.some(s => s.isDynamicHSCode);
  const hasAIError = aiSuggestions.some(s => s.isError);

  // Don't show if we have dynamic HS codes (AI found specific codes)
  if (hasDynamicHSCodes) {
    return null;
  }

  return (
    <div className={`form-section ${className}`}>
      <label className="form-label">
        {UI_TEXT.labels.categorySection}
      </label>
    
      {/* Show AI suggestion status */}
      {showAISuggestionStatus && hasAIError && (
        <div className="alert alert-warning" style={{marginBottom: '0.75rem'}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <AlertTriangle className="alert-icon icon-sm" aria-hidden="true" />
            <span className="text-body">
              AI classification unavailable. Please select a category manually from the dropdown below.
            </span>
          </div>
        </div>
      )}
      
      {showAISuggestionStatus && aiSuggestions.length > 0 && !hasAIError && (
        <div className="alert alert-info" style={{marginBottom: '0.75rem'}}>
          <span className="text-body">
            AI suggested a category above, or manually select a different one below.
          </span>
        </div>
      )}

      {/* Category Selector */}
      <div className="form-input-container">
        <select
          value={selectedCategory}
          onChange={handleSelectChange}
          disabled={isLoading}
          className="form-select"
          aria-label={A11Y_CONFIG.ariaLabels.categorySelect}
          aria-describedby="category-help"
        >
          <option value="">{UI_TEXT.placeholders.categorySelect}</option>
          {isLoading ? (
            <option disabled>Loading categories...</option>
          ) : (
            categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.product_count || 0} products)
              </option>
            ))
          )}
        </select>
        
        {isLoading && (
          <div style={{position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)'}}>
            <div className="loading-spinner" aria-hidden="true"></div>
          </div>
        )}
      </div>
      
      {/* Selection Confirmation */}
      {selectedCategory && !isLoading && (
        <div className="alert alert-success" style={{marginTop: '0.5rem', padding: '0.5rem'}}>
          <CheckCircle className="alert-icon icon-sm" aria-hidden="true" />
          <span>Category selected: {selectedCategory}</span>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="alert alert-error" style={{marginTop: '0.5rem', padding: '0.5rem'}} role="alert">
          <AlertTriangle className="alert-icon icon-sm" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Help Text */}
      <p id="category-help" className="form-help" style={{marginTop: '0.5rem'}}>
        {businessType && businessType !== 'general' ? 
          `Showing categories relevant to ${businessType} business. This dropdown is always available regardless of AI status.` :
          'This dropdown is always available regardless of AI status. Select the category that best matches your product.'
        }
      </p>
      
      {/* No Categories Available */}
      {!isLoading && categories.length === 0 && (
        <div className="alert" style={{marginTop: '0.5rem', padding: '0.5rem'}}>
          <AlertTriangle className="alert-icon icon-sm" aria-hidden="true" style={{display: 'inline', marginRight: '0.25rem'}} />
          No categories available. Please try refreshing the page or contact support.
        </div>
      )}
    </div>
  );
};

export default CategorySelector;