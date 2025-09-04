/**
 * SIMPLIFIED DATABASE-DRIVEN USMCA COMPLIANCE API
 * Working version without complex dependencies
 * Direct database queries only
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    switch (action) {
      case 'complete_workflow':
        return await handleCompleteWorkflow(data, res);
      
      case 'classify_product':
        return await handleProductClassification(data, res);
      
      case 'calculate_savings':
        return await handleSavingsCalculation(data, res);
      
      case 'health_check':
        return res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('USMCA API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function handleCompleteWorkflow(data, res) {
  try {
    // Step 1: Get HS code from user input or classify
    let hsCode = null;
    
    if (data.component_origins && data.component_origins.length > 0) {
      const componentWithHS = data.component_origins.find(comp => comp.hs_code);
      if (componentWithHS) {
        hsCode = componentWithHS.hs_code.replace(/[.\s-]/g, '');
      }
    }
    
    if (!hsCode && data.product_description) {
      const classificationResult = await classifyProductSimple(data.product_description);
      hsCode = classificationResult.hs_code;
    }

    if (!hsCode) {
      return res.json({
        success: false,
        error: 'Could not determine HS code',
        step: 'classification'
      });
    }

    // Step 2: Calculate savings
    const savingsResult = await calculateSavingsSimple(hsCode, data.trade_volume || 1000000);
    
    // Step 3: USMCA qualification (simplified)
    const qualified = savingsResult.usmca_rate < savingsResult.mfn_rate;
    
    return res.json({
      success: true,
      workflow_complete: true,
      results: {
        product: { hs_code: hsCode, description: data.product_description },
        usmca: { qualified },
        savings: savingsResult,
        company: {
          name: data.company_name,
          business_type: data.business_type,
          trade_volume: data.trade_volume
        }
      }
    });

  } catch (error) {
    console.error('Complete workflow error:', error);
    return res.json({
      success: false,
      error: 'Workflow failed',
      details: error.message
    });
  }
}

async function handleProductClassification(data, res) {
  try {
    const result = await classifyProductSimple(data.product_description);
    return res.json({ success: true, classification: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSavingsCalculation(data, res) {
  try {
    const result = await calculateSavingsSimple(data.hs_code, data.annual_import_value);
    return res.json({ success: true, savings: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function classifyProductSimple(productDescription) {
  const searchTerms = productDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .filter(word => word.length >= 3)
    .slice(0, 3);

  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .ilike('description', `%${term}%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        hs_code: data[0].hs_code,
        description: data[0].description,
        confidence: 80
      };
    }
  }

  throw new Error('Could not classify product');
}

async function calculateSavingsSimple(hsCode, tradeVolume) {
  const { data, error } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, mfn_rate, usmca_rate')
    .eq('hs_code', hsCode)
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error('HS code not found');
  }

  const record = data[0];
  const mfnRate = record.mfn_rate || 0;
  const usmcaRate = record.usmca_rate || 0;
  const savingsRate = Math.max(0, mfnRate - usmcaRate);
  const annualSavings = (tradeVolume * savingsRate) / 100;

  return {
    annual_savings: annualSavings,
    monthly_savings: annualSavings / 12,
    savings_percentage: savingsRate,
    mfn_rate: mfnRate,
    usmca_rate: usmcaRate
  };
}