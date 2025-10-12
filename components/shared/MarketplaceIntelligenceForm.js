/**
 * Marketplace Intelligence Form Component
 *
 * Captures marketplace data during service completion for database building
 * Used in Stage 3 of all professional services
 *
 * Purpose: Build Mexico supplier database and market intelligence
 * Data captured: Supplier contacts, lessons learned, market insights
 */

import React, { useState } from 'react';

export default function MarketplaceIntelligenceForm({ serviceType, onDataChange }) {
  const [intelligence, setIntelligence] = useState({
    supplier_contacts: '',
    market_insights: '',
    client_pain_points: '',
    lessons_learned: '',
    reusable_solutions: ''
  });

  const handleChange = (field, value) => {
    const updated = { ...intelligence, [field]: value };
    setIntelligence(updated);

    if (onDataChange) {
      onDataChange(updated);
    }
  };

  // Get service-specific guidance text
  const getGuidanceText = () => {
    switch (serviceType) {
      case 'supplier_sourcing':
      case 'Supply Chain Resilience':
        return {
          title: '🗄️ Supplier Database Building',
          supplier_label: 'Mexico Supplier Contacts Discovered (CRITICAL FOR MARKETPLACE)',
          supplier_placeholder: 'Example:\n\nAcme Textiles Mexico\n• Contact: Juan Rodriguez, juan@acmetextiles.mx, +52-81-1234-5678\n• Specialization: Cotton fabric manufacturing, 500K+ meters/month capacity\n• Certifications: ISO 9001, WRAP certified\n• Pricing: $3.50-4.20/meter depending on volume\n• Lead Time: 30-45 days\n• Quality Score: 9/10 based on samples\n• Notes: Excellent for medium-high volume orders, family-owned, strong USMCA compliance\n\n[Add 2-4 more suppliers with full contact details...]',
          insights_label: 'Mexico Market Intelligence',
          insights_placeholder: 'What did you learn about Mexico textile market? Pricing trends? Common supplier capabilities? Regional advantages (Monterrey vs Guadalajara)?'
        };

      case 'manufacturing_feasibility':
      case 'Manufacturing Feasibility':
        return {
          title: '🏭 Manufacturing Partner Database',
          supplier_label: 'Mexico Manufacturing Facility Contacts',
          supplier_placeholder: 'Example:\n\nMonterrey Industrial Park - Sector A\n• Contact: Maria Gonzalez, maria@mtyindustrial.mx\n• Specialization: Contract electronics manufacturing\n• Capacity: 50,000 units/month\n• Labor Cost: $4-6/hour fully burdened\n• Available Space: 10,000 sq ft ready, expandable to 25,000 sq ft\n• Certifications: ISO 14001, IMMEX program registered\n• Notes: Near airport, good for export, bilingual management',
          insights_label: 'Mexico Manufacturing Market Intelligence',
          insights_placeholder: 'What did you learn about Mexico manufacturing costs? Regional differences? Labor availability? Infrastructure quality?'
        };

      case 'market_entry':
      case 'Market Entry Strategy':
      case 'Pathfinder Market Entry':
        return {
          title: '🇲🇽 Mexico Distribution Network Intelligence',
          supplier_label: 'Mexico Distributor/Partner Contacts',
          supplier_placeholder: 'Example:\n\nDistribuidora Nacional SA de CV\n• Contact: Carlos Martinez, carlos@disnacional.mx\n• Coverage: National distribution, 15 regional warehouses\n• Product Categories: Industrial supplies, B2B focus\n• Existing Brands: 200+ international manufacturers\n• Minimum Order: 50K USD initial, 10K USD recurring\n• Notes: Strong relationships with automotive/electronics OEMs',
          insights_label: 'Mexico Market Entry Intelligence',
          insights_placeholder: 'What did you learn about Mexico market dynamics? Distribution channels? Competitor positioning? Regulatory barriers?'
        };

      default:
        return {
          title: '📊 Marketplace Intelligence Capture',
          supplier_label: 'Supplier/Partner Contacts Discovered',
          supplier_placeholder: 'Capture any supplier, distributor, or service provider contacts discovered during this service delivery.\n\nFormat:\n\nCompany Name\n• Contact: Name, email, phone\n• Specialization: [what they do]\n• Key Details: [capabilities, capacity, certifications]\n• Notes: [quality observations, pricing, reliability]',
          insights_label: 'Market Intelligence Gathered',
          insights_placeholder: 'What did you learn about the market/industry during this service? Pricing trends? Common challenges? Regional advantages?'
        };
    }
  };

  const guidance = getGuidanceText();

  return (
    <div className="workflow-status-card workflow-status-success workflow-mb-2">
      <h4 className="workflow-status-success-text workflow-mb-2">{guidance.title}</h4>
      <div className="workflow-text-sm workflow-text-gray-700 workflow-mb-2">
        <strong>Why This Matters:</strong> Every service delivery builds our Mexico supplier database.
        Capture supplier contacts and market intelligence to help future clients and build marketplace value.
      </div>

      <div className="workflow-form-group">
        <label className="workflow-form-label">
          <strong>{guidance.supplier_label}</strong>
        </label>
        <div className="workflow-text-xs workflow-text-gray-600 workflow-mb-1">
          Include: Company name, contact person, email, phone, specialization, capabilities, certifications, pricing, quality observations
        </div>
        <textarea
          className="workflow-form-input workflow-form-textarea"
          rows="10"
          value={intelligence.supplier_contacts}
          onChange={(e) => handleChange('supplier_contacts', e.target.value)}
          placeholder={guidance.supplier_placeholder}
        />
      </div>

      <div className="workflow-form-group">
        <label className="workflow-form-label">
          <strong>{guidance.insights_label}</strong>
        </label>
        <div className="workflow-text-xs workflow-text-gray-600 workflow-mb-1">
          What market intelligence did you gather? Pricing trends? Common capabilities? Regional advantages?
        </div>
        <textarea
          className="workflow-form-input workflow-form-textarea"
          rows="6"
          value={intelligence.market_insights}
          onChange={(e) => handleChange('market_insights', e.target.value)}
          placeholder={guidance.insights_placeholder}
        />
      </div>

      <div className="workflow-form-group">
        <label className="workflow-form-label">
          <strong>Client Pain Points & Solutions</strong>
        </label>
        <div className="workflow-text-xs workflow-text-gray-600 workflow-mb-1">
          What specific problems did this client face? What solutions worked? What patterns can help future clients?
        </div>
        <textarea
          className="workflow-form-input workflow-form-textarea"
          rows="5"
          value={intelligence.client_pain_points}
          onChange={(e) => handleChange('client_pain_points', e.target.value)}
          placeholder="Example:

Challenge: Client was 30% below USMCA threshold due to India fabric sourcing.

Solution: Found 3 Mexico textile mills that matched quality/price. Switching just 25% of fabric sourcing to Mexico achieves USMCA qualification.

Future Application: Most textile importers face this same gap - Mexico fabric mills are competitive alternative to India/China."
        />
      </div>

      <div className="workflow-form-group">
        <label className="workflow-form-label">
          <strong>Lessons Learned (Internal Use)</strong>
        </label>
        <div className="workflow-text-xs workflow-text-gray-600 workflow-mb-1">
          What worked well? What would you do differently next time? Process improvements?
        </div>
        <textarea
          className="workflow-form-input workflow-form-textarea"
          rows="4"
          value={intelligence.lessons_learned}
          onChange={(e) => handleChange('lessons_learned', e.target.value)}
          placeholder="Example:

✅ WORKED WELL: AI supplier research in Stage 2 found 8 candidates quickly, Jorge's verification calls narrowed to best 3 in 2 hours.

⚠️ IMPROVEMENT NEEDED: Need better criteria for 'USMCA-compliant' suppliers - some claimed compliance but lacked documentation.

💡 PROCESS TIP: Always ask for sample Certificates of Origin during supplier calls - saves time later."
        />
      </div>

      <div className="workflow-form-group">
        <label className="workflow-form-label">
          <strong>Reusable Solutions & Resources</strong>
        </label>
        <div className="workflow-text-xs workflow-text-gray-600 workflow-mb-1">
          What resources, templates, or solutions from this service can be reused for future clients in similar situations?
        </div>
        <textarea
          className="workflow-form-input workflow-form-textarea"
          rows="4"
          value={intelligence.reusable_solutions}
          onChange={(e) => handleChange('reusable_solutions', e.target.value)}
          placeholder="Example:

📄 REUSABLE TEMPLATE: Created 'Mexico Textile Supplier Evaluation Matrix' - can use for all textile sourcing clients.

🔗 VALUABLE RESOURCE: Monterrey Chamber of Commerce textile directory - excellent starting point for supplier research.

💼 BEST PRACTICE: 'Supplier USMCA Compliance Checklist' - now using as standard for all sourcing services."
        />
      </div>

      <div className="workflow-status-card workflow-status-info workflow-mb-0">
        <div className="workflow-text-xs workflow-text-gray-700">
          <strong className="workflow-text-blue-600">💡 Marketplace Building Strategy:</strong> This intelligence feeds our Mexico supplier database.
          After 40-60 services, we'll have 100+ verified suppliers to recruit for marketplace membership ($199/month).
          Your detailed capture today = marketplace revenue tomorrow.
        </div>
      </div>
    </div>
  );
}
