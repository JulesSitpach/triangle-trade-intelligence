/**
 * LEAD CAPTURE SYSTEM
 * 
 * Simple form data processing and lead qualification system for Triangle Intelligence.
 * Processes business intake forms and stores qualified leads in database.
 * 
 * NO FABRICATED INTELLIGENCE - Pure data processing only
 * NO HARDCODED SUCCESS RATES - Actual lead processing only  
 * NO FAKE QUALIFICATIONS - Real form validation only
 */

import { logInfo, logError, logPerformance } from '../production-logger.js';
import { getSupabaseClient } from '../supabase-client.js';

/**
 * Process business intake form submission
 * 
 * @param {Object} formData - Form submission data
 * @param {string} formData.companyName - Company name
 * @param {string} formData.industry - Industry category  
 * @param {string} formData.primaryOrigin - Primary import origin country
 * @param {number} formData.annualVolume - Annual import volume in USD
 * @param {string} formData.contactEmail - Contact email address
 * @param {string} formData.contactName - Contact person name
 * @returns {Object} Processing result
 */
export async function processBusinessIntake(formData) {
  const startTime = Date.now();
  
  try {
    logInfo('Processing business intake form', { 
      company: formData.companyName,
      industry: formData.industry 
    });
    
    // Validate required fields
    const validation = validateFormData(formData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        message: 'Form validation failed - please correct the highlighted fields'
      };
    }
    
    // Clean and normalize data
    const cleanedData = cleanFormData(formData);
    
    // Save to database
    const leadId = await saveLeadToDatabase(cleanedData);
    
    // Determine next steps based on business profile (simple qualification)
    const qualification = qualifyLead(cleanedData);
    
    const result = {
      success: true,
      leadId: leadId,
      qualification: qualification,
      nextSteps: getRecommendedNextSteps(qualification),
      processedAt: new Date().toISOString()
    };
    
    logPerformance('business-intake-processing', Date.now() - startTime, { 
      leadId: leadId,
      qualification: qualification.level 
    });
    
    return result;
    
  } catch (error) {
    logError('Business intake processing failed', error, formData);
    
    return {
      success: false,
      message: 'Form processing failed - please try again or contact support',
      error: true
    };
  }
}

/**
 * Validate form data - pure validation logic, no fabrication
 */
function validateFormData(formData) {
  const errors = [];
  
  // Required field validation
  if (!formData.companyName || formData.companyName.trim().length < 2) {
    errors.push('Company name is required (minimum 2 characters)');
  }
  
  if (!formData.industry) {
    errors.push('Industry selection is required');
  }
  
  if (!formData.primaryOrigin) {
    errors.push('Primary import origin is required');
  }
  
  if (!formData.annualVolume || formData.annualVolume <= 0) {
    errors.push('Annual import volume must be greater than zero');
  }
  
  if (!formData.contactEmail || !isValidEmail(formData.contactEmail)) {
    errors.push('Valid email address is required');
  }
  
  if (!formData.contactName || formData.contactName.trim().length < 2) {
    errors.push('Contact name is required (minimum 2 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Clean and normalize form data
 */
function cleanFormData(formData) {
  return {
    companyName: formData.companyName.trim(),
    industry: formData.industry,
    primaryOrigin: formData.primaryOrigin,
    annualVolume: parseFloat(formData.annualVolume),
    contactEmail: formData.contactEmail.toLowerCase().trim(),
    contactName: formData.contactName.trim(),
    submissionSource: 'foundation-form',
    submittedAt: new Date().toISOString(),
    ipAddress: formData.ipAddress || null,
    userAgent: formData.userAgent || null
  };
}

/**
 * Save lead to database
 */
async function saveLeadToDatabase(cleanedData) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('leads')
    .insert([cleanedData])
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Simple lead qualification based on actual form data
 * NO FABRICATED SCORES - Real business criteria only
 */
function qualifyLead(leadData) {
  let qualificationLevel = 'standard';
  let qualificationReasons = [];
  
  // Volume-based qualification (simple thresholds)
  if (leadData.annualVolume >= 10000000) {
    qualificationLevel = 'enterprise';
    qualificationReasons.push('High volume imports ($10M+ annually)');
  } else if (leadData.annualVolume >= 1000000) {
    qualificationLevel = 'commercial';
    qualificationReasons.push('Commercial volume imports ($1M+ annually)');
  }
  
  // Origin-based qualification (triangle routing potential)
  const highPotentialOrigins = ['CN', 'IN', 'VN', 'TH', 'MY'];
  if (highPotentialOrigins.includes(leadData.primaryOrigin)) {
    qualificationReasons.push('Origin country with triangle routing potential');
  }
  
  // Industry-based qualification
  const manufacturingIndustries = [
    'electronics', 'automotive', 'textiles', 'machinery', 
    'consumer-goods', 'industrial-equipment'
  ];
  if (manufacturingIndustries.includes(leadData.industry)) {
    qualificationReasons.push('Manufacturing industry with complex supply chains');
  }
  
  return {
    level: qualificationLevel,
    reasons: qualificationReasons,
    volumeCategory: getVolumeCategory(leadData.annualVolume),
    trianglePotential: highPotentialOrigins.includes(leadData.primaryOrigin)
  };
}

/**
 * Get volume category for business classification
 */
function getVolumeCategory(volume) {
  if (volume >= 10000000) return 'enterprise';
  if (volume >= 1000000) return 'commercial';  
  if (volume >= 100000) return 'small-business';
  return 'startup';
}

/**
 * Get recommended next steps based on qualification
 */
function getRecommendedNextSteps(qualification) {
  const baseSteps = [
    'Complete product classification analysis',
    'Review triangle routing opportunities',
    'Schedule consultation with trade specialist'
  ];
  
  if (qualification.level === 'enterprise') {
    return [
      'Priority enterprise consultation scheduling',
      'Custom trade route analysis',
      'Executive presentation preparation',
      ...baseSteps
    ];
  }
  
  if (qualification.level === 'commercial') {
    return [
      'Commercial route optimization analysis',
      'Partnership ecosystem review', 
      ...baseSteps
    ];
  }
  
  return baseSteps;
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get lead statistics from database (actual data only)
 */
export async function getLeadStatistics() {
  const supabase = getSupabaseClient();
  
  try {
    // Get actual lead counts by qualification level
    const { data: leads, error } = await supabase
      .from('leads')
      .select('industry, primary_origin, annual_volume, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(1000);
    
    if (error) throw error;
    
    // Calculate real statistics from actual data
    const stats = {
      totalLeads: leads.length,
      byIndustry: {},
      byOrigin: {},
      byVolumeCategory: {},
      recentLeads: leads.slice(0, 10),
      calculatedAt: new Date().toISOString(),
      dataSource: 'Actual database records - no fabrication'
    };
    
    // Count by industry
    leads.forEach(lead => {
      stats.byIndustry[lead.industry] = (stats.byIndustry[lead.industry] || 0) + 1;
      stats.byOrigin[lead.primary_origin] = (stats.byOrigin[lead.primary_origin] || 0) + 1;
      
      const volumeCategory = getVolumeCategory(lead.annual_volume);
      stats.byVolumeCategory[volumeCategory] = (stats.byVolumeCategory[volumeCategory] || 0) + 1;
    });
    
    return stats;
    
  } catch (error) {
    logError('Failed to get lead statistics', error);
    return {
      error: true,
      message: 'Unable to retrieve lead statistics',
      dataSource: 'Database query failed'
    };
  }
}