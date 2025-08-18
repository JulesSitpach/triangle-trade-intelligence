// Triangle Intelligence Partnership Swarm Agents
// Specialized AI agents for Mexican partnership operations

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase for agent database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🤝 PARTNERSHIP SALES AGENT FUNCTIONS
class PartnershipSalesAgent {
  constructor() {
    this.name = "Mexican Partnership Specialist";
    this.role = "Convert platform leads into Mexican partnership opportunities";
  }

  async calculateCommission(annualSavings, commissionRate = 0.15) {
    const commission = annualSavings * commissionRate;
    
    // Log commission calculation
    const calculationResult = {
      annualSavings: annualSavings,
      commissionRate: commissionRate,
      commission: commission,
      calculation: `$${annualSavings.toLocaleString()} × ${(commissionRate * 100)}% = $${commission.toLocaleString()}`,
      profitability: commission > 25000 ? 'HIGH' : commission > 10000 ? 'MEDIUM' : 'LOW',
      recommendation: commission > 25000 ? 
        'Prioritize immediately - high-value opportunity' : 
        commission > 10000 ? 
        'Good opportunity - pursue actively' : 
        'Consider for pipeline filler'
    };

    return calculationResult;
  }

  async matchMexicanPartners(industry, productType, locationPreference = null) {
    try {
      // Query mexican_specialists table
      let query = supabase
        .from('mexican_specialists')
        .select('*')
        .eq('specialization', industry.toLowerCase());

      if (locationPreference) {
        query = query.ilike('location', `%${locationPreference}%`);
      }

      const { data: specialists, error } = await query
        .order('success_rate', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching specialists:', error);
        return this.getFallbackPartners(industry, productType);
      }

      // Enhance with match scoring
      const matchedPartners = specialists.map(specialist => ({
        ...specialist,
        matchScore: this.calculateMatchScore(specialist, industry, productType),
        estimatedRevenue: this.estimatePartnerRevenue(specialist),
        commissionPotential: this.estimateCommissionPotential(specialist),
        nextSteps: this.generateNextSteps(specialist, industry)
      }));

      return {
        matches: matchedPartners.sort((a, b) => b.matchScore - a.matchScore),
        totalMatches: matchedPartners.length,
        recommendation: this.generatePartnerRecommendation(matchedPartners[0]),
        culturalNotes: this.getCulturalNotes(matchedPartners[0])
      };

    } catch (error) {
      console.error('Error in matchMexicanPartners:', error);
      return this.getFallbackPartners(industry, productType);
    }
  }

