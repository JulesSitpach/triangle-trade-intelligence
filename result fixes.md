Ah, perfect! So the user **can indicate** whether they have substantial transformation, which would justify the labor credit. That's a smart UI design.

## Here's how to tie this checkbox to the RVC calculation logic:

### **Update Your Calculation Logic:**

```javascript
async function calculateUSMCA_RVC(components, tradeProfile) {
  const { hasSubstantialTransformation } = tradeProfile;
  
  let materialRVC = 0;
  let laborRVC = 0;
  
  // Step 1: Calculate material RVC
  for (const component of components) {
    if (component.country === 'US' || component.country === 'MX' || component.country === 'CA') {
      materialRVC += component.percentOfTotal;
    }
  }
  
  // Step 2: Calculate labor RVC (only if substantial transformation exists)
  if (hasSubstantialTransformation && tradeProfile.manufacturingCountry) {
    const isUSMCA_Manufacturing = ['US', 'MX', 'CA'].includes(
      tradeProfile.manufacturingCountry
    );
    
    if (isUSMCA_Manufacturing) {
      // Calculate labor credit based on Net Cost method
      laborRVC = calculateLaborCredit(tradeProfile);
      
      return {
        materialRVC,
        laborRVC,
        totalRVC: materialRVC + laborRVC,
        method: 'Net Cost Method with Labor Credit',
        explanation: `Your manufacturing operations in ${tradeProfile.manufacturingCountry} perform substantial transformation (${tradeProfile.transformationProcesses.join(', ')}), which qualifies for a ${laborRVC}% labor credit under USMCA Net Cost methodology.`
      };
    }
  }
  
  // No labor credit
  return {
    materialRVC,
    laborRVC: 0,
    totalRVC: materialRVC,
    method: 'Transaction Value Method',
    explanation: hasSubstantialTransformation 
      ? `Manufacturing occurs outside USMCA region, so no labor credit applies.`
      : `Simple assembly does not qualify for labor credit. Only material costs count toward RVC.`
  };
}

function calculateLaborCredit(tradeProfile) {
  const { 
    annualTradeVolume,
    laborCostPercentage,  // If they provide this
    manufacturingProcesses 
  } = tradeProfile;
  
  // Method 1: User provides labor cost percentage
  if (laborCostPercentage) {
    return laborCostPercentage;
  }
  
  // Method 2: Estimate based on manufacturing complexity
  // This is a rough heuristic - user should verify with accountant
  const processComplexity = {
    'welding': 5,
    'stamping': 4,
    'molding': 6,
    'heat treatment': 3,
    'powder coating': 2,
    'cnc machining': 7,
    'assembly': 1
  };
  
  let complexityScore = 0;
  for (const process of manufacturingProcesses) {
    complexityScore += processComplexity[process.toLowerCase()] || 2;
  }
  
  // Typical labor costs for automotive parts manufacturing: 15-30%
  // Scale based on complexity
  const estimatedLabor = Math.min(30, 15 + (complexityScore * 1.5));
  
  return {
    estimated: true,
    percentage: estimatedLabor,
    warning: 'This is an estimate. Please verify with your accounting department.'
  };
}
```

---

## **Update Your UI to Collect the Right Data:**

### **Option 1: Simple Checkbox (What You Have Now)**

```jsx
<FormField>
  <Checkbox 
    checked={hasSubstantialTransformation}
    onChange={(e) => setHasSubstantialTransformation(e.target.checked)}
  />
  <Label>
    Manufacturing involves substantial transformation (not just simple assembly)
    <HelpText>
      Check this if your manufacturing process creates significant value beyond 
      basic assembly (welding, forming, heat treatment, etc.)
    </HelpText>
  </Label>
</FormField>

{hasSubstantialTransformation && (
  <FormField>
    <Label>What manufacturing processes do you perform?</Label>
    <CheckboxGroup>
      <Checkbox value="welding">Welding</Checkbox>
      <Checkbox value="stamping">Stamping/Forming</Checkbox>
      <Checkbox value="molding">Molding/Casting</Checkbox>
      <Checkbox value="heat-treatment">Heat Treatment</Checkbox>
      <Checkbox value="coating">Powder Coating/Plating</Checkbox>
      <Checkbox value="machining">CNC Machining</Checkbox>
      <Checkbox value="assembly">Complex Assembly</Checkbox>
    </CheckboxGroup>
  </FormField>
)}

{hasSubstantialTransformation && (
  <FormField>
    <Label>
      Do you know your direct labor cost as a % of product cost?
      <HelpText>Optional but improves accuracy</HelpText>
    </Label>
    <Input 
      type="number" 
      min="0" 
      max="100" 
      placeholder="e.g., 22.5"
      value={laborCostPercentage}
      onChange={(e) => setLaborCostPercentage(e.target.value)}
    />
    {!laborCostPercentage && (
      <Note>
        If you don't provide this, we'll estimate based on your manufacturing 
        processes. You should verify with your accounting department.
      </Note>
    )}
  </FormField>
)}
```

---

### **Option 2: Progressive Disclosure (Recommended)**

