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
    usmcaCountries: [],
    importVolumes: []
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  // Load saved user data from localStorage (for initial render)
  const loadSavedData = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('triangleUserData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Loading saved user data from localStorage');
          return parsed;
        } catch (e) {
          console.error('Error loading saved data:', e);
        }
      }
    }
    return null;
  };

  // Form data state with saved data or defaults
  const [formData, setFormData] = useState(() => {
    const saved = loadSavedData();
    return saved || {
      // Company Information
      company_name: '',
      business_type: '',
      supplier_country: '',
      trade_volume: '',
      destination_country: '',
      
      // Enhanced Company Details for Certificate Completion
      company_address: '',
      tax_id: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      
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
    };
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

  // Load workflow data from database on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      const sessionId = localStorage.getItem('workflow_session_id');
      if (sessionId) {
        try {
          const response = await fetch(`/api/workflow-session?sessionId=${sessionId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              console.log('✅ Restored workflow data from database');
              setFormData(prev => ({ ...prev, ...result.data }));
            }
          }
        } catch (error) {
          console.log('⚠️ Database load failed, using localStorage:', error.message);
        }
      }
    };

    loadFromDatabase();
  }, []); // Run once on mount

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

  // Save data to localStorage AND database whenever it changes (with debounce)
  useEffect(() => {
    if (typeof window !== 'undefined' && formData.company_name) {
      // Save to localStorage immediately (for instant access)
      localStorage.setItem('triangleUserData', JSON.stringify(formData));

      // Debounce database save (2 seconds after user stops typing)
      const saveTimer = setTimeout(async () => {
        try {
          let sessionId = localStorage.getItem('workflow_session_id');
          if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('workflow_session_id', sessionId);
          }

          const response = await fetch('/api/workflow-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              workflowData: formData,
              userId: 'current-user', // Will be replaced with actual user ID from auth
              action: 'save'
            })
          });

          if (response.ok) {
            console.log('✅ Workflow data auto-saved to database');
          }
        } catch (error) {
          console.log('⚠️ Database save failed (localStorage still has data):', error.message);
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(saveTimer);
    }
  }, [formData]);

  // Update form data utility
  const updateFormData = useCallback((field, value) => {
    console.log('Updating form data:', field, '=', value);
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

        // Save to localStorage for certificate completion page
        const workflowData = {
          company: workflowResult.company,
          product: workflowResult.product,
          usmca: workflowResult.usmca,
          trust: workflowResult.trust,
          components: formData.component_origins,
          timestamp: Date.now()
        };

        localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowData));
        console.log('✅ Workflow data saved to localStorage for certificate page');

        setCurrentStep(5); // Results step (updated for 5-step workflow)
      } else {
        setError(workflowResult.error || 'Processing failed');
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Classify product only (separate from full workflow)
  const classifyProduct = useCallback(async (productDescription, businessType) => {
    if (!productDescription || productDescription.length < 10) {
      setError('Product description must be at least 10 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const classificationResult = await workflowService.classifyProduct(productDescription, businessType);
      
      if (classificationResult.success) {
        // Update form data with classification results
        setFormData(prev => ({
          ...prev,
          classified_hs_code: classificationResult.classification.hs_code,
          hs_code_confidence: classificationResult.classification.confidence,
          hs_code_description: classificationResult.classification.description,
          classification_method: classificationResult.method
        }));

        return classificationResult;
      } else {
        setError('Classification failed');
        return null;
      }
    } catch (err) {
      setError(`Classification failed: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateFormData]);

  // Reset workflow but keep company data
  const resetWorkflow = useCallback(() => {
    setCurrentStep(1);
    setResults(null);
    setError(null);
    
    // Complete form reset - clear ALL fields for new analysis
    setFormData({
      company_name: '',
      business_type: '',
      supplier_country: 'CN',
      trade_volume: '',
      destination_country: 'US',
      company_address: '',
      tax_id: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
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
        // Continue to step 3 for certificate path (supply chain step)
        setCurrentStep(3);
        setError(null);
        return;
      }
    } else {
      // For default navigation, clear the workflow path to enable normal step progression
      if (currentStep === 1) {
        setWorkflowPath(null);
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 5));
    setError(null);
  }, [currentStep]);

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
               formData.trade_volume &&
               formData.company_address &&
               formData.contact_person &&
               formData.contact_phone &&
               formData.contact_email;
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
    classifyProduct,
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