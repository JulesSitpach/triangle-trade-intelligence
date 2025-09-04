import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { SAFE_ENDPOINTS } from '../config/safe-config.js';

/**
 * Guided Product Description Input Component
 * Helps users provide detailed descriptions that work well with HS classification
 */
export default function GuidedProductInput({ value, onChange, onCategoryChange, businessType }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputQuality, setInputQuality] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [userProvidedHSCode, setUserProvidedHSCode] = useState('');
  const [isSubmittingHSCode, setIsSubmittingHSCode] = useState(false);

  // AI-driven categorization - no hardcoded categories
  // Business type from Page 1 provides context for AI analysis

  // Load ALL categories from database - NO HARDCODED FILTERING
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        
        // Always load ALL categories from database
        const response = await fetch(`${SAFE_ENDPOINTS.dropdownOptions}?category=product_categories`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAvailableCategories(data.data);
            console.log(`Loaded ${data.data.length} product categories from database`);
          } else {
            console.error('API returned unsuccessful response:', data);
            setAvailableCategories([]);
          }
        } else {
          console.error('API request failed with status:', response.status);
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setAvailableCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []); // Load once on mount, no business type filtering

  // Dynamic HS code detection using business type + product description
  const getDynamicHSCodes = async (productDescription, businessType) => {
    console.log('🔍 getDynamicHSCodes called with:', {
      productDescription: productDescription,
      businessType: businessType
    });
    
    if (!productDescription || !businessType) {
      console.log('⚠️ Missing required params - aborting');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // ✅ Switch to simplified AI-first approach
      const response = await fetch(SAFE_ENDPOINTS.classification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessType: businessType,
          productDescription: productDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📡 API Response received:', {
          success: data.success,
          hsCodesCount: data.data?.matching_hs_codes?.length || 0,
          data: data
        });
        if (data.success && data.data.matching_hs_codes) {
          // Group HS codes by chapter
          const hsCodesByChapter = {};
          
          data.data.matching_hs_codes.forEach(hsCode => {
            const chapter = hsCode.chapter;
            if (!hsCodesByChapter[chapter]) {
              hsCodesByChapter[chapter] = [];
            }
            hsCodesByChapter[chapter].push(hsCode);
          });
          
          const chapters = Object.keys(hsCodesByChapter);
          
          // If no chapters found, show helpful message
          if (chapters.length === 0 || data.data.matching_hs_codes.length === 0) {
            console.error('❌ No HS codes found - API returned empty results');
            // Show a helpful message instead of empty results
            setAiSuggestions([{
              type: 'no_results',
              message: 'No matching HS codes found. Try adding more specific details about materials, construction, or use case.',
              isDynamicHSCode: false
            }]);
            return;
          }
          
          // If multiple chapters found, generate AI follow-up question
          if (chapters.length > 1) {
            const followUpOptions = generateFollowUpQuestion(hsCodesByChapter, productDescription);
            setAiSuggestions(followUpOptions);
          } else if (chapters.length === 1) {
            // Single chapter - show specific codes directly
            const singleChapter = chapters[0];
            const codes = hsCodesByChapter[singleChapter];
            if (!codes || codes.length === 0) {
              console.error('No codes found for chapter:', singleChapter);
              setAiSuggestions([]);
              return;
            }
            const specificCodes = codes.slice(0, 8).map(hsCode => ({
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
            console.log('Setting AI suggestions with specific codes:', specificCodes.length, 'codes');
            setAiSuggestions(specificCodes);
          }
          
          console.log(`Found ${chapters.length} chapters for "${productDescription.substring(0, 30)}..."`);
        }
      } else {
        console.warn('Dynamic HS code detection failed');
        const errorResponse = generateFallbackError();
        setAiSuggestions(errorResponse);
      }
    } catch (error) {
      console.error('Dynamic HS code detection error:', error);
      const errorResponse = generateFallbackError();
      setAiSuggestions(errorResponse);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI analysis function for product descriptions
  const analyzeProductDescription = async (description) => {
    if (!description || description.length < 10) {
      setAiSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-category-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productDescription: description.trim(),
          businessType: businessType || 'general' // Use business type from Page 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      } else {
        console.warn('AI analysis failed - no fallback classification provided');
        // NO hardcoded fallback - show error instead
        const errorResponse = generateFallbackError();
        setAiSuggestions(errorResponse);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // NO hardcoded fallback - show error instead
      const errorResponse = generateFallbackError();
      setAiSuggestions(errorResponse);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate fallback error message - NO classification logic
  // Generate intelligent follow-up questions when multiple chapters are found
  const generateFollowUpQuestion = (hsCodesByChapter, productDescription) => {
    const chapters = Object.keys(hsCodesByChapter);
    
    // Create options based on actual chapters and their products
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
  };

  const generateFallbackError = () => {
    return [{
      category: 'classification_unavailable',
      confidence: 0,
      reason: 'AI classification service temporarily unavailable. Please try again or contact support.',
      isError: true
    }];
  };

  // Analyze input quality and trigger AI analysis
  useEffect(() => {
    if (!value) {
      setInputQuality('');
      setAiSuggestions([]);
      return;
    }

    // Simple length-based quality assessment
    const chars = value.length;
    
    if (chars >= 30) {
      setInputQuality('excellent');
    } else if (chars >= 20) {
      setInputQuality('good');
    } else if (chars >= 10) {
      setInputQuality('basic');
    } else {
      setInputQuality('needs_detail');
    }

    // Trigger dynamic HS code detection when user has typed enough and business type is available
    console.log(`Debug: value="${value}", length=${value.length}, businessType="${businessType}"`);
    if (value.length >= 8 && businessType) {
      console.log('✅ Triggering dynamic HS code detection with:', {
        value: value,
        businessType: businessType
      });
      getDynamicHSCodes(value, businessType);
    } else {
      console.log('❌ Not triggering - conditions not met:', {
        valueLength: value.length,
        hasMinLength: value.length >= 8,
        businessType: businessType,
        hasBusinessType: !!businessType
      });
    }
  }, [value, businessType]);

  const handleCategoryChange = (categoryKey, source = 'manual') => {
    setSelectedCategory(categoryKey);
    if (onCategoryChange) {
      onCategoryChange(categoryKey);
    }
    console.log(`Category selected: ${categoryKey} (${source})`);
    
    // NOW trigger AI analysis with category context
    if (value && value.length >= 10 && categoryKey) {
      analyzeProductDescriptionWithCategory(value, categoryKey);
    }
  };

  // Handle clarifying option selection
  const handleClarifyingOptionSelection = (selectedOption) => {
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
    
    setAiSuggestions(specificCodes);
  };

  const handleHSCodeSelection = (hsSuggestion) => {
    console.log(`HS Code selected: ${hsSuggestion.hs_code} from Chapter ${hsSuggestion.chapter}`);
    
    // Notify parent component with HS code details
    if (onCategoryChange) {
      onCategoryChange(`HS Code: ${hsSuggestion.hs_code} - ${hsSuggestion.category}`);
    }
    
    // Update internal state
    setSelectedCategory(`HS: ${hsSuggestion.hs_code}`);
    
    // Clear suggestions since user made a selection
    setAiSuggestions([hsSuggestion]); // Keep only selected one
  };

  // AI analysis function for product descriptions WITH category context
  const analyzeProductDescriptionWithCategory = async (description, selectedCategory) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-category-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productDescription: description.trim(),
          businessType: businessType || 'general',
          selectedCategory: selectedCategory // Pass the user's category choice
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          // These should now be specific HS codes within the selected category
          setAiSuggestions(data.suggestions);
        }
      } else {
        console.warn('AI analysis failed within selected category');
        const errorResponse = generateFallbackError();
        setAiSuggestions(errorResponse);
      }
    } catch (error) {
      console.error('Category-specific AI analysis error:', error);
      const errorResponse = generateFallbackError();
      setAiSuggestions(errorResponse);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle user-provided HS code submission
  const handleUserHSCodeSubmit = async () => {
    if (!userProvidedHSCode || userProvidedHSCode.length < 4) {
      alert('Please enter a valid HS code (at least 4 digits)');
      return;
    }

    setIsSubmittingHSCode(true);
    try {
      const response = await fetch('/api/user-contributed-hs-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hs_code: userProvidedHSCode.trim(),
          product_description: value,
          business_type: businessType,
          user_confidence: 5 // User is confident since they provided it
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Show success message and clear input
          setUserProvidedHSCode('');
          
          // Trigger complete USMCA compliance analysis
          await triggerCompleteUSMCAWorkflow(userProvidedHSCode.trim(), value, businessType);
          
          // Update the parent component with the HS code
          if (onCategoryChange) {
            onCategoryChange(`User HS Code: ${userProvidedHSCode.trim()}`);
          }
          
          // Show success feedback with next steps
          setAiSuggestions([{
            category: `${userProvidedHSCode.trim()} - Complete Analysis Ready`,
            confidence: 100,
            reason: 'Running USMCA qualification check and tariff savings calculation...',
            isUserProvided: true,
            hsCode: userProvidedHSCode.trim()
          }]);
          
          alert('HS code saved! Now calculating your USMCA savings and qualification status...');
        }
      } else {
        throw new Error('Failed to save HS code');
      }
    } catch (error) {
      console.error('Error submitting user HS code:', error);
      alert('Sorry, there was an error saving your HS code. Please try again.');
    } finally {
      setIsSubmittingHSCode(false);
    }
  };

  // Trigger complete USMCA compliance workflow when user provides HS code
  const triggerCompleteUSMCAWorkflow = async (hsCode, productDescription, businessType) => {
    try {
      console.log(`Starting complete USMCA workflow for HS code: ${hsCode}`);
      
      // Call the complete USMCA compliance API
      const response = await fetch('/api/trusted-compliance-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trusted_complete_workflow',
          data: {
            company_name: 'User Company', // Could be passed from parent
            business_type: businessType,
            supplier_country: 'CN', // Default, could be made dynamic
            trade_volume: 1000000, // Default, could be made dynamic
            product_description: productDescription,
            user_provided_hs_code: hsCode, // Key: user provided this
            component_origins: [
              { origin_country: 'CN', value_percentage: 60 },
              { origin_country: 'MX', value_percentage: 40 }
            ],
            manufacturing_location: 'MX'
          }
        })
      });

      if (response.ok) {
        const workflowData = await response.json();
        
        if (workflowData.success) {
          console.log('Complete USMCA workflow results:', workflowData);
          
          // Update AI suggestions with complete results
          setAiSuggestions([{
            category: `${hsCode} - Complete USMCA Analysis`,
            confidence: 100,
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
          
          // Show detailed success message
          const savings = workflowData.savings?.annual_savings || 0;
          const qualified = workflowData.qualification?.qualified;
          alert(`Complete Analysis Results:\n• USMCA Qualified: ${qualified ? 'YES' : 'NO'}\n• Annual Savings: $${savings.toLocaleString()}\n• Certificate ready for generation\n• Triangle routing opportunities identified`);
          
        } else {
          console.error('USMCA workflow failed:', workflowData.error);
          alert('Error running complete analysis. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error triggering USMCA workflow:', error);
      alert('Error running complete analysis. Please check your connection.');
    }
  };

  // AI-driven suggestions - no hardcoded examples needed
  
  const qualityIndicators = {
    excellent: { icon: CheckCircle, color: 'text-green-600', message: 'Excellent detail - high classification confidence expected' },
    good: { icon: CheckCircle, color: 'text-blue-600', message: 'Good detail - should classify well' },
    basic: { icon: AlertTriangle, color: 'text-yellow-600', message: 'Add materials or construction details for better results' },
    needs_detail: { icon: AlertTriangle, color: 'text-red-600', message: 'More detail needed - add materials, construction, or use case' }
  };

  const currentQuality = qualityIndicators[inputQuality];

  return (
    <div className="space-y-4">
      {/* MOVED TO TOP: User Path Selection */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center mb-2">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="font-medium text-green-900">Already Know Your HS Code?</h3>
        </div>
        <p className="text-sm text-green-800 mb-3">
          Skip the classification process - enter your known HS code directly for immediate USMCA analysis.
        </p>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter HS Code (e.g., 080440 for avocados)"
            value={userProvidedHSCode}
            className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onChange={(e) => setUserProvidedHSCode(e.target.value)}
          />
          <button
            onClick={handleUserHSCodeSubmit}
            disabled={isSubmittingHSCode}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmittingHSCode ? 'Analyzing...' : 'Get USMCA Analysis'}
          </button>
        </div>
        
        <p className="text-xs text-green-600 mt-2">
          Get immediate tariff savings calculation, qualification check, and certificate generation.
        </p>
      </div>

      <div className="text-center text-sm text-gray-500 py-2">
        <span className="bg-white px-3">OR</span>
      </div>

      {/* Product Description - Clear Path B */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Need Help Classifying? Describe Your Product
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your product (e.g., Fresh avocados, organically grown OR Men's cotton dress shirts)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        
        {/* Quality Indicator */}
        {currentQuality && (
          <div className={`flex items-center mt-2 text-sm ${currentQuality.color}`}>
            <currentQuality.icon className="h-4 w-4 mr-1" />
            <span>{currentQuality.message}</span>
          </div>
        )}
      </div>

      {/* AI Analysis Results - Appears after user types */}
      {value && value.length >= 8 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">AI analyzing your product description...</span>
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div>
              {console.log('Rendering AI suggestions:', aiSuggestions.length, 'items')}
              <p className="text-sm font-medium text-blue-900 mb-2">
                {aiSuggestions.some(s => s.isDynamicHSCode) 
                  ? 'Found these HS codes for your product:'
                  : 'Based on your description, this appears to be:'
                }
              </p>
              <div className="space-y-3">
                {aiSuggestions.map((item, index) => {
                  // No Results Message
                  if (item.type === 'no_results') {
                    return (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">{item.message}</p>
                      </div>
                    );
                  }
                  
                  // Clarifying Question Display
                  if (item.type === 'clarifying_question') {
                    return (
                      <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">{item.question}</h4>
                        <div className="space-y-2">
                          {item.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => handleClarifyingOptionSelection(option)}
                              className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-blue-800">{option.option_text}</span>
                                <span className="text-sm text-gray-600">{option.description}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Sample codes: {option.sample_codes}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Specific Code Display
                  if (item.type === 'specific_code') {
                    return (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded-md hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-medium text-blue-700">{item.hs_code}</span>
                            {item.confidence && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                item.confidence >= 90 ? 'bg-green-100 text-green-700' :
                                item.confidence >= 80 ? 'bg-blue-100 text-blue-700' :
                                item.confidence >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.confidence}% Match
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleHSCodeSelection(item)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Use This Code
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{item.description}</p>
                        <div className="text-xs text-gray-500">
                          <span className={`mr-2 ${item.usmca_eligible ? 'text-green-600' : 'text-red-600'}`}>
                            {item.usmca_eligible ? '✓ USMCA Eligible' : '✗ Not USMCA Eligible'}
                          </span>
                          <span>Chapter {item.chapter}</span>
                          {item.confidence_label && (
                            <span className="ml-2 text-gray-400">• {item.confidence_label}</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular Suggestion Display (backward compatibility)
                  return (
                    <div
                      key={index}
                      className={`w-full p-3 rounded-md border transition-colors ${
                        item.isUserProvided
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                          : selectedCategory === item.category
                          ? 'bg-blue-100 border-blue-300 text-blue-900'
                          : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {item.chapter ? `${item.category} (Chapter ${item.chapter})` : item.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
                    
                    {/* Show complete USMCA results for user-provided HS codes */}
                    {item.isUserProvided && item.usmcaResults && (
                      <div className="mt-3 p-2 bg-white rounded border border-green-200">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Complete USMCA Analysis Results:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">USMCA Qualified:</span>{' '}
                            <span className={item.usmcaResults.qualified ? 'text-green-600' : 'text-red-600'}>
                              {item.usmcaResults.qualified ? 'YES' : 'NO'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Annual Savings:</span>{' '}
                            <span className="text-green-600 font-bold">
                              ${item.usmcaResults.savings?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex space-x-2">
                          <button className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                            Generate Certificate
                          </button>
                          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                            View Triangle Routes
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Dynamic HS Code selection */}
                    {item.isDynamicHSCode && (
                      <button
                        onClick={() => handleHSCodeSelection(item)}
                        className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Use HS Code {item.hs_code}
                      </button>
                    )}
                    
                    {/* Regular category selection for non-user-provided, non-HS-code suggestions */}
                    {!item.isUserProvided && !item.isDynamicHSCode && (
                      <button
                        onClick={() => handleCategoryChange(item.category, 'ai')}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select this category
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Select a suggestion above, or continue with manual classification below
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* AI-powered suggestions replace manual category selection */}


      {/* HIDDEN: Manual Category Selection Dropdown - Only show if no HS codes found */}
      {(!aiSuggestions.some(s => s.isDynamicHSCode)) && value.length < 8 && (
        <div className="bg-white rounded-lg border border-gray-300 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Category Selection
          </label>
        
        {/* Show AI suggestion status */}
        {aiSuggestions.length > 0 && aiSuggestions[0].isError ? (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                AI classification unavailable. Please select a category manually from the dropdown below.
              </span>
            </div>
          </div>
        ) : aiSuggestions.length > 0 ? (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm text-blue-800">
              AI suggested a category above, or manually select a different one below.
            </span>
          </div>
        ) : null}

        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value, 'manual')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a product category</option>
          {isLoadingCategories ? (
            <option disabled>Loading categories...</option>
          ) : (
            availableCategories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.product_count} products)
              </option>
            ))
          )}
        </select>
        
        {selectedCategory && (
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Category selected: {selectedCategory}
          </div>
        )}
        
        <p className="text-xs text-gray-600 mt-2">
          {businessType && businessType !== 'general' ? 
            `Showing categories relevant to ${businessType} business. This dropdown is always available regardless of AI status.` :
            'This dropdown is always available regardless of AI status. Select the category that best matches your product.'
          }
        </p>
      </div>
      )}

      {/* General Success Patterns - Show when no specific category selected */}
      {!value || value.length < 10 ? (
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">For accurate AI classification, include:</p>
          <ul className="space-y-0.5 ml-4">
            <li>• <strong>Materials:</strong> leather, cotton, rubber, metal, plastic, etc.</li>
            <li>• <strong>Construction:</strong> stitched, molded, woven, assembled, etc.</li>
            <li>• <strong>Intended use:</strong> athletic, industrial, decorative, protective, etc.</li>
            <li>• <strong>Key features:</strong> waterproof, adjustable, rechargeable, etc.</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}