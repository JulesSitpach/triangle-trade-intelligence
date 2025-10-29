# USMCA 2026 Renegotiation - Country-Specific Guidance

## Overview
The alerts page dynamically adapts based on user's `companyCountry` field to show relevant government resources, negotiation positions, and action priorities.

---

## 🇺🇸 United States SMBs

### Position: **OFFENSIVE** (Pushing for Changes)
"We want to strengthen USMCA to protect American jobs"

### Scenario Probabilities:
- **Minimal Changes**: 40% (US wants more than this)
- **Moderate Changes**: 45% ⭐ Most likely
- **Major Overhaul**: 15% (US could push hard)

### What US Wants:
✓ Increase RVC thresholds (65% → 70%)
✓ Enforce China transshipment rules
✓ Strengthen labor provisions
✓ Ensure authentic North American content

### Government Agencies:
- **USTR** (Lead negotiations) - 202-395-3230
- **SBA** (SMB guidance) - 1-800-827-5722
- **CBP** (Compliance) - 877-CBP-5511
- **ITA** (Market intelligence) - 1-800-USA-TRAD

### Public Comment:
**Submit to**: USTR (ustr.gov/public-comment)
**Deadline**: Jan 15, 2026
**Template**: Defend or support RVC changes

### Top 3 Actions:
1. **Submit USTR Public Comment** (Jan 15) - Make your voice heard
2. **Increase RVC Buffer to 75%** (Mar 1) - Prepare for changes
3. **Join Industry Coalition** (Dec 15) - Amplify your position

### Cost Impact (Moderate Changes):
- One-time: $2,800
- Annual: +$2,000/year
- Risk avoided: Losing $4,080/year USMCA savings

---

## 🇨🇦 Canadian SMBs

### Position: **DEFENSIVE** (Protecting Status Quo)
"We want to maintain CUSMA benefits and trade stability"

