/**
 * TRIANGLE INTELLIGENCE SALES PRESENTATIONS DEMO PAGE
 * Professional B2B presentation showcase for different sales scenarios
 * 
 * Features:
 * - Live interactive presentations
 * - Multiple presentation types (Executive, Technical, ROI, Crisis)
 * - Export functionality (PDF, PowerPoint, Email)
 * - Customization options for different prospects
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Users, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Eye,
  Edit,
  Copy
} from 'lucide-react';

import SalesPresentation from '../components/SalesPresentation';
import PresentationExport from '../components/PresentationExport';
import {
  SALES_MESSAGING,
  SALES_STATISTICS, 
  SLIDE_TEMPLATES,
  EMAIL_TEMPLATES
} from '../config/sales-presentation-config';

export default function SalesPresentations() {
  const [selectedPresentation, setSelectedPresentation] = useState('executiveSummary');
  const [customizations, setCustomizations] = useState({});
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dropdownOptions, setDropdownOptions] = useState({
    businessTypes: []
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Load dropdown options on component mount
  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await fetch('/api/database-driven-dropdown-options?category=business_types');
        const result = await response.json();
        
        if (result.success && result.data.business_types) {
          setDropdownOptions({
            businessTypes: result.data.business_types
          });
        }
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
        // Keep empty array as fallback
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadDropdownOptions();
  }, []);

  // Presentation type configurations
  const presentationTypes = [
    {
      id: 'executiveSummary',
      name: 'Executive Summary',
      icon: Users,
      description: 'C-level prospects (8-10 slides)',
      audience: 'CEOs, Presidents, C-suite executives',
      duration: '15-20 minutes',
      focus: 'Strategic value, competitive advantage, ROI',
      color: 'status-info'
    },
    {
      id: 'technicalDeepDive',
      name: 'Technical Deep Dive', 
      icon: Settings,
      description: 'Operations managers (15-20 slides)',
      audience: 'Operations managers, IT directors, supply chain managers',
      duration: '30-45 minutes',
      focus: 'Platform architecture, integration, features',
      color: 'status-success'
    },
    {
      id: 'roiFocused',
      name: 'ROI Analysis',
      icon: TrendingUp, 
      description: 'CFOs/Finance teams (12-15 slides)',
      audience: 'CFOs, finance directors, procurement teams',
      duration: '20-30 minutes',
      focus: 'Cost savings, investment analysis, payback timeline',
      color: 'status-info'
    },
    {
      id: 'crisisResponse',
      name: 'Crisis Response',
      icon: AlertTriangle,
      description: 'Emergency tariff situations (6-8 slides)',
      audience: 'All decision makers in crisis situations',
      duration: '10-15 minutes',
      focus: 'Immediate solutions, urgent action required',
      color: 'status-warning'
    }
  ];

  const handleSlideChange = (slideIndex, slideData) => {
    setCurrentSlide(slideIndex);
  };

  const handleCustomization = (key, value) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="app-layout">
      <Head>
        <title>Sales Presentations - Triangle Intelligence</title>
        <meta name="description" content="Professional B2B sales presentation templates for Triangle Intelligence USMCA platform" />
      </Head>

      {/* Page Header */}
      <div className="app-header">
        <div className="container-app">
          <div className="page-header">
            <h1 className="page-title">Sales Presentation Templates</h1>
            <p className="page-subtitle">
              Professional B2B presentations for Triangle Intelligence USMCA compliance platform. 
              Customizable templates for different sales scenarios and prospect types.
            </p>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="grid-2">
          
          {/* Sidebar - Presentation Selection */}
          <div>
            <div className="card">
              <h2 className="card-title">Presentation Types</h2>
              
              <div className="element-spacing">
                {presentationTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPresentation(type.id)}
                      className={`btn-secondary element-spacing-sm cursor-clickable ${
                        selectedPresentation === type.id ? 'card-header' : ''
                      }`}
                    >
                      <div className="workflow-step">
                        <div className={`step-number ${type.color}`}>
                          <IconComponent />
                        </div>
                        <div>
                          <h3 className="card-title">{type.name}</h3>
                          <p className="text-muted">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Presentation Details */}
              {selectedPresentation && (
                <div className="section-divider">
                  <h3 className="section-title">Presentation Details</h3>
                  {presentationTypes.map(type => {
                    if (type.id !== selectedPresentation) return null;
                    return (
                      <div key={type.id} className="element-spacing">
                        <div className="form-group">
                          <span className="form-label">Audience:</span>
                          <p className="text-body">{type.audience}</p>
                        </div>
                        <div className="form-group">
                          <span className="form-label">Duration:</span>
                          <p className="text-body">{type.duration}</p>
                        </div>
                        <div className="form-group">
                          <span className="form-label">Focus:</span>
                          <p className="text-body">{type.focus}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Actions */}
              <div className="section-divider">
                <h3 className="section-title">Quick Actions</h3>
                <div className="element-spacing">
                  <button
                    onClick={() => setShowCustomizer(!showCustomizer)}
                    className="btn-secondary element-spacing-sm"
                  >
                    <Edit />
                    Customize
                  </button>
                  
                  <button className="btn-primary">
                    <Eye />
                    Present
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Presentation Display */}
          <div>
            <div className="element-spacing">
              
              {/* Customizer Panel */}
              {showCustomizer && (
                <PresentationCustomizer
                  presentationType={selectedPresentation}
                  customizations={customizations}
                  onChange={handleCustomization}
                  onClose={() => setShowCustomizer(false)}
                />
              )}

              {/* Main Presentation */}
              <SalesPresentation
                presentationType={selectedPresentation}
                customization={customizations}
                onSlideChange={handleSlideChange}
              />

              {/* Export Options */}
              <PresentationExport
                presentationType={selectedPresentation}
                onExportComplete={(format, filename) => {
                  console.log(`Exported ${format}: ${filename}`);
                }}
              />

              {/* Usage Guidelines */}
              <PresentationGuidelines presentationType={selectedPresentation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Presentation Customizer Component
 * Allows users to customize presentations for specific prospects
 */
function PresentationCustomizer({ presentationType, customizations, onChange, onClose }) {
  const [prospectInfo, setProspectInfo] = useState({
    companyName: '',
    industry: '',
    tradeVolume: '',
    currentChallenges: '',
    decisionMakers: ''
  });

  const handleProspectChange = (field, value) => {
    setProspectInfo(prev => ({ ...prev, [field]: value }));
    
    // Apply customizations based on prospect info
    if (field === 'industry') {
      onChange('industryFocus', value);
    }
    if (field === 'tradeVolume') {
      onChange('roiCalculation', calculateCustomROI(value));
    }
  };

  const calculateCustomROI = (volume) => {
    const annualVolume = parseInt(volume) || 0;
    const avgSavings = annualVolume * 0.185; // 18.5% average savings
    return Math.round(avgSavings);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Customize Presentation</h3>
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          ×
        </button>
      </div>

      <div className="grid-2">
        {/* Prospect Information */}
        <div>
          <h4 className="section-title">Prospect Information</h4>
          <div className="element-spacing">
            <div className="form-group">
              <label className="form-label">
                Company Name
              </label>
              <input
                type="text"
                value={prospectInfo.companyName}
                onChange={(e) => handleProspectChange('companyName', e.target.value)}
                className="form-input"
                placeholder="e.g., AutoParts Manufacturing Inc"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Industry
              </label>
              <select
                value={prospectInfo.industry}
                onChange={(e) => handleProspectChange('industry', e.target.value)}
                className="form-select"
              >
                <option value="">Select industry</option>
                {isLoadingOptions ? (
                  <option disabled>Loading industries...</option>
                ) : (
                  dropdownOptions.businessTypes.map(businessType => (
                    <option key={businessType.value} value={businessType.value}>
                      {businessType.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Annual Trade Volume ($)
              </label>
              <input
                type="number"
                value={prospectInfo.tradeVolume}
                onChange={(e) => handleProspectChange('tradeVolume', e.target.value)}
                className="form-input"
                placeholder="e.g., 2500000"
              />
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div>
          <h4 className="section-title">Presentation Focus</h4>
          <div className="element-spacing">
            <div className="form-group">
              <label className="form-label">
                Key Challenges
              </label>
              <textarea
                value={prospectInfo.currentChallenges}
                onChange={(e) => handleProspectChange('currentChallenges', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="e.g., Rising China tariffs, manual compliance processes, broker delays"
              />
            </div>

            {customizations.roiCalculation && (
              <div className="status-success">
                <h5 className="card-title">Custom ROI Estimate</h5>
                <p className="text-body">
                  Potential annual savings: <span className="metric-value">${customizations.roiCalculation.toLocaleString()}</span>
                </p>
                <p className="text-muted">
                  Based on {SALES_STATISTICS.impact.avgSavingsPercent}% average tariff savings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Customizations Button */}
      <div className="section-divider">
        <button
          onClick={() => {
            onChange('prospectInfo', prospectInfo);
            alert('Customizations applied! The presentation will update with your prospect-specific information.');
          }}
          className="btn-primary"
        >
          Apply Customizations
        </button>
      </div>
    </div>
  );
}

/**
 * Presentation Guidelines Component
 * Provides usage tips and best practices for each presentation type
 */
function PresentationGuidelines({ presentationType }) {
  const guidelines = {
    executiveSummary: {
      preparation: [
        'Research company\'s current suppliers and trade volumes',
        'Identify key decision makers and their priorities',
        'Prepare custom ROI calculation based on their trade data',
        'Have case study from similar industry ready'
      ],
      delivery: [
        'Start with crisis urgency (Trump tariffs)',
        'Focus on strategic value and competitive advantage',
        'Quantify savings opportunities early in presentation',
        'End with clear next steps and timeline'
      ],
      followUp: [
        'Send executive summary email within 4 hours',
        'Schedule technical demo with operations team',
        'Prepare custom ROI analysis',
        'Connect with procurement/finance teams'
      ]
    },
    technicalDeepDive: {
      preparation: [
        'Understand current systems and integration requirements',
        'Prepare API documentation and technical specifications',
        'Set up demo environment with their product examples',
        'Review security and compliance requirements'
      ],
      delivery: [
        'Lead with platform capabilities and architecture',
        'Demonstrate AI classification with their products',
        'Show integration possibilities with their current systems',
        'Address technical concerns and requirements'
      ],
      followUp: [
        'Provide technical documentation package',
        'Schedule proof of concept discussion',
        'Connect with their IT/development teams',
        'Begin security and compliance review'
      ]
    },
    roiFocused: {
      preparation: [
        'Calculate detailed cost-benefit analysis',
        'Research their current compliance costs',
        'Prepare comparative analysis vs competitors',
        'Quantify risk costs of manual processes'
      ],
      delivery: [
        'Start with current state cost analysis',
        'Show detailed savings breakdown',
        'Present implementation timeline and costs',
        'Address budget and procurement processes'
      ],
      followUp: [
        'Provide detailed ROI spreadsheet',
        'Schedule budget planning session',
        'Connect with procurement and finance teams',
        'Prepare formal proposal and pricing'
      ]
    },
    crisisResponse: {
      preparation: [
        'Identify immediate impact of tariff changes',
        'Calculate urgent savings opportunities',
        'Prepare emergency implementation plan',
        'Have crisis support team ready'
      ],
      delivery: [
        'Emphasize immediate threat and opportunity',
        'Present 48-hour solution timeline',
        'Show exact savings for their products',
        'Propose emergency implementation plan'
      ],
      followUp: [
        'Immediate follow-up within 2 hours',
        'Begin emergency implementation if approved',
        'Daily check-ins during crisis period',
        'Document savings achieved for future reference'
      ]
    }
  };

  const currentGuidelines = guidelines[presentationType] || guidelines.executiveSummary;

  return (
    <div className="card">
      <h3 className="card-title">Presentation Guidelines</h3>
      
      <div className="grid-2">
        {Object.entries(currentGuidelines).map(([phase, items]) => (
          <div key={phase} className="element-spacing">
            <h4 className="section-title">{phase}</h4>
            <ul className="element-spacing">
              {items.map((item, index) => (
                <li key={index} className="workflow-step">
                  <div className="step-number-info" />
                  <span className="text-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Additional Tips */}
      <div className="section-divider">
        <h4 className="section-title">Pro Tips</h4>
        <div className="status-warning">
          <ul className="text-body element-spacing">
            <li>• Always customize case studies to match prospect's industry</li>
            <li>• Prepare backup slides for detailed technical questions</li>
            <li>• Have live demo environment ready for impromptu requests</li>
            <li>• Keep presentations to scheduled time - respect their calendar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}