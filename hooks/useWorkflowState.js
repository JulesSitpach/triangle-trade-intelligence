/**
 * useWorkflowState - Custom hook for USMCA workflow state management
 * Extracted from 894-line monolithic component
 * Implements clean state management patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { workflowService } from '../lib/services/workflow-service.js';

export function useWorkflowState() {
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowPath, setWorkflowPath] = useState(null); // 'crisis-calculator', 'certificate', or null
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({
    businessTypes: [],
    countries: [],
    importVolumes: []
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  // Form data state with dynamic defaults
  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    business_type: '',
    supplier_country: '',
    trade_volume: '',
    
    // Product Information  
    product_description: '',
    manufacturing_location: '',
    
    // HS Code Classification Results
    classified_hs_code: '',
    hs_code_confidence: 0,
    hs_code_description: '',
    classification_method: '',
    
    // Component Origins
    component_origins: []
  });

  // Load dropdown options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const options = await workflowService.loadDropdownOptions();
        setDropdownOptions(options);
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Set form defaults after options are loaded
  useEffect(() => {
    if (!defaultsLoaded && !isLoadingOptions) {
      setFormData(prev => ({
        ...prev,
        supplier_country: prev.supplier_country || 'CN',
        manufacturing_location: prev.manufacturing_location || 'MX',
        component_origins: prev.component_origins.length > 0 
          ? prev.component_origins 
          : [
              { origin_country: 'CN', value_percentage: 60 },
              { origin_country: 'MX', value_percentage: 40 }
            ]
      }));
      setDefaultsLoaded(true);
    }
  }, [defaultsLoaded, isLoadingOptions]);

  // Update form data utility
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Component origins management
  const addComponentOrigin = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      component_origins: [
        ...prev.component_origins,
        { origin_country: 'US', value_percentage: 0 }
      ]
    }));
  }, []);

  const updateComponentOrigin = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      component_origins: prev.component_origins.map((component, i) => 
        i === index ? { ...component, [field]: value } : component
      )
    }));
  }, []);

  const removeComponentOrigin = useCallback((index) => {
    setFormData(prev => {
      if (prev.component_origins.length > 1) {
        return {
          ...prev,
          component_origins: prev.component_origins.filter((_, i) => i !== index)
        };
      }
      return prev;
    });
  }, []);

  // Process workflow
  const processWorkflow = useCallback(async () => {
    const validation = workflowService.validateFormData(formData);
    
    if (!validation.isValid) {
      setError('Form validation failed: ' + validation.errors.join(', '));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const workflowResult = await workflowService.processCompleteWorkflow(formData);
      
      if (workflowResult.success) {
        // The API returns the entire response object as the results
        // It includes: company, product, usmca, savings, certificate fields
        setResults(workflowResult);
        setCurrentStep(3); // Results step (updated for 3-step workflow)
      } else {
        setError(workflowResult.error || 'Processing failed');
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setCurrentStep(1);
    setResults(null);
    setError(null);
    
    // Reset to defaults
    setFormData({
      company_name: '',
      business_type: '',
      supplier_country: 'CN',
      trade_volume: '',
      product_description: '',
      manufacturing_location: 'MX',
      classified_hs_code: '',
      hs_code_confidence: 0,
      hs_code_description: '',
      classification_method: '',
      component_origins: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'MX', value_percentage: 40 }
      ]
    });
  }, []);

  // Navigation helpers
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    setError(null); // Clear any previous errors when navigating
  }, []);

  const nextStep = useCallback((path = 'default') => {
    if (path !== 'default') {
      setWorkflowPath(path);
      
      if (path === 'crisis-calculator') {
        // Go directly to results for crisis calculator
        setCurrentStep(3);
        setError(null);
        return;
      } else if (path === 'certificate') {
        // Continue to step 2 for certificate path
        setCurrentStep(2);
        setError(null);
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
    setError(null);
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  }, []);

  // Validation helpers
  const isFormValid = useCallback(() => {
    const validation = workflowService.validateFormData(formData);
    return validation.isValid;
  }, [formData]);

  const getTotalComponentPercentage = useCallback(() => {
    return formData.component_origins.reduce(
      (sum, comp) => sum + parseFloat(comp.value_percentage || 0), 0
    );
  }, [formData.component_origins]);

  const isStepValid = useCallback((step) => {
    switch (step) {
      case 1:
        return formData.company_name.length > 2 && 
               formData.business_type && 
               formData.trade_volume;
      case 2:
        // Product & Components step - needs product description, manufacturing location, and valid components
        return formData.product_description.length >= 10 &&
               formData.manufacturing_location &&
               formData.component_origins.length > 0 &&
               getTotalComponentPercentage() === 100 &&
               formData.component_origins.every(comp => 
                 comp.description && comp.origin_country && comp.value_percentage > 0 && comp.hs_code
               );
      default:
        return true;
    }
  }, [formData, getTotalComponentPercentage]);

  // Clear error utility
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    currentStep,
    workflowPath,
    isLoading,
    results,
    error,
    dropdownOptions,
    isLoadingOptions,
    formData,
    
    // Form actions
    updateFormData,
    addComponentOrigin,
    updateComponentOrigin,
    removeComponentOrigin,
    
    // Workflow actions
    processWorkflow,
    resetWorkflow,
    
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    
    // Validation
    isFormValid,
    isStepValid,
    getTotalComponentPercentage,
    
    // Error handling
    clearError
  };
}