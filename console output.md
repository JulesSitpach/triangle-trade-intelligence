 React Hook useEffect has a missing dependency: 'components'. Either include it or remove the dependency array.


 console output 
 PS D:\bacjup\triangle-simple> npm run dev

> triangle-intelligence-platform@1.0.0 dev
> next dev -p 3000 -H 0.0.0.0

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1774ms
 ○ Compiling / ...
 ✓ Compiled / in 990ms (603 modules)
 GET /_next/static/webpack/c831104421964910.webpack.hot-update.json 404 in 1029ms
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 GET /dashboard 200 in 1235ms
 GET / 200 in 958ms
 GET /dashboard 200 in 15ms
 ✓ Compiled /api/auth/me in 163ms (163 modules)
 ✓ Compiled (168 modules)
(node:4496) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
{"timestamp":"2025-10-24T14:56:26.934Z","level":"INFO","message":"Dropdown options request","category":"all"}
 GET /api/auth/me?t=1761317786481 200 in 1219ms
{"timestamp":"2025-10-24T14:56:27.713Z","level":"INFO","message":"Business types generated from USMCA rules","totalCategories":9,"businessTypesFound":7}
{"timestamp":"2025-10-24T14:56:27.850Z","level":"INFO","message":"Performance: Dropdown options served","duration_ms":917,"category":"all","items":8}
 GET /api/database-driven-dropdown-options?category=all 200 in 1368ms
 ✓ Compiled /login in 414ms (631 modules)
 ✓ Compiled /api/auth/login in 66ms (175 modules)
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 982ms
 ✓ Compiled /api/dashboard-data in 119ms (181 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Professional',
  tierLimit: 100
}
❌ Data Contract Violation in dashboard-data: session 2ad4c6fa-393f-4fe4-a1cb-a313957fefc0:
   - Trade volume is missing in workflow_session[2ad4c6fa-393f-4fe4-a1cb-a313957fefc0].trade_volume
❌ Data Contract Violation in dashboard-data: session c22131d7-024f-4de8-b2b7-c25096b8c98b:
   - Trade volume is missing in workflow_session[c22131d7-024f-4de8-b2b7-c25096b8c98b].trade_volume
❌ Data Contract Violation in dashboard-data: session f3c2ab59-7f33-48e8-bba8-42427902381a:
   - Trade volume is missing in workflow_session[f3c2ab59-7f33-48e8-bba8-42427902381a].trade_volume
❌ Data Contract Violation in dashboard-data: session 02f4edab-ea42-4ff5-bd1d-495d5c8cd578:
   - Trade volume is missing in workflow_session[02f4edab-ea42-4ff5-bd1d-495d5c8cd578].trade_volume
❌ Data Contract Violation in dashboard-data: session 385b2a5e-8377-41bd-b1ee-4b716a1b3b4e:
   - Trade volume is missing in workflow_session[385b2a5e-8377-41bd-b1ee-4b716a1b3b4e].trade_volume
❌ Data Contract Violation in dashboard-data: session dec0570e-6a36-4071-ae33-7535f4de456f:
   - Trade volume is missing in workflow_session[dec0570e-6a36-4071-ae33-7535f4de456f].trade_volume
❌ Data Contract Violation in dashboard-data: session e63cb9d3-ea44-4b39-a5c6-b7fbdd04965b:
   - Trade volume is missing in workflow_session[e63cb9d3-ea44-4b39-a5c6-b7fbdd04965b].trade_volume
❌ Data Contract Violation in dashboard-data: session 7256c758-2ba9-460e-97ea-1cdc5bf3502b:
   - Trade volume is missing in workflow_session[7256c758-2ba9-460e-97ea-1cdc5bf3502b].trade_volume
❌ Data Contract Violation in dashboard-data: session c4af8fef-6567-40b7-acec-ec887bed9e50:
   - Trade volume is missing in workflow_session[c4af8fef-6567-40b7-acec-ec887bed9e50].trade_volume
❌ Data Contract Violation in dashboard-data: session 97e35eea-d14f-42b3-9ef9-f97d4dd5acc0:
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[1]
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[2]
❌ Data Contract Violation in dashboard-data: session 1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8:
   - Component missing/invalid 'hs_code' in workflow_session[1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8].components[1]
