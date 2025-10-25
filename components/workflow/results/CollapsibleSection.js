/**
 * CollapsibleSection - Reusable component for progressive disclosure
 * Reduces cognitive overload by hiding details by default
 *
 * Features:
 * - Smooth expand/collapse animation
 * - Optional default expanded state
 * - Icon changes on expand/collapse
 * - Accessible with proper ARIA labels
 */

import React, { useState } from 'react';

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  badge = null
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        <div className="collapsible-header-left">
          <span className="collapsible-icon">
            {isExpanded ? '▼' : '▶'}
          </span>
          <div className="collapsible-title-group">
            <h3 className="collapsible-title">
              {icon && <span className="collapsible-emoji">{icon}</span>}
              {title}
            </h3>
            {badge && <span className="collapsible-badge">{badge}</span>}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}
