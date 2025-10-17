/**
 * Workflow Data Capture Service
 * Captures comprehensive data from all workflow steps to build business intelligence
 */

import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class WorkflowDataCaptureService {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.workflowData = {};
  }

  /**
   * Initialize a new workflow session
   */
  async initializeSession(userId = 'anonymous') {
    this.sessionId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.workflowData = {
      session_id: this.sessionId,
      user_id: userId,
      started_at: new Date().toISOString(),
      workflow_type: 'usmca_certificate',
      steps_completed: [],
      current_step: 1
    };

    // Create initial workflow record in database
    try {
      const { data, error } = await supabase
        .from('workflow_sessions')
        .insert({
          session_id: this.sessionId,
          user_id: userId,
          started_at: this.workflowData.started_at,
          status: 'in_progress'
        });

      if (error) {
        await DevIssue.apiError('database_service', 'workflow-data-capture.initializeSession', error, {
          sessionId: this.sessionId,
          userId,
          operation: 'INSERT',
          table: 'workflow_sessions'
        });
        console.error('Error creating workflow session:', error);
      }
    } catch (error) {
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'database_service',
        message: 'Database connection error during workflow session initialization',
        data: {
          error: error.message,
          stack: error.stack,
          sessionId: this.sessionId,
          userId,
          table: 'workflow_sessions'
        }
      });
      console.error('Database connection error:', error);
    }

    return this.sessionId;
  }

  /**
   * Capture Step 1: Company Information
   */
  async captureCompanyInfo(data) {
    const companyData = {
      company_name: data.company_name || data.exporter_name,
      business_type: data.business_type,
      trade_volume: this.parseTradeVolume(data.trade_volume),
      annual_revenue: this.parseTradeVolume(data.annual_revenue),
      employees_count: data.employees_count,
      
      // Location data
      headquarters_country: data.country || 'US',
      headquarters_address: data.company_address || data.exporter_address,
      manufacturing_locations: data.manufacturing_locations || [],
      
      // Contact information
      contact_name: data.contact_name || data.exporter_contact,
      contact_email: data.contact_email || data.exporter_email,
      contact_phone: data.contact_phone || data.exporter_phone,
      
      // Compliance info
      tax_id: data.tax_id || data.exporter_tax_id,
      importer_tax_id: data.importer_tax_id,
      
      // Business relationships
      primary_supplier_country: data.supplier_country,
      customer_markets: data.customer_markets || ['US'],
      
      // Metadata
      captured_at: new Date().toISOString(),
      step_number: 1
    };

    this.workflowData.company = companyData;
    await this.saveStepData('company_info', companyData);
    return companyData;
  }

  /**
   * Capture Step 2: Product Analysis
   */
  async captureProductAnalysis(data) {
    const productData = {
      // Product details
      product_description: data.product_description || data.description,
      hs_code: data.hs_code,
      hs_description: data.hs_description,
      classification_confidence: data.classification_confidence || 0.95,
      
      // Trade details
      annual_units: data.annual_units,
      unit_value: data.unit_value,
      total_product_value: data.total_value || (data.annual_units * data.unit_value),
      
      // Tariff information
      mfn_rate: data.mfn_rate || data.general_rate,
      usmca_rate: data.usmca_rate || 0,
      potential_savings: data.savings || ((data.mfn_rate - data.usmca_rate) * data.total_value / 100),
      
      // Product characteristics
      product_category: data.product_category,
      is_agricultural: data.is_agricultural || false,
      is_manufactured: data.is_manufactured || true,
      requires_certification: data.requires_certification || true,
      
      // Supply chain
      primary_materials: data.materials || [],
      processing_steps: data.processing_steps || [],
      value_added_processes: data.value_added || [],
      
      // Metadata
      captured_at: new Date().toISOString(),
      step_number: 2
    };

    this.workflowData.product = productData;
    await this.saveStepData('product_analysis', productData);
    return productData;
  }

  /**
   * Capture Step 3: Component Origins
   */
  async captureComponentOrigins(data) {
    const componentsData = {
      // Component breakdown
      components: (data.component_origins || data.components || []).map(comp => ({
        description: comp.description || comp.component_name,
        origin_country: comp.origin_country,
        supplier_name: comp.supplier_name,
        value_percentage: comp.value_percentage || comp.percentage,
        value_amount: comp.value_amount,
        hs_code: comp.hs_code,
        is_originating: comp.is_originating !== false,
        certification_available: comp.certification_available || false
      })),
      
      // Origin summary
      total_na_content: this.calculateNAContent(data.component_origins),
      total_foreign_content: 100 - this.calculateNAContent(data.component_origins),
      qualifying_countries: this.getQualifyingCountries(data.component_origins),
      non_qualifying_countries: this.getNonQualifyingCountries(data.component_origins),
      
      // Supplier information
      supplier_count: data.supplier_count || data.component_origins?.length || 0,
      primary_supplier: data.primary_supplier,
      supplier_diversification: this.calculateSupplierDiversification(data.component_origins),
      
      // Risk assessment
      single_source_components: this.identifySingleSourceComponents(data.component_origins),
      supply_chain_risks: data.supply_chain_risks || [],
      alternative_suppliers: data.alternative_suppliers || {},
      
      // Metadata
      captured_at: new Date().toISOString(),
      step_number: 3
    };

    this.workflowData.component_origins = componentsData;
    await this.saveStepData('component_origins', componentsData);
    return componentsData;
  }

  /**
   * Capture Step 4: USMCA Qualification Results
   */
  async captureQualificationResults(data) {
    const resultsData = {
      // Qualification results
      qualifies_for_usmca: data.qualifies || data.usmca_qualified,
      qualification_method: data.qualification_method || 'RVC',
      rvc_percentage: data.rvc_percentage || this.calculateNAContent(this.workflowData.component_origins?.components),
      threshold_required: data.threshold || 60,
      margin_above_threshold: data.rvc_percentage - data.threshold,
      
      // Savings calculations
      annual_savings: data.annual_savings || this.workflowData.product?.potential_savings,
      monthly_savings: (data.annual_savings || 0) / 12,
      roi_percentage: this.calculateROI(data.annual_savings, data.compliance_cost),
      payback_period_months: this.calculatePaybackPeriod(data.annual_savings, data.compliance_cost),
      
      // Trust and validation
      trust_score: data.trust_score || 95,
      validation_status: data.validation_status || 'verified',
      expert_review: data.expert_review || false,
      documentation_complete: data.documentation_complete !== false,
      
      // Compliance metrics
      compliance_cost: data.compliance_cost || 500,
      time_to_complete: data.time_to_complete || '30 minutes',
      complexity_score: data.complexity_score || 'medium',
      
      // Recommendations
      optimization_opportunities: data.optimization_opportunities || [],
      alternative_suppliers_suggested: data.alternative_suppliers || [],
      risk_mitigation_steps: data.risk_mitigation || [],
      
      // Metadata
      captured_at: new Date().toISOString(),
      step_number: 4
    };

    this.workflowData.results = resultsData;
    await this.saveStepData('qualification_results', resultsData);
    return resultsData;
  }

  /**
   * Capture Step 5: Certificate Generation
   */
  async captureCertificateGeneration(data) {
    const certificateData = {
      // Certificate details
      certificate_number: data.certificate_number || `USMCA-${Date.now()}`,
      certificate_type: data.certificate_type || 'annual',
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until || new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      
      // Signatory information
      authorized_signature: data.authorized_signature,
      signatory_name: data.signatory_name,
      signatory_title: data.signatory_title,
      signatory_email: data.signatory_email,
      
      // Certificate status
      status: 'issued',
      issued_at: new Date().toISOString(),
      pdf_generated: data.pdf_generated !== false,
      pdf_url: data.pdf_url,
      
      // Audit trail
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      verification_code: this.generateVerificationCode(),
      
      // Metadata
      captured_at: new Date().toISOString(),
      step_number: 5
    };

    this.workflowData.certificate = certificateData;
    await this.saveStepData('certificate_generation', certificateData);
    return certificateData;
  }

  /**
   * Complete workflow and save comprehensive data
   */
  async completeWorkflow() {
    const completionData = {
      ...this.workflowData,
      completed_at: new Date().toISOString(),
      status: 'completed',
      total_time_minutes: this.calculateTotalTime(),
      
      // Summary metrics for business intelligence
      business_intelligence: {
        company_name: this.workflowData.company?.company_name,
        trade_volume: this.workflowData.company?.trade_volume,
        business_type: this.workflowData.company?.business_type,
        
        primary_hs_codes: [this.workflowData.product?.hs_code],
        primary_products: [this.workflowData.product?.product_description],
        
        supplier_countries: this.getUniqueSupplierCountries(),
        total_na_content: this.workflowData.component_origins?.total_na_content,
        
        annual_savings_achieved: this.workflowData.results?.annual_savings,
        certificates_generated: 1,
        compliance_score: this.workflowData.results?.trust_score,
        
        optimization_potential: this.calculateOptimizationPotential(),
        risk_factors: this.identifyRiskFactors()
      }
    };

    // Save complete workflow to database
    try {
      // Save to workflow_completions table
      const { data: completion, error: completionError } = await supabase
        .from('workflow_completions')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          company_name: completionData.business_intelligence.company_name,
          business_type: completionData.business_intelligence.business_type,
          trade_volume: completionData.business_intelligence.trade_volume,
          hs_code: completionData.business_intelligence.primary_hs_codes[0],
          product_description: completionData.business_intelligence.primary_products[0],
          supplier_country: completionData.business_intelligence.supplier_countries[0],
          annual_savings: completionData.business_intelligence.annual_savings_achieved,
          trust_score: completionData.business_intelligence.compliance_score,
          certificate_generated: true,
          certificate_number: this.workflowData.certificate?.certificate_number,
          workflow_data: completionData,
          created_at: completionData.completed_at
        });

      // Update or create business intelligence record
      const { data: biData, error: biError } = await supabase
        .from('business_intelligence')
        .upsert({
          user_id: this.userId,
          ...completionData.business_intelligence,
          last_updated: new Date().toISOString()
        });

      if (completionError || biError) {
        await DevIssue.apiError('database_service', 'workflow-data-capture.completeWorkflow', completionError || biError, {
          sessionId: this.sessionId,
          userId: this.userId,
          operation: completionError ? 'INSERT workflow_completions' : 'UPSERT business_intelligence',
          table: completionError ? 'workflow_completions' : 'business_intelligence',
          companyName: completionData.business_intelligence.company_name
        });
        console.error('Error saving completion data:', completionError || biError);
      }

      return { success: true, data: completionData };
    } catch (error) {
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'database_service',
        message: 'Failed to complete workflow and save to database',
        data: {
          error: error.message,
          stack: error.stack,
          sessionId: this.sessionId,
          userId: this.userId,
          companyName: completionData?.business_intelligence?.company_name
        }
      });
      console.error('Error completing workflow:', error);
      return { success: false, error: error.message, data: completionData };
    }
  }

  // Helper methods
  parseTradeVolume(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[$,]/g, '')) || 0;
    }
    return 0;
  }

  calculateNAContent(components) {
    if (!components || !Array.isArray(components)) return 0;
    return components
      .filter(c => ['US', 'CA', 'MX'].includes(c.origin_country))
      .reduce((sum, c) => sum + (c.value_percentage || 0), 0);
  }

  getQualifyingCountries(components) {
    if (!components) return [];
    return [...new Set(components
      .filter(c => ['US', 'CA', 'MX'].includes(c.origin_country))
      .map(c => c.origin_country))];
  }

  getNonQualifyingCountries(components) {
    if (!components) return [];
    return [...new Set(components
      .filter(c => !['US', 'CA', 'MX'].includes(c.origin_country))
      .map(c => c.origin_country))];
  }

  calculateSupplierDiversification(components) {
    if (!components || components.length === 0) return 'none';
    const countries = new Set(components.map(c => c.origin_country));
    if (countries.size === 1) return 'single_source';
    if (countries.size === 2) return 'limited';
    if (countries.size >= 3) return 'diversified';
    return 'unknown';
  }

  identifySingleSourceComponents(components) {
    if (!components) return [];
    const critical = components.filter(c => c.value_percentage > 30);
    return critical.map(c => ({
      component: c.description,
      country: c.origin_country,
      percentage: c.value_percentage
    }));
  }

  calculateROI(savings, cost) {
    if (!savings || !cost) return 0;
    return ((savings - cost) / cost * 100).toFixed(1);
  }

  calculatePaybackPeriod(annualSavings, cost) {
    if (!annualSavings || !cost) return 0;
    return Math.ceil((cost / annualSavings) * 12); // months
  }

  calculateTotalTime() {
    if (!this.workflowData.started_at) return 0;
    const start = new Date(this.workflowData.started_at);
    const end = new Date();
    return Math.round((end - start) / 60000); // minutes
  }

  getUniqueSupplierCountries() {
    const countries = new Set();
    if (this.workflowData.company?.primary_supplier_country) {
      countries.add(this.workflowData.company.primary_supplier_country);
    }
    if (this.workflowData.component_origins?.components) {
      this.workflowData.component_origins.components.forEach(c => {
        if (c.origin_country) countries.add(c.origin_country);
      });
    }
    return Array.from(countries);
  }

  calculateOptimizationPotential() {
    const current = this.workflowData.results?.rvc_percentage || 0;
    const threshold = this.workflowData.results?.threshold_required || 60;
    const margin = current - threshold;
    
    if (margin > 20) return 'low'; // Already well above threshold
    if (margin > 10) return 'medium'; // Some room for optimization
    if (margin > 0) return 'high'; // Close to threshold, needs optimization
    return 'critical'; // Below threshold
  }

  identifyRiskFactors() {
    const risks = [];
    
    // Single source dependency
    if (this.workflowData.component_origins?.supplier_diversification === 'single_source') {
      risks.push('single_source_dependency');
    }
    
    // Low margin above threshold
    if (this.workflowData.results?.margin_above_threshold < 5) {
      risks.push('low_qualification_margin');
    }
    
    // High foreign content
    if (this.workflowData.component_origins?.total_foreign_content > 50) {
      risks.push('high_foreign_content');
    }
    
    return risks;
  }

  generateVerificationCode() {
    return `USMCA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  async saveStepData(stepName, data) {
    try {
      const { error } = await supabase
        .from('workflow_step_data')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          step_name: stepName,
          step_data: data,
          created_at: data.captured_at
        });

      if (error) {
        await DevIssue.apiError('database_service', `workflow-data-capture.saveStepData.${stepName}`, error, {
          sessionId: this.sessionId,
          userId: this.userId,
          stepName,
          operation: 'INSERT',
          table: 'workflow_step_data'
        });
        console.error(`Error saving ${stepName} data:`, error);
      }
    } catch (error) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'database_service',
        message: `Database connection error saving workflow step: ${stepName}`,
        data: {
          error: error.message,
          stack: error.stack,
          sessionId: this.sessionId,
          userId: this.userId,
          stepName,
          table: 'workflow_step_data'
        }
      });
      console.error('Database error:', error);
    }
  }
}

// Export singleton instance
const workflowDataCapture = new WorkflowDataCaptureService();
export default workflowDataCapture;