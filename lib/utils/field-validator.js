
/**
 * Database Field Validator - Handles field mapping inconsistencies
 */
export function validateAndMapFields(records) {
  if (!Array.isArray(records)) {
    records = [records];
  }

  return records.map(record => {
    if (!record) return record;

    // Ensure usmca_rate is always present
    if (record.usmca_rate === undefined && record.usmca_tariff_rate !== undefined) {
      record.usmca_rate = record.usmca_tariff_rate;
    }
    
    // Provide fallback for missing usmca_rate
    if (record.usmca_rate === undefined || record.usmca_rate === null) {
      record.usmca_rate = 0; // Default to 0 for USMCA qualifying products
    }

    // Ensure mfn_rate is present
    if (record.mfn_rate === undefined && record.mfn_tariff_rate !== undefined) {
      record.mfn_rate = record.mfn_tariff_rate;
    }

    // Add computed savings
    if (record.mfn_rate !== undefined && record.usmca_rate !== undefined) {
      record.savings_percent = Math.max(0, (record.mfn_rate - record.usmca_rate));
    }

    return record;
  });
}

// Export for use in APIs
export default { validateAndMapFields };
