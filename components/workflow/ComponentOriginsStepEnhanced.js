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
  currentSessionId,  // ✅ FIX (Nov 6): Receive session ID from parent hook
  viewMode = 'normal', // 'normal', 'read-only', 'edit', or 'refresh'
  onLoadDemoData, // ✅ NEW: Callback to load demo data for Step 2
  onClearDemoData // ✅ NEW: Callback to clear demo data for Step 2
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
      stale: component?.stale ?? false,

      // ✅ NEW: Section 232 material checkbox and material origin
      contains_section_232_material: component?.contains_section_232_material ?? false,
      material_origin: component?.material_origin ?? 'unknown',
      material_notes: component?.material_notes ?? ''
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
  const [searchAbortControllers, setSearchAbortControllers] = useState({}); // Track abort controllers for cancellation
  const [searchTimeouts, setSearchTimeouts] = useState({}); // Track search timeouts

  // ✅ Ref for Component Breakdown section (smooth scroll after Product Overview completion)
  const componentBreakdownRef = useRef(null);
  // ✅ UI ENHANCEMENT: Refs for AI suggestion sections (smooth scroll after HS code lookup)
  const suggestionRefs = useRef([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasScrolledToComponents, setHasScrolledToComponents] = useState(false);
  // ✅ UI ENHANCEMENT: Track which suggestions we've already scrolled to (prevent re-scroll)
  const [scrolledSuggestions, setScrolledSuggestions] = useState({});
  // ✅ NEW: Track demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ✅ CRITICAL FIX: Detect demo mode by checking if form has EXACT demo data
  // Check for specific demo component signatures
  useEffect(() => {
    const components = formData.component_origins || [];

    // Demo data has exactly 3 components with these specific characteristics:
    // 1. Ceramic friction material (MX, 50%)
    // 2. Steel backing plates (US, 30%)
    // 3. Hardware assembly (CN, 20%)
    const hasExactDemoData =
      components.length === 3 &&
      components.some(c => c.description?.includes('Ceramic friction') && c.origin_country === 'MX' && c.value_percentage === 50) &&
      components.some(c => c.description?.includes('steel backing') && c.origin_country === 'US' && c.value_percentage === 30) &&
      components.some(c => c.description?.includes('hardware assembly') && c.origin_country === 'CN' && c.value_percentage === 20);

    // ✅ FIX (Nov 21): Only set demo mode if components exist (prevents false positive on fresh start)
    setIsDemoMode(hasExactDemoData && components.length > 0);
  }, [formData.component_origins]);

  // ✅ Helper function to check if Material Origin field should show
  // User manually indicates if component contains Section 232 material via checkbox
  const shouldShowMaterialOrigin = (component) => {
    // Show field when user checks the "contains steel/aluminum/copper" checkbox
    return component.contains_section_232_material === true;
  };

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

  // ✅ UI ENHANCEMENT: Auto-scroll to AI suggestion when it appears
  useEffect(() => {
    // Check each component for new suggestions
    Object.keys(agentSuggestions).forEach(indexStr => {
      const index = parseInt(indexStr);
      const suggestion = agentSuggestions[index];

      // Only scroll if we haven't scrolled to this suggestion yet
      if (suggestion && !scrolledSuggestions[index]) {
        // Wait for React to render the suggestion badge
        setTimeout(() => {
          if (suggestionRefs.current[index]) {
            const elementTop = suggestionRefs.current[index].getBoundingClientRect().top;
            const offset = 120; // Keep HS Code input visible above suggestion

            window.scrollTo({
              top: window.pageYOffset + elementTop - offset,
              behavior: 'smooth'
            });

            // Mark this suggestion as scrolled
            setScrolledSuggestions(prev => ({ ...prev, [index]: true }));
            console.log('✅ Scrolled to AI suggestion for component', index + 1);
          }
        }, 100); // Small delay for React to render
      }
    });
  }, [agentSuggestions, scrolledSuggestions]);

  // ✅ AUTO-SCROLL: Function to scroll to Component Breakdown
  const scrollToComponentBreakdown = useCallback(() => {
    const isProductOverviewComplete =
      formData.product_description?.trim() &&
      formData.manufacturing_location?.trim();

    if (isProductOverviewComplete && !hasScrolledToComponents && componentBreakdownRef.current) {
      // Delay scroll slightly to allow field validation to complete
      setTimeout(() => {
        componentBreakdownRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        setHasScrolledToComponents(true);
      }, 150); // ✅ Faster scroll - reduced from 300ms to 150ms
    }
  }, [formData.product_description, formData.manufacturing_location, hasScrolledToComponents]);

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

      // ✅ FIX: ALWAYS check for duplicates to prevent infinite loop (even in demo mode)
      if (lastPushedRef.current === formDataString) {
        return;
      }

      console.log(`🔄 Syncing ${normalizedComponents.length} components from formData`, formData.is_demo ? '(DEMO MODE)' : '(navigation restore)');
      setComponents(normalizedComponents);

      // ✅ P1-1 FIX: Recalculate usedComponentsCount to stay in sync with restored components
      const newUsedCount = normalizedComponents.filter(c =>
        c.is_locked || (c.hs_code && c.hs_code.length >= 6)
      ).length;
      setUsedComponentsCount(newUsedCount);
      console.log(`🔒 Restored ${newUsedCount} locked components`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.component_origins, formData.is_demo]); // normalizeComponent removed to prevent re-runs when manufacturing_location changes

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

  // Cancel AI classification search
  const cancelSearch = (index) => {
    // Abort the fetch request
    if (searchAbortControllers[index]) {
      searchAbortControllers[index].abort();
      console.log(`❌ User cancelled search for component ${index + 1}`);
    }

    // Clear timeout
    if (searchTimeouts[index]) {
      clearTimeout(searchTimeouts[index]);
    }

    // Reset search state
    setSearchingHS(prev => ({ ...prev, [index]: false }));

    // Clean up controllers
    setSearchAbortControllers(prev => {
      const newControllers = { ...prev };
      delete newControllers[index];
      return newControllers;
    });
    setSearchTimeouts(prev => {
      const newTimeouts = { ...prev };
      delete newTimeouts[index];
      return newTimeouts;
    });

    // Show suggestion to simplify description
    setAgentSuggestions(prev => ({
      ...prev,
      [index]: {
        error: true,
        hs_code: 'Search Cancelled',
        description: 'Classification search was cancelled',
        confidence: 0,
        explanation: 'You can try again with a simpler description, or enter the HS code manually if you know it.',
        retryOptions: [
          '• Simplify the description (e.g., "Hydraulic cylinder actuator, 3-inch bore" instead of listing all specs)',
          '• Remove brand names and detailed specifications',
          '• Focus on the primary function/material of the component',
          '• Enter HS code manually if you know it'
        ]
      }
    }));
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

    // Create abort controller for this search
    const abortController = new AbortController();
    setSearchAbortControllers(prev => ({ ...prev, [index]: abortController }));

    setSearchingHS(prev => ({ ...prev, [index]: true }));

    // Set timeout to suggest simplification after 15 seconds
    const timeoutId = setTimeout(() => {
      if (searchingHS[index]) {
        console.warn(`⏱️ Search taking longer than expected for component ${index + 1}`);
        // Don't cancel automatically, just show a hint in console
        // User can click Cancel button if they want
      }
    }, 15000);
    setSearchTimeouts(prev => ({ ...prev, [index]: timeoutId }));

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
        signal: abortController.signal, // ✅ Allow cancellation
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
            substantialTransformation: formData.substantial_transformation || false, // ✅ NEW (Nov 10): Critical for material-based classification
            manufacturingProcess: formData.manufacturing_process || null, // ✅ NEW (Nov 10): Process details for transformation context

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
        // ✅ VALIDATION: Check if AI returned valid HS code and confidence
        const hsCode = result.data.hs_code;
        const confidence = result.data.confidence || result.data.adjustedConfidence || 0;

        // ❌ FAILED CLASSIFICATION: undefined HS code or 0% confidence
        if (!hsCode || hsCode === 'undefined' || confidence === 0) {
          console.log(`❌ AI classification failed for component ${index + 1}: ${!hsCode ? 'No HS code' : 'Zero confidence'}`);

          // Show error suggestion badge
          setAgentSuggestions(prev => ({
            ...prev,
            [index]: {
              error: true,
              hs_code: 'Classification Failed',
              description: 'AI could not confidently classify this component',
              confidence: 0,
              explanation: 'We couldn\'t confidently classify this component. This can happen with very specialized products or unclear descriptions.',
              retryOptions: [
                '• Click "Get AI Suggestion" again',
                '• Simplify the component description (remove brand names, specs)',
                '• Remove and re-add this component',
                '• Enter HS code manually if you know it'
              ]
            }
          }));
          return; // Don't lock component on failed classification
        }

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
          hs_code: hsCode,
          description: result.data.description, // ✅ REAL HTS DESCRIPTION
          confidence: confidence,
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

        // Show generic error
        setAgentSuggestions(prev => ({
          ...prev,
          [index]: {
            error: true,
            hs_code: 'Classification Failed',
            description: 'AI service temporarily unavailable',
            confidence: 0,
            explanation: 'The AI classification service encountered an error. Please try again in a moment.',
            retryOptions: [
              '• Click "Get AI Suggestion" again',
              '• If problem persists, enter HS code manually'
            ]
          }
        }));
      }
    } catch (error) {
      // Check if error is due to user cancellation
      if (error.name === 'AbortError') {
        console.log(`🛑 Search aborted by user for component ${index + 1}`);
        // cancelSearch already handled the UI, just return
        return;
      }

      console.error(`Agent classification error for component ${index + 1}:`, error);
      await DevIssue.apiError('component_origins_step', '/api/agents/classification', error, {
        componentIndex: index,
        componentDescription: component.description,
        originCountry: component.origin_country
      });
    } finally {
      setSearchingHS(prev => ({ ...prev, [index]: false }));

      // Clean up abort controller and timeout
      setSearchAbortControllers(prev => {
        const newControllers = { ...prev };
        delete newControllers[index];
        return newControllers;
      });
      if (searchTimeouts[index]) {
        clearTimeout(searchTimeouts[index]);
        setSearchTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[index];
          return newTimeouts;
        });
      }
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
            substantialTransformation: formData.substantial_transformation || false, // ✅ FIX (Nov 8): Critical for HS classification - transformed vs raw material
            manufacturingProcess: formData.manufacturing_process || null, // ✅ NEW (Nov 10): Process details for transformation context
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
        // ✅ FIX (Nov 8): Capture full AI classification data including alternatives and explanation
        const suggestion = {
          hs_code: result.data.hs_code,
          description: result.data.description || component.description,
          confidence: result.data.confidence || 85,
          confidenceText: `${Math.round((result.data.confidence || 0.85) * 100)}% accuracy`,
          explanation: result.data.explanation || 'AI classification completed',
          reasoning: result.data.explanation || 'AI classification completed',  // Keep for backwards compatibility
          alternative_codes: result.data.alternative_codes || [],
          legal_basis: result.data.legal_basis || '',
          audit_risk: result.data.audit_risk || 'medium',
          source: 'Classification Agent'
        };

        // ✅ FIX (Nov 8): Show suggestion badge instead of auto-populating
        // This allows user to see AI explanation and alternatives before accepting
        setAgentSuggestions({
          ...agentSuggestions,
          [index]: suggestion
        });

        console.log(`✅ AI classification complete for component ${index + 1}:`, {
          hs_code: suggestion.hs_code,
          confidence: suggestion.confidence,
          alternatives: suggestion.alternative_codes?.length || 0
        });

        // ✅ UI ENHANCEMENT: Scroll happens automatically via useEffect (lines 146-173)
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
        // ✅ UI ENHANCEMENT: Manual scroll with offset to keep component title visible
        const elementTop = componentElement.getBoundingClientRect().top;
        const offset = 100; // Pixels from top - keeps component title visible with spacing

        window.scrollTo({
          top: window.pageYOffset + elementTop - offset,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const removeComponent = (index) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  // Clear component data (reset to empty state but keep slot for subscription counting)
  const clearComponent = (index) => {
    const updatedComponents = [...components];
    // Reset ALL fields to empty (matches normalizeComponent structure)
    updatedComponents[index] = {
      description: '',
      origin_country: '',
      value_percentage: 0,  // ✅ FIX: Use 0 instead of '' to properly update total percentage
      hs_code: '',
      hs_suggestions: [],  // Clear AI suggestions
      manufacturing_location: formData.manufacturing_location ?? '',
      enrichment_error: null,
      mfn_rate: null,
      usmca_rate: null,
      section_301: null,
      section_232: null,
      total_rate: null,
      savings_percentage: null,
      policy_adjustments: [],
      confidence: '',
      hs_description: '',
      is_locked: false  // Unlock so user can classify again
    };
    setComponents(updatedComponents);
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
    // CRITICAL: Preserve null values (don't convert to 0) - null means "pending verification"
    updateFormData('classified_hs_code', suggestion.hs_code);
    updateFormData('current_tariff_rate', suggestion.mfn_rate !== undefined ? suggestion.mfn_rate : null);
    updateFormData('usmca_tariff_rate', suggestion.usmca_rate !== undefined ? suggestion.usmca_rate : null);

    // Calculate and save annual savings based on trade volume
    // Use the centralized parseTradeVolume utility for consistency across the app
    const tradeVolume = parseTradeVolume(formData.trade_volume);

    // ✅ FIX #5: Validator ensures this is valid
    // Add assertion for safety in development
    if (process.env.NODE_ENV === 'development' && (tradeVolume === null || tradeVolume === 0 || isNaN(tradeVolume))) {
      console.warn('[ComponentOrigins] Trade volume is null/0/invalid (should have been caught by validator):', {
        formDataValue: formData.trade_volume,
        parsedValue: tradeVolume
      });
    }

    // CRITICAL: Only calculate savings if both rates are available (not null)
    // If either rate is pending verification, save null for savings (not 0)
    const mfnRate = suggestion.mfn_rate;
    const usmcaRate = suggestion.usmca_rate;

    if (mfnRate !== null && mfnRate !== undefined && usmcaRate !== null && usmcaRate !== undefined) {
      const tariffSavings = (parseFloat(mfnRate) - parseFloat(usmcaRate)) / 100;
      const annualSavings = (tradeVolume || 0) * tariffSavings;
      updateFormData('calculated_savings', Math.round(annualSavings));
      updateFormData('monthly_savings', Math.round(annualSavings / 12));
    } else {
      // Rates pending - don't calculate yet
      updateFormData('calculated_savings', null);
      updateFormData('monthly_savings', null);
    }

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

  // ✅ NEW: Handle demo data loading for Step 2
  const handleLoadDemoData = () => {
    console.log('🚀 Loading Step 2 demo data...');
    setIsDemoMode(true);

    if (onLoadDemoData) {
      onLoadDemoData();
    }

    console.log('✅ Demo data loaded - user can scroll down to review');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="form-section-title" style={{ margin: 0 }}>Product Overview</h3>

          {/* ✅ Demo Data Buttons - Now at TOP */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isDemoMode && onLoadDemoData && (
              <button
                onClick={handleLoadDemoData}
                className="btn-secondary"
                title="Auto-fill with sample automotive components"
              >
                🚀 Try Demo Data
              </button>
            )}
            {isDemoMode && onClearDemoData && (
              <button
                onClick={onClearDemoData}
                className="btn-secondary"
                title="Clear demo data and start fresh"
              >
                🗑️ Clear Demo
              </button>
            )}
          </div>
        </div>

        {/* ✅ Demo Mode Banner */}
        {isDemoMode && (
          <div className="alert-info" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
            <strong>📊 Demo Mode Active</strong>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
              Demo workflows don't count against your subscription limit. Feel free to test "Search for HS code" and explore all features.
            </p>
          </div>
        )}

        <div className="form-grid-2">
          {/* LEFT COLUMN: Substantial Transformation */}
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={formData.substantial_transformation || false}
                onChange={(e) => updateFormData('substantial_transformation', e.target.checked)}
              />
              {' '}
              <strong>Manufacturing involves substantial transformation</strong> (not just simple assembly)
            </label>
            <div className="form-help">
              Check this if your manufacturing process in US/Canada/Mexico creates significant value beyond basic assembly (welding, forming, heat treatment, etc.). Leave unchecked if you only import/distribute or manufacture elsewhere.
            </div>

            {/* Manufacturing Process Details - Show when substantial transformation is checked */}
            {formData.substantial_transformation && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="form-label">
                  Describe Your Manufacturing Process
                </label>
                <input
                  type="text"
                  value={formData.manufacturing_process || ''}
                  onChange={(e) => updateFormData('manufacturing_process', e.target.value)}
                  placeholder="Example: PCB assembly, firmware integration, enclosure molding"
                  className="form-input"
                />
                <div className="form-help">
                  What processes create substantial transformation? (e.g., welding, heat treatment, chemical processing, assembly with value-add)
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Description + Manufacturing Location */}
          <div>
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

            {/* Manufacturing Location - Below product description */}
            <div className="form-group">
              <label className="form-label required">
                Manufacturing/Assembly Location
              </label>
              <select
                value={formData.manufacturing_location || ''}
                onChange={(e) => updateFormData('manufacturing_location', e.target.value)}
                onBlur={scrollToComponentBreakdown}
                className={`form-select ${formData.manufacturing_location ? 'has-value' : ''}`}
                required
              >
                <option value="">Select manufacturing country...</option>
                <option value="DOES_NOT_APPLY">Does Not Apply (Imported/Distributed Only)</option>
                {dropdownOptions.usmcaCountries?.map(country => {
                  const countryCode = country.code || country.value;
                  const countryName = country.label || country.name;
                  return (
                    <option key={`mfg-loc-usmca-${countryCode}`} value={countryCode}>
                      {countryName}
                    </option>
                  );
                })}
                <optgroup label="Other Countries">
                  {dropdownOptions.countries?.filter(country => {
                    const code = typeof country === 'string' ? country : country.value || country.code;
                    return !['US', 'CA', 'MX'].includes(code);
                  }).map((country, idx) => {
                    const countryCode = typeof country === 'string' ? country : country.value || country.code;
                    const countryName = typeof country === 'string' ? country : country.label || country.name;
                    return (
                      <option key={`mfg-loc-other-${countryCode}-${idx}`} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
              <div className="form-help">
                Where is the final product assembled/manufactured? (Select &quot;Does Not Apply&quot; if you import/distribute only)
              </div>
            </div>
          </div>

          {/* REMOVED: origin_criterion and method_of_qualification dropdowns
              These fields confused users because AI determines them based on USMCA treaty rules.
              Allowing users to "choose" created false sense of control - AI must apply correct rules
              regardless of user selection (e.g., automotive products MUST use Net Cost method).

              These values are now determined by AI and shown in results/certificate. */}
        </div>
      </div>

      {/* Component Breakdown Section */}
      <div ref={componentBreakdownRef} className="element-spacing">
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
              <div className="dashboard-actions-right">
                {components.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    className="btn-danger"
                    title="Remove component"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => clearComponent(index)}
                    className="btn-secondary"
                    title="Clear component data"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 2-Column Grid Layout */}
            <div className="form-grid-2">
              {/* LEFT COLUMN: Component Description + Section 232 Checkbox */}
              <div>
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
                    placeholder="Example: 'Polyester fabric outer shell' or 'Stainless steel fastener'"
                    className="form-input"
                    disabled={component.is_locked}
                    style={component.is_locked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                  {component.is_locked ? (
                    <div className="form-help" style={{ color: '#f59e0b', fontWeight: 500 }}>
                      🔒 Component locked after HS lookup (counts toward your tier limit)
                    </div>
                  ) : (
                    <div className="form-help">
                      <strong>Be specific:</strong> Include materials, specs, and processing.
                      <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                        ✅ &quot;100% polyester ripstop fabric (300D, DWR waterproof coating, woven from US yarn)&quot;
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 232 Material Checkbox - Under Description */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={component.contains_section_232_material || false}
                      onChange={(e) => updateComponent(index, 'contains_section_232_material', e.target.checked)}
                      disabled={component.is_locked}
                      style={{ marginRight: '0.5rem', marginTop: '0.125rem', cursor: component.is_locked ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ color: component.is_locked ? '#9ca3af' : '#374151', lineHeight: '1.5' }}>
                      This component contains steel, aluminum, or copper
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                        Check this if your component is subject to Section 232 tariffs (50% on steel/aluminum/copper materials)
                      </div>
                    </span>
                  </label>
                </div>

                {/* Material Origin Field - Show only for Section 232 materials */}
                {shouldShowMaterialOrigin(component) && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <label className="form-label text-sm mb-2">
                      Material Origin (for Section 232 exemption)
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="radio"
                          name={`material_origin_${index}`}
                          value="unknown"
                          checked={component.material_origin === 'unknown'}
                          onChange={(e) => updateComponent(index, 'material_origin', e.target.value)}
                        />
                        <span>Unknown</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="radio"
                          name={`material_origin_${index}`}
                          value="non_na"
                          checked={component.material_origin === 'non_na'}
                          onChange={(e) => updateComponent(index, 'material_origin', e.target.value)}
                        />
                        <span>Outside North America</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="radio"
                          name={`material_origin_${index}`}
                          value="mx_ca"
                          checked={component.material_origin === 'mx_ca'}
                          onChange={(e) => updateComponent(index, 'material_origin', e.target.value)}
                        />
                        <span>Mexico or Canada</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="radio"
                          name={`material_origin_${index}`}
                          value="us"
                          checked={component.material_origin === 'us'}
                          onChange={(e) => updateComponent(index, 'material_origin', e.target.value)}
                        />
                        <span>United States (may be exempt)</span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={component.material_notes || ''}
                      onChange={(e) => updateComponent(index, 'material_notes', e.target.value)}
                      placeholder="Example: Aluminum smelted in Pittsburgh, PA by Alcoa - verified with supplier"
                      className="form-input"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Stacked fields */}
              <div>
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
                    {/* USMCA countries first (Canada, Mexico, USA) */}
                    {dropdownOptions.usmcaCountries?.map(country => {
                      const countryCode = country.code || country.value;
                      const countryName = country.label || country.name;
                      return (
                        <option key={`origin-usmca-${countryCode}`} value={countryCode}>{countryName}</option>
                      );
                    })}
                    {/* Other countries grouped below */}
                    <optgroup label="Other Countries">
                      {dropdownOptions.countries?.filter(country => {
                        const code = typeof country === 'string' ? country : country.code || country.value;
                        // Filter out USMCA countries (CA, MX, US)
                        return !['CA', 'MX', 'US'].includes(code);
                      }).map((country, idx) => {
                        const countryCode = typeof country === 'string' ? country : country.value || country.code;
                        const countryName = typeof country === 'string' ? country : country.label || country.name;
                        return (
                          <option key={`origin-other-${countryCode}-${idx}`} value={countryCode}>
                            {countryName}
                          </option>
                        );
                      })}
                    </optgroup>
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

                {/* HS Code */}
                <div className="form-group">
                  <label className="form-label">
                    HS Code * {component.is_locked && '🔒'}
                  </label>
                  <input
                    type="text"
                    value={component.hs_code || ''}
                    onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                    placeholder="Enter if known (e.g., 8544.42.90)"
                    className="form-input"
                  />
                  <div className="form-help">
                    Required for accurate AI classification (like a tax form needs accurate information)
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestion Button - FULL WIDTH below grid */}
            {!component.is_locked && (
              <div className="form-group">
                <div className="form-help mb-2">
                  Don&apos;t know your HS code? Get AI suggestion below.
                </div>
                {!searchingHS[index] ? (
                  <button
                    type="button"
                    onClick={() => getComponentHSSuggestion(index)}
                    disabled={
                      !component.description ||
                      component.description.length < 10 ||
                      !component.origin_country ||
                      !component.value_percentage
                    }
                    className={
                      component.description && component.description.length >= 10 &&
                      component.origin_country && component.value_percentage
                        ? 'btn-primary btn-ai-suggestion'
                        : 'btn-secondary btn-ai-suggestion'
                    }
                    style={{ width: '100%' }}
                  >
                    🤖 Get AI HS Code Suggestion
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        disabled
                        className="btn-secondary btn-ai-suggestion"
                        style={{
                          opacity: 1,
                          flex: '1 1 auto',
                          position: 'relative',
                          overflow: 'hidden',
                          backgroundColor: '#3b82f6',
                          color: 'white'
                        }}
                      >
                        <span style={{ position: 'relative', zIndex: 1 }}>🤖 Analyzing (2-3 sec typical)...</span>
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 1.5s infinite'
                        }}></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelSearch(index)}
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                    <style>{`
                      @keyframes shimmer {
                        0% { left: -100%; }
                        100% { left: 100%; }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            )}

            {/* AI Agent HS Code Suggestion - FULL WIDTH outside grid */}
            {agentSuggestions[index] && (
              <div ref={el => suggestionRefs.current[index] = el}>
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

                  // NOTE: Component already locked when AI was called (line 339)
                  // No need to lock again here - user accepting suggestion is free

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
              </div>
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

        {/* Add Component Button - Disabled until last component is complete */}
        <div className="element-spacing">
          <button
            type="button"
            onClick={addComponent}
            disabled={(() => {
              // Check if total percentage is already 100%
              if (getTotalPercentage() === 100) {
                return true;
              }

              // Check if subscription tier limit reached
              if (!canAddComponent(userTier, usedComponentsCount)) {
                return true;
              }

              // Check if last component is fully filled
              const lastComponent = components[components.length - 1];
              const isLastComponentComplete = lastComponent &&
                lastComponent.description && lastComponent.description.trim().length >= 10 &&
                lastComponent.origin_country &&
                lastComponent.value_percentage > 0 &&
                lastComponent.hs_code;

              return !isLastComponentComplete; // Disabled if NOT complete
            })()}
            className="btn-primary add-component-button"
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
      {viewMode === 'normal' && (
        <>
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
        </>
      )}

      {/* Read-Only Mode Indicator */}
      {viewMode === 'read-only' && (
        <div className="dashboard-actions section-spacing">
          <span className="form-help" style={{color: '#6b7280', textAlign: 'center', display: 'block'}}>
            📊 Viewing saved workflow data (read-only mode)
          </span>
        </div>
      )}

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
                  <li className="mb-2">✓ 10 components per analysis</li>
                  <li className="mb-2">✓ 10 analyses per month</li>
                  <li className="mb-2">✓ Full certificate download</li>
                  <li className="mb-2">✓ Email crisis alerts</li>
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
                  <li className="mb-2">✓ 25 components per analysis</li>
                  <li className="mb-2">✓ Unlimited analyses</li>
                  <li className="mb-2">✓ 15% service discounts</li>
                  <li className="mb-2">✓ Priority support (48hr)</li>
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