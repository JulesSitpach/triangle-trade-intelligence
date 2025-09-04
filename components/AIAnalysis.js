import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { 
  UI_TEXT, 
  STYLE_CONFIG, 
  A11Y_CONFIG, 
  CONFIDENCE_CONFIG,
  DISPLAY_CONFIG 
} from '../config/classificationConfig';

/**
 * AIAnalysis Component
 * Displays AI analysis results with different result types
 * Single responsibility: Display and interact with AI classification results
 */
const AIAnalysis = ({ 
  suggestions = [], 
  isAnalyzing = false, 
  error = null,
  onHSCodeSelection,
  onClarifyingOptionSelection,
  onCategorySelection,
  className = '',
  showTitle = true
}) => {
  // Don't render if no suggestions and not analyzing
  if (!isAnalyzing && suggestions.length === 0 && !error) {
    return null;
  }

  const handleHSCodeSelect = (item) => {
    if (onHSCodeSelection) {
      onHSCodeSelection(item);
    }
  };

  const handleClarifyingOptionSelect = (option) => {
    if (onClarifyingOptionSelection) {
      onClarifyingOptionSelection(option);
    }
  };

  const handleCategorySelect = (category, source = 'ai') => {
    if (onCategorySelection) {
      onCategorySelection(category, source);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= CONFIDENCE_CONFIG.highConfidence) return 'bg-sage-100 text-sage-700';
    if (confidence >= CONFIDENCE_CONFIG.mediumConfidence) return 'bg-teal-100 text-teal-700';
    if (confidence >= CONFIDENCE_CONFIG.lowConfidence) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const renderClarifyingQuestion = (item, index) => (
    <div key={index} className="p-4 bg-navy-50 border border-navy-200 rounded-lg">
      <h4 className="font-medium text-navy-900 mb-3">{item.question}</h4>
      <div className={STYLE_CONFIG.spacing.resultGap}>
        {item.options?.map((option, optIndex) => (
          <button
            key={optIndex}
            onClick={() => handleClarifyingOptionSelect(option)}
            className="w-full text-left p-3 bg-white border border-navy-200 rounded hover:bg-navy-50 hover:border-navy-300 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500"
            aria-label={`Select ${option.option_text}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-navy-800">{option.option_text}</span>
              <span className="text-sm text-gray-600">{option.description}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Sample codes: {option.sample_codes}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpecificCode = (item, index) => (
    <div key={index} className="p-3 bg-white border border-warm-gray-200 rounded-md hover:border-navy-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm font-medium text-navy-700">{item.hs_code}</span>
          {item.confidence && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(item.confidence)}`}>
              {item.confidence}% Match
            </span>
          )}
        </div>
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="text-xs px-3 py-1 bg-navy-600 text-white rounded hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 transition-colors"
          aria-label={`Use HS code ${item.hs_code}`}
        >
          {UI_TEXT.buttons.useThisCode}
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-1">{item.description}</p>
      <div className="text-xs text-gray-500">
        <span className={`mr-2 ${item.usmca_eligible ? 'text-sage-600' : 'text-amber-600'}`}>
          {item.usmca_eligible ? '✓ USMCA Eligible' : '✗ Not USMCA Eligible'}
        </span>
        <span>Chapter {item.chapter}</span>
        {item.confidence_label && (
          <span className="ml-2 text-gray-400">• {item.confidence_label}</span>
        )}
      </div>
    </div>
  );

  const renderRegularSuggestion = (item, index) => (
    <div
      key={index}
      className={`w-full p-3 rounded-md border transition-colors ${
        item.isUserProvided
          ? 'bg-gradient-to-r from-sage-50 to-sage-100 border-sage-300'
          : 'bg-white border-warm-gray-200 hover:bg-navy-50 hover:border-navy-200'
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
        <div className="mt-3 p-2 bg-white rounded border border-sage-200">
          <h4 className="text-sm font-medium text-sage-800 mb-2">Complete USMCA Analysis Results:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">USMCA Qualified:</span>{' '}
              <span className={item.usmcaResults.qualified ? 'text-sage-600' : 'text-amber-600'}>
                {item.usmcaResults.qualified ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="font-medium">Annual Savings:</span>{' '}
              <span className="text-sage-600 font-bold">
                ${item.usmcaResults.savings?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex space-x-2">
            <button className="text-xs px-2 py-1 bg-sage-600 text-white rounded hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500">
              {UI_TEXT.buttons.generateCertificate}
            </button>
            <button className="text-xs px-2 py-1 bg-navy-600 text-white rounded hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500">
              {UI_TEXT.buttons.viewRoutes}
            </button>
          </div>
        </div>
      )}
      
      {/* Dynamic HS Code selection */}
      {item.isDynamicHSCode && (
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="mt-2 text-xs px-3 py-1 bg-navy-600 text-white rounded hover:bg-navy-700 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500"
          aria-label={`Use HS Code ${item.hs_code}`}
        >
          Use HS Code {item.hs_code}
        </button>
      )}
      
      {/* Regular category selection for non-user-provided, non-HS-code suggestions */}
      {!item.isUserProvided && !item.isDynamicHSCode && (
        <button
          onClick={() => handleCategorySelect(item.category)}
          className="mt-2 text-xs text-navy-600 hover:text-navy-800 focus:outline-none focus:underline"
        >
          {UI_TEXT.buttons.selectCategory}
        </button>
      )}
    </div>
  );

  const renderSuggestion = (item, index) => {
    if (item.type === 'clarifying_question') {
      return renderClarifyingQuestion(item, index);
    }
    
    if (item.type === 'specific_code') {
      return renderSpecificCode(item, index);
    }
    
    return renderRegularSuggestion(item, index);
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 ${className}`}>
      {isAnalyzing ? (
        <div 
          className="flex items-center space-x-2"
          role="status"
          aria-label={A11Y_CONFIG.ariaLabels.loadingSpinner}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="text-sm text-blue-700">AI analyzing your product description...</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-red-700" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div role="region" aria-label={A11Y_CONFIG.ariaLabels.analysisResults}>
          {showTitle && (
            <p className="text-sm font-medium text-blue-900 mb-2">
              {suggestions.some(s => s.isDynamicHSCode) 
                ? 'Found these HS codes for your product:'
                : 'Based on your description, this appears to be:'
              }
            </p>
          )}
          
          <div className={STYLE_CONFIG.spacing.resultGap}>
            {suggestions.slice(0, DISPLAY_CONFIG.maxSuggestionDisplay).map(renderSuggestion)}
          </div>
          
          {suggestions.length > DISPLAY_CONFIG.maxSuggestionDisplay && (
            <p className="text-xs text-gray-600 mt-2">
              Showing {DISPLAY_CONFIG.maxSuggestionDisplay} of {suggestions.length} results
            </p>
          )}
          
          <p className="text-xs text-gray-600 mt-2">
            Select a suggestion above, or continue with manual classification below
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AIAnalysis;