❌ Data Contract Violation in dashboard-data: session 704f816e-6f8a-47b0-877c-3f70bd9ea877:
   - Component missing/invalid 'hs_code' in workflow_session[704f816e-6f8a-47b0-877c-3f70bd9ea877].components[2]
❌ Data Contract Violation in dashboard-data: session 2cd3edf6-88f8-48cf-9254-1b13e0529399:
   - Component missing/invalid 'hs_code' in workflow_session[2cd3edf6-88f8-48cf-9254-1b13e0529399].components[1]
❌ Data Contract Violation in dashboard-data: session c456b441-d3aa-438d-9e0b-33be032195e7:
   - Component missing/invalid 'hs_code' in workflow_session[c456b441-d3aa-438d-9e0b-33be032195e7].components[1]
❌ Data Contract Violation in dashboard-data: session 45f5d6a9-8405-4126-9faa-2e555d1ce88c:
   - Component missing/invalid 'hs_code' in workflow_session[45f5d6a9-8405-4126-9faa-2e555d1ce88c].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[45f5d6a9-8405-4126-9faa-2e555d1ce88c].components[2]
❌ Data Contract Violation in dashboard-data: session d6bc20f1-2a41-47f0-906e-699122bd1750:
   - Component missing/invalid 'hs_code' in workflow_session[d6bc20f1-2a41-47f0-906e-699122bd1750].components[0]
❌ Data Contract Violation in dashboard-data: completion 61b5e8f1-05ba-401c-8c16-d8997c3bcf69:
   - Trade volume is missing in workflow_completion[61b5e8f1-05ba-401c-8c16-d8997c3bcf69].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion d78406a2-ed43-4a9b-8ac7-135800b90d71:
   - Trade volume is missing in workflow_completion[d78406a2-ed43-4a9b-8ac7-135800b90d71].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion 47322c36-c787-408b-8738-80f3a18f809f:
   - Trade volume is missing in workflow_completion[47322c36-c787-408b-8738-80f3a18f809f].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion 4e81f77b-2a4b-4769-970b-6eb105a16767:
   - Component missing/invalid 'hs_code' in workflow_completion[4e81f77b-2a4b-4769-970b-6eb105a16767].components[2]
❌ Data Contract Violation in dashboard-data: completion 8f3d4114-b4a1-4271-bf98-1ac8ce5663ca:
   - Trade volume is missing in workflow_completion[8f3d4114-b4a1-4271-bf98-1ac8ce5663ca].company.trade_volume
📍 User Alert Filtering Context: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  userHSCodes: 18,
  userDestination: null,
  workflowCount: 126
}
✅ Alert filtering complete: {
  totalAlerts: 12,
  relevantAlerts: 5,
  filtered: 7,
  userDestination: null
}
 GET /api/dashboard-data 200 in 1762ms
 ✓ Compiled /api/admin/log-dev-issue in 208ms (183 modules)
⚠️ DEV ISSUE [HIGH]: pdf_generator - Missing certifier.country in certificate {
  certificate_number: 'USMCA-1761253789393',
  section_data: { tax_id: '' }
}
 POST /api/admin/log-dev-issue 200 in 459ms
⚠️ DEV ISSUE [HIGH]: pdf_generator - Missing exporter.country in certificate {
  certificate_number: 'USMCA-1761253789393',
  section_data: {
    same_as_certifier: true,
    name: 'MexManufacturing Ltd',
    address: '456 Industrial Way, Monterrey, NL, Mexico 64000',
    country: '',
    phone: '52-81-555-6789',
    email: 'maria@mexmanufacturing.com',
    tax_id: 'RFC-MEX123456'
  }
}
 POST /api/admin/log-dev-issue 200 in 465ms
⚠️ DEV ISSUE [HIGH]: pdf_generator - Missing producer.country in certificate {
  certificate_number: 'USMCA-1761253789393',
  section_data: {
    same_as_exporter: false,
    name: 'Various USMCA Producers',
    address: '',
    country: ''
  }
}
 POST /api/admin/log-dev-issue 200 in 468ms
 ○ Compiling /trade-risk-alternatives ...
 ✓ Compiled /trade-risk-alternatives in 829ms (627 modules)
 ✓ Compiled /api/dashboard-data in 54ms (175 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Professional',
  tierLimit: 100
}
❌ Data Contract Violation in dashboard-data: session 2ad4c6fa-393f-4fe4-a1cb-a313957fefc0:
   - Trade volume is missing in workflow_session[2ad4c6fa-393f-4fe4-a1cb-a313957fefc0].trade_volume
