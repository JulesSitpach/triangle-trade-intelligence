/**
 * Stage 1 Detailed Intake Forms for Paid Services
 * These comprehensive forms are sent to clients AFTER they purchase services
 * Jorge/Cristina send these forms - clients fill them out and return
 */

export const MANUFACTURING_FEASIBILITY_INTAKE_FORM = {
  title: 'Manufacturing Feasibility - Detailed Requirements',
  service_price: 650,
  description: 'Comprehensive intake form for Mexico manufacturing feasibility assessment',
  sections: [
    {
      title: 'Product Specifications',
      fields: [
        {
          id: 'product_name',
          label: 'Product Name',
          type: 'text',
          required: true,
          placeholder: 'Enter product name'
        },
        {
          id: 'product_specifications',
          label: 'Detailed Technical Specifications',
          type: 'textarea',
          required: true,
          rows: 4,
          placeholder: 'Provide detailed technical requirements, dimensions, materials, etc.'
        },
        {
          id: 'required_certifications',
          label: 'Required Certifications or Quality Standards',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'ISO, FDA, CE, UL, industry-specific certifications, etc.'
        }
      ]
    },
    {
      title: 'Manufacturing Requirements',
      fields: [
        {
          id: 'monthly_volume',
          label: 'Monthly Production Volume',
          type: 'text',
          required: true,
          placeholder: 'e.g., 10,000 units per month'
        },
        {
          id: 'annual_volume',
          label: 'Annual Production Projection',
          type: 'text',
          required: true,
          placeholder: 'e.g., 120,000 units per year'
        },
        {
          id: 'manufacturing_process',
          label: 'Manufacturing Process Type',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select process type' },
            { value: 'assembly', label: 'Assembly' },
            { value: 'machining', label: 'Machining/CNC' },
            { value: 'injection-molding', label: 'Injection Molding' },
            { value: 'food-processing', label: 'Food Processing' },
            { value: 'chemical-processing', label: 'Chemical Processing' },
            { value: 'electronics-assembly', label: 'Electronics Assembly' },
            { value: 'textile-production', label: 'Textile Production' },
            { value: 'other', label: 'Other (specify in notes)' }
          ]
        },
        {
          id: 'labor_requirements',
          label: 'Labor Skill Requirements',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Skilled technicians, engineers, assembly line workers, quality inspectors, etc.'
        }
      ]
    },
    {
      title: 'Investment & Budget',
      fields: [
        {
          id: 'investment_budget',
          label: 'Total Investment Budget for Mexico Operations',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select budget range' },
            { value: '100k-500k', label: '$100K - $500K' },
            { value: '500k-1m', label: '$500K - $1M' },
            { value: '1m-2m', label: '$1M - $2M' },
            { value: '2m-5m', label: '$2M - $5M' },
            { value: '5m-10m', label: '$5M - $10M' },
            { value: '10m-plus', label: '$10M+' }
          ]
        },
        {
          id: 'current_manufacturing_cost',
          label: 'Current Manufacturing Cost per Unit',
          type: 'text',
          required: false,
          placeholder: 'e.g., $25.50 per unit'
        },
        {
          id: 'target_cost_reduction',
          label: 'Target Cost Reduction Goal',
          type: 'text',
          required: false,
          placeholder: 'e.g., 20% reduction, $5 per unit savings'
        }
      ]
    },
    {
      title: 'Current Operations',
      fields: [
        {
          id: 'current_location',
          label: 'Current Manufacturing Location',
          type: 'text',
          required: true,
          placeholder: 'City, State/Province, Country'
        },
        {
          id: 'setup_timeline',
          label: 'Timeline for Mexico Manufacturing Setup',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select timeline' },
            { value: '1-3-months', label: 'Immediate (1-3 months)' },
            { value: '3-6-months', label: 'Short-term (3-6 months)' },
            { value: '6-12-months', label: 'Medium-term (6-12 months)' },
            { value: '12-plus-months', label: 'Long-term (12+ months)' },
            { value: 'exploring', label: 'Just exploring options' }
          ]
        }
      ]
    },
    {
      title: 'Location & Infrastructure',
      fields: [
        {
          id: 'preferred_locations',
          label: 'Preferred Mexico Manufacturing Locations',
          type: 'textarea',
          required: true,
          rows: 2,
          placeholder: 'Border regions (Tijuana, Juarez), Central (Guadalajara, Queretaro), etc.'
        },
        {
          id: 'proximity_requirements',
          label: 'Proximity Requirements',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Proximity to ports, suppliers, US border, specific markets, etc.'
        },
        {
          id: 'infrastructure_needs',
          label: 'Infrastructure Requirements',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Power capacity, water supply, logistics access, specialized equipment, etc.'
        }
      ]
    },
    {
      title: 'Supply Chain & Materials',
      fields: [
        {
          id: 'raw_materials',
          label: 'Raw Material Sourcing Preferences',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Local Mexico sourcing, import from US/Canada, specific suppliers, etc.'
        },
        {
          id: 'supplier_relationships',
          label: 'Existing Supplier Relationships in Mexico',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'List any current Mexico suppliers or partnerships'
        }
      ]
    },
    {
      title: 'Regulatory & Compliance',
      fields: [
        {
          id: 'regulatory_compliance',
          label: 'Regulatory Compliance Needs',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Environmental permits, import/export licenses, industry-specific regulations, etc.'
        },
        {
          id: 'usmca_requirements',
          label: 'USMCA Qualification Requirements',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Content requirements for USMCA benefits, rules of origin considerations'
        }
      ]
    },
    {
      title: 'Partnership & Strategy',
      fields: [
        {
          id: 'local_partner_preference',
          label: 'Local Partnership Preferences',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select preference' },
            { value: 'full-ownership', label: 'Full ownership (100% subsidiary)' },
            { value: 'joint-venture', label: 'Joint venture with Mexico partner' },
            { value: 'contract-manufacturing', label: 'Contract manufacturing arrangement' },
            { value: 'open-to-options', label: 'Open to exploring options' }
          ]
        },
        {
          id: 'risk_tolerance',
          label: 'Risk Tolerance Level',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select risk tolerance' },
            { value: 'conservative', label: 'Conservative - Minimize risks' },
            { value: 'moderate', label: 'Moderate - Balanced approach' },
            { value: 'aggressive', label: 'Aggressive - Higher risk acceptable for faster setup' }
          ]
        }
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        {
          id: 'specific_concerns',
          label: 'Specific Concerns or Questions',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Any specific concerns, questions, or priorities for this assessment'
        },
        {
          id: 'success_criteria',
          label: 'Success Criteria for This Project',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'What would make this Mexico manufacturing setup successful for your business?'
        }
      ]
    }
  ]
};

