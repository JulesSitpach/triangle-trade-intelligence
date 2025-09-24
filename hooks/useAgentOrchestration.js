import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for agent orchestration in certificate completion
 *
 * Provides real-time agent suggestions, validation, and smart escalation
 */
export function useAgentOrchestration(certificateData, userContext) {
  const [orchestrationResult, setOrchestrationResult] = useState(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [agentSuggestions, setAgentSuggestions] = useState({
    formAssistant: null,
    classification: null,
    validation: null
  });
  const [error, setError] = useState(null);

  // Debounce orchestration calls to avoid excessive API requests
  const orchestrateCertificate = useCallback(async () => {
    if (!certificateData || Object.keys(certificateData).length === 0) {
      return;
    }

    setIsOrchestrating(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/orchestrate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateData,
          userContext: userContext || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Orchestration failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setOrchestrationResult(result);

        // Extract individual agent suggestions for granular display
        setAgentSuggestions({
          formAssistant: result.agentResults?.formSuggestions || null,
          classification: result.agentResults?.classification || null,
          validation: result.agentResults?.validation || null
        });

        console.log('✅ Agent orchestration complete:', {
          confidence: result.orchestrationSummary?.overallConfidence,
          readyToSubmit: result.orchestrationSummary?.readyToSubmit,
          orchestrationId: result.orchestrationId
        });
      } else {
        throw new Error('Orchestration returned unsuccessful result');
      }

    } catch (err) {
      console.error('❌ Agent orchestration error:', err);
      setError(err.message);
    } finally {
      setIsOrchestrating(false);
    }
  }, [certificateData, userContext]);

  // Auto-orchestrate when certificate data changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (certificateData && Object.keys(certificateData).length > 0) {
        orchestrateCertificate();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [certificateData, orchestrateCertificate]);

  // Get field-specific suggestion from Form Assistant
  const getFieldSuggestion = useCallback(async (fieldName) => {
    try {
      const response = await fetch('/api/agents/form-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_field',
          fieldName,
          userContext,
          partialData: certificateData
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error(`Error getting suggestion for ${fieldName}:`, err);
      return null;
    }
  }, [certificateData, userContext]);

  // Get HS code classification suggestion
  const getHSCodeSuggestion = useCallback(async (productDescription, componentOrigins = []) => {
    try {
      const response = await fetch('/api/agents/classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_hs_code',
          productDescription,
          componentOrigins
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error getting HS code suggestion:', err);
      return null;
    }
  }, []);

  // Validate specific field input
  const validateField = useCallback(async (fieldName, value) => {
    try {
      const response = await fetch('/api/agents/form-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_input',
          fieldName,
          value,
          partialData: certificateData
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error(`Error validating ${fieldName}:`, err);
      return null;
    }
  }, [certificateData]);

  return {
    // Main orchestration result
    orchestrationResult,
    isOrchestrating,
    error,

    // Individual agent suggestions
    agentSuggestions,

    // Orchestration summary
    overallConfidence: orchestrationResult?.orchestrationSummary?.overallConfidence || 0,
    readyToSubmit: orchestrationResult?.orchestrationSummary?.readyToSubmit || false,
    acceptanceProbability: orchestrationResult?.orchestrationSummary?.acceptanceProbability || 0,
    expertRecommendation: orchestrationResult?.orchestrationSummary?.expertRecommendation || null,
    userGuidance: orchestrationResult?.userGuidance || null,

    // Helper functions
    getFieldSuggestion,
    getHSCodeSuggestion,
    validateField,
    manualOrchestrate: orchestrateCertificate
  };
}

export default useAgentOrchestration;