❌ Data Contract Violation in dashboard-data: session c22131d7-024f-4de8-b2b7-c25096b8c98b:
   - Trade volume is missing in workflow_session[c22131d7-024f-4de8-b2b7-c25096b8c98b].trade_volume
❌ Data Contract Violation in dashboard-data: session f3c2ab59-7f33-48e8-bba8-42427902381a:
   - Trade volume is missing in workflow_session[f3c2ab59-7f33-48e8-bba8-42427902381a].trade_volume
❌ Data Contract Violation in dashboard-data: session 02f4edab-ea42-4ff5-bd1d-495d5c8cd578:
   - Trade volume is missing in workflow_session[02f4edab-ea42-4ff5-bd1d-495d5c8cd578].trade_volume
❌ Data Contract Violation in dashboard-data: session 385b2a5e-8377-41bd-b1ee-4b716a1b3b4e:
   - Trade volume is missing in workflow_session[385b2a5e-8377-41bd-b1ee-4b716a1b3b4e].trade_volume
❌ Data Contract Violation in dashboard-data: session dec0570e-6a36-4071-ae33-7535f4de456f:
   - Trade volume is missing in workflow_session[dec0570e-6a36-4071-ae33-7535f4de456f].trade_volume
❌ Data Contract Violation in dashboard-data: session e63cb9d3-ea44-4b39-a5c6-b7fbdd04965b:
   - Trade volume is missing in workflow_session[e63cb9d3-ea44-4b39-a5c6-b7fbdd04965b].trade_volume
❌ Data Contract Violation in dashboard-data: session 7256c758-2ba9-460e-97ea-1cdc5bf3502b:
   - Trade volume is missing in workflow_session[7256c758-2ba9-460e-97ea-1cdc5bf3502b].trade_volume
❌ Data Contract Violation in dashboard-data: session c4af8fef-6567-40b7-acec-ec887bed9e50:
   - Trade volume is missing in workflow_session[c4af8fef-6567-40b7-acec-ec887bed9e50].trade_volume
❌ Data Contract Violation in dashboard-data: session 97e35eea-d14f-42b3-9ef9-f97d4dd5acc0:
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[1]
   - Component missing/invalid 'hs_code' in workflow_session[97e35eea-d14f-42b3-9ef9-f97d4dd5acc0].components[2]
❌ Data Contract Violation in dashboard-data: session 1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8:
   - Component missing/invalid 'hs_code' in workflow_session[1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[1f66dd74-d18a-4e81-befc-b8d2fe3e7ef8].components[1]
❌ Data Contract Violation in dashboard-data: session 704f816e-6f8a-47b0-877c-3f70bd9ea877:
   - Component missing/invalid 'hs_code' in workflow_session[704f816e-6f8a-47b0-877c-3f70bd9ea877].components[2]
❌ Data Contract Violation in dashboard-data: session 2cd3edf6-88f8-48cf-9254-1b13e0529399:
   - Component missing/invalid 'hs_code' in workflow_session[2cd3edf6-88f8-48cf-9254-1b13e0529399].components[1]
❌ Data Contract Violation in dashboard-data: session c456b441-d3aa-438d-9e0b-33be032195e7:
   - Component missing/invalid 'hs_code' in workflow_session[c456b441-d3aa-438d-9e0b-33be032195e7].components[1]
❌ Data Contract Violation in dashboard-data: session 45f5d6a9-8405-4126-9faa-2e555d1ce88c:
   - Component missing/invalid 'hs_code' in workflow_session[45f5d6a9-8405-4126-9faa-2e555d1ce88c].components[0]
   - Component missing/invalid 'hs_code' in workflow_session[45f5d6a9-8405-4126-9faa-2e555d1ce88c].components[2]
❌ Data Contract Violation in dashboard-data: session d6bc20f1-2a41-47f0-906e-699122bd1750:
   - Component missing/invalid 'hs_code' in workflow_session[d6bc20f1-2a41-47f0-906e-699122bd1750].components[0]
❌ Data Contract Violation in dashboard-data: completion 61b5e8f1-05ba-401c-8c16-d8997c3bcf69:
   - Trade volume is missing in workflow_completion[61b5e8f1-05ba-401c-8c16-d8997c3bcf69].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion d78406a2-ed43-4a9b-8ac7-135800b90d71:
   - Trade volume is missing in workflow_completion[d78406a2-ed43-4a9b-8ac7-135800b90d71].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion 47322c36-c787-408b-8738-80f3a18f809f:
   - Trade volume is missing in workflow_completion[47322c36-c787-408b-8738-80f3a18f809f].company.trade_volume
❌ Data Contract Violation in dashboard-data: completion 4e81f77b-2a4b-4769-970b-6eb105a16767:
   - Component missing/invalid 'hs_code' in workflow_completion[4e81f77b-2a4b-4769-970b-6eb105a16767].components[2]
❌ Data Contract Violation in dashboard-data: completion 8f3d4114-b4a1-4271-bf98-1ac8ce5663ca:
   - Trade volume is missing in workflow_completion[8f3d4114-b4a1-4271-bf98-1ac8ce5663ca].company.trade_volume
📍 User Alert Filtering Context: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  userHSCodes: 18,
  userDestination: null,
  workflowCount: 126
}
✅ Alert filtering complete: {
  totalAlerts: 12,
  relevantAlerts: 5,
  filtered: 7,
  userDestination: null
}
 GET /api/dashboard-data 200 in 1572ms
 ✓ Compiled /api/generate-personalized-alerts in 78ms (177 modules)