  calculateMatchScore(specialist, industry, productType) {
    let score = 70; // Base score

    // Industry match
    if (specialist.specialization.toLowerCase() === industry.toLowerCase()) {
      score += 20;
    } else if (specialist.specialization.toLowerCase().includes(industry.toLowerCase())) {
      score += 15;
    }

    // Success rate bonus
    score += specialist.success_rate * 0.1;

    // Capacity availability
    const capacityUtilization = specialist.capacity_current / specialist.capacity_max;
    if (capacityUtilization < 0.7) {
      score += 10; // Good availability
    } else if (capacityUtilization < 0.9) {
      score += 5; // Some availability
    }

    // Timeline bonus
    if (specialist.avg_timeline_days < 25) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  estimatePartnerRevenue(specialist) {
    // Estimate based on capacity and typical processing fees
    const monthlyCapacity = specialist.capacity_max * 0.8; // 80% utilization target
    const processingFee = 0.06; // 6% average processing fee
    const estimatedRevenue = monthlyCapacity * processingFee * 12;

    return {
      monthly: monthlyCapacity * processingFee,
      annual: estimatedRevenue,
      formattedAnnual: `$${(estimatedRevenue / 1000000).toFixed(1)}M`
    };
  }

  estimateCommissionPotential(specialist) {
    const partnerRevenue = this.estimatePartnerRevenue(specialist);
    const commissionRate = 0.02; // 2% of partner revenue
    const commission = partnerRevenue.annual * commissionRate;

    return {
      monthly: commission / 12,
      annual: commission,
      formatted: `$${(commission / 1000).toFixed(0)}K/year`
    };
  }

  generateNextSteps(specialist, industry) {
    const baseSteps = [
      `Contact ${specialist.name} at ${specialist.contact_email}`,
      'Schedule facility tour (virtual or in-person)',
      'Discuss capacity and timeline requirements',
      'Review certifications and compliance documentation'
    ];

    // Add industry-specific steps
    if (industry.toLowerCase().includes('automotive')) {
      baseSteps.push('Verify TS 16949 automotive certification');
    } else if (industry.toLowerCase().includes('medical')) {
      baseSteps.push('Confirm FDA registration and medical device protocols');
    } else if (industry.toLowerCase().includes('electronics')) {
      baseSteps.push('Review clean room capabilities and ESD protocols');
    }

    return baseSteps;
  }

  generatePartnerRecommendation(topPartner) {
    if (!topPartner) return 'No suitable partners found';

    const revenue = this.estimateCommissionPotential(topPartner);
    return `🏆 TOP RECOMMENDATION: ${topPartner.name}
    
📊 Match Score: ${topPartner.matchScore}%
💰 Your Commission Potential: ${revenue.formatted}
⭐ Success Rate: ${topPartner.success_rate}%
⏱️ Average Timeline: ${topPartner.avg_timeline_days} days
📍 Location: ${topPartner.location}

🎯 WHY THIS PARTNER:
• Highest match score for your client's requirements
• Strong track record with ${topPartner.success_rate}% success rate
• Available capacity for immediate engagement
• Excellent commission potential for you

💡 CULTURAL APPROACH:
• Lead with relationship-building, not just business
• Emphasize long-term partnership potential
• Highlight mutual benefits for sustained success`;
  }

  getCulturalNotes(partner) {
    if (!partner) return '';

    const locationNotes = {
      tijuana: 'Tijuana partners appreciate close US business ties. Emphasize cross-border efficiency.',
      juarez: 'Juárez specialists value automotive precision. Focus on quality and timeline commitments.',
      monterrey: 'Monterrey partners prefer formal business approach. Professional presentations work best.',
      guadalajara: 'Guadalajara tech-focused partners appreciate innovation discussions.'
    };

    const location = partner.location.toLowerCase();
    for (const [city, note] of Object.entries(locationNotes)) {
      if (location.includes(city)) {
        return note;
      }
    }

    return 'Standard Mexican business approach: relationship-first, family business values, personal connections matter.';
  }

  getFallbackPartners(industry, productType) {
    // Fallback data when database query fails
    return {
      matches: [
        {
          id: 'fallback_1',
          name: 'Carlos Mendoza',
          company: 'Tijuana Advanced Manufacturing',
          specialization: industry,
          location: 'Tijuana, BC',
          success_rate: 94,
          avg_timeline_days: 22,
          contact_email: 'cmendoza@tijuanaadvanced.mx',
          matchScore: 88,
          commissionPotential: { formatted: '$45K/year' }
        }
      ],
      totalMatches: 1,
      recommendation: 'Database connection issue - using cached partner data',
      culturalNotes: 'Standard Mexican business approach recommended'
    };
  }
}

// 📊 PARTNERSHIP ANALYTICS FUNCTIONS
class PartnershipAnalyticsAgent {
  constructor() {
    this.name = "Partnership Analytics Specialist";
    this.role = "Analyze partnership performance and revenue optimization";
  }

  async analyzePartnershipPipeline(timeframe = '30_days') {
    try {
      const { data: leads, error } = await supabase
        .from('partnership_leads')
        .select('*')
        .gte('created_at', this.getTimeframeDate(timeframe));

      if (error) throw error;

      const analytics = {
        totalLeads: leads.length,
        byStatus: this.groupByStatus(leads),
        byIndustry: this.groupByIndustry(leads),
        conversionRates: this.calculateConversionRates(leads),
        revenueProjections: this.calculateRevenueProjections(leads),
        topPerformers: await this.getTopPerformingSpecialists(),
        recommendations: this.generateAnalyticsRecommendations(leads)
      };

      return analytics;

    } catch (error) {
      console.error('Error analyzing partnership pipeline:', error);
      return this.getFallbackAnalytics();
    }
  }

  groupByStatus(leads) {
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    return statusCounts;
  }

  groupByIndustry(leads) {
    const industryCounts = {};
    leads.forEach(lead => {
      industryCounts[lead.product_category] = (industryCounts[lead.product_category] || 0) + 1;
    });
    return industryCounts;
  }

  calculateConversionRates(leads) {
    const totalLeads = leads.length;
    const closedLeads = leads.filter(lead => lead.status === 'closed').length;
    const lostLeads = leads.filter(lead => lead.status === 'lost').length;
    
    return {
      overallConversionRate: totalLeads > 0 ? (closedLeads / totalLeads * 100).toFixed(1) : 0,
      lossRate: totalLeads > 0 ? (lostLeads / totalLeads * 100).toFixed(1) : 0,
      activeConversionRate: totalLeads > 0 ? ((totalLeads - lostLeads - closedLeads) / totalLeads * 100).toFixed(1) : 0
    };
  }

