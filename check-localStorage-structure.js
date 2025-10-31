// Paste this in your browser console to check the data structure
const data = JSON.parse(localStorage.getItem('usmca_workflow_results'));
console.log('📊 Results data structure:', {
  hasUsmca: !!data?.usmca,
  qualified: data?.usmca?.qualified,
  hasSavings: !!data?.savings,
  annualSavings: data?.savings?.annual_savings,
  hasSection301: !!data?.savings?.section_301_exposure,
  isExposed: data?.savings?.section_301_exposure?.is_exposed,
  northAmericanContent: data?.usmca?.north_american_content,
  thresholdApplied: data?.usmca?.threshold_applied,
  margin: data?.usmca ? (data.usmca.north_american_content - data.usmca.threshold_applied) : null
});