❌ Data Contract Violation in generate-personalized-alerts:
   - Trade volume is missing in generate-personalized-alerts request
🎯 Generating personalized alerts for CanadaDistribution Inc
📊 User trade profile: CN, MX, US origins | Electronics, Plastics/Rubber industries
🎯 TIER 1: Trying OpenRouter...
✅ OpenRouter SUCCESS
✅ Parsed 5 personalized alerts
 POST /api/generate-personalized-alerts 200 in 37397ms
 ✓ Compiled /api/consolidate-alerts in 236ms (172 modules)
❌ Data Contract Violation in consolidate-alerts:
   - Trade volume is missing in consolidate-alerts request
🧠 Consolidating 5 alerts for CanadaDistribution Inc
🔍 User countries: [ 'CN', 'MX', 'US' ]
🔍 User components: [
  'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant',
  'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C',
  'Injection-molded ABS housing, UV-stabilized black resin, EMI shielding, snap-fit assembly, automotive-grade material'
]
📊 Grouped into 5 consolidated alerts
✅ Consolidated analysis: USMCA Recordkeeping Audit Risk - 5-Year Documentation Gap Could Cost You Duty-Free Status (HIGH)
⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache: [ 25 ]
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (25%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [ 25, 2.5 ],
  cached_rates: [
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Injection-molded ABS housing, UV-stabilized black resin, EMI shielding, snap-fit assembly, automotive-grade material'
    }
  ],
  deviations: [ 25 ],
  broker_summary_preview: "Look, this isn't about new tariffs - it's about proving you deserve the duty-free treatment you're already claiming under USMCA. CBP is ramping up audits and if you can't produce valid Certifications of Origin going back 5 years, they'll retroactively deny your claims and hit you with duties plus pe",
  breakdown_preview: 'Example: If you import $1M annually → $250K from Mexico → $6,250 duty exposure per year × 5 years lookback = $31,250 + penalties ($6,250-$12,500) = $37,500-$43,750 total exposure'
}
 ✓ Compiled /api/admin/log-dev-issue in 54ms (165 modules)
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (25%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [ 25, 2.5 ],
  cached_rates: [
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Injection-molded ABS housing, UV-stabilized black resin, EMI shielding, snap-fit assembly, automotive-grade material'
    }
  ],
  deviations: [ 25 ],
  broker_summary_preview: "Look, this isn't about new tariffs - it's about proving you deserve the duty-free treatment you're already claiming under USMCA. CBP is ramping up audits and if you can't produce valid Certifications of Origin going back 5 years, they'll retroactively deny your claims and hit you with duties plus pe",
  breakdown_preview: 'Example: If you import $1M annually → $250K from Mexico → $6,250 duty exposure per year × 5 years lookback = $31,250 + penalties ($6,250-$12,500) = $37,500-$43,750 total exposure'
}
 POST /api/admin/log-dev-issue 200 in 405ms
