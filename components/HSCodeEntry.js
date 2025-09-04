import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { UI_TEXT, STYLE_CONFIG, A11Y_CONFIG, ERROR_MESSAGES } from '../config/classificationConfig';
import { useFormAccessibility, useAnnouncements, createButtonProps, generateId } from '../lib/utils/a11yUtils';

/**
 * HSCodeEntry Component
 * Handles user-provided HS code entry with validation and USMCA analysis trigger
 * Single responsibility: HS code input and immediate analysis
 */
const HSCodeEntry = ({ 
  onHSCodeSubmit, 
  isSubmitting = false,
  className = '',
  disabled = false 
}) => {
  const [hsCode, setHSCode] = useState('');
  const [error, setError] = useState('');
  
  // Accessibility hooks
  const { generateFieldProps } = useFormAccessibility();
  const { announceError, announceSuccess } = useAnnouncements();
  
  // Generate unique IDs for accessibility
  const sectionId = generateId('hs-code-section');
  const inputFieldProps = generateFieldProps('hs-code', {
    required: true,
    error: error,
    invalid: Boolean(error)
  });

  const handleSubmit = async () => {
    setError('');
    
    if (!hsCode.trim()) {
      const errorMsg = ERROR_MESSAGES.invalidHSCode;
      setError(errorMsg);
      announceError(errorMsg);
      return;
    }

    try {
      await onHSCodeSubmit(hsCode.trim());
      setHSCode(''); // Clear on success
      announceSuccess('HS code submitted successfully for analysis');
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.saveHSCodeError;
      setError(errorMsg);
      announceError(errorMsg);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === A11Y_CONFIG.keyboardShortcuts.submitHSCode && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setHSCode(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // Create accessible button props
  const submitButtonProps = createButtonProps({
    disabled: disabled || !hsCode.trim(),
    loading: isSubmitting,
    loadingText: UI_TEXT.buttons.analyzing,
    ariaLabel: isSubmitting ? UI_TEXT.buttons.analyzing : UI_TEXT.buttons.getAnalysis,
    onClick: handleSubmit
  });

  return (
    <section 
      className={`${STYLE_CONFIG.colors.secondary === 'green' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'} rounded-lg p-4 border ${STYLE_CONFIG.colors.secondary === 'green' ? 'border-green-200' : 'border-gray-200'} ${className}`}
      aria-labelledby={sectionId}
      role="region"
    >
      <div className="flex items-center mb-2">
        <CheckCircle 
          className={`h-5 w-5 ${STYLE_CONFIG.colors.secondary === 'green' ? 'text-green-600' : 'text-blue-600'} mr-2`}
          aria-hidden="true" 
        />
        <h3 
          id={sectionId}
          className={`font-medium ${STYLE_CONFIG.colors.secondary === 'green' ? 'text-green-900' : 'text-gray-900'}`}
        >
          {UI_TEXT.labels.hsCodeSection}
        </h3>
      </div>
      
      <p className={`text-sm ${STYLE_CONFIG.colors.secondary === 'green' ? 'text-green-800' : 'text-gray-700'} mb-3`}>
        Skip the classification process - enter your known HS code directly for immediate USMCA analysis.
      </p>
      
      <div className={`flex ${STYLE_CONFIG.spacing.buttonGap}`}>
        <div className="flex-1">
          <label htmlFor={inputFieldProps.id} className="sr-only">
            {A11Y_CONFIG.ariaLabels.hsCodeInput}
          </label>
          <input
            {...inputFieldProps}
            type="text"
            placeholder={UI_TEXT.placeholders.hsCodeInput}
            value={hsCode}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || isSubmitting}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : STYLE_CONFIG.colors.secondary === 'green'
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-blue-300 focus:ring-blue-500'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            autoComplete="off"
            spellCheck="false"
          />
          {error && (
            <p {...inputFieldProps.errorProps} className="text-sm text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
        
        <button
          {...submitButtonProps}
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors ${
            STYLE_CONFIG.colors.secondary === 'green'
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400'
          }`}
        >
          <span aria-hidden={isSubmitting ? 'true' : 'false'}>
            {isSubmitting ? UI_TEXT.buttons.analyzing : UI_TEXT.buttons.getAnalysis}
          </span>
          {isSubmitting && (
            <span className="sr-only">Processing your request, please wait</span>
          )}
        </button>
      </div>
      
      <p 
        {...inputFieldProps.descriptionProps}
        className={`text-xs mt-2 ${STYLE_CONFIG.colors.secondary === 'green' ? 'text-green-600' : 'text-blue-600'}`}
      >
        Get immediate tariff savings calculation, qualification check, and certificate generation.
      </p>
    </section>
  );
};

export default HSCodeEntry;