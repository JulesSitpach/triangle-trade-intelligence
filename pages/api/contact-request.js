/**
 * CONTACT REQUEST API ENDPOINT
 * Handles enterprise demo requests and sales inquiries
 * Integrates with Supabase for lead tracking and follow-up
 */

import { createClient } from '@supabase/supabase-js'
import { logInfo, logError } from '../../lib/utils/production-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    firstName,
    lastName,
    email,
    company,
    title,
    phone,
    businessType,
    importVolume,
    primaryCountry,
    inquiryType,
    message,
    urgency,
    source,
    estimatedSavings
  } = req.body

  // Validate required fields
  if (!firstName || !lastName || !email || !company || !businessType || !importVolume) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['firstName', 'lastName', 'email', 'company', 'businessType', 'importVolume']
    })
  }

  try {
    logInfo('Processing enterprise contact request', {
      company,
      inquiryType,
      importVolume,
      businessType,
      source
    })

    // Save lead to enterprise_leads table
    const { data: leadData, error: leadError } = await supabase
      .from('enterprise_leads')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        title,
        phone,
        business_type: businessType,
        import_volume: importVolume,
        primary_country: primaryCountry,
        inquiry_type: inquiryType,
        message,
        urgency,
        source,
        estimated_savings: estimatedSavings,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()

    if (leadError) {
      logError('Error saving enterprise lead', { error: leadError })
      return res.status(500).json({ error: 'Failed to save lead information' })
    }

    // Calculate lead score based on profile
    const leadScore = calculateLeadScore({
      importVolume,
      businessType,
      urgency,
      inquiryType,
      title
    })

    // Update lead with calculated score
    if (leadData && leadData[0]) {
      await supabase
        .from('enterprise_leads')
        .update({ lead_score: leadScore })
        .eq('id', leadData[0].id)
    }

    // Send notification to sales team for high-value leads
    if (leadScore >= 80 || urgency === 'immediate') {
      await notifySalesTeam({
        lead: leadData[0],
        leadScore,
        estimatedSavings
      })
    }

    // Log successful lead capture
    logInfo('Enterprise lead captured successfully', {
      leadId: leadData[0]?.id,
      company,
      leadScore,
      estimatedSavings
    })

    res.status(200).json({
      success: true,
      message: 'Demo request received successfully',
      leadId: leadData[0]?.id,
      estimatedResponse: urgency === 'immediate' ? '4-6 hours' : '12-24 hours'
    })

  } catch (error) {
    logError('Contact request processing error', {
      error: error.message,
      company,
      email
    })

    res.status(500).json({
      error: 'Failed to process contact request',
      message: 'Please try again or contact us directly at enterprise@triangleintelligence.com'
    })
  }
}

function calculateLeadScore({ importVolume, businessType, urgency, inquiryType, title }) {
  let score = 0

  // Import volume scoring (40 points max)
  const volumeScores = {
    'Under $1M': 10,
    '$1M - $5M': 20,
    '$5M - $25M': 30,
    '$25M - $100M': 40,
    'Over $100M': 40
  }
  score += volumeScores[importVolume] || 0

  // Business type scoring (20 points max)
  const typeScores = {
    'Electronics & Technology': 20,
    'Automotive & Transportation': 18,
    'Manufacturing & Industrial': 16,
    'Medical & Healthcare': 15,
    'Consumer Goods': 12,
    'Textiles & Apparel': 10
  }
  score += typeScores[businessType] || 8

  // Urgency scoring (20 points max)
  const urgencyScores = {
    'immediate': 20,
    'fast': 15,
    'standard': 10
  }
  score += urgencyScores[urgency] || 10

  // Inquiry type scoring (10 points max)
  const inquiryScores = {
    'enterprise': 10,
    'consultation': 8,
    'demo': 6
  }
  score += inquiryScores[inquiryType] || 6

  // Title scoring (10 points max)
  const titleKeywords = ['ceo', 'cfo', 'coo', 'president', 'vp', 'director', 'head', 'chief']
  const titleLower = (title || '').toLowerCase()
  if (titleKeywords.some(keyword => titleLower.includes(keyword))) {
    score += 10
  } else if (titleLower.includes('manager')) {
    score += 5
  }

  return Math.min(score, 100)
}

async function notifySalesTeam({ lead, leadScore, estimatedSavings }) {
  try {
    // In production, this would send to Slack, email, or CRM
    logInfo('High-value lead notification', {
      leadId: lead.id,
      company: lead.company,
      leadScore,
      estimatedSavings,
      urgency: lead.urgency
    })

    // Save notification record
    await supabase
      .from('sales_notifications')
      .insert({
        lead_id: lead.id,
        notification_type: 'high_value_lead',
        priority: lead.urgency === 'immediate' ? 'urgent' : 'high',
        message: `High-value lead: ${lead.company} (${lead.import_volume}) - Score: ${leadScore}`,
        sent_at: new Date().toISOString()
      })

  } catch (error) {
    logError('Sales team notification failed', { error: error.message, leadId: lead.id })
  }
}