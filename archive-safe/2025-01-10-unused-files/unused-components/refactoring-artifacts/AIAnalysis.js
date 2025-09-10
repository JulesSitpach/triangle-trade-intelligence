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
    if (confidence >= CONFIDENCE_CONFIG.highConfidence) return 'status-success';
    if (confidence >= CONFIDENCE_CONFIG.mediumConfidence) return 'status-info';
    if (confidence >= CONFIDENCE_CONFIG.lowConfidence) return 'status-warning';
    return 'badge';
  };

  const renderClarifyingQuestion = (item, index) => (
    <div key={index} className="alert alert-info">
      <h4 className="alert-title">{item.question}</h4>
      <div className={STYLE_CONFIG.spacing.resultGap}>
        {item.options?.map((option, optIndex) => (
          <button
            key={optIndex}
            onClick={() => handleClarifyingOptionSelect(option)}
            className="btn-secondary btn-full-width"
            aria-label={`Select ${option.option_text}`}
          >
            <div className="hero-button-group">
              <span className="form-label">{option.option_text}</span>
              <span className="text-muted">{option.description}</span>
            </div>
            <p className="text-muted small-text section-spacing">Sample codes: {option.sample_codes}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpecificCode = (item, index) => (
    <div key={index} className="status-card">
      <div className="hero-button-group">
        <div className="hero-button-group">
          <span className="hs-code-display">{item.hs_code}</span>
          {item.confidence && (
            <span className={`badge ${getConfidenceColor(item.confidence)}`}>
              {item.confidence}% Match
            </span>
          )}
        </div>
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="btn-primary btn-sm"
          aria-label={`Use HS code ${item.hs_code}`}
        >
          {UI_TEXT.buttons.useThisCode}
        </button>
      </div>
      <p className="hs-description">{item.description}</p>
      <div className="hs-rates-display">
        <span className={item.usmca_eligible ? 'status-success' : 'status-warning'}>
          {item.usmca_eligible ? '✓ USMCA Eligible' : '✗ Not USMCA Eligible'}
        </span>
        <span>Chapter {item.chapter}</span>
        {item.confidence_label && (
          <span className="text-muted">• {item.confidence_label}</span>
        )}
      </div>
    </div>
  );

  const renderRegularSuggestion = (item, index) => (
    <div
      key={index}
      className={item.isUserProvided ? 'status-card success' : 'card'}
    >
      <div className="hero-button-group">
        <span className="form-label">
          {item.chapter ? `${item.category} (Chapter ${item.chapter})` : item.category}
        </span>
        <span className="text-muted">
          {item.confidence}% confidence
        </span>
      </div>
      <p className="text-muted small-text section-spacing">{item.reason}</p>
      
      {/* Show complete USMCA results for user-provided HS codes */}
      {item.isUserProvided && item.usmcaResults && (
        <div className="status-card success">
          <h4 className="form-label text-green-800 margin-bottom-sm">Complete USMCA Analysis Results:</h4>
          <div className="form-grid-2 small-text">
            <div>
              <span className="status-label">USMCA Qualified:</span>{' '}
              <span className={item.usmcaResults.qualified ? 'text-success' : 'text-warning'}>
                {item.usmcaResults.qualified ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="status-label">Annual Savings:</span>{' '}
              <span className="status-value success">
                ${item.usmcaResults.savings?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <div className="margin-top-sm hero-button-group">
            <button className="btn-success btn-sm">
              {UI_TEXT.buttons.generateCertificate}
            </button>
            <button className="btn-primary btn-sm">
              {UI_TEXT.buttons.viewRoutes}
            </button>
          </div>
        </div>
      )}
      
      {/* Dynamic HS Code selection */}
      {item.isDynamicHSCode && (
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="btn-primary margin-top-sm btn-sm-extended"
          aria-label={`Use HS Code ${item.hs_code}`}
        >
          Use HS Code {item.hs_code}
        </button>
      )}
      
      {/* Regular category selection for non-user-provided, non-HS-code suggestions */}
      {!item.isUserProvided && !item.isDynamicHSCode && (
        <button
          onClick={() => handleCategorySelect(item.category)}
          className="btn-secondary margin-top-sm small-text btn-underlined"
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
    <div className={`alert alert-info ${className}`}>
      {isAnalyzing ? (
        <div 
          className="flex-center-gap"
          role="status"
          aria-label={A11Y_CONFIG.ariaLabels.loadingSpinner}
        >
          <div className="loading-spinner" aria-hidden="true"></div>
          <span className="text-body">AI analyzing your product description...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error" role="alert">
          <AlertTriangle className="alert-icon icon-sm" aria-hidden="true" />
          <span className="text-body">{error}</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div role="region" aria-label={A11Y_CONFIG.ariaLabels.analysisResults}>
          {showTitle && (
            <p className="form-label margin-bottom-sm">
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
            <p className="text-muted small-text margin-top-sm">
              Showing {DISPLAY_CONFIG.maxSuggestionDisplay} of {suggestions.length} results
            </p>
          )}
          
          <p className="text-muted small-text margin-top-sm">
            Select a suggestion above, or continue with manual classification below
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AIAnalysis;