✅ Consolidated analysis: Chinese PCB Tariffs Jump to 25% - Hits 55% of Your Product Cost (URGENT)
⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache: [
  25.25, 55, 24.75,
     25, 55,    15,
     25
]
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (25.25%, 55%, 24.75%, 25%, 55%, 15%, 25%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
    25.25,  0.5, 55,
    24.75, 0.25, 25,
       55,    0, 15,
       25
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    }
  ],
  deviations: [
    25.25, 55, 24.75,
       25, 55,    15,
       25
  ],
  broker_summary_preview: "Alright, here's the situation: Section 301 tariffs on your Chinese circuit boards just jumped from 0.25% to 25%. Since these PCBs make up 55% of your automotive control systems, this is a significant hit. Without knowing your annual volume, I can't give you a dollar figure, but here's the math: ever",
  breakdown_preview: 'Per $100K of Chinese PCBs: ($100,000 × 25.25%) - ($100,000 × 0.5%) = $25,250 - $500 = $24,750 additional cost. For your total business: (Annual Volume × 55% PCB content × 24.75% tariff increase) = Annual Impact'
}
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (25.25%, 55%, 24.75%, 25%, 55%, 15%, 25%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
    25.25,  0.5, 55,
    24.75, 0.25, 25,
       55,    0, 15,
       25
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    }
  ],
  deviations: [
    25.25, 55, 24.75,
       25, 55,    15,
       25
  ],
  broker_summary_preview: "Alright, here's the situation: Section 301 tariffs on your Chinese circuit boards just jumped from 0.25% to 25%. Since these PCBs make up 55% of your automotive control systems, this is a significant hit. Without knowing your annual volume, I can't give you a dollar figure, but here's the math: ever",
  breakdown_preview: 'Per $100K of Chinese PCBs: ($100,000 × 25.25%) - ($100,000 × 0.5%) = $25,250 - $500 = $24,750 additional cost. For your total business: (Annual Volume × 55% PCB content × 24.75% tariff increase) = Annual Impact'
}
 POST /api/admin/log-dev-issue 200 in 206ms
✅ Consolidated analysis: Mexico Nearshoring Opportunity: Cut Tariffs on 55% of Your Product (MEDIUM)
⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache: [ 55, 25, 20, 55, 12 ]
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 25%, 20%, 55%, 12%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
     55,  0.5, 0.275,  25,
      0,   20, 0.275,  55,
    0.5, 0.25,  0.25, 0.5,
     12
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    }
  ],
  deviations: [ 55, 25, 20, 55, 12 ],
  broker_summary_preview: "Good news for once – Mexico's T-MEC electronics program could save you money on those Chinese circuit boards that make up 55% of your product. Right now, you're paying 0.5% on PCBs from China (0.25% base + 0.25% Section 301). Your Mexican wire harnesses already enter duty-free under USMCA. If you sh",
  breakdown_preview: 'Current state: Chinese PCBs = 55% of product value × 0.5% tariff = 0.275% of total product cost. Mexican connectors = 25% of product × 0% tariff = $0. Remaining 20% of components not specified. If you provide annual import volume, multiply by 0.275% for current annual tariff spend on PCBs.'
}
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 25%, 20%, 55%, 12%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
     55,  0.5, 0.275,  25,
      0,   20, 0.275,  55,
    0.5, 0.25,  0.25, 0.5,
     12
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    }
  ],
  deviations: [ 55, 25, 20, 55, 12 ],
  broker_summary_preview: "Good news for once – Mexico's T-MEC electronics program could save you money on those Chinese circuit boards that make up 55% of your product. Right now, you're paying 0.5% on PCBs from China (0.25% base + 0.25% Section 301). Your Mexican wire harnesses already enter duty-free under USMCA. If you sh",
  breakdown_preview: 'Current state: Chinese PCBs = 55% of product value × 0.5% tariff = 0.275% of total product cost. Mexican connectors = 25% of product × 0% tariff = $0. Remaining 20% of components not specified. If you provide annual import volume, multiply by 0.275% for current annual tariff spend on PCBs.'
}
 POST /api/admin/log-dev-issue 200 in 252ms
