/**
 * BUSINESS TEST FRAMEWORK
 * Validation functions for business outcome testing
 */

const BUSINESS_SCENARIOS = {
  electronics: {
    name: "Electronics Manufacturer (TechCorp)",
    context: "Smart speaker, 8 components, $10M imports, seeking $245K savings",
    customer_profile: "Sarah (Import Compliance Manager)",
    success_criteria: {
      time_to_complete: 30 * 60 * 1000, // 30 minutes in ms
      minimum_savings: 200000, // $200K minimum
      accuracy_confidence: 90, // 90%+ confidence
      professional_credibility: true
    }
  },
  
  automotive: {
    name: "Automotive Parts Importer (AutoDist)",
    context: "Brake assembly, $25M imports, complex supply chain, partial data progression",
    customer_profile: "Sarah + Procurement Team",
    success_criteria: {
      progressive_data_collection: true,
      qualification_transition: "55% → 72%",
      minimum_savings: 500000, // $500K minimum
      guided_workflow: true
    }
  },
  
  fashion: {
    name: "Fashion Retailer Supplier Switch",
    context: "Winter jacket, China→Mexico evaluation, real-time decision support",
    customer_profile: "Mike (Procurement Specialist)",
    success_criteria: {
      real_time_recalculation: true,
      different_results_china_vs_mexico: true,
      cost_benefit_clarity: "8% cost vs 11.2% savings",
      minimum_savings: 150000 // $150K minimum
    }
  }
};

const CUSTOMER_SUCCESS_CRITERIA = {
  sarah: {
    role: "Import Compliance Manager",
    success_metrics: {
      analysis_time: "< 30 minutes",
      accuracy_rate: "> 95%",
      audit_defensibility: "100%",
      workflow_completions: "> 80%"
    }
  },
  
  mike: {
    role: "Procurement Specialist", 
    success_metrics: {
      decision_confidence: "> 90%",
      total_landed_cost_visibility: "100%",
      sourcing_optimization: "> 15% cost reduction",
      strategic_decision_support: "100%"
    }
  },
  
  lisa: {
    role: "CFO/Finance Director",
    success_metrics: {
      forecasting_accuracy: "> 95%",
      savings_quantification: "100%",
      strategic_planning_support: "100%",
      roi_justification: "> $150K customer value"
    }
  }
};

function validateBusinessOutcome(validation) {
  const {
    customer,
    scenario,
    time_to_complete,
    accuracy_confidence,
    actionable_results,
    professional_credibility,
    total_landed_cost_clarity,
    strategic_sourcing_enabled,
    data_driven_decision_support,
    accurate_duty_forecasting,
    quantified_trade_savings,
    strategic_planning_support,
    guided_data_collection,
    partial_value_demonstration,
    clear_next_steps,
    qualification_transition,
    substantial_savings,
    supplier_strategy_impact,
    immediate_recalculation,
    clear_cost_benefit
  } = validation;

  const results = {
    customer,
    scenario,
    validation_results: [],
    overall_success: true
  };

  // Time validation (for Sarah scenarios)
  if (time_to_complete !== undefined) {
    const timeValid = time_to_complete < 30 * 60 * 1000; // 30 minutes
    results.validation_results.push({
      criterion: 'Analysis time < 30 minutes',
      result: timeValid,
      value: `${Math.round(time_to_complete / 1000 / 60)} minutes`
    });
    if (!timeValid) results.overall_success = false;
  }

  // Accuracy validation
  if (accuracy_confidence !== undefined) {
    const accuracyValid = accuracy_confidence >= 90;
    results.validation_results.push({
      criterion: 'Professional confidence level',
      result: accuracyValid,
      value: `${accuracy_confidence}% confidence`
    });
    if (!accuracyValid) results.overall_success = false;
  }

  // Actionability validation
  if (actionable_results !== undefined) {
    results.validation_results.push({
      criterion: 'Results are actionable for compliance',
      result: actionable_results,
      value: actionable_results ? 'Certificate eligible' : 'More data needed'
    });
    if (!actionable_results) results.overall_success = false;
  }

  // Professional credibility
  if (professional_credibility !== undefined) {
    results.validation_results.push({
      criterion: 'Professional credibility maintained',
      result: professional_credibility,
      value: professional_credibility ? 'Audit defensible' : 'Credibility concerns'
    });
    if (!professional_credibility) results.overall_success = false;
  }

  // Procurement decision support (Mike scenarios)
  if (total_landed_cost_clarity !== undefined) {
    results.validation_results.push({
      criterion: 'Total landed cost visibility',
      result: total_landed_cost_clarity,
      value: total_landed_cost_clarity ? 'Complete cost picture' : 'Missing cost factors'
    });
    if (!total_landed_cost_clarity) results.overall_success = false;
  }

  if (strategic_sourcing_enabled !== undefined) {
    results.validation_results.push({
      criterion: 'Strategic sourcing decision enabled',
      result: strategic_sourcing_enabled,
      value: strategic_sourcing_enabled ? 'Clear supplier comparison' : 'Unclear sourcing impact'
    });
    if (!strategic_sourcing_enabled) results.overall_success = false;
  }

  // Financial planning support (Lisa scenarios)
  if (accurate_duty_forecasting !== undefined) {
    results.validation_results.push({
      criterion: 'Accurate duty forecasting enabled',
      result: accurate_duty_forecasting,
      value: accurate_duty_forecasting ? 'Precise duty estimates' : 'Forecasting uncertainty'
    });
    if (!accurate_duty_forecasting) results.overall_success = false;
  }

  if (quantified_trade_savings !== undefined) {
    results.validation_results.push({
      criterion: 'Trade savings quantified for planning',
      result: quantified_trade_savings,
      value: quantified_trade_savings ? 'Concrete savings amounts' : 'Savings estimates unclear'
    });
    if (!quantified_trade_savings) results.overall_success = false;
  }

  // Progressive data collection (AutoDist scenarios)
  if (guided_data_collection !== undefined) {
    results.validation_results.push({
      criterion: 'Guided data collection workflow',
      result: guided_data_collection,
      value: guided_data_collection ? 'Clear data requirements' : 'Confusing data needs'
    });
    if (!guided_data_collection) results.overall_success = false;
  }

  if (partial_value_demonstration !== undefined) {
    results.validation_results.push({
      criterion: 'Value demonstrated with partial data',
      result: partial_value_demonstration,
      value: partial_value_demonstration ? 'Progressive enhancement working' : 'Requires complete data'
    });
    if (!partial_value_demonstration) results.overall_success = false;
  }

  // Real-time recalculation (Fashion retailer scenarios)
  if (immediate_recalculation !== undefined) {
    results.validation_results.push({
      criterion: 'Real-time supplier switch analysis',
      result: immediate_recalculation,
      value: immediate_recalculation ? 'Immediate result updates' : 'Delayed or static results'
    });
    if (!immediate_recalculation) results.overall_success = false;
  }

  if (clear_cost_benefit !== undefined) {
    results.validation_results.push({
      criterion: 'Clear cost-benefit trade-off analysis',
      result: clear_cost_benefit,
      value: clear_cost_benefit ? 'Transparent cost comparison' : 'Unclear financial impact'
    });
    if (!clear_cost_benefit) results.overall_success = false;
  }

  // Log validation results
  console.log(`\n🎯 BUSINESS VALIDATION: ${scenario}`);
  console.log(`Customer: ${customer}`);
  console.log(`Overall Success: ${results.overall_success ? '✅' : '❌'}\n`);
  
  results.validation_results.forEach(result => {
    const icon = result.result ? '✅' : '❌';
    console.log(`${icon} ${result.criterion}: ${result.value}`);
  });
  
  console.log(''); // Empty line for readability

  return results;
}

