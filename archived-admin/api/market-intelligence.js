/**
 * ADMIN API: Market Intelligence Analytics
 * GET /api/admin/market-intelligence - Returns industry analysis and conversion rates
 * Database-driven market insights for Jorge's sales strategy
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query user profiles and workflow completions for market analysis
    let { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        industry,
        company_size,
        trade_volume,
        subscription_tier,
        workflow_completions,
        certificates_generated,
        total_savings,
        created_at
      `);

    // If no user data, use sample market intelligence
    if (usersError || !users || users.length === 0) {
      console.log('Using sample market intelligence data for demo');
      const sampleMarketData = [
        {
          industry: 'Electronics',
          conversionRate: 68,
          avgDealSize: 127000,
          activeProspects: 12,
          pipelineValue: 1524000,
          trend: 'up',
          trendPercent: 15
        },
        {
          industry: 'Automotive',
          conversionRate: 45,
          avgDealSize: 98000,
          activeProspects: 8,
          pipelineValue: 784000,
          trend: 'down',
          trendPercent: 8
        },
        {
          industry: 'Textiles',
          conversionRate: 52,
          avgDealSize: 67000,
          activeProspects: 5,
          pipelineValue: 335000,
          trend: 'stable',
          trendPercent: 0
        },
        {
          industry: 'Manufacturing',
          conversionRate: 58,
          avgDealSize: 89000,
          activeProspects: 7,
          pipelineValue: 623000,
          trend: 'up',
          trendPercent: 12
        }
      ];

      return res.status(200).json({
        industries: sampleMarketData,
        summary: {
          total_industries: sampleMarketData.length,
          total_pipeline_value: sampleMarketData.reduce((sum, i) => sum + i.pipelineValue, 0),
          avg_conversion_rate: 55.8,
          fastest_growing: 'Electronics'
        },
        data_status: {
          source: 'sample_data',
          table_exists: false,
          record_count: sampleMarketData.length
        }
      });
    }

    // Analyze users by industry
    const industryAnalysis = {};

    users.forEach(user => {
      const industry = user.industry || 'General';

      if (!industryAnalysis[industry]) {
        industryAnalysis[industry] = {
          totalUsers: 0,
          activeProspects: 0,
          totalDealValue: 0,
          conversions: 0,
          workflowCompletions: 0,
          certificates: 0,
          savings: 0
        };
      }

      const analysis = industryAnalysis[industry];
      analysis.totalUsers++;

      // Count as active prospect if they have workflow completions
      if (user.workflow_completions > 0) {
        analysis.activeProspects++;
        analysis.workflowCompletions += user.workflow_completions;
      }

      // Count as conversion if they have certificates
      if (user.certificates_generated > 0) {
        analysis.conversions++;
        analysis.certificates += user.certificates_generated;
      }

      // Estimate deal size based on trade volume
      const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
      if (tradeVolume > 0) {
        let dealSize = Math.floor(tradeVolume * 0.03); // 3% of trade volume
        if (dealSize < 25000) dealSize = 25000; // Minimum deal size
        if (dealSize > 500000) dealSize = 500000; // Maximum deal size

        analysis.totalDealValue += dealSize;
      }

      analysis.savings += user.total_savings || 0;
    });

    // Convert analysis to market intelligence format
    const industries = Object.entries(industryAnalysis).map(([industryName, data]) => {
      const conversionRate = data.activeProspects > 0
        ? Math.round((data.conversions / data.activeProspects) * 100)
        : 0;

      const avgDealSize = data.activeProspects > 0
        ? Math.round(data.totalDealValue / data.activeProspects)
        : 50000;

      const pipelineValue = data.totalDealValue;

      // Determine trend based on recent activity (simplified)
      let trend = 'stable';
      let trendPercent = 0;

      if (conversionRate > 60) {
        trend = 'up';
        trendPercent = Math.min(conversionRate - 50, 25);
      } else if (conversionRate < 40) {
        trend = 'down';
        trendPercent = Math.min(50 - conversionRate, 20);
      }

      return {
        industry: industryName,
        conversionRate: conversionRate,
        avgDealSize: avgDealSize,
        activeProspects: data.activeProspects,
        pipelineValue: pipelineValue,
        trend: trend,
        trendPercent: trendPercent
      };
    }).filter(industry => industry.activeProspects > 0); // Only show industries with prospects

    // Calculate summary metrics
    const totalPipelineValue = industries.reduce((sum, i) => sum + i.pipelineValue, 0);
    const avgConversionRate = industries.length > 0
      ? (industries.reduce((sum, i) => sum + i.conversionRate, 0) / industries.length).toFixed(1)
      : 0;

    const fastestGrowing = industries
      .filter(i => i.trend === 'up')
      .sort((a, b) => b.trendPercent - a.trendPercent)[0]?.industry || 'None';

    return res.status(200).json({
      industries: industries,
      summary: {
        total_industries: industries.length,
        total_pipeline_value: totalPipelineValue,
        avg_conversion_rate: parseFloat(avgConversionRate),
        fastest_growing: fastestGrowing
      },
      data_status: {
        source: 'database',
        table_exists: true,
        record_count: industries.length
      }
    });

  } catch (error) {
    console.error('Market intelligence API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}