/**
 * Service Capacity Configuration
 * Defines capacity metrics and rates for Cristina's services
 */

export const CRISTINA_SERVICE_CAPACITY = {
  certificates: {
    current: 12,
    monthly_target: 15,
    rate: 200,
    service_name: 'USMCA Certificate Generation',
    unit: 'certificates'
  },
  classifications: {
    current: 16,
    monthly_target: 20,
    rate: 150,
    service_name: 'HS Code Classification',
    unit: 'classifications'
  },
  clearance: {
    current: 8,
    monthly_target: 10,
    rate: 300,
    service_name: 'Customs Clearance',
    unit: 'clearances'
  },
  crisis: {
    current: 3,
    monthly_target: 5,
    rate: 650,
    service_name: 'Crisis Response',
    unit: 'incidents'
  }
};

export const SERVICE_DELIVERY_RATES = {
  usmca_certificate: {
    price: 200,
    timeline: '3-5 business days',
    currency: 'USD'
  },
  hs_classification: {
    price: 150,
    timeline: 'Same day',
    currency: 'USD'
  },
  customs_clearance: {
    price: 300,
    timeline: '1-3 business days',
    currency: 'USD'
  },
  crisis_response: {
    price: 650,
    timeline: 'Same day to 24 hours',
    currency: 'USD'
  }
};

export const PERFORMANCE_THRESHOLDS = {
  success_rate_min: 95.0,
  response_time_max: 400, // milliseconds
  avg_processing_days: 2.8
};