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
            className="btn-secondary" style={{width: '100%', textAlign: 'left', marginBottom: '0.5rem'}}
            aria-label={`Select ${option.option_text}`}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span className="form-label">{option.option_text}</span>
              <span className="text-muted">{option.description}</span>
            </div>
            <p className="text-muted" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>Sample codes: {option.sample_codes}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpecificCode = (item, index) => (
    <div key={index} className="status-card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <span className="hs-code-display">{item.hs_code}</span>
          {item.confidence && (
            <span className={`badge ${getConfidenceColor(item.confidence)}`}>
              {item.confidence}% Match
            </span>
          )}
        </div>
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="btn-primary" style={{fontSize: '0.75rem', padding: '0.25rem 0.75rem'}}
          aria-label={`Use HS code ${item.hs_code}`}
        >
          {UI_TEXT.buttons.useThisCode}
        </button>
      </div>
      <p className="hs-description">{item.description}</p>
      <div className="hs-rates-display">
        <span style={{marginRight: '0.5rem', color: item.usmca_eligible ? 'var(--green-600)' : 'var(--amber-600)'}}>
          {item.usmca_eligible ? '✓ USMCA Eligible' : '✗ Not USMCA Eligible'}
        </span>
        <span>Chapter {item.chapter}</span>
        {item.confidence_label && (
          <span style={{marginLeft: '0.5rem', color: 'var(--gray-400)'}}>• {item.confidence_label}</span>
        )}
      </div>
    </div>
  );

  const renderRegularSuggestion = (item, index) => (
    <div
      key={index}
      className={item.isUserProvided ? 'status-card' : 'card'}
      style={item.isUserProvided ? {
        background: 'linear-gradient(135deg, var(--green-50) 0%, rgba(255, 255, 255, 0.8) 100%)',
        border: '1px solid var(--green-300)'
      } : {}}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span className="form-label">
          {item.chapter ? `${item.category} (Chapter ${item.chapter})` : item.category}
        </span>
        <span className="text-muted">
          {item.confidence}% confidence
        </span>
      </div>
      <p className="text-muted" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>{item.reason}</p>
      
      {/* Show complete USMCA results for user-provided HS codes */}
      {item.isUserProvided && item.usmcaResults && (
        <div className="status-card" style={{marginTop: '0.75rem', border: '1px solid var(--green-200)'}}>
          <h4 className="form-label" style={{color: 'var(--green-800)', marginBottom: '0.5rem'}}>Complete USMCA Analysis Results:</h4>
          <div className="form-grid-2" style={{fontSize: '0.75rem'}}>
            <div>
              <span className="status-label">USMCA Qualified:</span>{' '}
              <span style={{color: item.usmcaResults.qualified ? 'var(--green-600)' : 'var(--amber-600)'}}>
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
          <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem'}}>
            <button className="btn-success" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>
              {UI_TEXT.buttons.generateCertificate}
            </button>
            <button className="btn-primary" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>
              {UI_TEXT.buttons.viewRoutes}
            </button>
          </div>
        </div>
      )}
      
      {/* Dynamic HS Code selection */}
      {item.isDynamicHSCode && (
        <button
          onClick={() => handleHSCodeSelect(item)}
          className="btn-primary" style={{marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.75rem'}}
          aria-label={`Use HS Code ${item.hs_code}`}
        >
          Use HS Code {item.hs_code}
        </button>
      )}
      
      {/* Regular category selection for non-user-provided, non-HS-code suggestions */}
      {!item.isUserProvided && !item.isDynamicHSCode && (
        <button
          onClick={() => handleCategorySelect(item.category)}
          className="btn-secondary" style={{marginTop: '0.5rem', fontSize: '0.75rem', textDecoration: 'underline'}}
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
          style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
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
            <p className="form-label" style={{marginBottom: '0.5rem'}}>
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
            <p className="text-muted" style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>
              Showing {DISPLAY_CONFIG.maxSuggestionDisplay} of {suggestions.length} results
            </p>
          )}
          
          <p className="text-muted" style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>
            Select a suggestion above, or continue with manual classification below
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AIAnalysis;