/**
 * Classification Scoring Configuration
 * Used for AI classification confidence and tariff lookup fallbacks
 * NO HARDCODING: All values externalized to config
 */

export const TECHNICAL_TERMS = [
  'voltage',
  'material',
  'dimensions',
  'weight',
  'capacity',
  'specification'
];

export const USMCA_COUNTRIES = [
  'US',
  'CA',
  'MX',
  'United States',
  'Canada',
  'Mexico'
];

export const PRODUCT_CATEGORY_TERMS = {
  // Food & Agriculture (Chapter 08)
  food: ['fresh', 'fruit', 'mango', 'apple', 'banana', 'citrus', 'frozen', 'dried', 'canned'],

  // Electronics (Chapter 85)
  electronics: ['electronic', 'circuit', 'board', 'component', 'wire', 'cable', 'connector'],

  // Textiles (Chapters 61-62)
  textiles: ['cotton', 'shirt', 'clothing', 'apparel', 'fabric', 'textile', 'garment'],

  // Plastics (Chapter 39)
  plastics: ['plastic', 'polymer', 'packaging', 'container', 'film', 'sheet'],

  // Machinery (Chapter 84)
  machinery: ['machine', 'engine', 'pump', 'bearing', 'gear', 'motor'],

  // Automotive (Chapter 87)
  automotive: ['vehicle', 'car', 'automotive', 'truck', 'engine', 'part']
};

export function getTechnicalTerms() {
  return TECHNICAL_TERMS;
}

export function getUSMCACountries() {
  return USMCA_COUNTRIES;
}

export function getProductCategoryTerms() {
  return PRODUCT_CATEGORY_TERMS;
}
