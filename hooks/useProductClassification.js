import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  API_CONFIG, 
  DEBOUNCE_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  DEFAULT_WORKFLOW_VALUES,
  QUALITY_THRESHOLDS,
  CONFIDENCE_CONFIG 
} from '../config/classificationConfig';

/**
 * Custom hook for product classification with debouncing, error handling, and cleanup
 * Replaces multiple state variables and API calls from the original component
 */
export const useProductClassification = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [error, setError] = useState(null);
  
  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Generate fallback error response
  const generateFallbackError = useCallback(() => {
    return [{
      category: 'classification_unavailable',
      confidence: 0,
      reason: ERROR_MESSAGES.apiUnavailable,
      isError: true
    }];
  }, []);

  // Generate intelligent follow-up questions
  const generateFollowUpQuestion = useCallback((hsCodesByChapter, productDescription) => {
    const chapters = Object.keys(hsCodesByChapter);
    
    const options = chapters.map(chapter => {
      const codes = hsCodesByChapter[chapter];
      const sampleProduct = codes[0];
      
      return {
        type: 'clarifying_option',
        chapter: chapter,
        option_text: `${sampleProduct.category} (Chapter ${chapter})`,
        description: `${codes.length} matching products`,
        sample_codes: codes.slice(0, 3).map(c => c.hs_code).join(', '),
        codes: codes
      };
    });
    
    return [{
      type: 'clarifying_question',
      question: `I found codes for multiple product categories. Which best describes "${productDescription}"?`,
      options: options
    }];
  }, []);

  // Dynamic HS code detection with debouncing
  const getDynamicHSCodes = useCallback(async (productDescription, businessType, sourceCountry = null) => {
    if (!productDescription || !businessType) return;
    
    // Use config default if no source country provided
    const finalSourceCountry = sourceCountry || DEFAULT_WORKFLOW_VALUES.supplierCountry;
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setIsAnalyzing(true);
      setError(null);
      
      try {
        const response = await fetch('/api/database-driven-usmca-compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'classify_product',
            data: {
              product_description: productDescription,
              business_type: businessType,
              source_country: finalSourceCountry
            }
          }),
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Classification API response:', data); // Debug log
          
          // Handle both original and new API response formats
          const results = data.results || data.classification?.results;
          
          if (data.success && results && results.length > 0) {
            console.log('Hook: Found results:', results.length, 'items');
            // Convert working API format to expected format
            const specificCodes = results.slice(0, 8).map(result => ({
              type: 'specific_code',
              hs_code: result.hs_code,
              description: result.product_description,
              display_text: `${result.hs_code} - ${result.product_description}`,
              usmca_eligible: result.usmca_eligible,
              chapter: result.hs_code.slice(0, 2), // First 2 digits
              category: result.product_description.split(' - ')[0], // Simple category
              confidence: result.confidenceScore > 1 ? Math.round(result.confidenceScore) : Math.round((result.confidenceScore || 0) * 100),
              confidence_label: result.confidenceScore > 0.8 ? 'High' : result.confidenceScore > 0.6 ? 'Medium' : 'Low',
              isDynamicHSCode: true,
              mfn_tariff_rate: result.mfn_tariff_rate,
              usmca_tariff_rate: result.usmca_tariff_rate
            }));
            
            setAiSuggestions(specificCodes);
            console.log('Hook: Set AI suggestions:', specificCodes.length, 'codes'); // Debug log
          } else {
            console.warn('No results from classification API:', data);
            const errorResponse = generateFallbackError();
            setAiSuggestions(errorResponse);
          }
        } else {
          console.warn('Dynamic HS code detection failed');
          const errorResponse = generateFallbackError();
          setAiSuggestions(errorResponse);
          setError(ERROR_MESSAGES.networkError);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Dynamic HS code detection error:', error);
          const errorResponse = generateFallbackError();
          setAiSuggestions(errorResponse);
          setError(ERROR_MESSAGES.networkError);
        }
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    }, DEBOUNCE_CONFIG.aiAnalysis);
  }, [generateFollowUpQuestion, generateFallbackError]);

  // AI analysis with category context
  const analyzeProductDescriptionWithCategory = useCallback(async (description, selectedCategory, businessType) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsAnalyzing(true);
      setError(null);
      
      try {
        const response = await fetch('/api/database-driven-usmca-compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'classify_product',
            data: {
              product_description: description.trim(),
              business_type: businessType || 'general'
            }
          }),
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results && data.results.length > 0) {
            // Convert to expected format
            const suggestions = data.results.map(result => ({
              category: `${result.hs_code} - ${result.product_description}`,
              confidence: result.confidenceScore > 1 ? Math.round(result.confidenceScore) : Math.round((result.confidenceScore || 0) * 100),
              reason: `USMCA eligible: ${result.usmca_eligible ? 'YES' : 'NO'}`,
              hs_code: result.hs_code,
              mfn_tariff_rate: result.mfn_tariff_rate,
              usmca_tariff_rate: result.usmca_tariff_rate
            }));
            setAiSuggestions(suggestions);
          }
        } else {
          console.warn('AI analysis failed within selected category');
          const errorResponse = generateFallbackError();
          setAiSuggestions(errorResponse);
          setError(ERROR_MESSAGES.apiUnavailable);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Category-specific AI analysis error:', error);
          const errorResponse = generateFallbackError();
          setAiSuggestions(errorResponse);
          setError(ERROR_MESSAGES.networkError);
        }
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    }, DEBOUNCE_CONFIG.categorySelection);
  }, [generateFallbackError]);

  // Submit user-provided HS code
  const submitUserHSCode = useCallback(async (hsCode, productDescription, businessType) => {
    if (!hsCode || hsCode.length < QUALITY_THRESHOLDS.hsCodeMinLength) {
      throw new Error(ERROR_MESSAGES.invalidHSCode);
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(API_CONFIG.endpoints.userContributedHSCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hs_code: hsCode.trim(),
          product_description: productDescription,
          business_type: businessType,
          user_confidence: CONFIDENCE_CONFIG.userProvidedConfidence
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return { success: true, hsCode: hsCode.trim() };
        }
      }
      throw new Error('Failed to save HS code');
    } catch (error) {
      console.error('Error submitting user HS code:', error);
      setError(ERROR_MESSAGES.saveHSCodeError);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Trigger complete USMCA workflow
  const triggerCompleteUSMCAWorkflow = useCallback(async (hsCode, productDescription, businessType) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(API_CONFIG.endpoints.trustedComplianceWorkflow, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trusted_complete_workflow',
          data: {
            company_name: DEFAULT_WORKFLOW_VALUES.companyName,
            business_type: businessType,
            supplier_country: DEFAULT_WORKFLOW_VALUES.supplierCountry,
            trade_volume: DEFAULT_WORKFLOW_VALUES.tradeVolume,
            product_description: productDescription,
            user_provided_hs_code: hsCode,
            component_origins: DEFAULT_WORKFLOW_VALUES.componentOrigins,
            manufacturing_location: DEFAULT_WORKFLOW_VALUES.manufacturingLocation
          }
        })
      });

      if (response.ok) {
        const workflowData = await response.json();
        
        if (workflowData.success) {
          // Update AI suggestions with complete results
          setAiSuggestions([{
            category: `${hsCode} - Complete USMCA Analysis`,
            confidence: CONFIDENCE_CONFIG.userProvidedConfidence,
            reason: `USMCA Qualified: ${workflowData.qualification?.qualified ? 'YES' : 'NO'} | Savings: $${workflowData.savings?.annual_savings?.toLocaleString() || '0'}`,
            hsCode: hsCode,
            isUserProvided: true,
            usmcaResults: {
              qualified: workflowData.qualification?.qualified,
              savings: workflowData.savings?.annual_savings,
              certificate: workflowData.certificate_data,
              tariff_rates: workflowData.tariff_rates,
              triangle_opportunities: workflowData.triangle_opportunities
            }
          }]);
          
          return workflowData;
        } else {
          throw new Error(workflowData.error || 'Workflow failed');
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Error triggering USMCA workflow:', error);
      setError(ERROR_MESSAGES.workflowError);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    // State
    isAnalyzing,
    aiSuggestions,
    error,
    
    // Actions
    getDynamicHSCodes,
    analyzeProductDescriptionWithCategory,
    submitUserHSCode,
    triggerCompleteUSMCAWorkflow,
    setAiSuggestions,
    
    // Utilities
    cleanup,
    generateFollowUpQuestion,
    generateFallbackError
  };
};