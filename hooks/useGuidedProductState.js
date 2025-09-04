import { useReducer, useCallback } from 'react';
import { QUALITY_THRESHOLDS } from '../config/classificationConfig';

/**
 * Consolidated state management for GuidedProductInput using useReducer
 * Replaces 8+ individual useState variables with a single state object
 */

// Action types
export const ACTIONS = {
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_INPUT_QUALITY: 'SET_INPUT_QUALITY',
  SET_AI_SUGGESTIONS: 'SET_AI_SUGGESTIONS',
  SET_IS_ANALYZING: 'SET_IS_ANALYZING',
  SET_AVAILABLE_CATEGORIES: 'SET_AVAILABLE_CATEGORIES',
  SET_IS_LOADING_CATEGORIES: 'SET_IS_LOADING_CATEGORIES',
  SET_USER_PROVIDED_HS_CODE: 'SET_USER_PROVIDED_HS_CODE',
  SET_IS_SUBMITTING_HS_CODE: 'SET_IS_SUBMITTING_HS_CODE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE',
  BATCH_UPDATE: 'BATCH_UPDATE'
};

// Initial state
const initialState = {
  selectedCategory: '',
  inputQuality: '',
  aiSuggestions: [],
  isAnalyzing: false,
  availableCategories: [],
  isLoadingCategories: true,
  userProvidedHSCode: '',
  isSubmittingHSCode: false,
  error: null,
  lastAnalyzedInput: '',
  analysisTimestamp: null
};

// Quality assessment function
const assessInputQuality = (input) => {
  if (!input) return '';
  
  const words = input.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  
  if (wordCount >= QUALITY_THRESHOLDS.excellentQuality) {
    return 'excellent';
  } else if (wordCount >= QUALITY_THRESHOLDS.goodQuality) {
    return 'good';
  } else if (wordCount >= QUALITY_THRESHOLDS.basicQuality) {
    return 'basic';
  } else {
    return 'needs_detail';
  }
};

