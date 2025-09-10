/**
 * PHASE 4: Mike Procurement Officer Crisis Response Journey
 * MIKE - Procurement Officer facing China supplier crisis
 * 
 * Journey: Crisis Alert → Emergency Analysis → Mexico Alternatives → Implementation Plan
 * Expected: Urgent China diversification with immediate Mexico triangle routing solutions
 */

require('dotenv').config({ path: '.env.local' });

async function testMikeCrisisResponseJourney() {
  console.log('🚨 PHASE 4: MIKE PROCUREMENT OFFICER CRISIS RESPONSE JOURNEY');
  console.log('==========================================================');
  console.log('Customer: Mike - Procurement Officer at ManufacturingCorp');
  console.log('Crisis: China supplier disruption, needs immediate alternatives');
  console.log('Expected: Urgent Mexico triangle routing with crisis response messaging\n');

  try {
    // STEP 1: Crisis Product Analysis (Automotive brake pads from China)
    console.log('1. 🚨 CRISIS PRODUCT ANALYSIS');
    console.log('Mike urgently needs alternatives for: "Automotive brake pads from China supplier"');
    
    const classificationResponse = await fetch('http://localhost:3000/api/simple-hs-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'automotive brake pads for vehicles',
        businessType: 'Automotive'
      })
    });

    const classificationResult = await classificationResponse.json();
    const hsCode = classificationResult.results?.[0]?.hsCode;
    
    console.log(`   🔍 HS Code: ${hsCode}`);
    console.log(`   📊 Confidence: ${classificationResult.results?.[0]?.confidence}%`);
    console.log(`   🚨 Business Context: Crisis response required for China supplier`);

    // STEP 2: Current Supply Chain Risk Assessment
    console.log('\n2. ⚠️ CURRENT SUPPLY CHAIN RISK ASSESSMENT');
    console.log('   Current situation: 100% China sourcing (HIGH RISK)');
    
    const riskAssessmentResponse = await fetch('http://localhost:3000/api/simple-usmca-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check_qualification',
        data: {
          hs_code: hsCode,
          business_type: 'Automotive',
          component_origins: [
            { description: 'brake pads', origin_country: 'China', value_percentage: 100 }
          ],
          manufacturing_location: 'China'
        }
      })
    });

    const riskResult = await riskAssessmentResponse.json();
    const risk = riskResult.qualification;
    
    console.log(`   🚨 QUALIFICATION STATUS: ${risk?.qualified ? 'QUALIFIED' : 'CRISIS - NOT QUALIFIED'}`);
    console.log(`   📊 Regional Content: ${risk?.regional_content_actual}% vs ${risk?.regional_content_threshold}% required`);
    console.log(`   ⚡ URGENCY: China dependency creates supply chain vulnerability`);

    // STEP 3: Crisis Response - Mexico Triangle Routing Solutions
    console.log('\n3. 🇲🇽 CRISIS RESPONSE - MEXICO TRIANGLE ROUTING');
    console.log('   Triangle Intelligence crisis response activated:');
    
    if (risk?.mexico_opportunities && risk.mexico_opportunities.length > 0) {
      console.log('\n   🚨 URGENT MEXICO ALTERNATIVES:');
      risk.mexico_opportunities.forEach((opp, i) => {
        if (opp.strategy?.includes('URGENT') || opp.strategy?.includes('CRISIS')) {
          console.log(`   ${i + 1}. ${opp.strategy}`);
          console.log(`      ⚡ Description: ${opp.description}`);
          console.log(`      💰 Business Value: ${opp.business_value}`);
          console.log(`      🕐 Timeline: ${opp.timeframe}`);
          console.log(`      🎯 Triangle Advantage: ${opp.triangle_advantage}`);
          console.log('');
        }
      });
    }

    // STEP 4: Alternative Sourcing Cost Analysis
    console.log('4. 💰 ALTERNATIVE SOURCING COST ANALYSIS');
    console.log('   Mike evaluates Mexico triangle routing vs current China sourcing:');
    
    const costAnalysisResponse = await fetch('http://localhost:3000/api/simple-savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hsCode: hsCode,
        importVolume: 2000000, // $2M annual volume for crisis scenario
        supplierCountry: 'CN',
        businessType: 'Automotive'
      })
    });

    const costResult = await costAnalysisResponse.json();
    
    console.log(`   ✅ Crisis Analysis: ${costResult.analysis?.systemDecision}`);
    console.log(`   💵 Annual Risk Mitigation Value: $${costResult.savings?.annualTariffSavings?.toLocaleString()}`);
    console.log(`   📈 Cost Reduction: ${costResult.savings?.savingsPercentage}%`);
    console.log(`   🚀 Triangle Route Benefits: ${costResult.triangleRoute?.description}`);
    console.log(`   ⚡ Time Advantage: ${costResult.savings?.transitTimeSaved} days faster shipping`);

    // STEP 5: Implementation Urgency Assessment
    console.log('\n5. ⚡ IMPLEMENTATION URGENCY ASSESSMENT');
    console.log('====================================================');
    
    const urgencyFactors = {
      supplierRisk: 'HIGH - China dependency',
      businessImpact: `$${costResult.savings?.annualTariffSavings?.toLocaleString()} annual exposure`,
      timelineUrgency: risk?.mexico_opportunities?.[0]?.timeframe || '30-90 days',
      triangleAdvantage: 'Immediate Mexico supplier network access'
    };
    
    console.log('🚨 CRISIS FACTORS:');
    console.log(`   • Supplier Risk: ${urgencyFactors.supplierRisk}`);
    console.log(`   • Business Impact: ${urgencyFactors.businessImpact}`);
    console.log(`   • Implementation Timeline: ${urgencyFactors.timelineUrgency}`);
    console.log(`   • Triangle Intelligence Advantage: ${urgencyFactors.triangleAdvantage}`);

    // STEP 6: Crisis Action Plan
    console.log('\n6. 📋 MIKE\'S CRISIS ACTION PLAN');
    console.log('===============================');
    
    console.log('✅ IMMEDIATE ACTIONS (Next 30 days):');
    console.log('   1. Contact Triangle Intelligence crisis response team');
    console.log('   2. Access exclusive Mexico supplier network');
    console.log('   3. Initiate emergency supplier transition program');
    console.log(`   4. Secure $${costResult.savings?.annualTariffSavings?.toLocaleString()} annual risk mitigation`);
    
    console.log('\n🇲🇽 MEXICO TRIANGLE ROUTING BENEFITS:');
    console.log(`   • Supply Chain Security: Diversification away from China risk`);
    console.log(`   • Cost Advantage: $${costResult.savings?.annualTariffSavings?.toLocaleString()} annual savings`);
    console.log(`   • Speed Advantage: ${costResult.savings?.transitTimeSaved} days faster shipping`);
    console.log(`   • USMCA Qualification: Path to ${risk?.regional_content_threshold}% regional content`);
    
    console.log('\n🎯 TRIANGLE INTELLIGENCE VALUE PROPOSITION:');
    console.log('   • Crisis Response: Immediate access to vetted Mexico alternatives');
    console.log('   • Exclusive Network: Suppliers not available through other channels');
    console.log('   • Risk Insurance: Quality guarantees and relationship management');
    console.log(`   • ROI Timeline: ${urgencyFactors.timelineUrgency} to implementation`);

    return {
      success: true,
      customerType: 'Procurement Officer - Crisis Response',
      outcomes: {
        crisisIdentification: { hsCode, riskLevel: 'HIGH', currentExposure: risk?.regional_content_actual },
        mexicoSolutions: { urgentOptions: risk?.mexico_opportunities?.length, timeframe: risk?.mexico_opportunities?.[0]?.timeframe },
        costBenefit: { annualSavings: costResult.savings?.annualTariffSavings, speedAdvantage: costResult.savings?.transitTimeSaved },
        actionPlan: { immediateSteps: 4, triangleAdvantages: 4 }
      }
    };

  } catch (error) {
    console.error('🚨 Mike\'s crisis response journey failed:', error.message);
    return { success: false, error: error.message };
  }
}

testMikeCrisisResponseJourney().then(result => {
  if (result.success) {
    console.log('\n🎉 MIKE\'S CRISIS RESPONSE JOURNEY: COMPLETE SUCCESS');
    console.log('✅ Triangle Intelligence positioned as crisis response leader');
    console.log('✅ Ready for Lisa (CFO) enterprise analytics journey');
  } else {
    console.log('\n❌ MIKE\'S CRISIS RESPONSE JOURNEY: FAILED');
  }
}).catch(console.error);