export const SUPPLIER_SOURCING_INTAKE_FORM = {
  title: 'Supplier Sourcing - Detailed Requirements',
  service_price: 450,
  description: 'Comprehensive supplier sourcing requirements for Mexico network',
  sections: [
    {
      title: 'Fast Track Option',
      fields: [
        {
          id: 'has_usmca_certificate',
          label: 'Do you already have a USMCA Certificate of Origin?',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select option' },
            { value: 'yes', label: 'Yes - I have my USMCA certificate (Fast Track)' },
            { value: 'no', label: 'No - I need supplier sourcing first' }
          ]
        },
        {
          id: 'usmca_certificate_upload',
          label: 'Upload USMCA Certificate (Optional - enables fast track)',
          type: 'file',
          required: false,
          accept: '.pdf,.jpg,.jpeg,.png',
          help: 'Uploading your certificate allows Jorge to skip supplier research and connect you directly with qualified Mexico partners'
        }
      ]
    },
    {
      title: 'Product Requirements',
      fields: [
        {
          id: 'product_description',
          label: 'Detailed Product Description',
          type: 'textarea',
          required: true,
          rows: 4,
          placeholder: 'Provide comprehensive product details, specifications, technical requirements'
        },
        {
          id: 'technical_drawings',
          label: 'Technical Drawings or Specifications Available',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select availability' },
            { value: 'complete', label: 'Complete technical drawings available' },
            { value: 'partial', label: 'Partial specifications available' },
            { value: 'samples-only', label: 'Physical samples only' },
            { value: 'none', label: 'Need help developing specifications' }
          ]
        },
        {
          id: 'quality_standards',
          label: 'Required Quality Standards & Certifications',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'ISO certifications, industry standards, testing requirements, etc.'
        }
      ]
    },
    {
      title: 'Volume & Pricing',
      fields: [
        {
          id: 'minimum_order_quantity',
          label: 'Minimum Order Quantity (MOQ) Acceptable',
          type: 'text',
          required: true,
          placeholder: 'e.g., 1,000 units'
        },
        {
          id: 'annual_volume',
          label: 'Annual Volume Requirements',
          type: 'text',
          required: true,
          placeholder: 'e.g., 50,000 units per year'
        },
        {
          id: 'target_price_range',
          label: 'Target Price Range per Unit',
          type: 'text',
          required: true,
          placeholder: 'e.g., $15-$20 per unit'
        },
        {
          id: 'current_supplier_cost',
          label: 'Current Supplier Cost (if applicable)',
          type: 'text',
          required: false,
          placeholder: 'e.g., $25 per unit from current supplier'
        }
      ]
    },
    {
      title: 'Delivery & Timeline',
      fields: [
        {
          id: 'delivery_timeline',
          label: 'Required Delivery Timeline',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select timeline' },
            { value: 'immediate', label: 'Immediate (1-2 weeks)' },
            { value: 'short', label: 'Short term (1 month)' },
            { value: 'medium', label: 'Medium term (2-3 months)' },
            { value: 'long', label: 'Long term (6+ months)' }
          ]
        },
        {
          id: 'delivery_frequency',
          label: 'Ongoing Delivery Frequency',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select frequency' },
            { value: 'one-time', label: 'One-time order' },
            { value: 'monthly', label: 'Monthly shipments' },
            { value: 'quarterly', label: 'Quarterly shipments' },
            { value: 'as-needed', label: 'As needed / JIT' }
          ]
        }
      ]
    },
    {
      title: 'Supplier Preferences',
      fields: [
        {
          id: 'geographic_preference',
          label: 'Geographic Preferences within Mexico',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Border regions, central Mexico, specific states or cities'
        },
        {
          id: 'supplier_size_preference',
          label: 'Supplier Size Preference',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select preference' },
            { value: 'small', label: 'Small suppliers (more flexible)' },
            { value: 'medium', label: 'Medium suppliers (balanced)' },
            { value: 'large', label: 'Large suppliers (high capacity)' },
            { value: 'no-preference', label: 'No preference' }
          ]
        },
        {
          id: 'language_requirements',
          label: 'Language Capabilities Needed',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select requirement' },
            { value: 'english-required', label: 'English fluency required' },
            { value: 'english-preferred', label: 'English preferred but not required' },
            { value: 'spanish-ok', label: 'Spanish communication acceptable' },
            { value: 'translator-available', label: 'We have translator available' }
          ]
        }
      ]
    },
    {
      title: 'Payment & Terms',
      fields: [
        {
          id: 'payment_terms',
          label: 'Preferred Payment Terms',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select payment terms' },
            { value: 'net-30', label: 'Net 30' },
            { value: 'net-60', label: 'Net 60' },
            { value: 'deposit-balance', label: '50% deposit / 50% on delivery' },
            { value: 'letter-of-credit', label: 'Letter of credit' },
            { value: 'flexible', label: 'Flexible / Open to negotiation' }
          ]
        },
        {
          id: 'currency_preference',
          label: 'Currency Preference',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select currency' },
            { value: 'usd', label: 'USD' },
            { value: 'mxn', label: 'Mexican Peso (MXN)' },
            { value: 'either', label: 'Either USD or MXN' }
          ]
        }
      ]
    },
    {
      title: 'Quality & Samples',
      fields: [
        {
          id: 'sample_requirements',
          label: 'Sample or Prototype Requirements',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select requirement' },
            { value: 'samples-required', label: 'Samples required before order' },
            { value: 'prototype-needed', label: 'Prototype development needed' },
            { value: 'existing-samples', label: 'We have existing samples to match' },
            { value: 'no-samples', label: 'No samples needed' }
          ]
        },
        {
          id: 'previous_issues',
          label: 'Previous Supplier Issues to Avoid',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Quality problems, delivery delays, communication issues, etc.'
        }
      ]
    },
    {
      title: 'Relationship Expectations',
      fields: [
        {
          id: 'relationship_duration',
          label: 'Expected Relationship Duration',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select duration' },
            { value: 'one-time', label: 'One-time project' },
            { value: 'short-term', label: 'Short-term (6-12 months)' },
            { value: 'long-term', label: 'Long-term partnership (1+ years)' },
            { value: 'strategic', label: 'Strategic partnership' }
          ]
        },
        {
          id: 'additional_requirements',
          label: 'Additional Requirements or Priorities',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Any other important factors for supplier selection'
        }
      ]
    }
  ]
};

