/**
 * CONFIDENCE BADGE COMPONENT
 *
 * PURPOSE:
 * Display confidence level for tariff rates with visual indicators.
 * Shows users how reliable each rate is (government verified vs estimated).
 *
 * CONFIDENCE LEVELS:
 * - 100: Government verified (USITC, USTR, Federal Register)
 * - 85: Category-level rate (6-digit parent code)
 * - 70: Heading-level rate (4-digit)
 * - 50: Chapter-level estimate (2-digit prefix)
 * - 0: Not found (needs customs broker research)
 *
 * USAGE:
 * import ConfidenceBadge from '@/components/ui/ConfidenceBadge';
 *
 * <ConfidenceBadge
 *   confidence={100}
 *   source="USITC verified"
 *   showTooltip={true}
 * />
 *
 * Created: November 20, 2025
 */

import React from 'react';

export default function ConfidenceBadge({ confidence, source, showTooltip = true, size = 'md' }) {
  // Determine badge style based on confidence level
  const getBadgeStyle = () => {
    if (confidence >= 95) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Verified',
        icon: '✓',
        description: 'Government-verified rate from official source'
      };
    }

    if (confidence >= 80) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        label: 'Category',
        icon: '≈',
        description: 'Category-level rate (6-digit parent code)'
      };
    }

    if (confidence >= 65) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Heading',
        icon: '~',
        description: 'Heading-level estimate (4-digit code)'
      };
    }

    if (confidence >= 40) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        label: 'Estimated',
        icon: '?',
        description: 'Chapter-level estimate (verify with broker)'
      };
    }

    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      label: 'Needs Research',
      icon: '!',
      description: 'Rate not found - contact customs broker'
    };
  };

  const style = getBadgeStyle();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const badgeClasses = `
    inline-flex items-center gap-1.5 rounded-full font-medium border
    ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="inline-block" title={showTooltip ? style.description : ''}>
      <span className={badgeClasses}>
        <span className="font-bold">{style.icon}</span>
        <span>{confidence}%</span>
        {size !== 'sm' && <span className="hidden sm:inline">{style.label}</span>}
      </span>

      {source && size !== 'sm' && (
        <div className="text-xs text-gray-600 mt-1">
          Source: {source}
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline confidence indicator (for tables)
 */
export function ConfidenceIndicator({ confidence, size = 'sm' }) {
  const getColor = () => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 65) return 'text-yellow-600';
    if (confidence >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getIcon = () => {
    if (confidence >= 95) return '✓';
    if (confidence >= 80) return '≈';
    if (confidence >= 65) return '~';
    if (confidence >= 40) return '?';
    return '!';
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base'
  };

  return (
    <span className={`${getColor()} font-bold ${sizeClasses[size]}`} title={`${confidence}% confidence`}>
      {getIcon()}
    </span>
  );
}

/**
 * Confidence progress bar (for detailed views)
 */
export function ConfidenceBar({ confidence, showLabel = true }) {
  const getColor = () => {
    if (confidence >= 95) return 'bg-green-500';
    if (confidence >= 80) return 'bg-blue-500';
    if (confidence >= 65) return 'bg-yellow-500';
    if (confidence >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Confidence Level</span>
          <span className="font-medium">{confidence}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}