✅ Consolidated analysis: RoHS/REACH Compliance Tightening for Your Chinese Circuit Boards (HIGH)
⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache: [ 55, 55, 100 ]
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 55%, 100%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [ 55, 10, 55, 100 ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    }
  ],
  deviations: [ 55, 55, 100 ],
  broker_summary_preview: "Alright, here's the situation: New compliance verification requirements are coming for automotive electronics with RoHS/REACH materials - that's 55% of your product (the Chinese circuit boards). The good news? You're already buying RoHS-compliant boards, so you're not starting from zero. The bad new",
  breakdown_preview: 'Cost calculation requires annual volume. Formula: (Annual Units × 55% affected) × (Compliance cost per unit OR delay cost per shipment). Example: If you import 10,000 units/year at $50/unit = $500K volume, and 10% of shipments get held for 5 days averaging $350/hold with 20 shipments/year = $7,000 in delays alone, plus one-time supplier certification ~$1,500.'    
}
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 55%, 100%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [ 55, 10, 55, 100 ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    }
  ],
  deviations: [ 55, 55, 100 ],
  broker_summary_preview: "Alright, here's the situation: New compliance verification requirements are coming for automotive electronics with RoHS/REACH materials - that's 55% of your product (the Chinese circuit boards). The good news? You're already buying RoHS-compliant boards, so you're not starting from zero. The bad new",
  breakdown_preview: 'Cost calculation requires annual volume. Formula: (Annual Units × 55% affected) × (Compliance cost per unit OR delay cost per shipment). Example: If you import 10,000 units/year at $50/unit = $500K volume, and 10% of shipments get held for 5 days averaging $350/hold with 20 shipments/year = $7,000 in delays alone, plus one-time supplier certification ~$1,500.'    
}
 POST /api/admin/log-dev-issue 200 in 143ms
✅ Consolidated analysis: USMCA Automotive Electronics Compliance Gap - 55% Chinese PCBs Block Duty-Free Access (MEDIUM)
⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache: [ 55, 25, 20, 55 ]
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 25%, 20%, 55%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
     55, 0.5, 0.25, 0.25,
     25,  20,    0,   55,
    0.5,   0,   10,    0
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Injection-molded ABS housing, UV-stabilized black resin, EMI shielding, snap-fit assembly, automotive-grade material'
    }
  ],
  deviations: [ 55, 25, 20, 55 ],
  broker_summary_preview: "Here's the situation: Your automotive control systems don't qualify for USMCA duty-free treatment because 55% of your product (the Chinese PCBs) doesn't meet regional value content rules. Right now you're paying minimal duties (0.5% on Chinese boards = $0.275 per $100 of PCB value), but you're leavi",
  breakdown_preview: 'Assumed $500K annual imports × 55% Chinese PCBs = $275K PCB value × 0.5% total duty (0.25% MFN + 0.25% Section 301) = $1,375. Mexican connectors (25%) and US housings (20%) already qualify for 0% under USMCA.'
}
 POST /api/consolidate-alerts 200 in 86354ms
⚠️ DEV ISSUE [HIGH]: consolidate_alerts_api - AI claimed tariff rates (55%, 25%, 20%, 55%) not matching component cached data {
  company: 'CanadaDistribution Inc',
  ai_percentages: [
     55, 0.5, 0.25, 0.25,
     25,  20,    0,   55,
    0.5,   0,   10,    0
  ],
  cached_rates: [
    {
      baseMFN: 0.25,
      section301: 0.25,
      totalRate: 0.5,
      component: 'Multi-layer circuit boards, 6-layer FR4 PCB, copper-clad, solder mask coating, ENIG finish, RoHS compliant'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Wire harness connectors, sealed Deutsch-style connectors, gold-plated terminals, silicone seals, temperature range -40 to +125C'
    },
    {
      baseMFN: 0,
      section301: 0,
      totalRate: 0,
      component: 'Injection-molded ABS housing, UV-stabilized black resin, EMI shielding, snap-fit assembly, automotive-grade material'
    }
  ],
  deviations: [ 55, 25, 20, 55 ],
  broker_summary_preview: "Here's the situation: Your automotive control systems don't qualify for USMCA duty-free treatment because 55% of your product (the Chinese PCBs) doesn't meet regional value content rules. Right now you're paying minimal duties (0.5% on Chinese boards = $0.275 per $100 of PCB value), but you're leavi",
  breakdown_preview: 'Assumed $500K annual imports × 55% Chinese PCBs = $275K PCB value × 0.5% total duty (0.25% MFN + 0.25% Section 301) = $1,375. Mexican connectors (25%) and US housings (20%) already qualify for 0% under USMCA.'
}
 POST /api/admin/log-dev-issue 200 in 261ms