export const MARKET_ENTRY_INTAKE_FORM = {
  title: 'Market Entry Strategy - Detailed Requirements',
  service_price: 550,
  description: 'Comprehensive Mexico market entry planning and strategy assessment',
  sections: [
    {
      title: 'Product/Service Overview',
      fields: [
        {
          id: 'offering_description',
          label: 'Detailed Product/Service Description for Mexico Market',
          type: 'textarea',
          required: true,
          rows: 4,
          placeholder: 'Describe what you will offer in Mexico market, unique value proposition, etc.'
        },
        {
          id: 'market_differentiation',
          label: 'Key Differentiators from Competitors',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'What makes your offering unique in the Mexico market?'
        }
      ]
    },
    {
      title: 'Target Market',
      fields: [
        {
          id: 'customer_segments',
          label: 'Target Customer Segments',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'B2B manufacturers, consumers, retailers, distributors, etc.'
        },
        {
          id: 'target_regions',
          label: 'Target Mexico Regions',
          type: 'textarea',
          required: true,
          rows: 2,
          placeholder: 'Mexico City, Guadalajara, Monterrey, border regions, nationwide, etc.'
        },
        {
          id: 'market_size_estimate',
          label: 'Estimated Market Size/Opportunity',
          type: 'text',
          required: false,
          placeholder: 'e.g., $50M addressable market, 10,000 potential customers'
        }
      ]
    },
    {
      title: 'Pricing & Revenue',
      fields: [
        {
          id: 'pricing_strategy',
          label: 'Pricing Strategy for Mexico',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select pricing strategy' },
            { value: 'premium', label: 'Premium pricing' },
            { value: 'competitive', label: 'Competitive with market' },
            { value: 'penetration', label: 'Penetration pricing (lower to gain share)' },
            { value: 'value-based', label: 'Value-based pricing' },
            { value: 'undecided', label: 'Still determining' }
          ]
        },
        {
          id: 'revenue_projections',
          label: 'First Year Revenue Projection',
          type: 'text',
          required: false,
          placeholder: 'e.g., $2M - $5M'
        },
        {
          id: 'break_even_timeline',
          label: 'Target Break-Even Timeline',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select timeline' },
            { value: '6-months', label: '6 months' },
            { value: '12-months', label: '12 months' },
            { value: '18-months', label: '18 months' },
            { value: '24-months', label: '24+ months' }
          ]
        }
      ]
    },
    {
      title: 'Distribution & Logistics',
      fields: [
        {
          id: 'distribution_channels',
          label: 'Preferred Distribution Channels',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Direct sales, distributors, online, retail partners, etc.'
        },
        {
          id: 'logistics_approach',
          label: 'Logistics and Fulfillment Approach',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select approach' },
            { value: 'own-operations', label: 'Own operations in Mexico' },
            { value: 'third-party', label: 'Third-party logistics (3PL)' },
            { value: 'partner-handled', label: 'Distribution partner handles' },
            { value: 'exploring', label: 'Still exploring options' }
          ]
        }
      ]
    },
    {
      title: 'Market Entry Investment',
      fields: [
        {
          id: 'total_investment',
          label: 'Total Market Entry Investment Budget',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select budget range' },
            { value: 'under-100k', label: 'Under $100K' },
            { value: '100k-500k', label: '$100K - $500K' },
            { value: '500k-1m', label: '$500K - $1M' },
            { value: '1m-5m', label: '$1M - $5M' },
            { value: '5m-plus', label: '$5M+' }
          ]
        },
        {
          id: 'marketing_budget',
          label: 'First Year Marketing Budget',
          type: 'text',
          required: false,
          placeholder: 'e.g., $200K'
        },
        {
          id: 'entry_timeline',
          label: 'Market Entry Timeline',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select timeline' },
            { value: 'immediate', label: 'Immediate (1-3 months)' },
            { value: 'short-term', label: 'Short-term (3-6 months)' },
            { value: 'medium-term', label: 'Medium-term (6-12 months)' },
            { value: 'long-term', label: 'Long-term (12+ months)' }
          ]
        }
      ]
    },
    {
      title: 'Partnership Strategy',
      fields: [
        {
          id: 'partnership_interest',
          label: 'Local Partnership Interest',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select interest level' },
            { value: 'essential', label: 'Local partner essential' },
            { value: 'preferred', label: 'Partner preferred but not required' },
            { value: 'open', label: 'Open to exploring' },
            { value: 'independent', label: 'Prefer independent entry' }
          ]
        },
        {
          id: 'partner_expectations',
          label: 'Partnership Expectations/Requirements',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Ideal partner profile, capabilities needed, relationship structure, etc.'
        }
      ]
    },
    {
      title: 'Competitive Landscape',
      fields: [
        {
          id: 'known_competitors',
          label: 'Known Competitors in Mexico',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'List any known competitors or similar offerings in Mexico market'
        },
        {
          id: 'competitive_advantage',
          label: 'Your Competitive Advantages',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Why will customers choose you over local/existing competitors?'
        }
      ]
    },
    {
      title: 'Regulatory & Cultural',
      fields: [
        {
          id: 'regulatory_concerns',
          label: 'Regulatory Compliance Concerns',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Import regulations, licensing, industry-specific requirements, etc.'
        },
        {
          id: 'cultural_adaptation',
          label: 'Cultural Adaptation Needs',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Product modifications, marketing adaptations, language requirements, etc.'
        }
      ]
    },
    {
      title: 'Success Metrics',
      fields: [
        {
          id: 'success_criteria',
          label: 'Success Criteria for Market Entry',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'What specific outcomes would define success in Mexico market?'
        },
        {
          id: 'expansion_experience',
          label: 'Previous International Expansion Experience',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any previous experience entering international markets, lessons learned'
        }
      ]
    }
  ]
};

