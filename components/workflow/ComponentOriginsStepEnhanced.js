/**
 * ComponentOriginsStepEnhanced - Step 2 of USMCA workflow
 * Includes component descriptions and HS code lookup
 * Real-world approach to multi-component products
 * Enhanced with real-time AI agent assistance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AgentSuggestionBadge from '../agents/AgentSuggestionBadge';
import { canAddComponent, getComponentLimitMessage, getUpgradeMessage, SUBSCRIPTION_TIERS } from '../../config/subscription-limits';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
import { parseTradeVolume } from '../../lib/utils/parseTradeVolume.js';
import workflowStorage from '../../lib/services/workflow-storage-adapter';
// Direct API call - no intermediate helper files

export default function ComponentOriginsStepEnhanced({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  onPrevious,
  onProcessWorkflow,
  isFormValid,
  isLoading,
  userTier = SUBSCRIPTION_TIERS.FREE_TRIAL,
  saveWorkflowToDatabase,
  currentSessionId  // ✅ FIX (Nov 6): Receive session ID from parent hook
}) {
  // Track if we just pushed to parent to avoid infinite restore loop
  const lastPushedRef = useRef(null);

  // ✅ FIX #3: Ensure all component fields are always defined to prevent React controlled/uncontrolled warning
  // Memoized with useCallback to prevent infinite loops in effects (no dependencies = stable reference)
  const normalizeComponent = useCallback((component) => {
    // ✅ FIX: Auto-lock components that have HS codes (indicates prior lookup, counts toward tier limit)
    // This handles restoration from previous sessions where lock tracking wasn't implemented
    const hasHSCode = component?.hs_code && component.hs_code.length >= 6;
    const shouldBeLocked = component?.is_locked ?? (hasHSCode ? true : false);

    return {
      description: component?.description ?? '',
      origin_country: component?.origin_country ?? '',
      value_percentage: component?.value_percentage ?? '',
      hs_code: component?.hs_code ?? '',
      hs_suggestions: component?.hs_suggestions ?? [],
      manufacturing_location: component?.manufacturing_location ?? formData.manufacturing_location ?? '',
      enrichment_error: component?.enrichment_error ?? null,
      mfn_rate: component?.mfn_rate ?? null,
      usmca_rate: component?.usmca_rate ?? null,
      is_usmca_member: component?.is_usmca_member ?? false,
      is_locked: shouldBeLocked, // Track if component used an HS lookup (auto-lock if has HS code)

      // ✅ P0-3 FIX: Preserve AI classification metadata (was being lost on navigation)
      ai_reasoning: component?.ai_reasoning ?? '',
      classification_source: component?.classification_source ?? null,
      confidence: component?.confidence ?? null,
      alternative_codes: component?.alternative_codes ?? [],
      required_documentation: component?.required_documentation ?? [],

      // ✅ Additional tariff enrichment fields
      section_301: component?.section_301 ?? null,
      section_232: component?.section_232 ?? null,
      total_rate: component?.total_rate ?? null,
      annual_savings: component?.annual_savings ?? null,
      rate_source: component?.rate_source ?? null,
      stale: component?.stale ?? false
    };
  }, [formData.manufacturing_location]);

  const [components, setComponents] = useState(() => {
    // RESTORATION: Check if formData already has components from previous navigation
    if (formData.component_origins && formData.component_origins.length > 0) {
      console.log(`📂 Restoring ${formData.component_origins.length} components from formData`);
      // ✅ Normalize each component to ensure all fields exist
      return formData.component_origins.map(normalizeComponent);
    }
    // Otherwise initialize with empty template
    return [
      normalizeComponent({
        manufacturing_location: formData.manufacturing_location
      })
    ];
  });

  // Track total components used (including deleted locked ones) - prevents gaming HS lookup
  const [usedComponentsCount, setUsedComponentsCount] = useState(() => {
    if (formData.component_origins && formData.component_origins.length > 0) {
      // ✅ FIX: Count components that are locked OR have HS codes (prior lookups count toward limit)
      return formData.component_origins.filter(c =>
        c.is_locked || (c.hs_code && c.hs_code.length >= 6)
      ).length;
    }
    return 0;
  });

  const [searchingHS, setSearchingHS] = useState({});
  const [agentSuggestions, setAgentSuggestions] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Update parent form data when components change
  // CRITICAL: Prevent infinite loop by tracking when we push to parent
  // ✅ FIX: Use ref to mark when we pushed, skip restoration if we just pushed
  useEffect(() => {
    // Don't update on initial render (components will be [{}])
    if (components.length === 1 && !components[0].description) {
      return; // Skip initial empty component
    }

    // Mark that we just pushed this data
    lastPushedRef.current = JSON.stringify(components);
    updateFormData('component_origins', components);
  }, [components, updateFormData]);

  // Sync used_components_count to formData for API validation
  useEffect(() => {
    updateFormData('used_components_count', usedComponentsCount);
  }, [usedComponentsCount, updateFormData]);

  // Restore components when navigating back and formData changes
  // This handles browser back button and in-app navigation
  // ✅ FIX: Skip restoration if we just pushed the same data (prevents infinite loop)
  useEffect(() => {
    if (formData.component_origins &&
        formData.component_origins.length > 0) {

      // ✅ P1-2 FIX: Normalize BEFORE comparing to prevent infinite loop
      // If we compare un-normalized data, the stringified output will never match
      const normalizedComponents = formData.component_origins.map(normalizeComponent);
      const formDataString = JSON.stringify(normalizedComponents);

      // Skip if we just pushed this exact data (prevents loop)
      if (lastPushedRef.current === formDataString) {
        return;
      }

      console.log(`🔄 Syncing components from formData (navigation restore)`);
      setComponents(normalizedComponents);

      // ✅ P1-1 FIX: Recalculate usedComponentsCount to stay in sync with restored components
      const newUsedCount = normalizedComponents.filter(c =>
        c.is_locked || (c.hs_code && c.hs_code.length >= 6)
      ).length;
      setUsedComponentsCount(newUsedCount);
      console.log(`🔒 Restored ${newUsedCount} locked components`);
    }
  }, [formData.component_origins]); // ✅ Only watch formData.component_origins, not components (would cause loop)

  // 💾 AUTO-SAVE: Debounced auto-save to database when components change
  // Prevents data loss if browser crashes or page is closed during Step 2 editing
  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    // Skip initial empty render
    if (components.length === 1 && !components[0].description) {
      return;
    }

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (debounce: 2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (saveWorkflowToDatabase && formData.company_name) {
        try {
          console.log('💾 Auto-saving component data (Step 2)...');
          await saveWorkflowToDatabase();
          console.log('✅ Component data auto-saved to database');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
          // Don't show error to user - this is background save
        }
      }
    }, 2000); // Wait 2 seconds after last change before saving

    return () => {
      // Cleanup timeout on unmount
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [components, saveWorkflowToDatabase, formData.company_name]);

  const updateComponent = (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    setComponents(newComponents);
  };

  // Get AI agent suggestion for specific component
  const getComponentHSSuggestion = async (index) => {
    const component = components[index];

    // Validate all required fields are filled
    if (!component.description || component.description.length < 10) {
      console.log('Description too short or missing');
      return;
    }
    if (!component.origin_country) {
      console.log('Origin country not selected');
      return;
    }
    if (!component.value_percentage || component.value_percentage <= 0) {
      console.log('Value percentage not entered');
      return;
    }

    // CRITICAL: Validate formData business_type (REQUIRED by AI classification agent)
    if (!formData.business_type) {
      console.error('❌ Cannot classify component: business_type is required from Step 1');
      alert('Please complete company information (business type) in Step 1 before requesting AI classification.');
      return;
    }

    setSearchingHS(prev => ({ ...prev, [index]: true }));

    try {
      // ✅ CRITICAL FIX (Nov 6): Use session ID from parent hook (passed via props)
      // This ensures we always get the CURRENT session that React knows about
      const workflow_session_id = currentSessionId;

      // 🔍 DEBUG: Comprehensive session ID logging
      console.log('═══════════════════════════════════════════════════');
      console.log('🔍 [CLASSIFICATION AUTO-SUGGEST] HS CODE - Component', index + 1);
      console.log('🔍 [CLASSIFICATION AUTO-SUGGEST] currentSessionId (from props):', currentSessionId);
      console.log('🔍 [CLASSIFICATION AUTO-SUGGEST] workflow_session_id (to be sent):', workflow_session_id);
      console.log('🔍 [CLASSIFICATION AUTO-SUGGEST] localStorage workflow_session_id:', localStorage.getItem('workflow_session_id'));
      console.log('═══════════════════════════════════════════════════');

      if (!workflow_session_id) {
        console.error('❌ [CLASSIFICATION] No workflow session ID available!');
        throw new Error('No active workflow session. Please start a new analysis.');
      }

      // ✅ FIX (Nov 6): Save session to database BEFORE classification API call
      // Classification API requires active workflow session in database
      console.log('💾 [CLASSIFICATION AUTO-SUGGEST] Saving workflow session to database...');
      console.log('💾 [CLASSIFICATION AUTO-SUGGEST] Session ID being saved:', workflow_session_id);
      await saveWorkflowToDatabase();
      console.log('✅ [CLASSIFICATION AUTO-SUGGEST] Workflow session saved - proceeding with classification')

      // Send complete business context for accurate AI classification
      const response = await fetch('/api/agents/classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_hs_code',
          productDescription: component.description,
          workflow_session_id,  // ✅ Required by API to verify active workflow
          componentOrigins: [{
            description: component.description,
            origin_country: component.origin_country,
            value_percentage: component.value_percentage
          }],
          additionalContext: {
            // Complete product context from Step 1
            overallProduct: formData.product_description,
            industryContext: formData.industry_sector, // ✅ FIX (Nov 1): Use industry_sector (Electronics), not business_type (Manufacturer)
            businessType: formData.business_type,
            manufacturingLocation: formData.manufacturing_location,
            exportDestination: formData.export_destination,
            tradeVolume: formData.trade_volume,  // ✅ FIXED: Use trade_volume, not annual_trade_volume (matches CompanyInformationStep)
            companyName: formData.company_name,
            primarySupplier: formData.primary_supplier_country,

            // PROGRESSIVE CONTEXT: Send previously classified components (before this index)
            // This prevents duplicate HS codes - AI knows what codes it already assigned
            previouslyClassifiedComponents: components.slice(0, index)
              .filter(c => c.description && c.hs_code) // Only components with HS codes
              .map(c => ({
                description: c.description,
                origin_country: c.origin_country,
                value_percentage: c.value_percentage,
                hs_code: c.hs_code
              }))
          }
        })
      });

      const result = await response.json();
      console.log(`🤖 Agent Classification Result for Component ${index + 1}:`, result);

      if (result.success && result.data) {
        // ✅ SAFETY: Ensure explanation is always a string (AI might return objects)
        const rawExplanation = result.data.reasoning || result.data.explanation;
        const safeExplanation = typeof rawExplanation === 'string'
          ? rawExplanation
          : JSON.stringify(rawExplanation || 'AI classification completed');

        // ✅ SAFETY: Ensure alternativeCodes are safe (normalize any nested objects)
        const safeAlternativeCodes = (result.enhanced_features?.alternative_codes || []).map(alt => ({
          code: typeof alt.code === 'string' ? alt.code : String(alt.code || ''),
          reason: typeof alt.reason === 'string' ? alt.reason : (alt.reason?.status || String(alt.reason || 'Alternative option')),
          confidence: Number(alt.confidence) || 0
        }));

        const suggestion = {
          hs_code: result.data.hs_code,
          description: result.data.description, // ✅ REAL HTS DESCRIPTION
          confidence: result.data.confidence || result.data.adjustedConfidence,
          explanation: safeExplanation,
          source: 'AI Classification Agent',
          // Enhanced features from API - HS CLASSIFICATION ONLY (tariff rates looked up separately)
          alternative_codes: safeAlternativeCodes
        };
        console.log(`✅ Setting agent suggestion for component ${index + 1}:`, suggestion);
        setAgentSuggestions(prev => ({ ...prev, [index]: suggestion }));

        // 🔒 LOCK COMPONENT: Once HS lookup performed, component slot is consumed
        // Even if user deletes it later, this prevents gaming the system
        const newComponents = [...components];
        if (!newComponents[index].is_locked) {
          newComponents[index].is_locked = true;
          setComponents(newComponents);
          setUsedComponentsCount(prev => prev + 1);
          console.log(`🔒 Component ${index + 1} locked after HS lookup. Used count: ${usedComponentsCount + 1}`);
        }

        // ✅ REMOVED AUTO-ACCEPT - User now sees suggestion and decides to accept or not
        // This gives user time to read AI explanation before committing
      } else {
        console.log(`❌ No valid suggestion returned for component ${index + 1}`);
      }
    } catch (error) {
      console.error(`Agent classification error for component ${index + 1}:`, error);
      await DevIssue.apiError('component_origins_step', '/api/agents/classification', error, {
        componentIndex: index,
        componentDescription: component.description,
        originCountry: component.origin_country
      });
    } finally {
      setSearchingHS(prev => ({ ...prev, [index]: false }));
    }
  };

  // Manual HS Code lookup function - uses classification endpoint
  const lookupHSCode = async (index) => {
    const component = components[index];

    if (!component.description || component.description.length < 3) {
      alert('Please enter a product description first');
      return;
    }

    // CRITICAL: Validate formData business_type (improves AI accuracy)
    if (!formData.business_type) {
      console.error('❌ Cannot lookup HS code: business_type missing from Step 1');
      alert('Please complete company information (business type) in Step 1 for better HS code accuracy.');
      return;
    }

    setSearchingHS({ ...searchingHS, [index]: true });

    try {
      // ✅ CRITICAL FIX (Nov 6): Use session ID from parent hook (passed via props)
      // This ensures we always get the CURRENT session that React knows about
      const workflow_session_id = currentSessionId;

      // 🔍 DEBUG: Comprehensive session ID logging
      console.log('═══════════════════════════════════════════════════');
      console.log('🔍 [CLASSIFICATION MANUAL LOOKUP] HS CODE - Component', index + 1);
      console.log('🔍 [CLASSIFICATION MANUAL LOOKUP] currentSessionId (from props):', currentSessionId);
      console.log('🔍 [CLASSIFICATION MANUAL LOOKUP] workflow_session_id (to be sent):', workflow_session_id);
      console.log('🔍 [CLASSIFICATION MANUAL LOOKUP] localStorage workflow_session_id:', localStorage.getItem('workflow_session_id'));
      console.log('═══════════════════════════════════════════════════');

      if (!workflow_session_id) {
        console.error('❌ [CLASSIFICATION] No workflow session ID available!');
        throw new Error('No active workflow session. Please start a new analysis.');
      }

      // ✅ FIX (Nov 6): Save session to database BEFORE classification API call
      // Classification API requires active workflow session in database
      console.log('💾 [CLASSIFICATION MANUAL LOOKUP] Saving workflow session to database...');
      console.log('💾 [CLASSIFICATION MANUAL LOOKUP] Session ID being saved:', workflow_session_id);
      await saveWorkflowToDatabase();
      console.log('✅ [CLASSIFICATION MANUAL LOOKUP] Workflow session saved - proceeding with classification');

      // Use the existing classification endpoint which handles AI + caching
      const response = await fetch('/api/agents/classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_hs_code',
          productDescription: component.description,
          workflow_session_id,  // ✅ Required by API to verify active workflow
          componentOrigins: [{
            description: component.description,
            origin_country: component.origin_country || 'Unknown',  // ✅ Don't assume 'US' - let API validate
            value_percentage: component.value_percentage || 100
          }],
          additionalContext: {
            overallProduct: formData.product_description,
            industryContext: formData.industry_sector, // ✅ FIX (Nov 1): Use industry_sector (Electronics), not business_type (Manufacturer)
            businessType: formData.business_type,
            manufacturingLocation: formData.manufacturing_location,
            exportDestination: formData.export_destination,
            tradeVolume: formData.trade_volume,
            companyName: formData.company_name,
            primarySupplier: formData.primary_supplier_country,
            previouslyClassifiedComponents: components.slice(0, index)
              .filter(c => c.description && c.hs_code)
              .map(c => ({
                description: c.description,
                origin_country: c.origin_country,
                value_percentage: c.value_percentage,
                hs_code: c.hs_code
              }))
          }
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Use classification result to populate suggestions
        const suggestion = {
          hs_code: result.data.hs_code,
          description: result.data.description || component.description,
          confidence: result.data.confidence || 85,
          confidenceText: `${Math.round((result.data.confidence || 0.85) * 100)}% accuracy`,
          reasoning: result.data.explanation || 'AI classification completed',
          source: 'Classification Agent'
        };

        const newComponents = [...components];
        newComponents[index].hs_code = suggestion.hs_code;
        newComponents[index].hs_description = suggestion.description;
        newComponents[index].hs_suggestions = [suggestion];

        // 🔒 LOCK COMPONENT: Once HS lookup performed, component slot is consumed
        if (!newComponents[index].is_locked) {
          newComponents[index].is_locked = true;
          setUsedComponentsCount(prev => prev + 1);
          console.log(`🔒 Component ${index + 1} locked after manual HS lookup. Used count: ${usedComponentsCount + 1}`);
        }

        setComponents(newComponents);
        console.log(`✅ Auto-populated HS code ${suggestion.hs_code} for component ${index + 1}`);
      } else {
        console.log(`⚠️ No HS code suggestions found for component ${index + 1}`);
        alert('No HS code suggestions found. Try a more specific product description.');
      }
    } catch (error) {
      console.error('HS code lookup failed:', error);
      await DevIssue.apiError('component_origins_step', '/api/agents/classification', error, {
        componentIndex: index,
        productDescription: component.description
      });
      alert('HS code lookup failed. Please try again or enter the code manually.');
    } finally {
      setSearchingHS({ ...searchingHS, [index]: false });
    }
  };

  // Function to capture user-contributed HS codes
  const captureUserHSCode = async (hsCode, description) => {
    if (!hsCode || !description) return;

    // CRITICAL: Validate required fields before calling API (Fail Loudly Protocol)
    if (!formData.company_name) {
      console.error('❌ Cannot capture HS code: company_name is required');
      return; // Skip optional HS code capture if company data is missing
    }

    try {
      const response = await fetch('/api/user-contributed-hs-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hs_code: hsCode,
          product_description: description,
          business_type: formData.business_type || 'general',
          company_name: formData.company_name, // Required field, validated above
          user_confidence: 8 // User-provided codes have high confidence
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ HS code captured:', result.message);
      }
    } catch (error) {
      console.error('Failed to capture HS code:', error);
      // Fail silently - don't disrupt user experience (no dev issue log needed for optional feature)
    }
  };

  const addComponent = () => {
    // Check component limit using USED count (not current count) - prevents gaming
    // Once a component uses HS lookup, it's counted even if deleted
    if (!canAddComponent(userTier, usedComponentsCount)) {
      setShowUpgradeModal(true);
      return;
    }

    setComponents([...components, {
      description: '',
      origin_country: '',
      value_percentage: '',
      hs_code: '',
      hs_suggestions: [],
      manufacturing_location: formData.manufacturing_location || '',
      is_locked: false
    }]);

    // Scroll to the new component after it's added
    setTimeout(() => {
      const newComponentIndex = components.length;
      const componentElement = document.querySelector(`[data-component-index="${newComponentIndex}"]`);
      if (componentElement) {
        componentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const removeComponent = (index) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const getTotalPercentage = () => {
    return components.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0);
  };

  const selectHSCode = (index, suggestion) => {
    const newComponents = [...components];
    newComponents[index].hs_code = suggestion.hs_code;
    newComponents[index].hs_description = suggestion.description;
    newComponents[index].showSuggestions = false;
    setComponents(newComponents);

    // Update main formData with HS classification and tariff rates for certificate workflow
    updateFormData('classified_hs_code', suggestion.hs_code);
    updateFormData('current_tariff_rate', suggestion.mfn_rate || 0);
    updateFormData('usmca_tariff_rate', suggestion.usmca_rate || 0);

    // Calculate and save annual savings based on trade volume
    // Use the centralized parseTradeVolume utility for consistency across the app
    const tradeVolume = parseTradeVolume(formData.trade_volume);
    const mfnRate = parseFloat(suggestion.mfn_rate || 0);
    const usmcaRate = parseFloat(suggestion.usmca_rate || 0);
    const tariffSavings = (mfnRate - usmcaRate) / 100; // Convert percentage to decimal
    const annualSavings = tradeVolume * tariffSavings;

    updateFormData('calculated_savings', Math.round(annualSavings));
    updateFormData('monthly_savings', Math.round(annualSavings / 12));

    console.log('Updated formData with HS classification results:', {
      hs_code: suggestion.hs_code,
      mfn_rate: suggestion.mfn_rate,
      usmca_rate: suggestion.usmca_rate,
      tradeVolumeText: formData.trade_volume,
      tradeVolumeNumeric: tradeVolume,
      tariffSavingsRate: tariffSavings,
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(annualSavings / 12)
    });
  };

  const isValid = () => {
    const total = getTotalPercentage();
    // HS code is REQUIRED - user must either input it manually or get AI suggestion
    // This ensures all HS codes are pre-classified before main USMCA analysis API call
    const allFieldsFilled = components.every(c =>
      c.description &&
      c.origin_country &&
      c.value_percentage > 0 &&
      c.hs_code &&
      c.hs_code.trim() !== ''
    );
    return total === 100 && allFieldsFilled;
  };

  // Validate workflow data before proceeding
  const handleValidateAndProceed = async () => {
    if (!isValid()) return;

    // ✅ FIX (Nov 6): Check ALL required fields including HS codes
    const errors = [];

    // Check company info
    if (!formData.company_name || !formData.business_type) {
      errors.push({ message: 'Company information incomplete (company name and business type required)' });
    }

    // Check each component for ALL required fields
    components.forEach((component, index) => {
      const missing = [];
      if (!component.description || component.description.length < 10) {
        missing.push('description (min 10 characters)');
      }
      if (!component.origin_country) {
        missing.push('origin country');
      }
      if (!component.value_percentage || component.value_percentage <= 0) {
        missing.push('value percentage');
      }
      if (!component.hs_code) {
        missing.push('HS code (click "Get AI HS Code Suggestion" or enter manually)');
      }

      if (missing.length > 0) {
        errors.push({
          message: `Component ${index + 1}: Missing ${missing.join(', ')}`
        });
      }
    });

    // Check total percentage
    if (getTotalPercentage() !== 100) {
      errors.push({ message: `Components must total 100% (currently ${getTotalPercentage()}%)` });
    }

    if (errors.length > 0) {
      setValidationResult({
        success: true,
        data: {
          valid: false,
          errors: errors
        }
      });
      return;
    }

    // If workflow is valid, proceed directly
    console.log('🚀 ========== STEP 2 SUBMIT: COMPONENT DATA ==========');
    console.log('📦 Component Data Being Submitted:', {
      component_count: components.length,
      components: components.map((c, i) => ({
        index: i + 1,
        description: c.description,
        origin_country: c.origin_country,
        value_percentage: c.value_percentage,
        hs_code: c.hs_code,
        manufacturing_location: c.manufacturing_location
      })),
      total_percentage: components.reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0)
    });
    console.log('🏢 Company Data from formData:', {
      company_name: formData.company_name,
      business_type: formData.business_type,
      trade_volume: formData.trade_volume,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location
    });
    console.log('========== END COMPONENT DATA ==========');

    // 💾 NEW: Save component data to database before processing workflow
    if (saveWorkflowToDatabase) {
      console.log('💾 Saving component data to database before analysis...');
      await saveWorkflowToDatabase();
    }

    // ✅ CRITICAL: Check subscription limit BEFORE triggering AI analysis
    // This is the ONLY place users trigger analysis - blocking here blocks ALL paths
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const limitCheck = await fetch('/api/check-usage-limit', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (limitCheck.ok) {
          const limitData = await limitCheck.json();
          if (limitData.limitReached) {
            // Show upgrade modal instead of proceeding
            alert(`🔒 Monthly Analysis Limit Reached\n\nYou've used ${limitData.usage.used} of ${limitData.usage.limit} analyses this month.\n\nUpgrade to continue creating workflows.`);
            window.location.href = '/pricing';
            return; // Block proceeding
          }
        }
      }
    } catch (error) {
      console.error('[LIMIT-CHECK] Error checking subscription limit:', error);
      // Continue anyway if check fails (don't block legitimate users due to API issues)
    }

    onProcessWorkflow();
  };

  // Educational template - shows format without specific compliance data
  const loadExample = () => {
    // Set example format - no specific compliance data
    updateFormData('product_description', '[Enter your complete product description here]');
    updateFormData('manufacturing_location', '');
    
    // Set component structure example - user must fill actual data
    setComponents([
      { 
        description: '[Describe major component #1]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      },
      { 
        description: '[Describe major component #2]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      },
      { 
        description: '[Describe major component #3]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      }
    ]);
  };

  return (
    <div className="dashboard-container">
      {/* Product Overview Section */}
      <div className="form-section">
        <h3 className="form-section-title">Product Overview</h3>
        
        <div className="form-grid-2">
          {/* Main Product Description */}
          <div className="form-group">
            <label className="form-label">
              Complete Product Description
            </label>
            <textarea
              value={formData.product_description || ''}
              onChange={(e) => updateFormData('product_description', e.target.value)}
              placeholder="Example: '100% cotton crew neck t-shirts with reinforced seams, medium weight jersey knit fabric'"
              className="form-input"
              rows="3"
            />
            <div className="form-help">
              Detailed product description including materials, construction, and key features for accurate classification
            </div>

          </div>

          {/* Manufacturing Location */}
          <div className="form-group">
            <label className="form-label required">
              Manufacturing/Assembly Location
            </label>
            <select
              value={formData.manufacturing_location || ''}
              onChange={(e) => updateFormData('manufacturing_location', e.target.value)}
              className={`form-select ${formData.manufacturing_location ? 'has-value' : ''}`}
              required
            >
              <option value="">Select manufacturing country...</option>
              <option value="DOES_NOT_APPLY">Does Not Apply (Imported/Distributed Only)</option>
              {dropdownOptions.countries?.map((country, idx) => {
                const countryCode = typeof country === 'string' ? country : country.value || country.code;
                const countryName = typeof country === 'string' ? country : country.label || country.name;
                return (
                  <option key={`mfg-loc-${countryCode}-${idx}`} value={countryCode}>
                    {countryName}
                  </option>
                );
              })}
            </select>
            <div className="form-help">
              Where is the final product assembled/manufactured? (Select &quot;Does Not Apply&quot; if you import/distribute only)
            </div>

            {/* Substantial Transformation Checkbox - Only show for USMCA countries */}
            {formData.manufacturing_location && ['US', 'MX', 'CA', 'United States', 'Mexico', 'Canada'].includes(formData.manufacturing_location) && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.substantial_transformation || false}
                    onChange={(e) => updateFormData('substantial_transformation', e.target.checked)}
                    style={{ marginTop: '0.125rem', marginRight: '0.5rem', flexShrink: 0 }}
                  />
                  <span style={{ color: '#0c4a6e', lineHeight: '1.5' }}>
                    <strong>Manufacturing involves substantial transformation</strong> (not just simple assembly)
                    <br />
                    <span style={{ fontSize: '0.8125rem', color: '#075985', fontStyle: 'italic' }}>
                      Check this if your manufacturing process creates significant value beyond basic assembly (welding, forming, heat treatment, etc.)
                    </span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* REMOVED: origin_criterion and method_of_qualification dropdowns
              These fields confused users because AI determines them based on USMCA treaty rules.
              Allowing users to "choose" created false sense of control - AI must apply correct rules
              regardless of user selection (e.g., automotive products MUST use Net Cost method).

              These values are now determined by AI and shown in results/certificate. */}
        </div>
      </div>

      {/* Component Breakdown Section */}
      <div className="element-spacing">
        <h2 className="form-section-title">Component Breakdown</h2>
        <p className="text-body">
          Break down your product into its major components. Each component should represent a significant portion of the product&apos;s value.
        </p>
      </div>

      <div className="element-spacing">
        {components.map((component, index) => (
          <div key={index} className="form-section" data-component-index={index}>
            <div className="dashboard-actions">
              <div className="dashboard-actions-left">
                <h3 className="form-section-title">Component {index + 1}</h3>
              </div>
              {components.length > 1 && (
                <div className="dashboard-actions-right">
                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    className="btn-danger"
                    title="Remove component"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-grid-2">
              {/* Component Description */}
              <div className="form-group">
                <label className="form-label">
                  Component Description {component.is_locked && '🔒'}
                </label>
                <input
                  type="text"
                  value={component.description || ''}
                  onChange={(e) => {
                    updateComponent(index, 'description', e.target.value);
                  }}
                  placeholder="Example: 'Polyester fabric outer shell' or 'Stainless steel fasteners'"
                  className="form-input"
                  disabled={component.is_locked}
                  style={component.is_locked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                {component.is_locked && (
                  <div className="form-help" style={{ color: '#f59e0b', fontWeight: 500 }}>
                    🔒 Component locked after HS lookup (counts toward your tier limit)
                  </div>
                )}
              </div>

              {/* Origin Country */}
              <div className="form-group">
                <label className="form-label">
                  Origin Country {component.is_locked && '🔒'}
                </label>
                <select
                  value={component.origin_country || ''}
                  onChange={(e) => updateComponent(index, 'origin_country', e.target.value)}
                  className={`form-select ${component.origin_country ? 'has-value' : ''}`}
                  disabled={component.is_locked}
                  style={component.is_locked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                >
                  <option value="">Select origin country...</option>
                  {dropdownOptions.countries?.map((country, idx) => {
                    const countryCode = typeof country === 'string' ? country : country.value || country.code;
                    const countryName = typeof country === 'string' ? country : country.label || country.name;
                    return (
                      <option key={`origin-${countryCode}-${idx}`} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Value Percentage */}
              <div className="form-group">
                <label className="form-label">
                  Value Percentage {component.is_locked && '🔒'}
                </label>
                <div className="form-input-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={component.value_percentage || ''}
                    onChange={(e) => updateComponent(index, 'value_percentage', parseFloat(e.target.value) || '')}
                    placeholder="Example: 45"
                    className="form-input"
                    disabled={component.is_locked}
                    style={component.is_locked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>

              {/* HS Code Input - Simple Hybrid Approach */}
              <div className="form-group">
                <label className="form-label">
                  HS Code * {component.is_locked && '🔒'}
                </label>
                <div className="form-help">
                  Required for accurate AI classification (like a tax form needs accurate information)
                </div>
                <input
                  type="text"
                  value={component.hs_code || ''}
                  onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                  placeholder="Enter if known (e.g., 8544.42.90)"
                  className="form-input"
                  disabled={component.is_locked}
                  style={component.is_locked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                <div className="form-help">
                  Don&apos;t know your HS code? Get AI suggestion below.
                </div>

                {/* Get AI Suggestion Button - Disabled when component is locked */}
                {!component.is_locked && (
                  <button
                    type="button"
                    onClick={() => getComponentHSSuggestion(index)}
                    disabled={
                      !component.description ||
                      component.description.length < 10 ||
                      !component.origin_country ||
                      !component.value_percentage ||
                      searchingHS[index]
                    }
                    className={
                      component.description && component.description.length >= 10 &&
                      component.origin_country && component.value_percentage && !searchingHS[index]
                        ? 'btn-primary btn-ai-suggestion'  // BLUE when all required fields filled
                        : 'btn-secondary btn-ai-suggestion'  // Gray when fields incomplete
                    }
                  >
                    {searchingHS[index] ? '🤖 Analyzing...' : '🤖 Get AI HS Code Suggestion'}
                  </button>
                )}
              </div>
            </div>

            {/* AI Agent HS Code Suggestion - FULL WIDTH outside grid */}
            {agentSuggestions[index] && (
              <AgentSuggestionBadge
                suggestion={{
                  success: true,
                  data: {
                    hs_code: agentSuggestions[index].hs_code,
                    description: agentSuggestions[index].description,
                    value: `HS Code: ${agentSuggestions[index].hs_code}`,
                    confidence: agentSuggestions[index].confidence,
                    explanation: agentSuggestions[index].explanation,
                    source: agentSuggestions[index].source,
                    alternative_codes: agentSuggestions[index].alternative_codes,
                    requiredDocumentation: agentSuggestions[index].requiredDocumentation
                  }
                }}
                onAccept={() => {
                  // EDUCATIONAL: Preserve AI reasoning in component data
                  const suggestion = agentSuggestions[index];
                  updateComponent(index, 'hs_code', suggestion.hs_code);
                  updateComponent(index, 'hs_description', suggestion.description);
                  updateComponent(index, 'ai_reasoning', suggestion.explanation);
                  updateComponent(index, 'confidence', suggestion.confidence);
                  updateComponent(index, 'alternative_codes', suggestion.alternative_codes || []);
                  updateComponent(index, 'required_documentation', suggestion.requiredDocumentation || []);
                  updateComponent(index, 'classification_source', 'ai_agent');

                  // Clear the suggestion badge (user accepted it)
                  const newSuggestions = { ...agentSuggestions };
                  delete newSuggestions[index];
                  setAgentSuggestions(newSuggestions);
                }}
                onDismiss={() => {
                  const newSuggestions = { ...agentSuggestions };
                  delete newSuggestions[index];
                  setAgentSuggestions(newSuggestions);
                }}
              />
            )}

            {/* EDUCATIONAL: Show AI classification indicator after acceptance */}
            {!agentSuggestions[index] && component.classification_source === 'ai_agent' && component.hs_code && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '4px',
                borderLeft: '3px solid #0ea5e9',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#075985' }}>
                  <span>🤖</span>
                  <span style={{ fontWeight: '500' }}>
                    AI-classified ({component.confidence}% confidence)
                  </span>
                  {component.ai_reasoning && (
                    <button
                      type="button"
                      onClick={() => {
                        // Show reasoning in alert for now (could be a modal in future)
                        alert(`AI Classification Reasoning:\n\n${component.ai_reasoning}\n\nRequired Documentation:\n${(component.required_documentation || []).map((doc, i) => `${i + 1}. ${doc}`).join('\n')}`);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0ea5e9',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.75rem',
                        padding: 0
                      }}
                    >
                      View reasoning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Component Button with Limit Status - Turns BLUE when last component is filled */}
        <div className="element-spacing">
          <button
            type="button"
            onClick={addComponent}
            className={(() => {
              // Check if last component is fully filled
              const lastComponent = components[components.length - 1];
              const isLastComponentComplete = lastComponent &&
                lastComponent.description && lastComponent.description.trim().length >= 10 &&
                lastComponent.origin_country &&
                lastComponent.value_percentage > 0 &&
                lastComponent.hs_code;

              return isLastComponentComplete ? 'btn-primary add-component-button' : 'btn-secondary add-component-button';
            })()}
          >
            Add Component
          </button>
          <div className="form-help" style={{marginTop: '0.5rem', textAlign: 'center'}}>
            {getComponentLimitMessage(userTier, usedComponentsCount)}
            {!canAddComponent(userTier, usedComponentsCount) && (
              <span style={{color: '#f59e0b', marginLeft: '0.5rem'}}>
                {getUpgradeMessage(userTier, 'component_limit')}
              </span>
            )}
            {usedComponentsCount > components.length && (
              <div style={{color: '#f59e0b', marginTop: '0.25rem', fontSize: '0.875rem'}}>
                ({components.length} active, {usedComponentsCount} total used including deleted)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total Percentage Display - PROMINENT & SEPARATE */}
      <div style={{
        margin: '2rem 0',
        padding: '1.5rem',
        background: getTotalPercentage() === 100 ? '#f0fdf4' : '#fef2f2',
        border: `4px solid ${getTotalPercentage() === 100 ? '#16a34a' : '#dc2626'}`,
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          Total Value Percentage: <span style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: getTotalPercentage() === 100 ? '#16a34a' : '#dc2626'
          }}>
            {getTotalPercentage().toFixed(1)}%
          </span>
        </div>
        {getTotalPercentage() !== 100 && (
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: '#dc2626',
            fontWeight: 600
          }}>
            ⚠️ Components must total exactly 100% of product value
          </p>
        )}
        {getTotalPercentage() === 100 && (
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: '#16a34a',
            fontWeight: 600
          }}>
            ✓ Components total 100% - Ready to continue
          </p>
        )}
      </div>

      {/* Validation Results */}
      {validationResult && !validationResult.data?.valid && (
        <div className="alert alert-warning">
          <div className="alert-content">
            <h3>⚠️ Validation Issues Detected</h3>
            <ul>
              {validationResult.data?.errors?.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                setValidationResult(null);
                onProcessWorkflow();
              }}
              className="btn-primary"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="dashboard-actions section-spacing">
        <button
          onClick={onPrevious}
          className="btn-primary"
        >
          ← Previous
        </button>
        <button
          onClick={handleValidateAndProceed}
          disabled={!isValid() || isLoading || isValidating}
          className={`${isValid() && !isLoading && !isValidating ? 'btn-primary' : 'btn-secondary'} ${!isValid() || isLoading || isValidating ? 'disabled' : ''}`}
        >
          {isLoading || isValidating ? (
            <>{isValidating ? 'Validating...' : 'Processing...'}</>
          ) : (
            <>
              Continue to USMCA Analysis
            </>
          )}
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Component Limit Reached</h2>
              <button onClick={() => setShowUpgradeModal(false)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <p className="text-body" style={{marginBottom: '1.5rem'}}>
                Your product needs more than 3 components for complete analysis?
                Most products require 5-7 components for accurate USMCA qualification.
              </p>

              <div style={{background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem'}}>Starter Plan - $99/mo</h3>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  <li style={{marginBottom: '0.5rem'}}>✓ 10 components per analysis</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ 10 analyses per month</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Full certificate download</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Email crisis alerts</li>
                </ul>
              </div>

              <div style={{background: '#ede9fe', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.75rem'}}>
                  <h3 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>Professional Plan - $299/mo</h3>
                  <span style={{
                    background: '#8b5cf6',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    marginLeft: '0.75rem'
                  }}>POPULAR</span>
                </div>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  <li style={{marginBottom: '0.5rem'}}>✓ 25 components per analysis</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Unlimited analyses</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ 15% service discounts</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Priority support (48hr)</li>
                </ul>
              </div>

              <p className="form-help" style={{textAlign: 'center', marginBottom: '1rem'}}>
                💡 Pro Tip: You can continue with 3 components to get started,
                but complex products need full analysis for accurate USMCA qualification.
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowUpgradeModal(false)} className="btn-secondary">
                Continue with 3 Components
              </button>
              <Link href="/pricing" className="btn-primary">
                View Plans & Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}