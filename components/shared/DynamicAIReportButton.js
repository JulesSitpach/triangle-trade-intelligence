/**
 * Dynamic AI Report Button Component
 * Fetches real-time pricing from the dynamic pricing API
 * Updates button text with current price
 */

import { useState, useEffect } from 'react';
import { useDynamicPricing } from '../../lib/hooks/useDynamicPricing';

export default function DynamicAIReportButton({
  serviceSlug,
  onClick,
  request = null,
  className = "btn-action btn-info",
  disabled = false,
  emergency = false
}) {
  const [buttonText, setButtonText] = useState('🤖 AI Report');
  const [isLoading, setIsLoading] = useState(false);
  const { getServicePrice, getEmergencyPricing, getCustomPricing } = useDynamicPricing();

  useEffect(() => {
    loadPricing();
  }, [serviceSlug, emergency, request?.trade_volume]);

  const loadPricing = async () => {
    setIsLoading(true);

    try {
      let pricing;

      if (emergency) {
        pricing = await getEmergencyPricing(serviceSlug);
      } else if (request?.trade_volume && request.trade_volume > 500000) {
        pricing = await getCustomPricing(request.trade_volume, serviceSlug);
      } else {
        pricing = await getServicePrice(serviceSlug);
      }

      if (pricing) {
        let buttonLabel = '🤖 AI Report';

        if (emergency) {
          buttonLabel = `🚨 Emergency Report (${pricing.formatted})`;
        } else if (pricing.discount > 0) {
          buttonLabel = `🤖 AI Report (${pricing.formatted} - ${pricing.discount}% off)`;
        } else {
          buttonLabel = `🤖 AI Report (${pricing.formatted})`;
        }

        setButtonText(buttonLabel);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      setButtonText('🤖 AI Report (TBD)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (onClick) {
      // Pass pricing information to the onClick handler
      try {
        let pricing;

        if (emergency) {
          pricing = await getEmergencyPricing(serviceSlug);
        } else if (request?.trade_volume && request.trade_volume > 500000) {
          pricing = await getCustomPricing(request.trade_volume, serviceSlug);
        } else {
          pricing = await getServicePrice(serviceSlug);
        }

        onClick(request, pricing);
      } catch (error) {
        console.error('Error getting pricing for report generation:', error);
        onClick(request, null);
      }
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={emergency ? 'Emergency 24-hour delivery' : 'Standard 3-5 day delivery'}
    >
      {isLoading ? '⏳ Loading...' : buttonText}
    </button>
  );
}

/**
 * Specialized buttons for different service types
 */

export function SupplierSourcingAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="mexico-supplier-sourcing"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-info"
    />
  );
}

export function ManufacturingFeasibilityAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="mexico-manufacturing-feasibility"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-info"
    />
  );
}

export function MarketEntryAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="mexico-market-entry"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-info"
    />
  );
}

export function USMCACertificateAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="usmca-certificate"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-success"
    />
  );
}

export function HSClassificationAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="hs-classification"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-info"
    />
  );
}

export function DocumentReviewAIButton({ request, onClick, emergency = false }) {
  return (
    <DynamicAIReportButton
      serviceSlug="document-review"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-warning"
    />
  );
}

export function CrisisResponseAIButton({ request, onClick, emergency = true }) {
  return (
    <DynamicAIReportButton
      serviceSlug="crisis-response"
      request={request}
      onClick={onClick}
      emergency={emergency}
      className="btn-action btn-danger"
    />
  );
}