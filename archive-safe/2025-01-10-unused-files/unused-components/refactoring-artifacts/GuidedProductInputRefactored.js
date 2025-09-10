import React, { useEffect, useCallback } from 'react';
import { useGuidedProductState } from '../hooks/useGuidedProductState';
import { useProductClassification } from '../hooks/useProductClassification';
import { useProductCategories } from '../hooks/useProductCategories';
import HSCodeEntry from './HSCodeEntry';
import ProductInput from './ProductInput';
import AIAnalysis from './AIAnalysis';
import CategorySelector from './CategorySelector';

import { 
  STYLE_CONFIG, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES,
  QUALITY_THRESHOLDS 
} from '../config/classificationConfig';

/**
 * Refactored GuidedProductInput Component
 * 
 * IMPROVEMENTS:
 * - Replaced 8+ state variables with useReducer (useGuidedProductState)
 * - Split into focused sub-components (HSCodeEntry, ProductInput, AIAnalysis, CategorySelector)
 * - Added proper debouncing (500ms) to prevent API spam
 * - Extracted all hardcoded values to configuration
 * - Implemented proper cleanup functions
 * - Added comprehensive error handling
 * - Improved accessibility with ARIA labels
 * - Added memory leak prevention
 * 
 * Single responsibility: Orchestrate guided product classification workflow
 */