### Scenario Probabilities:
- **Status Quo Maintained**: 55% ⭐ Most likely (Canada's goal)
- **US Pushes Changes**: 35%
- **US Bilateral Deals**: 10% (Worst case - lose CUSMA)

### What Canada Wants:
✓ Maintain 65% RVC threshold
✓ Defend existing trade benefits
✓ Prevent US bilateral deals outside CUSMA
✓ Preserve supply chain stability

### Government Agencies:
- **Global Affairs Canada** (Lead CUSMA) - 1-800-267-8376
- **CBSA** (Customs) - 1-800-461-9999
- **EDC** (Trade financing) - 1-800-229-0575
- **CCC** (US contracts) - 1-800-748-8191

### Public Consultation:
**Submit to**: Global Affairs Canada (international.gc.ca/trade-commerce/consultations)
**Deadline**: Jan 15, 2026
**Template**: Defend 65% RVC and current benefits

### Top 3 Actions:
1. **Submit Consultation to Global Affairs** (Jan 15) - Defend CUSMA
2. **Document US Market Dependency** (Feb 1) - Show impact if benefits lost
3. **Identify Alternative Markets** (Mar 1) - Prepare for worst case (EU, Asia)

### Cost Impact (If CUSMA Benefits Lost):
- Face 10% US tariffs
- Alternative markets: $2,000-5,000 (transition cost)
- Lost US market share: Variable

### Note:
- Uses **"CUSMA"** naming (Canada-US-Mexico Agreement)
- Focus on defensive strategy
- Prepare contingency plans for US going bilateral

---

## 🇲🇽 Mexican SMBs / PYMEs Mexicanas

### Position: **MIXED** (Expand Benefits, Resist Restrictions)
"Queremos expandir beneficios de maquiladoras mientras mantenemos competitividad"

### Scenario Probabilities:
- **Extension with Improvements**: 50% ⭐ Most likely
- **Wage Requirements Added**: 40% (Real risk)
- **Restrictive Changes**: 10% (Lose advantage vs Asia)

### What Mexico Wants:
✓ Expandir beneficios de maquiladoras
✓ Defender contra requisitos salariales ($16/hr)
✓ Aumentar contenido mexicano en cadenas de suministro
✓ Mantener ventaja competitiva vs Asia

### Government Agencies / Agencias Gubernamentales:
- **Secretaría de Economía** (Liderazgo T-MEC) - 800-083-3863
- **SAT** (Administración aduanera) - 800-463-7263
- **ProMéxico** (Promoción exportaciones) - 800-123-4567

### Public Consultation / Consulta Pública:
**Submit to / Enviar a**: Secretaría de Economía (gob.mx/se/acciones-y-programas/consultas-publicas)
**Deadline / Fecha límite**: 15 enero 2026
**Template / Plantilla**: Defender beneficios maquiladoras

### Top 3 Actions / Acciones Prioritarias:
1. **Enviar consulta a Secretaría de Economía** (15 ene) - Defender maquiladoras
2. **Verificar cumplimiento salarial** (1 feb) - Documentar salarios $16/hr
3. **Aumentar contenido norteamericano** (1 mar) - Objetivo 75% CVR

### Cost Impact / Impacto de Costos (Wage Requirements):
- Wage compliance verification: $500-1,500
- If wages increase: +10-15% labor cost
- Alternative: Automate or relocate to maintain cost advantage

### Language Support:
✅ **Spanish translations available** for all sections
✅ Uses **"T-MEC"** naming (Tratado México-Estados Unidos-Canadá)
✅ MXN currency formatting
✅ Mexico-specific resources and associations

---

## Key Differences Summary

| Feature | US 🇺🇸 | Canada 🇨🇦 | Mexico 🇲🇽 |
|---------|--------|------------|------------|
| **Position** | Offensive | Defensive | Mixed |
| **Main Goal** | Increase RVC | Maintain 65% | Defend maquiladoras |
| **Top Risk** | China transshipment | Losing CUSMA | Wage requirements |
| **Public Comment** | USTR | Global Affairs | Secretaría |
| **Status Quo %** | 40% | 55% | 50% |
| **Change Likely** | 60% | 45% | 50% |
| **Language** | English | English | English/Español |
| **Agreement Name** | USMCA | CUSMA | T-MEC |
| **Priority 1** | Submit comment | Defend benefits | Verify wages |
| **Cost (Moderate)** | $2,800 + $2K/yr | $2-5K (alt markets) | $500-1,500 |

---

## Implementation Notes

### How It Works:
1. Read `userProfile.companyCountry` or `userProfile.workflow_data?.company?.company_country`
2. Call `getCountryConfig(companyCountry)` from `lib/usmca/usmca-2026-config.js`
3. Render country-specific:
   - Government agencies
   - Industry associations
   - Action priorities
   - Scenario probabilities
   - Public comment process
   - Cost estimates

### Spanish Support (Mexico):
- Check `userProfile.preferredLanguage` or browser locale
- If `'es'`, use Spanish field names:
  - `nameES`, `descriptionES`, `actionES`, etc.
- All government resources include Spanish versions
- Currency formatted as MXN (pesos)

### Dynamic Elements:
- **Scenario probabilities** adjust by country position
- **Government agencies** are country-specific (no US agencies shown to Canada/Mexico)
- **Action priorities** reflect country goals
- **Cost estimates** in local context
- **Timeline events** filtered by relevance

### Testing:
```javascript
// US user sees:
companyCountry: 'US' → USTR, SBA, CBP, offensive position

// Canadian user sees:
companyCountry: 'CA' → Global Affairs, CBSA, defensive position, CUSMA naming

// Mexican user sees:
companyCountry: 'MX' → Secretaría, SAT, mixed position, T-MEC naming, Spanish option
```

---

## User Experience Examples

### US User Dashboard:
```
🗓️ USMCA Joint Review: July 2026 (8 months away)
⚠️ Your Position: Support RVC increases to 70%
📝 Action Required: Submit USTR comment by Jan 15

Scenario B (45% probability): RVC Increases to 70%
Your Impact: Need to increase Mexico content from 65% → 75%
Cost: $2,800 one-time + $2,000/year
Action: Switch 10% components to Mexico suppliers
```

### Canadian User Dashboard:
```
🗓️ CUSMA Joint Review: July 2026 (8 months away)
⚠️ Your Position: Defend 65% RVC threshold
📝 Action Required: Submit Global Affairs consultation by Jan 15

Scenario A (55% probability): Status Quo Maintained
Your Impact: Continue current operations
Cost: $0 (maintain qualification)
Action: Monitor for minor process improvements
```

### Mexican User Dashboard (Spanish):
```
🗓️ Revisión Conjunta T-MEC: Julio 2026 (8 meses)
⚠️ Tu Posición: Defender beneficios maquiladoras
📝 Acción Requerida: Enviar consulta a Secretaría antes del 15 enero

Escenario B (40% probabilidad): Requisitos Salariales Añadidos
Tu Impacto: Verificar proveedores cumplen $16/hr
Costo: $500-1,500 (verificación)
Acción: Documentar cumplimiento salarial de proveedores
```

---

## Next Steps

1. ✅ Configuration file created (`lib/usmca/usmca-2026-config.js`)
2. ⏳ Integrate into alerts page component
3. ⏳ Add Spanish translation layer for Mexico
4. ⏳ Test with real user profiles (US, CA, MX)
5. ⏳ Add AI analysis that uses country-specific context

This makes the USMCA 2026 section genuinely valuable for ALL USMCA member countries!