export const USMCA_CERTIFICATE_INTAKE_FORM = {
  title: 'USMCA Certificate - Document Requirements',
  service_price: 200,
  description: 'Comprehensive USMCA certificate generation requirements',
  sections: [
    {
      title: 'Product Information',
      fields: [
        {
          id: 'product_description',
          label: 'Complete Product Description',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Detailed description of product for USMCA certification'
        },
        {
          id: 'hs_code',
          label: 'HS Code (if known)',
          type: 'text',
          required: false,
          placeholder: 'e.g., 8517.62.00'
        },
        {
          id: 'product_value',
          label: 'Product Value (USD)',
          type: 'text',
          required: true,
          placeholder: 'e.g., $125.00 per unit'
        }
      ]
    },
    {
      title: 'Manufacturing Details',
      fields: [
        {
          id: 'manufacturing_process',
          label: 'Manufacturing Process Description',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Describe how the product is manufactured'
        },
        {
          id: 'production_facility',
          label: 'Production Facility Location(s)',
          type: 'text',
          required: true,
          placeholder: 'City, State/Province, Country'
        }
      ]
    },
    {
      title: 'Component Sourcing',
      fields: [
        {
          id: 'components_us',
          label: 'US-Sourced Components (% of value)',
          type: 'text',
          required: true,
          placeholder: 'e.g., 45%'
        },
        {
          id: 'components_canada',
          label: 'Canada-Sourced Components (% of value)',
          type: 'text',
          required: true,
          placeholder: 'e.g., 20%'
        },
        {
          id: 'components_mexico',
          label: 'Mexico-Sourced Components (% of value)',
          type: 'text',
          required: true,
          placeholder: 'e.g., 25%'
        },
        {
          id: 'components_other',
          label: 'Non-USMCA Components (% of value)',
          type: 'text',
          required: true,
          placeholder: 'e.g., 10%'
        },
        {
          id: 'component_details',
          label: 'Component Breakdown Details',
          type: 'textarea',
          required: true,
          rows: 4,
          placeholder: 'List major components with origin country and value/percentage'
        }
      ]
    },
    {
      title: 'Supporting Documentation',
      fields: [
        {
          id: 'supplier_docs_available',
          label: 'Supplier Documentation Availability',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select availability' },
            { value: 'complete', label: 'Complete supplier certificates available' },
            { value: 'partial', label: 'Partial documentation available' },
            { value: 'need-assistance', label: 'Need assistance obtaining' }
          ]
        },
        {
          id: 'previous_certificates',
          label: 'Previous USMCA Certificate History',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select history' },
            { value: 'first-time', label: 'First USMCA certificate' },
            { value: 'have-previous', label: 'Have previous certificates' },
            { value: 'renewal', label: 'Renewal of existing certificate' }
          ]
        }
      ]
    },
    {
      title: 'Submission Details',
      fields: [
        {
          id: 'urgency_level',
          label: 'Urgency Level',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select urgency' },
            { value: 'standard', label: 'Standard (5-7 business days)' },
            { value: 'expedited', label: 'Expedited (2-3 business days)' },
            { value: 'rush', label: 'Rush (24-48 hours)' }
          ]
        },
        {
          id: 'submission_deadline',
          label: 'Required Completion Date',
          type: 'date',
          required: true
        },
        {
          id: 'customs_broker',
          label: 'Customs Broker Information (if applicable)',
          type: 'text',
          required: false,
          placeholder: 'Broker name and contact'
        }
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        {
          id: 'special_handling',
          label: 'Special Handling Requirements',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any special considerations or requirements'
        },
        {
          id: 'additional_notes',
          label: 'Additional Notes or Questions',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Any other information that may be relevant'
        }
      ]
    }
  ]
};