const GuidedProductInputRefactored = ({ 
  value = '', 
  onChange, 
  onCategoryChange, 
  businessType = '',
  sourceCountry = null,
  className = ''
}) => {
  // Consolidated state management
  const { state, actions, computed, helpers } = useGuidedProductState();
  
  // Classification functionality
  const {
    isAnalyzing: classificationAnalyzing,
    aiSuggestions: classificationSuggestions,
    error: classificationError,
    getDynamicHSCodes,
    analyzeProductDescriptionWithCategory,
    submitUserHSCode,
    triggerCompleteUSMCAWorkflow,
    cleanup: cleanupClassification
  } = useProductClassification();

  // Category management
  const {
    availableCategories,
    isLoadingCategories,
    error: categoriesError,
    handleCategoryChange: categoriesHandleCategoryChange,
    cleanup: cleanupCategories
  } = useProductCategories();

  // Sync classification state with local state
  useEffect(() => {
    if (classificationAnalyzing !== state.isAnalyzing) {
      actions.setIsAnalyzing(classificationAnalyzing);
    }
  }, [classificationAnalyzing, state.isAnalyzing, actions]);

  useEffect(() => {
    if (classificationSuggestions !== state.aiSuggestions) {
      actions.setAiSuggestions(classificationSuggestions);
    }
  }, [classificationSuggestions, state.aiSuggestions, actions]);

  useEffect(() => {
    if (classificationError) {
      actions.setError(classificationError);
    }
  }, [classificationError, actions]);

  // Sync category state
  useEffect(() => {
    actions.setAvailableCategories(availableCategories);
  }, [availableCategories, actions]);

  useEffect(() => {
    actions.setIsLoadingCategories(isLoadingCategories);
  }, [isLoadingCategories, actions]);

  useEffect(() => {
    if (categoriesError) {
      actions.setError(categoriesError);
    }
  }, [categoriesError, actions]);

  // Input quality assessment with debouncing
  const handleInputChange = useCallback((newValue) => {
    // Update parent component
    if (onChange) {
      onChange(newValue);
    }

    // Update input quality
    helpers.updateInputAndQuality(newValue);

    // Clear suggestions if input is too short
    if (!newValue || newValue.length < QUALITY_THRESHOLDS.aiTriggerLength) {
      actions.setAiSuggestions([]);
      return;
    }

    // Trigger AI analysis if conditions are met
    if (computed.shouldTriggerAI(newValue, businessType)) {
      console.log('Triggering dynamic HS code detection');
      getDynamicHSCodes(newValue, businessType, sourceCountry).catch(error => {
        console.error('HS code detection failed:', error);
        actions.setError(error.message);
      });
    } else {
      console.log('Not triggering - insufficient length or missing business type');
    }
  }, [onChange, helpers, actions, computed, businessType, getDynamicHSCodes]);

  // Category selection handler
  const handleCategorySelection = useCallback((categoryKey, source = 'manual') => {
    const selectedKey = helpers.handleCategoryChange(categoryKey, source);
    
    // Notify parent component
    if (onCategoryChange) {
      onCategoryChange(selectedKey);
    }

    // Also update categories hook state
    categoriesHandleCategoryChange(selectedKey, source);
    
    // Trigger AI analysis with category context if we have enough input
    if (value && value.length >= QUALITY_THRESHOLDS.categoryAnalysisLength && categoryKey) {
      analyzeProductDescriptionWithCategory(value, categoryKey, businessType).catch(error => {
        console.error('Category analysis failed:', error);
        actions.setError(error.message);
      });
    }
  }, [helpers, onCategoryChange, categoriesHandleCategoryChange, value, businessType, analyzeProductDescriptionWithCategory, actions]);

  // HS Code submission handler
  const handleHSCodeSubmit = useCallback(async (hsCode) => {
    try {
      actions.setIsSubmittingHSCode(true);
      actions.clearError();

      // Submit HS code
      const result = await submitUserHSCode(hsCode, value, businessType);
      
      if (result.success) {
        actions.setUserProvidedHSCode('');
        
        // Trigger complete USMCA workflow
        await triggerCompleteUSMCAWorkflow(hsCode, value, businessType);
        
        // Update parent component
        if (onCategoryChange) {
          onCategoryChange(`User HS Code: ${hsCode}`);
        }
        
        // Show success message
        alert(SUCCESS_MESSAGES.hsCodeSaved);
        
        return result;
      }
    } catch (error) {
      console.error('HS code submission failed:', error);
      actions.setError(error.message);
      throw error;
    } finally {
      actions.setIsSubmittingHSCode(false);
    }
  }, [value, businessType, submitUserHSCode, triggerCompleteUSMCAWorkflow, onCategoryChange, actions]);

  // HS Code selection from AI suggestions
  const handleHSCodeSelection = useCallback((hsSuggestion) => {
    const result = helpers.handleHSCodeSelection(hsSuggestion);
    
    // Notify parent component
    if (onCategoryChange) {
      onCategoryChange(`HS Code: ${result.hs_code} - ${result.category}`);
    }
    
    return result;
  }, [helpers, onCategoryChange]);

  // Clarifying option selection
  const handleClarifyingOptionSelection = useCallback((selectedOption) => {
    return helpers.handleClarifyingOptionSelection(selectedOption);
  }, [helpers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupClassification();
      cleanupCategories();
    };
  }, [cleanupClassification, cleanupCategories]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error('Unhandled error in GuidedProductInput:', event.error);
      actions.setError(ERROR_MESSAGES.networkError);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [actions]);

  return (
    <div className={`${STYLE_CONFIG.spacing.componentGap} ${className}`}>
      {/* HS Code Entry Section */}
      <HSCodeEntry
        onHSCodeSubmit={handleHSCodeSubmit}
        isSubmitting={state.isSubmittingHSCode}
        disabled={computed.isAnyLoading}
      />

      {/* Divider */}
      <div className="text-muted">
        <span className="form-divider">OR</span>
      </div>

      {/* Product Description Input */}
      <ProductInput
        value={value}
        onChange={handleInputChange}
        inputQuality={state.inputQuality}
        disabled={computed.isAnyLoading}
      />

      {/* AI Analysis Results */}
      {(computed.inputHasMinLength(value) || state.isAnalyzing || computed.hasAISuggestions) && (
        <AIAnalysis
          suggestions={state.aiSuggestions}
          isAnalyzing={state.isAnalyzing}
          error={state.error}
          onHSCodeSelection={handleHSCodeSelection}
          onClarifyingOptionSelection={handleClarifyingOptionSelection}
          onCategorySelection={handleCategorySelection}
        />
      )}

      {/* Manual Category Selection */}
      {computed.shouldShowCategorySelector && value.length < QUALITY_THRESHOLDS.aiTriggerLength && (
        <CategorySelector
          categories={state.availableCategories}
          selectedCategory={state.selectedCategory}
          isLoading={state.isLoadingCategories}
          error={state.error}
          businessType={businessType}
          aiSuggestions={state.aiSuggestions}
          onCategoryChange={handleCategorySelection}
        />
      )}

      {/* Error Display */}
      {state.error && !state.isAnalyzing && (
        <div className="status-error" role="alert">
          <p className="text-sm text-red-800">{state.error}</p>
          <button
            onClick={actions.clearError}
            className="text-xs text-red-600 hover:text-red-800 mt-1 underline focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Debug Information (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-muted">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              inputLength: value?.length || 0,
              inputQuality: state.inputQuality,
              businessType,
              suggestionsCount: state.aiSuggestions.length,
              selectedCategory: state.selectedCategory,
              isAnalyzing: state.isAnalyzing,
              availableCategoriesCount: state.availableCategories.length
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default GuidedProductInputRefactored;