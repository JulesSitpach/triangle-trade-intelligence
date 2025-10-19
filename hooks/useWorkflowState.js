/**
 * useWorkflowState - Custom hook for USMCA workflow state management
 * Extracted from 894-line monolithic component
 * Implements clean state management patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { workflowService } from '../lib/services/workflow-service.js';

export function useWorkflowState() {
  // Initialize step - check localStorage for saved session
  const [currentStep, setCurrentStep] = useState(() => {
    // Check if there's a saved step from a previous session
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('workflow_current_step');
      const savedResults = localStorage.getItem('usmca_workflow_results');

      // If we have saved results, restore to step 3 (results page)
      if (savedResults && savedStep) {
        console.log('📂 Restoring workflow session - Step', savedStep);
        return parseInt(savedStep, 10);
      } else if (savedResults) {
        console.log('📂 Restoring workflow results - Jumping to step 3');
        return 3; // Results step
      }
    }

    // Default: start at step 1 for new workflow
    return 1;
  });

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

  // Form data state - initialize with defaults only (load saved data in useEffect)
  const [formData, setFormData] = useState({
      // Company Information
      company_name: '',
      company_country: '',  // CRITICAL: Company's country for certificate (Box 2, 3, 4)
      business_type: '',  // Business role: Importer, Exporter, Manufacturer, Distributor
      industry_sector: '',  // Industry classification: Automotive, Electronics, etc.
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

      // USMCA Certificate Fields
      origin_criterion: '',
      method_of_qualification: '',

      // Producer Details (Field #4 - if different from exporter)
      producer_name: '',
      producer_address: '',
      producer_tax_id: '',
      producer_phone: '',
      producer_email: '',
      producer_country: '',
      producer_same_as_exporter: false,

      // Component Origins
      component_origins: []
  });

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentStep) {
      localStorage.setItem('workflow_current_step', currentStep.toString());
    }
  }, [currentStep]);

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

  // Load saved form data from localStorage (client-side only)
  useEffect(() => {
    const saved = loadSavedData();
    if (saved) {
      setFormData(saved);
      console.log('✅ Loaded saved form data from localStorage:', {
        company_name: saved.company_name,
        product_description: saved.product_description,
        component_origins_count: saved.component_origins?.length
      });
    } else {
      console.log('ℹ️ No saved form data found in localStorage');
    }
  }, []);

  // Load saved results from localStorage (client-side only)
  // Note: currentStep is now restored in the useState initializer
  useEffect(() => {
    const savedResults = localStorage.getItem('usmca_workflow_results');

    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);

        // CRITICAL FIX: Also populate formData from saved results
        // This ensures when users navigate back to earlier steps, form fields are populated
        if (parsed) {
          setFormData(prev => ({
            ...prev,
            company_name: parsed.company?.name || parsed.company?.company_name || prev.company_name,
            business_type: parsed.company?.business_type || prev.business_type,
            industry_sector: parsed.company?.industry_sector || prev.industry_sector,
            trade_volume: parsed.company?.trade_volume || prev.trade_volume,
            company_address: parsed.company?.company_address || parsed.company?.address || prev.company_address,
            tax_id: parsed.company?.tax_id || prev.tax_id,
            contact_person: parsed.company?.contact_person || prev.contact_person,
            contact_phone: parsed.company?.contact_phone || parsed.company?.phone || prev.contact_phone,
            contact_email: parsed.company?.contact_email || parsed.company?.email || prev.contact_email,
            product_description: parsed.product?.description || prev.product_description,
            manufacturing_location: parsed.usmca?.manufacturing_location || prev.manufacturing_location,
            classified_hs_code: parsed.product?.hs_code || prev.classified_hs_code,
            component_origins: parsed.components || parsed.component_origins || prev.component_origins
          }));
        }

        console.log('✅ Loaded saved results from localStorage AND populated formData');
      } catch (e) {
        console.error('Error loading saved results:', e);
      }
    }
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

              // Filter out null/undefined values to avoid overwriting localStorage data
              const cleanData = Object.entries(result.data).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                  acc[key] = value;
                }
                return acc;
              }, {});

              setFormData(prev => ({ ...prev, ...cleanData }));
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
        component_origins: (prev.component_origins && prev.component_origins.length > 0)
          ? prev.component_origins
          : [
              { origin_country: 'CN', value_percentage: 60 },
              { origin_country: 'MX', value_percentage: 40 }
            ]
      }));
      setDefaultsLoaded(true);
    }
  }, [defaultsLoaded, isLoadingOptions]);

  // ✅ REMOVED AUTO-SAVE - Now saves only when user clicks "Next"
  // This eliminates 150+ unnecessary database writes during form filling
  // localStorage still updates immediately for instant form restoration
  useEffect(() => {
    if (typeof window !== 'undefined' && formData.company_name) {
      localStorage.setItem('triangleUserData', JSON.stringify(formData));
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
    console.log('⚙️ ========== PROCESS WORKFLOW CALLED ==========');
    console.log('📋 formData received by useWorkflowState:', {
      company_name: formData.company_name,
      business_type: formData.business_type,
      trade_volume: formData.trade_volume,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location,
      component_origins_count: formData.component_origins?.length,
      component_origins: formData.component_origins
    });

    const validation = workflowService.validateFormData(formData);

    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      setError('Form validation failed: ' + validation.errors.join(', '));
      return;
    }

    console.log('✅ Validation passed, calling workflow service...');
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
          company: {
            ...workflowResult.company,
            // CRITICAL: Ensure company_country and certifier_type flow through
            company_country: formData.company_country || workflowResult.company?.company_country,
            certifier_type: formData.certifier_type || workflowResult.company?.certifier_type
          },
          product: workflowResult.product,
          usmca: workflowResult.usmca,
          trust: workflowResult.trust,
          // CRITICAL FIX: Use ENRICHED components from API, not original formData
          component_origins: workflowResult.component_origins || workflowResult.components || formData.component_origins,
          components: workflowResult.component_origins || workflowResult.components || formData.component_origins,
          timestamp: Date.now()
        };

        localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowData));
        console.log('✅ Workflow data saved to localStorage with ENRICHED components:', {
          has_company_country: !!workflowData.company.company_country,
          has_certifier_type: !!workflowData.company.certifier_type,
          enriched_components_count: workflowData.component_origins?.length,
          has_enrichment: workflowData.component_origins?.[0]?.hs_code ? true : false
        });

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

    // Clear saved step and results from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('workflow_current_step');
      localStorage.removeItem('usmca_workflow_results');
    }

    // Complete form reset - clear ALL fields for new analysis
    setFormData({
      company_name: '',
      company_country: '',  // CRITICAL: Reset company country for certificate
      business_type: '',
      industry_sector: '',
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
      // Reset USMCA Certificate Fields
      origin_criterion: '',
      method_of_qualification: '',
      // Reset Producer Details
      producer_name: '',
      producer_address: '',
      producer_tax_id: '',
      producer_phone: '',
      producer_email: '',
      producer_country: '',
      producer_same_as_exporter: false,
      component_origins: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'MX', value_percentage: 40 }
      ]
    });
  }, []);

  // Navigation helpers
  const goToStep = useCallback((step) => {
    console.log(`📍 Navigating to step ${step} - Current formData:`, {
      company_name: formData.company_name,
      product_description: formData.product_description,
      component_origins_count: formData.component_origins?.length
    });

    setCurrentStep(step);
    setError(null); // Clear any previous errors when navigating

    // Save step to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('workflow_current_step', step.toString());
    }
  }, [formData]);

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
               formData.company_country &&  // CRITICAL: Validate company country for certificate
               formData.business_type &&
               formData.industry_sector &&
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

  // Load saved workflow from dashboard
  const loadSavedWorkflow = useCallback((workflow) => {
    console.log('📥 Loading saved workflow:', workflow);

    // Convert workflow data to results format
    const workflowData = workflow.workflow_data || {};

    const loadedResults = {
      success: true,
      company: {
        name: workflow.company_name,
        company_name: workflow.company_name,
        business_type: workflow.business_type,
        trade_volume: workflow.trade_volume,
        ...workflowData.company
      },
      product: {
        hs_code: workflow.hs_code,
        description: workflow.product_description,
        confidence: workflowData.classification_confidence || 95,
        ...workflowData.product
      },
      usmca: {
        qualified: workflow.qualification_status === 'QUALIFIED',
        north_american_content: workflow.regional_content_percentage,
        regional_content: workflow.regional_content_percentage,
        threshold_applied: workflow.required_threshold,
        component_breakdown: workflow.component_origins || workflowData.components || [],
        ...workflowData.usmca
      },
      savings: {
        annual_savings: workflow.estimated_annual_savings || 0,
        ...workflowData.savings
      },
      component_origins: workflow.component_origins || workflowData.components || [],
      components: workflow.component_origins || workflowData.components || []
    };

    // CRITICAL FIX: Also populate formData so step navigation works
    // This ensures when users click back to Step 1 or 2, the form fields are populated
    setFormData(prev => ({
      ...prev,
      company_name: workflow.company_name || workflowData.company?.name || '',
      business_type: workflow.business_type || workflowData.company?.business_type || '',
      industry_sector: workflow.industry_sector || workflowData.company?.industry_sector || '',
      trade_volume: workflow.trade_volume || workflowData.company?.trade_volume || '',
      company_address: workflowData.company?.company_address || workflowData.company?.address || '',
      tax_id: workflowData.company?.tax_id || '',
      contact_person: workflowData.company?.contact_person || '',
      contact_phone: workflowData.company?.contact_phone || workflowData.company?.phone || '',
      contact_email: workflowData.company?.contact_email || workflowData.company?.email || '',
      product_description: workflow.product_description || workflowData.product?.description || '',
      manufacturing_location: workflow.manufacturing_location || workflowData.usmca?.manufacturing_location || 'MX',
      classified_hs_code: workflow.hs_code || workflowData.product?.hs_code || '',
      component_origins: workflow.component_origins || workflowData.components || []
    }));

    // Set results and jump to results page
    setResults(loadedResults);
    setCurrentStep(5);

    console.log('✅ Workflow loaded, showing results AND formData populated for navigation');
  }, []);

  // Manual save function - called when user clicks "Next"
  const saveWorkflowToDatabase = useCallback(async () => {
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
          userId: 'current-user',
          action: 'save'
        })
      });

      if (response.ok) {
        console.log('✅ Workflow saved to database');
        return { success: true };
      } else {
        console.error('❌ Database save failed');
        return { success: false, error: 'Save failed' };
      }
    } catch (error) {
      console.error('❌ Database save error:', error);
      return { success: false, error: error.message };
    }
  }, [formData]);

  // Beforeunload warning if user has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formData.company_name && currentStep < 5) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.company_name, currentStep]);

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
    loadSavedWorkflow,
    saveWorkflowToDatabase,

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