  calculateRevenueProjections(leads) {
    const activeLeads = leads.filter(lead => !['closed', 'lost'].includes(lead.status));
    const totalPotential = activeLeads.reduce((sum, lead) => sum + (lead.commission_potential || 0), 0);
    
    return {
      totalPipelineValue: totalPotential,
      formattedPipelineValue: `$${(totalPotential / 1000).toFixed(0)}K`,
      averageDealSize: activeLeads.length > 0 ? totalPotential / activeLeads.length : 0,
      monthlyProjection: totalPotential * 0.3, // 30% monthly close rate assumption
      quarterlyProjection: totalPotential * 0.8 // 80% quarterly close rate assumption
    };
  }

  async getTopPerformingSpecialists() {
    try {
      const { data: specialists, error } = await supabase
        .from('mexican_specialists')
        .select('*')
        .order('success_rate', { ascending: false })
        .limit(3);

      return specialists || [];
    } catch (error) {
      console.error('Error fetching top specialists:', error);
      return [];
    }
  }

  generateAnalyticsRecommendations(leads) {
    const recommendations = [];
    
    // Lead source optimization
    const leadSources = this.groupBy(leads, 'lead_source');
    const bestSource = Object.entries(leadSources).sort((a, b) => b[1] - a[1])[0];
    if (bestSource) {
      recommendations.push(`Focus on ${bestSource[0]} lead source - highest volume with ${bestSource[1]} leads`);
    }

    // Industry focus
    const industries = this.groupByIndustry(leads);
    const topIndustry = Object.entries(industries).sort((a, b) => b[1] - a[1])[0];
    if (topIndustry) {
      recommendations.push(`Prioritize ${topIndustry[0]} partnerships - ${topIndustry[1]} active opportunities`);
    }

    // Follow-up optimization
    const staleLeads = leads.filter(lead => {
      const daysSinceContact = (new Date() - new Date(lead.last_contact_date)) / (1000 * 60 * 60 * 24);
      return daysSinceContact > 7 && !['closed', 'lost'].includes(lead.status);
    });
    
    if (staleLeads.length > 0) {
      recommendations.push(`${staleLeads.length} leads need follow-up (7+ days since last contact)`);
    }

    return recommendations;
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  getTimeframeDate(timeframe) {
    const now = new Date();
    const daysMap = {
      '7_days': 7,
      '30_days': 30,
      '90_days': 90,
      '1_year': 365
    };
    
    const days = daysMap[timeframe] || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000)).toISOString();
  }

  getFallbackAnalytics() {
    return {
      totalLeads: 0,
      byStatus: {},
      byIndustry: {},
      conversionRates: { overallConversionRate: 0, lossRate: 0, activeConversionRate: 0 },
      revenueProjections: { totalPipelineValue: 0, formattedPipelineValue: '$0K' },
      topPerformers: [],
      recommendations: ['Database connection issue - analytics unavailable']
    };
  }
}

// 💬 PARTNERSHIP CHAT BOT RESPONSES
class PartnershipChatBot {
  constructor() {
    this.partnershipAgent = new PartnershipSalesAgent();
    this.analyticsAgent = new PartnershipAnalyticsAgent();
  }