export const HS_CLASSIFICATION_INTAKE_FORM = {
  title: 'HS Code Classification - Product Details',
  service_price: 150,
  description: 'Detailed product information for accurate HS code classification',
  sections: [
    {
      title: 'Product Identification',
      fields: [
        {
          id: 'product_name',
          label: 'Product Name',
          type: 'text',
          required: true,
          placeholder: 'Commercial product name'
        },
        {
          id: 'detailed_description',
          label: 'Detailed Product Description',
          type: 'textarea',
          required: true,
          rows: 4,
          placeholder: 'Complete description including function, use, and key features'
        }
      ]
    },
    {
      title: 'Technical Specifications',
      fields: [
        {
          id: 'materials_composition',
          label: 'Materials and Composition',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Primary materials, percentages, construction details'
        },
        {
          id: 'technical_specs',
          label: 'Technical Specifications',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'Dimensions, weight, capacity, technical features'
        },
        {
          id: 'ingredients',
          label: 'Ingredients/Components (if applicable)',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'For food, chemical, or composite products'
        }
      ]
    },
    {
      title: 'Product Application',
      fields: [
        {
          id: 'intended_use',
          label: 'Intended Use and Applications',
          type: 'textarea',
          required: true,
          rows: 3,
          placeholder: 'How the product is used, primary applications'
        },
        {
          id: 'industry_classification',
          label: 'Industry Classification (if known)',
          type: 'text',
          required: false,
          placeholder: 'e.g., Electronics, Automotive, Food & Beverage'
        }
      ]
    },
    {
      title: 'Reference Information',
      fields: [
        {
          id: 'similar_products',
          label: 'Similar Products with Known HS Codes',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'List any similar products and their HS codes if known'
        },
        {
          id: 'previous_classification',
          label: 'Previous Classification Attempts',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any previous HS codes used or suggested'
        }
      ]
    },
    {
      title: 'Trade Details',
      fields: [
        {
          id: 'origin_country',
          label: 'Country of Origin',
          type: 'text',
          required: true,
          placeholder: 'Manufacturing country'
        },
        {
          id: 'destination_country',
          label: 'Primary Destination Country',
          type: 'text',
          required: true,
          placeholder: 'Import destination'
        },
        {
          id: 'volume_projections',
          label: 'Import/Export Volume Projections',
          type: 'text',
          required: false,
          placeholder: 'Annual volume estimates'
        }
      ]
    },
    {
      title: 'Classification Requirements',
      fields: [
        {
          id: 'urgency',
          label: 'Classification Urgency',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select urgency' },
            { value: 'standard', label: 'Standard (3-5 business days)' },
            { value: 'expedited', label: 'Expedited (1-2 business days)' },
            { value: 'immediate', label: 'Immediate (same day if possible)' }
          ]
        },
        {
          id: 'classification_purpose',
          label: 'Purpose of Classification',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select purpose' },
            { value: 'import-planning', label: 'Import planning' },
            { value: 'tariff-calculation', label: 'Tariff calculation' },
            { value: 'compliance', label: 'Compliance requirements' },
            { value: 'dispute-resolution', label: 'Dispute resolution' },
            { value: 'other', label: 'Other (specify in notes)' }
          ]
        }
      ]
    },
    {
      title: 'Additional Details',
      fields: [
        {
          id: 'special_considerations',
          label: 'Special Considerations',
          type: 'textarea',
          required: false,
          rows: 2,
          placeholder: 'Any special factors affecting classification'
        },
        {
          id: 'questions',
          label: 'Specific Questions or Concerns',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Any questions about the classification process or requirements'
        }
      ]
    }
  ]
};

export function getIntakeFormByService(serviceType) {
  const forms = {
    'manufacturing-feasibility': MANUFACTURING_FEASIBILITY_INTAKE_FORM,
    'supplier-sourcing': SUPPLIER_SOURCING_INTAKE_FORM,
    'market-entry': MARKET_ENTRY_INTAKE_FORM,
    'usmca-certificate': USMCA_CERTIFICATE_INTAKE_FORM,
    'hs-classification': HS_CLASSIFICATION_INTAKE_FORM
  };

  return forms[serviceType] || null;
}

export function getAllIntakeForms() {
  return {
    'manufacturing-feasibility': MANUFACTURING_FEASIBILITY_INTAKE_FORM,
    'supplier-sourcing': SUPPLIER_SOURCING_INTAKE_FORM,
    'market-entry': MARKET_ENTRY_INTAKE_FORM,
    'usmca-certificate': USMCA_CERTIFICATE_INTAKE_FORM,
    'hs-classification': HS_CLASSIFICATION_INTAKE_FORM
  };
}