// Reducer function
const guidedProductReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_SELECTED_CATEGORY:
      return {
        ...state,
        selectedCategory: action.payload,
        error: null // Clear errors when user makes a selection
      };

    case ACTIONS.SET_INPUT_QUALITY:
      return {
        ...state,
        inputQuality: action.payload
      };

    case ACTIONS.SET_AI_SUGGESTIONS:
      return {
        ...state,
        aiSuggestions: action.payload,
        analysisTimestamp: Date.now(),
        error: null
      };

    case ACTIONS.SET_IS_ANALYZING:
      return {
        ...state,
        isAnalyzing: action.payload,
        // Clear previous error when starting new analysis
        error: action.payload ? null : state.error
      };

    case ACTIONS.SET_AVAILABLE_CATEGORIES:
      return {
        ...state,
        availableCategories: action.payload,
        error: null
      };

    case ACTIONS.SET_IS_LOADING_CATEGORIES:
      return {
        ...state,
        isLoadingCategories: action.payload
      };

    case ACTIONS.SET_USER_PROVIDED_HS_CODE:
      return {
        ...state,
        userProvidedHSCode: action.payload,
        error: null // Clear errors when user starts typing
      };

    case ACTIONS.SET_IS_SUBMITTING_HS_CODE:
      return {
        ...state,
        isSubmittingHSCode: action.payload,
        error: action.payload ? null : state.error
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isAnalyzing: false,
        isSubmittingHSCode: false,
        isLoadingCategories: false
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ACTIONS.RESET_STATE:
      return {
        ...initialState,
        // Preserve categories if they were loaded
        availableCategories: state.availableCategories,
        isLoadingCategories: state.availableCategories.length === 0
      };

    case ACTIONS.BATCH_UPDATE:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

/**
 * Custom hook for guided product input state management
 */
export const useGuidedProductState = () => {
  const [state, dispatch] = useReducer(guidedProductReducer, initialState);

  // Action creators (memoized for performance)
  const actions = {
    setSelectedCategory: useCallback((category) => {
      dispatch({ type: ACTIONS.SET_SELECTED_CATEGORY, payload: category });
    }, []),

    setInputQuality: useCallback((input) => {
      const quality = assessInputQuality(input);
      dispatch({ type: ACTIONS.SET_INPUT_QUALITY, payload: quality });
    }, []),

    setAiSuggestions: useCallback((suggestions) => {
      dispatch({ type: ACTIONS.SET_AI_SUGGESTIONS, payload: suggestions });
    }, []),

    setIsAnalyzing: useCallback((isAnalyzing) => {
      dispatch({ type: ACTIONS.SET_IS_ANALYZING, payload: isAnalyzing });
    }, []),

    setAvailableCategories: useCallback((categories) => {
      dispatch({ type: ACTIONS.SET_AVAILABLE_CATEGORIES, payload: categories });
    }, []),

    setIsLoadingCategories: useCallback((isLoading) => {
      dispatch({ type: ACTIONS.SET_IS_LOADING_CATEGORIES, payload: isLoading });
    }, []),

    setUserProvidedHSCode: useCallback((hsCode) => {
      dispatch({ type: ACTIONS.SET_USER_PROVIDED_HS_CODE, payload: hsCode });
    }, []),

    setIsSubmittingHSCode: useCallback((isSubmitting) => {
      dispatch({ type: ACTIONS.SET_IS_SUBMITTING_HS_CODE, payload: isSubmitting });
    }, []),

    setError: useCallback((error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: ACTIONS.RESET_STATE });
    }, []),

    batchUpdate: useCallback((updates) => {
      dispatch({ type: ACTIONS.BATCH_UPDATE, payload: updates });
    }, [])
  };

  // Computed values
  const computed = {
    hasAISuggestions: state.aiSuggestions.length > 0,
    hasDynamicHSCodes: state.aiSuggestions.some(s => s.isDynamicHSCode),
    hasError: state.aiSuggestions.some(s => s.isError),
    shouldShowCategorySelector: !state.aiSuggestions.some(s => s.isDynamicHSCode),
    isAnyLoading: state.isAnalyzing || state.isLoadingCategories || state.isSubmittingHSCode,
    canSubmitHSCode: state.userProvidedHSCode.trim().length >= QUALITY_THRESHOLDS.hsCodeMinLength && !state.isSubmittingHSCode,
    inputHasMinLength: (input) => input && input.length >= QUALITY_THRESHOLDS.aiTriggerLength,
    shouldTriggerAI: (input, businessType) => 
      input && 
      input.length >= QUALITY_THRESHOLDS.aiTriggerLength && 
      businessType && 
      input !== state.lastAnalyzedInput
  };

  // Helper functions
  const helpers = {
    assessInputQuality,
    
    updateInputAndQuality: useCallback((input) => {
      const quality = assessInputQuality(input);
      dispatch({ 
        type: ACTIONS.BATCH_UPDATE, 
        payload: { 
          inputQuality: quality,
          lastAnalyzedInput: input
        }
      });
    }, []),

    handleCategoryChange: useCallback((categoryKey, source = 'manual') => {
      actions.setSelectedCategory(categoryKey);
      console.log(`Category selected: ${categoryKey} (${source})`);
      return categoryKey;
    }, [actions.setSelectedCategory]),

    handleHSCodeSelection: useCallback((hsSuggestion) => {
      console.log(`HS Code selected: ${hsSuggestion.hs_code} from Chapter ${hsSuggestion.chapter}`);
      
      const categoryDisplay = `HS Code: ${hsSuggestion.hs_code} - ${hsSuggestion.category}`;
      actions.setSelectedCategory(categoryDisplay);
      
      // Keep only selected suggestion
      actions.setAiSuggestions([hsSuggestion]);
      
      return hsSuggestion;
    }, [actions.setSelectedCategory, actions.setAiSuggestions]),

    handleClarifyingOptionSelection: useCallback((selectedOption) => {
      console.log(`User selected chapter ${selectedOption.chapter}: ${selectedOption.option_text}`);
      
      // Show specific codes from selected chapter
      const specificCodes = selectedOption.codes.slice(0, 8).map(hsCode => ({
        type: 'specific_code',
        hs_code: hsCode.hs_code,
        description: hsCode.description,
        display_text: hsCode.display_text,
        usmca_eligible: hsCode.usmca_eligible,
        chapter: hsCode.chapter,
        category: hsCode.category,
        confidence: hsCode.confidence,
        confidence_label: hsCode.confidence_label,
        isDynamicHSCode: true
      }));
      
      actions.setAiSuggestions(specificCodes);
      return specificCodes;
    }, [actions.setAiSuggestions])
  };

  return {
    state,
    actions,
    computed,
    helpers,
    dispatch
  };
};