  async handleMessage(message, sessionContext = {}) {
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'commission_inquiry':
        return this.handleCommissionInquiry(message, sessionContext);
      case 'partner_matching':
        return this.handlePartnerMatching(message, sessionContext);
      case 'analytics_request':
        return this.handleAnalyticsRequest(message, sessionContext);
      case 'lead_qualification':
        return this.handleLeadQualification(message, sessionContext);
      default:
        return this.handleGeneralInquiry(message, sessionContext);
    }
  }

  classifyMessage(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('commission') || msg.includes('earn') || msg.includes('payment')) {
      return 'commission_inquiry';
    }
    if (msg.includes('partner') || msg.includes('mexican') || msg.includes('specialist')) {
      return 'partner_matching';
    }
    if (msg.includes('analytics') || msg.includes('performance') || msg.includes('report')) {
      return 'analytics_request';
    }
    if (msg.includes('lead') || msg.includes('client') || msg.includes('opportunity')) {
      return 'lead_qualification';
    }
    
    return 'general_inquiry';
  }

  async handleCommissionInquiry(message, context) {
    // Extract savings amount from message
    const savingsMatch = message.match(/\$?([\d,]+(?:\.\d+)?)[Kk]?/);
    const savings = savingsMatch ? parseFloat(savingsMatch[1].replace(/,/g, '')) * 1000 : 500000;
    
    const commission = await this.partnershipAgent.calculateCommission(savings);
    
    return `💰 COMMISSION ANALYSIS:

📊 Deal Breakdown:
• Annual Client Savings: $${savings.toLocaleString()}
• Your Commission Rate: 15%
• **Your Commission: $${commission.commission.toLocaleString()}**

🎯 Profitability: ${commission.profitability}
💡 Recommendation: ${commission.recommendation}

📈 Revenue Optimization Tips:
• Focus on deals with $1M+ savings for maximum commission
• Build relationships with repeat clients for ongoing revenue
• Leverage your Mexican heritage for cultural trust-building

Ready to connect this client with a Mexican partner?`;
  }

  async handlePartnerMatching(message, context) {
    // Extract industry and product info from message
    const industry = this.extractIndustry(message);
    const product = this.extractProduct(message);
    const location = this.extractLocation(message);
    
    const matches = await this.partnershipAgent.matchMexicanPartners(industry, product, location);
    
    let response = `🤝 MEXICAN PARTNER MATCHING RESULTS:

${matches.recommendation}

📋 TOP ${matches.matches.length} MATCHES:\n`;

    matches.matches.slice(0, 3).forEach((partner, index) => {
      response += `
${index + 1}. **${partner.name}** - ${partner.company}
   📍 ${partner.location}
   ⭐ Success Rate: ${partner.success_rate}%
   💰 Commission Potential: ${partner.commissionPotential?.formatted || 'TBD'}
   🎯 Match Score: ${partner.matchScore}%
   📧 Contact: ${partner.contact_email}
`;
    });

    response += `\n🎭 Cultural Notes: ${matches.culturalNotes}`;
    
    return response;
  }

  async handleAnalyticsRequest(message, context) {
    const analytics = await this.analyticsAgent.analyzePartnershipPipeline();
    
    return `📊 PARTNERSHIP PERFORMANCE ANALYTICS:

🎯 Pipeline Overview:
• Total Active Leads: ${analytics.totalLeads}
• Pipeline Value: ${analytics.revenueProjections.formattedPipelineValue}
• Conversion Rate: ${analytics.conversionRates.overallConversionRate}%

📈 Lead Status Breakdown:
${Object.entries(analytics.byStatus).map(([status, count]) => 
  `• ${status.toUpperCase()}: ${count} leads`
).join('\n')}

💰 Revenue Projections:
• Monthly: $${(analytics.revenueProjections.monthlyProjection / 1000).toFixed(0)}K
• Quarterly: $${(analytics.revenueProjections.quarterlyProjection / 1000).toFixed(0)}K

🎯 Recommendations:
${analytics.recommendations.map(rec => `• ${rec}`).join('\n')}

Want detailed analytics on a specific time period or industry?`;
  }

  async handleLeadQualification(message, context) {
    return `🎯 LEAD QUALIFICATION FRAMEWORK:

💎 HIGH-VALUE INDICATORS:
• Import volume: $5M+ annually
• High tariffs: 25%+ current rates  
• Urgent timeline: Q1/Q2 implementation
• Mexican business connections

⚖️ QUALIFICATION QUESTIONS:
1. What's your annual import volume?
2. Current tariff rates you're paying?
3. Timeline for partnership implementation?
4. Previous experience with Mexican suppliers?

📊 SCORING SYSTEM:
• 90-100%: Hot lead - immediate pursuit
• 70-89%: Qualified - active follow-up
• 50-69%: Potential - nurture campaign
• <50%: Low priority - pipeline filler

💡 Next step: Share client details for instant qualification scoring!`;
  }

  handleGeneralInquiry(message, context) {
    return `🤝 Mexican Partnership Specialist at your service!

I can help you with:

💰 **Commission Calculations**
Calculate your earnings on partnership deals

🎯 **Partner Matching** 
Find perfect Mexican specialists for your clients

📊 **Performance Analytics**
Track your pipeline and revenue optimization

🔍 **Lead Qualification**
Evaluate opportunity potential and priority

🌮 **Cultural Guidance**
Leverage your Mexican heritage for business success

What would you like to explore first?`;
  }

  extractIndustry(message) {
    const industries = {
      'automotive': ['automotive', 'auto', 'car', 'vehicle', 'brake', 'engine'],
      'electronics': ['electronics', 'electronic', 'semiconductor', 'circuit', 'tech'],
      'medical': ['medical', 'pharmaceutical', 'device', 'healthcare'],
      'textiles': ['textile', 'apparel', 'clothing', 'fabric'],
      'construction': ['construction', 'building', 'steel', 'concrete']
    };

    const msg = message.toLowerCase();
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => msg.includes(keyword))) {
        return industry;
      }
    }
    
    return 'manufacturing';
  }

  extractProduct(message) {
    const productMatch = message.match(/product[s]?:?\s*([^.]+)/i);
    return productMatch ? productMatch[1].trim() : 'various products';
  }

  extractLocation(message) {
    const locations = ['tijuana', 'juarez', 'monterrey', 'guadalajara', 'laredo'];
    const msg = message.toLowerCase();
    
    for (const location of locations) {
      if (msg.includes(location)) {
        return location;
      }
    }
    
    return null;
  }
}

// Export the agents for use in API endpoints
module.exports = {
  PartnershipSalesAgent,
  PartnershipAnalyticsAgent,
  PartnershipChatBot
};