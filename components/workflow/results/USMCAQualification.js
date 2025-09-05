/**
 * USMCAQualification - USMCA qualification status display
 * Shows qualification status with detailed reasoning
 */

import React from 'react';
import { Shield, CheckCircle, XCircle } from '../../Icons';

export default function USMCAQualification({ results }) {
  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;

  return (
    <div className="form-section">
      <div className="form-section-title-with-icon">
        <Shield className="icon-sm text-body" />
        <h3 className="form-section-title">USMCA Qualification Status</h3>
      </div>
      <div className={qualified ? 'qualification-card success' : 'qualification-card warning'}>
        <div className="qualification-status">
          <span className="qualification-icon">
            {qualified ? 
              <CheckCircle className="icon-md calculator-metric-value success" /> : 
              <XCircle className="icon-md calculator-metric-value primary" />
            }
          </span>
          <span className={qualified ? 'status-text qualified' : 'status-text not-qualified'}>
            {qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
          </span>
        </div>
        
        <div className="qualification-details">
          <div className="qualification-detail-row">
            <span className="detail-label">Rule Applied:</span>
            <span className="detail-value">{rule}</span>
          </div>
          <div className="qualification-detail-row">
            <span className="detail-label">Reason:</span>
            <span className="detail-value">{reason}</span>
          </div>
          {documentation_required && documentation_required.length > 0 && (
            <div className="documentation-section">
              <span className="detail-label">Documentation Required:</span>
              <ul className="documentation-list">
                {documentation_required.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}