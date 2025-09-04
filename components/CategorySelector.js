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
    <div className={`bg-white rounded-lg border border-gray-300 p-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {UI_TEXT.labels.categorySection}
      </label>
    
      {/* Show AI suggestion status */}
      {showAISuggestionStatus && hasAIError && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" aria-hidden="true" />
            <span className="text-sm text-yellow-800">
              AI classification unavailable. Please select a category manually from the dropdown below.
            </span>
          </div>
        </div>
      )}
      
      {showAISuggestionStatus && aiSuggestions.length > 0 && !hasAIError && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-800">
            AI suggested a category above, or manually select a different one below.
          </span>
        </div>
      )}

      {/* Category Selector */}
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={handleSelectChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" aria-hidden="true"></div>
          </div>
        )}
      </div>
      
      {/* Selection Confirmation */}
      {selectedCategory && !isLoading && (
        <div className="mt-2 text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          <span>Category selected: {selectedCategory}</span>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center" role="alert">
          <AlertTriangle className="h-4 w-4 mr-1" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Help Text */}
      <p id="category-help" className="text-xs text-gray-600 mt-2">
        {businessType && businessType !== 'general' ? 
          `Showing categories relevant to ${businessType} business. This dropdown is always available regardless of AI status.` :
          'This dropdown is always available regardless of AI status. Select the category that best matches your product.'
        }
      </p>
      
      {/* No Categories Available */}
      {!isLoading && categories.length === 0 && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
          <AlertTriangle className="h-4 w-4 inline mr-1" aria-hidden="true" />
          No categories available. Please try refreshing the page or contact support.
        </div>
      )}
    </div>
  );
};

export default CategorySelector;