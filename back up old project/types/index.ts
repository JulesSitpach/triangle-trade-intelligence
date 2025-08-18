/**
 * TypeScript Type Definitions for Triangle Intelligence Platform
 * Production-ready type safety implementation
 */

// Environment and Configuration Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  ANTHROPIC_API_KEY?: string
  COMTRADE_API_KEY?: string
  SHIPPO_API_KEY?: string
  STRIPE_SECRET_KEY?: string
}

// Database Types
export interface ComtradeReference {
  id: number
  hs_code: string
  product_description: string
  base_tariff_rate: number
  product_category: string
  created_at: string
  updated_at: string
}

export interface USMCATariffRate {
  id: number
  hs_code: string
  hs_description: string
  usmca_rate: number
  triangle_eligible: boolean
  triangle_savings_potential: number
  rule_of_origin: string
  created_at: string
}

export interface WorkflowSession {
  id: string
  company_name: string
  business_type: string
  import_volume: string
  stage_completed: number
  intelligence_level: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CurrentMarketAlert {
  id: number
  alert_type: string
  country: string
  current_rate: number
  previous_rate: number
  change_percentage: number
  alert_message: string
  created_at: string
}

export interface APICache {
  id: number
  endpoint: string
  response_data: Record<string, any>
  cached_at: string
  expires_at: string
}

export interface HindsightPattern {
  id: number
  pattern_name: string
  business_type: string
  pattern_details: Record<string, any>
  confidence_score: number
  created_at: string
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DatabaseOperationResult<T = any> {
  data: T | null
  error: Error | null
  count?: number
}

// Intelligence System Types
export interface IntelligenceData {
  stable: {
    usmca: USMCAData
    patterns: PatternData
    ports?: PortData
    routes?: RouteData
  }
  volatile: {
    current: APIData
    rates?: ShippingData
  }
  recommendation: {
    savings: string
    confidence: number
    apiCallsMade: number
  }
  efficiency?: {
    apiCallsMade: number
    dataFromCache: boolean
  }
}

export interface USMCAData {
  source: string
  rate: number
  status: string
  apiCallNeeded: boolean
  confidence: number
}

export interface PatternData {
  source: string
  patterns: HindsightPattern[]
  confidence: number
  apiCallNeeded: boolean
}

export interface PortData {
  source: string
  ports: Port[]
  apiCallNeeded: boolean
  lastUpdated: string
}

export interface RouteData {
  source: string
  routes: TradeRoute[]
  apiCallNeeded: boolean
  note: string
}

export interface APIData {
  source: string
  data: any
  apiCallMade: boolean
  timestamp?: string
  cachedAt?: string
}

export interface ShippingData {
  source: string
  rates: ShippingRate[]
  apiCallMade: boolean
  timestamp?: string
}

// Business Logic Types
export interface Port {
  id: number
  port_name: string
  country: string
  region: string
  latitude: number
  longitude: number
  container_capacity: number
}

export interface TradeRoute {
  id: number
  route_name: string
  origin_country: string
  transit_country: string
  destination_country: string
  estimated_duration: number
  confidence_score: number
}

export interface ShippingRate {
  id: string
  provider: string
  service_level: string
  estimated_days: number
  amount: number
  currency: string
}

// User Interface Types
export interface BusinessProfile {
  companyName: string
  businessType: string
  importVolume: string
  state: string
  city: string
  zipCode: string
  primarySupplierCountry: string
  currentShippingPorts: string[]
  seasonalPatterns: string
  timelinePriority: string
  specialRequirements: string
}

export interface ProductInformation {
  description: string
  hsCode?: string
  category: string
  confidence: number
  tariffRate?: number
  usmcaRate?: number
  triangleEligible?: boolean
  triangleSavings?: number
}

export interface TriangleRoute {
  routeName: string
  originCountry: string
  transitCountry: string
  destinationCountry: string
  estimatedDuration: number
  savingsAmount: number
  confidenceScore: number
  intelligenceFactors: string[]
}

// Logging Types
export interface LogEntry {
  timestamp: string
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'
  message: string
  data?: any
  metadata?: any
}

export interface PerformanceMetrics {
  operation: string
  duration: number
  metadata?: Record<string, any>
}

export interface APICallMetrics {
  method: string
  endpoint: string
  duration: number
  status: number
}

export interface DatabaseMetrics {
  table: string
  operation: string
  duration: number
  recordCount?: number
}

// Error Types
export interface ApplicationError extends Error {
  code: string
  statusCode: number
  metadata?: Record<string, any>
}

// Utility Types
export type BusinessType = 
  | 'manufacturing'
  | 'electronics'
  | 'textiles'
  | 'automotive'
  | 'medical'
  | 'consumer_goods'
  | 'industrial'
  | 'other'

export type ImportVolume = 
  | 'Under $500K'
  | '$500K - $1M' 
  | '$1M - $5M'
  | '$5M - $25M'
  | 'Over $25M'

export type TimelinePriority = 
  | 'immediate'
  | 'within_30_days'
  | 'within_90_days'
  | 'flexible'

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export type CacheStrategy = 'forever' | 'daily' | 'hourly' | 'per_request'

// API Endpoint Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  database: 'connected' | 'disconnected'
  apis: Record<string, 'healthy' | 'unhealthy'>
}

export interface StatusResponse {
  system: {
    environment: string
    version: string
    uptime: number
  }
  database: {
    connected: boolean
    tables: number
    recordCount: number
  }
  apis: {
    [key: string]: {
      configured: boolean
      healthy: boolean
    }
  }
  performance: {
    cacheHitRate: number
    averageResponseTime: number
    apiCallReduction: number
  }
}

// Testing Types
export interface TestCase {
  name: string
  description: string
  input: any
  expected: any
  metadata?: Record<string, any>
}

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  metadata?: Record<string, any>
}