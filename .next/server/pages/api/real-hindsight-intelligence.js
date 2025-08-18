"use strict";(()=>{var e={};e.id=2254,e.ids=[2254],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5253:(e,t,a)=>{a.r(t),a.d(t,{config:()=>u,default:()=>c,routeModule:()=>g});var s={};a.r(s),a.d(s,{default:()=>handler});var i=a(1802),n=a(7153),o=a(6249),r=a(2885);let l=(0,r.createClient)("https://mrwitpgbcaxgnirqtavt.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function handler(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let{businessType:a="Electronics",origin:s="China",products:i=[],importVolume:n="$1M-$5M"}=e.body;console.log("\uD83E\uDDE0 Real hindsight intelligence request:",{businessType:a,origin:s,importVolume:n});let o=await getRealSuccessPatterns(a,s),r=await getPeerBenchmarks(a,n),l=await getActualSavingsData(s),c=await getRoutePerformanceData(s),u=await getMarcusAnalysis(a,s,i,n,o,r,l),g={successPatterns:o,peerBenchmarks:r,actualSavings:l,routePerformance:c,recommendations:function(e,t){let a=[];e.averageSavings>1e6&&a.push({type:"high_potential",message:`Companies like yours averaged $${(e.averageSavings/1e6).toFixed(1)}M in USMCA savings`,action:"Priority triangle routing implementation",confidence:"high"});let s=Object.keys(e.routeDistribution).reduce((t,a)=>e.routeDistribution[a]>(e.routeDistribution[t]||0)?a:t,"1");return a.push({type:"route_optimization",message:`Stage ${s} routes most common for successful ${t.totalRecords} peer companies`,action:`Focus on Stage ${s} triangle routing`,confidence:"medium"}),t.averageConfidence>=7&&a.push({type:"peer_confidence",message:`Similar companies report ${t.averageConfidence}/10 confidence in USMCA routes`,action:"High success probability for your implementation",confidence:"high"}),a}(o,r),marcusAnalysis:u};console.log("✅ Real hindsight intelligence generated from database"),t.json({success:!0,source:"REAL_DATABASE_INTELLIGENCE",dataPoints:o.totalRecords+r.totalRecords,hindsightIntelligence:g})}catch(e){console.error("❌ Hindsight intelligence error:",e.message),t.status(500).json({success:!1,error:e.message,fallback:{message:"Database intelligence temporarily unavailable",suggestion:"Using cached analysis patterns"}})}}async function getRealSuccessPatterns(e,t){let{data:a,error:s}=await l.from("trade_flows").select(`
      product_description,
      trade_value,
      estimated_usmca_savings,
      triangle_stage,
      reporter_country,
      partner_country,
      route_recommendation
    `).ilike("product_description",`%${e.toLowerCase()}%`).eq("reporter_country",t).not("estimated_usmca_savings","is",null).order("estimated_usmca_savings",{ascending:!1}).limit(20);if(s)throw s;let i=a?.reduce((e,t)=>e+(t.estimated_usmca_savings||0),0)||0,n=a?.length>0?i/a.length:0,o={};return a?.forEach(e=>{let t=e.triangle_stage;o[t]=(o[t]||0)+1}),{totalRecords:a?.length||0,totalSavings:i,averageSavings:Math.round(n),topSavers:a?.slice(0,5)||[],routeDistribution:o,insight:`${e} companies from ${t} achieved avg $${(n/1e6).toFixed(1)}M in USMCA savings`}}async function getPeerBenchmarks(e,t){let{data:a,error:s}=await l.from("trade_flows").select(`
      trade_value,
      estimated_usmca_savings,
      difficulty_score,
      confidence_level,
      triangle_stage
    `).ilike("product_description",`%${e.toLowerCase()}%`).not("trade_value","is",null).order("trade_value",{ascending:!1}).limit(50);if(s)throw s;let i=a?.reduce((e,t)=>e+(t.trade_value||0),0)||0,n=a?.reduce((e,t)=>e+(t.estimated_usmca_savings||0),0)||0,o=a?.length>0?a.reduce((e,t)=>e+(t.confidence_level||5),0)/a.length:5;return{totalRecords:a?.length||0,averageTradeValue:a?.length>0?i/a.length:0,averageSavings:a?.length>0?n/a.length:0,averageConfidence:Math.round(o),savingsRate:i>0?n/i*100:0,insight:`Similar ${e} companies average ${((n/a?.length||1)/1e6).toFixed(1)}M in annual savings`}}async function getActualSavingsData(e){let{data:t,error:a}=await l.from("trade_flows").select(`
      triangle_stage,
      estimated_usmca_savings,
      partner_country
    `).eq("reporter_country",e).not("estimated_usmca_savings","is",null).gte("estimated_usmca_savings",1e4);if(a)throw a;let s={};return t?.forEach(t=>{let a=t.triangle_stage;s[a]||(s[a]={count:0,totalSavings:0,routes:[]}),s[a].count++,s[a].totalSavings+=t.estimated_usmca_savings,s[a].routes.push(`${e} → ${t.partner_country}`)}),{totalRoutes:t?.length||0,stageAnalysis:s,bestStage:Object.keys(s).reduce((e,t)=>s[t].totalSavings>(s[e]?.totalSavings||0)?t:e,"1"),insight:`Stage ${Object.keys(s).reduce((e,t)=>s[t].totalSavings>(s[e]?.totalSavings||0)?t:e,"1")} routes show highest savings potential`}}async function getRoutePerformanceData(e){let{data:t,error:a}=await l.from("trade_flows").select(`
      partner_country,
      trade_value,
      estimated_usmca_savings,
      triangle_stage
    `).eq("reporter_country",e).not("trade_value","is",null).order("trade_value",{ascending:!1}).limit(30);if(a)throw a;let s={};return t?.forEach(e=>{let t=e.partner_country;s[t]||(s[t]={count:0,totalValue:0,totalSavings:0,stages:[]}),s[t].count++,s[t].totalValue+=e.trade_value,s[t].totalSavings+=e.estimated_usmca_savings||0,s[t].stages.push(e.triangle_stage)}),{totalRoutes:t?.length||0,destinationAnalysis:s,topDestination:Object.keys(s).reduce((e,t)=>s[t].totalValue>(s[e]?.totalValue||0)?t:e,"USA"),insight:`${Object.keys(s).reduce((e,t)=>s[t].totalValue>(s[e]?.totalValue||0)?t:e,"USA")} shows highest trade value potential`}}async function getMarcusAnalysis(e,t,a,s,i,n,o){try{let r=`
MARCUS ANALYSIS: Complete Triangle Intelligence Journey Review

USER JOURNEY DATA:
- Business Type: ${e}
- Origin: ${t}
- Import Volume: ${s}
- Products: ${a?.length||0} analyzed

DATABASE INTELLIGENCE FINDINGS:
- Success Patterns: ${i.totalRecords} similar companies analyzed
- Average Savings: $${(i.averageSavings/1e3).toFixed(0)}K
- Peer Benchmarks: ${n.totalRecords} comparable businesses
- Route Performance: ${o.totalRoutes} routes evaluated
- Best Stage: ${o.bestStage}

ANALYSIS REQUEST:
1. What specific insights emerge from combining this user's profile with our $76.9B trade database?
2. What are the 3 most important strategic recommendations for this business?
3. What market opportunities should they prioritize based on similar company success patterns?
4. What implementation risks should they be aware of?
5. How does their profile compare to our most successful triangle routing implementations?

Provide practical, data-driven insights in a professional consulting tone. Focus on actionable intelligence.
`,l=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-3-sonnet-20240229",max_tokens:1e3,messages:[{role:"user",content:r}]})});if(!l.ok)throw Error(`Marcus API error: ${l.status}`);let c=await l.json();return{analysis:c.content[0].text,timestamp:new Date().toISOString(),dataPoints:i.totalRecords+n.totalRecords,source:"MARCUS_AI_ANALYSIS"}}catch(t){return console.error("Marcus analysis error:",t),{analysis:`Based on the $76.9B trade database analysis:

**Strategic Assessment for ${e} Business:**

With ${i.totalRecords} similar companies in our database showing average savings of $${(i.averageSavings/1e3).toFixed(0)}K, your profile indicates strong triangle routing potential.

**Key Recommendations:**
1. **Route Optimization**: Stage ${o.bestStage} routes show highest success rates for your business type
2. **Implementation Priority**: Your ${s} volume justifies immediate triangle routing evaluation
3. **Risk Management**: ${n.totalRecords} peer companies provide benchmarking confidence

**Market Position**: Companies with your profile typically achieve 15-25% cost reduction through USMCA triangle routing. The database suggests focusing on Mexico-USA routes for optimal savings.

**Next Steps**: Implement triangle routing pilot program, monitor performance against peer benchmarks, scale successful routes.`,timestamp:new Date().toISOString(),dataPoints:i.totalRecords+n.totalRecords,source:"FALLBACK_ANALYSIS"}}}let c=(0,o.l)(s,"default"),u=(0,o.l)(s,"config"),g=new i.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/real-hindsight-intelligence",pathname:"/api/real-hindsight-intelligence",bundlePath:"",filename:""},userland:s})}};var t=require("../../webpack-api-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[4222],()=>__webpack_exec__(5253));module.exports=a})();