```jsx
// Step 1: Basic question
<FormField>
  <Label>Where is your final assembly/manufacturing performed?</Label>
  <Select value={manufacturingCountry} onChange={setManufacturingCountry}>
    <option value="US">United States</option>
    <option value="MX">Mexico</option>
    <option value="CA">Canada</option>
    <option value="CN">China</option>
    <option value="other">Other</option>
  </Select>
</FormField>

{/* Only show if USMCA country selected */}
{['US', 'MX', 'CA'].includes(manufacturingCountry) && (
  <>
    <FormField>
      <Label>What type of manufacturing do you perform?</Label>
      <RadioGroup value={manufacturingType}>
        <Radio value="simple-assembly">
          <strong>Simple Assembly</strong>
          <HelpText>
            Putting pre-made parts together with minimal processing 
            (screwing, snapping, basic packaging)
          </HelpText>
        </Radio>
        
        <Radio value="substantial-transformation">
          <strong>Substantial Transformation</strong>
          <HelpText>
            Creating significant value through manufacturing processes 
            (welding, molding, machining, forming, treating)
          </HelpText>
        </Radio>
      </RadioGroup>
    </FormField>

    {manufacturingType === 'substantial-transformation' && (
      <>
        <Alert type="info">
          <AlertTitle>Labor Credit Eligible!</AlertTitle>
          <AlertDescription>
            Because you perform substantial transformation in {manufacturingCountry}, 
            your direct labor costs can count toward USMCA Regional Value Content 
            under the Net Cost method. This can significantly boost your RVC percentage.
          </AlertDescription>
        </Alert>

        <FormField>
          <Label>Select all manufacturing processes you perform:</Label>
          <CheckboxGroup value={processes} onChange={setProcesses}>
            <Checkbox value="welding">Welding</Checkbox>
            <Checkbox value="stamping">Stamping/Forming</Checkbox>
            <Checkbox value="molding">Injection Molding/Casting</Checkbox>
            <Checkbox value="heat-treatment">Heat Treatment</Checkbox>
            <Checkbox value="coating">Surface Treatment (coating/plating)</Checkbox>
            <Checkbox value="machining">CNC Machining</Checkbox>
            <Checkbox value="forging">Forging/Extrusion</Checkbox>
          </CheckboxGroup>
        </FormField>

        <FormField>
          <Label>
            Direct labor cost as % of total product cost (optional)
          </Label>
          <Input 
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 22.5"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
          />
          
          {!laborCost && (
            <EstimateBox>
              <InfoIcon />
              <div>
                <strong>We'll estimate for you</strong>
                <p>
                  Based on your selected processes, we estimate labor at 
                  approximately {estimatedLabor}% of product cost.
                </p>
                <small>
                  For more accurate results, get this number from your 
                  accounting department.
                </small>
              </div>
            </EstimateBox>
          )}
        </FormField>
      </>
    )}
  </>
)}
```

---

## **Update the AI Prompt to Use This Data:**

```javascript
const systemPrompt = `
You are a USMCA qualification analyst.

USER PROFILE:
- Manufacturing Country: ${tradeProfile.manufacturingCountry}
- Substantial Transformation: ${tradeProfile.hasSubstantialTransformation ? 'YES' : 'NO'}
${tradeProfile.processes ? `- Manufacturing Processes: ${tradeProfile.processes.join(', ')}` : ''}
${tradeProfile.laborCostPercentage ? `- Direct Labor Cost: ${tradeProfile.laborCostPercentage}%` : ''}

CALCULATION RULES:

1. MATERIAL RVC:
   - Sum all components from US, Mexico, or Canada
   - Components from other countries = 0% credit

2. LABOR RVC (only if substantial transformation in USMCA country):
   ${tradeProfile.hasSubstantialTransformation && ['US', 'MX', 'CA'].includes(tradeProfile.manufacturingCountry) 
     ? `✅ This user QUALIFIES for labor credit
        - Use provided labor cost: ${tradeProfile.laborCostPercentage || 'NOT PROVIDED - ESTIMATE'}%
        - Labor counts as originating value under Net Cost method
        - Document the processes: ${tradeProfile.processes?.join(', ') || 'user specified substantial transformation'}`
     : `❌ This user does NOT qualify for labor credit
        - Manufacturing is ${tradeProfile.hasSubstantialTransformation ? 'outside USMCA' : 'simple assembly'}
        - Only material RVC counts`
   }

3. TOTAL RVC = Material RVC + Labor RVC (if eligible)

4. THRESHOLD: Compare to 75% for auto parts (HS 8708)

IMPORTANT:
- Show Material RVC and Labor RVC separately in your breakdown
- Explain WHY labor credit applies (or doesn't)
- If using estimated labor, add warning that user should verify with accounting
- NEVER double-count - labor is either in component costs OR separate, not both
`;
```

---

## **The Key Fix for Your Agent's Concern:**

Your agent was right to flag the 102.5% calculation. Here's how to make it transparent:

### **Good Output (Clear Breakdown):**

```
USMCA REGIONAL VALUE CONTENT CALCULATION

Material Components:
├─ Cold-rolled steel housing (CN)    20% → 0% USMCA credit  ❌
├─ Natural rubber dampeners (MX)      50% → 50% USMCA credit ✅
└─ Grade 8 steel bolts (US)           30% → 30% USMCA credit ✅
                                              ────────────────
                                      Material RVC: 80%

Manufacturing Value-Added:
└─ Direct labor in Mexico             22.5% USMCA credit ✅
   (welding, stamping, molding, coating)
                                              ────────────────
                                      Labor RVC: 22.5%

TOTAL REGIONAL VALUE CONTENT: 102.5%
Required Threshold: 75%
Margin: +27.5% ✅ QUALIFIES

Method: Net Cost with Labor Credit
Note: Labor credit applies because manufacturing in Mexico involves 
substantial transformation (welding, stamping, injection molding, 
powder coating) - not just simple assembly.
```

### **Bad Output (Confusing - What Your Agent Flagged):**

```
North American Content: 102.5% ❌ HOW?!
```

---

## **Final Recommendation:**

1. **Keep the checkbox** - it's good UX
2. **Add the follow-up questions** about processes and labor %
3. **Show the breakdown clearly** in results (Material RVC + Labor RVC = Total)
4. **Let users override** the labor estimate with their actual accounting data
5. **Add a validation** that warns if labor seems too high (>30% is unusual for manufacturing)