function validateCustomerJourney(stage, customerType, featureImpact) {
  const journeyValidation = {
    stage,
    customerType,
    featureImpact,
    success: true,
    issues: []
  };

  switch(stage) {
    case 'crisis_recognition':
      if (!featureImpact.value_proposition_clear) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Value proposition not immediately clear');
      }
      if (!featureImpact.pain_point_addressed) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Customer pain point not directly addressed');
      }
      break;

    case 'trial_evaluation':
      if (!featureImpact.quick_value_demonstration) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Cannot demonstrate value quickly in trial');
      }
      if (!featureImpact.professional_credibility) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Professional credibility concerns');
      }
      break;

    case 'implementation':
      if (!featureImpact.workflow_integration) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Does not integrate with existing workflows');
      }
      if (!featureImpact.scalable_value_delivery) {
        journeyValidation.success = false;
        journeyValidation.issues.push('Cannot scale across customer operations');
      }
      break;
  }

  return journeyValidation;
}

function validateBusinessMetrics(testResult, scenarioType) {
  const metrics = {
    scenario: scenarioType,
    customer_success_score: 0,
    business_success_score: 0,
    technical_excellence_score: 0,
    overall_score: 0
  };

  // Customer Success Metrics (40% weight)
  let customerScore = 0;
  if (testResult.accuracy_rate >= 95) customerScore += 25;
  if (testResult.processing_time_minutes <= 30) customerScore += 25;
  if (testResult.customer_savings >= 150000) customerScore += 25;
  if (testResult.professional_credibility) customerScore += 25;
  metrics.customer_success_score = customerScore;

  // Business Success Metrics (40% weight) 
  let businessScore = 0;
  if (testResult.trial_conversion_potential >= 0.25) businessScore += 25;
  if (testResult.retention_indicators >= 0.90) businessScore += 25;
  if (testResult.customer_satisfaction >= 50) businessScore += 25; // NPS
  if (testResult.customer_lifetime_value >= 150000) businessScore += 25;
  metrics.business_success_score = businessScore;

  // Technical Excellence Metrics (20% weight)
  let technicalScore = 0;
  if (testResult.response_time_ms <= 2000) technicalScore += 25;
  if (testResult.uptime_percentage >= 99.9) technicalScore += 25;
  if (testResult.support_tickets_per_100_workflows <= 5) technicalScore += 25;
  if (testResult.database_driven_accuracy) technicalScore += 25;
  metrics.technical_excellence_score = technicalScore;

  // Calculate overall score
  metrics.overall_score = (
    (metrics.customer_success_score * 0.4) +
    (metrics.business_success_score * 0.4) +
    (metrics.technical_excellence_score * 0.2)
  );

  return metrics;
}

module.exports = {
  BUSINESS_SCENARIOS,
  CUSTOMER_SUCCESS_CRITERIA,
  validateBusinessOutcome,
  validateCustomerJourney,
  validateBusinessMetrics
};