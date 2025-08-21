/**
 * EMERGENCY DATABASE OPTIMIZER
 * Implements query batching, pagination, and performance monitoring for 500K+ records
 * 
 * This addresses the core database performance issues causing Beast Master timeouts
 */

import { getSupabaseClient } from './lib/supabase-client.js';
import { logInfo, logError, logPerformance, logDBQuery } from './lib/production-logger.js';

export class EmergencyDatabaseOptimizer {
  static batchSize = 100; // Small batches to prevent timeouts
  static queryTimeout = 3000; // 3 second maximum per query
  static maxRetries = 2;
  
  /**
   * CRITICAL: Paginated query for trade_flows table (500K+ records)
   * Prevents full table scans that cause billion-millisecond timeouts
   */
  static async getTradeFlowsPaginated(filters = {}, limit = 50) {
    const startTime = Date.now();
    const supabase = getSupabaseClient();
    
    try {
      logInfo('EMERGENCY: Paginated trade flows query', { filters, limit });
      
      // Use optimized view instead of raw table
      let query = supabase
        .from('beast_master_trade_flows_fast') // Uses pre-filtered view
        .select('reporter_country, partner_country, hs_code, trade_value, confidence_level')
        .limit(limit)
        .abortSignal(AbortSignal.timeout(this.queryTimeout));
      
      // Apply filters only if provided (avoids unnecessary WHERE clauses)
      if (filters.reporterCountry) {
        query = query.eq('reporter_country', filters.reporterCountry);
      }
      
      if (filters.partnerCountry) {
        query = query.eq('partner_country', filters.partnerCountry);
      }
      
      if (filters.hsCode) {
        query = query.like('hs_code', `${filters.hsCode}%`);
      }
      
      // Always order by indexed column for performance
      query = query.order('trade_value', { ascending: false });
      
      const { data, error, count } = await query;
      
      const queryTime = Date.now() - startTime;
      
      if (error) {
        logError('Trade flows paginated query failed', { error: error.message, queryTime });
        throw error;
      }
      
      logDBQuery('beast_master_trade_flows_fast', 'PAGINATED_SELECT', queryTime, data?.length || 0);
      
      // Performance warning if query is still slow
      if (queryTime > 1000) {
        logError('Trade flows query exceeded 1s threshold', { queryTime, records: data?.length, filters });
      }
      
      return {
        data: data || [],
        count: data?.length || 0,
        queryTime: queryTime,
        source: 'EMERGENCY_PAGINATED_OPTIMIZED',
        performanceStatus: queryTime < 1000 ? 'GOOD' : queryTime < 2000 ? 'ACCEPTABLE' : 'POOR'
      };
      
    } catch (error) {
      const queryTime = Date.now() - startTime;
      logError('Emergency trade flows query failed', {
        error: error.message,
        queryTime: queryTime,
        filters: filters,
        timeout: queryTime >= this.queryTimeout ? 'TIMEOUT_EXCEEDED' : 'OTHER_ERROR'
      });
      
      return {
        data: [],
        count: 0,
        queryTime: queryTime,
        source: 'EMERGENCY_FALLBACK',
        error: error.message,
        performanceStatus: 'FAILED'
      };
    }
  }
  
  /**
   * CRITICAL: Batched workflow sessions query to prevent memory issues
   * Processes workflow sessions in small batches instead of loading all at once
   */
  static async getWorkflowSessionsBatched(businessType, maxBatches = 3) {
    const startTime = Date.now();
    const supabase = getSupabaseClient();
    const allSessions = [];
    let totalQueryTime = 0;
    
    try {
      logInfo('EMERGENCY: Batched workflow sessions query', { businessType, maxBatches });
      
      for (let batchIndex = 0; batchIndex < maxBatches; batchIndex++) {
        const batchStartTime = Date.now();
        const offset = batchIndex * this.batchSize;
        
        // Use optimized view with built-in filtering
        const { data: batchData, error } = await supabase
          .from('beast_master_similarity_fast')
          .select('business_type, supplier_country, import_volume, company_name, created_at')
          .eq('business_type', businessType)
          .range(offset, offset + this.batchSize - 1)
          .order('created_at', { ascending: false })
          .abortSignal(AbortSignal.timeout(1000)); // 1 second per batch
        
        const batchTime = Date.now() - batchStartTime;
        totalQueryTime += batchTime;
        
        if (error) {
          logError(`Workflow batch ${batchIndex + 1} failed`, { error: error.message, batchTime });
          break; // Stop processing batches on error
        }
        
        if (batchData && batchData.length > 0) {
          allSessions.push(...batchData);
          logInfo(`Batch ${batchIndex + 1} processed: ${batchData.length} records in ${batchTime}ms`);
        }
        
        // Stop if batch returned fewer records than batch size (end of data)
        if (!batchData || batchData.length < this.batchSize) {
          logInfo(`Reached end of data at batch ${batchIndex + 1}`);
          break;
        }
        
        // Performance safety: Stop if total time is getting too high
        if (totalQueryTime > 2000) {
          logError('Batched query exceeded 2s total time, stopping early', { totalQueryTime, batches: batchIndex + 1 });
          break;
        }
      }
      
      const overallTime = Date.now() - startTime;
      
      logDBQuery('beast_master_similarity_fast', 'BATCHED_SELECT', overallTime, allSessions.length);
      logPerformance('workflow_sessions_batched_query', overallTime, {
        totalRecords: allSessions.length,
        batchesProcessed: Math.min(maxBatches, Math.ceil(allSessions.length / this.batchSize)),
        averageTimePerBatch: totalQueryTime / maxBatches
      });
      
      return {
        data: allSessions,
        count: allSessions.length,
        queryTime: overallTime,
        source: 'EMERGENCY_BATCHED_OPTIMIZED',
        batchesProcessed: Math.ceil(allSessions.length / this.batchSize),
        performanceStatus: overallTime < 1000 ? 'EXCELLENT' : overallTime < 2000 ? 'GOOD' : 'ACCEPTABLE'
      };
      
    } catch (error) {
      const overallTime = Date.now() - startTime;
      logError('Emergency batched workflow sessions query failed', {
        error: error.message,
        queryTime: overallTime,
        recordsBeforeError: allSessions.length
      });
      
      // Return partial results if we got some data before error
      return {
        data: allSessions,
        count: allSessions.length,
        queryTime: overallTime,
        source: 'EMERGENCY_PARTIAL_BATCHED',
        error: error.message,
        performanceStatus: 'PARTIAL_FAILURE',
        partialResults: allSessions.length > 0
      };
    }
  }
  
  /**
   * CRITICAL: Lightweight data quality check for performance monitoring
   * Monitors database performance without causing additional load
   */
  static async performLightweightHealthCheck() {
    const startTime = Date.now();
    const results = {
      tradeFlows: { status: 'UNKNOWN', time: 0, error: null },
      workflowSessions: { status: 'UNKNOWN', time: 0, error: null },
      comtradeReference: { status: 'UNKNOWN', time: 0, error: null },
      overall: { status: 'UNKNOWN', time: 0 }
    };
    
    try {
      const supabase = getSupabaseClient();
      
      // Test 1: Trade flows (most critical - 500K+ records)
      const tradeFlowStart = Date.now();
      try {
        const { data, error } = await supabase
          .from('beast_master_trade_flows_fast')
          .select('reporter_country')
          .limit(1)
          .abortSignal(AbortSignal.timeout(1000));
          
        results.tradeFlows.time = Date.now() - tradeFlowStart;
        results.tradeFlows.status = error ? 'ERROR' : (results.tradeFlows.time < 500 ? 'EXCELLENT' : 'ACCEPTABLE');
        results.tradeFlows.error = error?.message;
      } catch (error) {
        results.tradeFlows.time = Date.now() - tradeFlowStart;
        results.tradeFlows.status = 'TIMEOUT';
        results.tradeFlows.error = error.message;
      }
      
      // Test 2: Workflow sessions  
      const workflowStart = Date.now();
      try {
        const { data, error } = await supabase
          .from('beast_master_similarity_fast')
          .select('business_type')
          .limit(1)
          .abortSignal(AbortSignal.timeout(1000));
          
        results.workflowSessions.time = Date.now() - workflowStart;
        results.workflowSessions.status = error ? 'ERROR' : (results.workflowSessions.time < 300 ? 'EXCELLENT' : 'ACCEPTABLE');
        results.workflowSessions.error = error?.message;
      } catch (error) {
        results.workflowSessions.time = Date.now() - workflowStart;
        results.workflowSessions.status = 'TIMEOUT';
        results.workflowSessions.error = error.message;
      }
      
      // Test 3: Comtrade reference
      const comtradeStart = Date.now();
      try {
        const { data, error } = await supabase
          .from('comtrade_reference')
          .select('product_category')
          .limit(1)
          .abortSignal(AbortSignal.timeout(1000));
          
        results.comtradeReference.time = Date.now() - comtradeStart;
        results.comtradeReference.status = error ? 'ERROR' : (results.comtradeReference.time < 200 ? 'EXCELLENT' : 'ACCEPTABLE');
        results.comtradeReference.error = error?.message;
      } catch (error) {
        results.comtradeReference.time = Date.now() - comtradeStart;
        results.comtradeReference.status = 'TIMEOUT';
        results.comtradeReference.error = error.message;
      }
      
      // Overall assessment
      const overallTime = Date.now() - startTime;
      results.overall.time = overallTime;
      
      const allStatuses = [results.tradeFlows.status, results.workflowSessions.status, results.comtradeReference.status];
      const hasTimeouts = allStatuses.includes('TIMEOUT');
      const hasErrors = allStatuses.includes('ERROR');
      
      if (hasTimeouts) {
        results.overall.status = 'CRITICAL_TIMEOUTS';
      } else if (hasErrors) {
        results.overall.status = 'ERRORS_DETECTED';
      } else if (overallTime < 1000) {
        results.overall.status = 'HEALTHY';
      } else {
        results.overall.status = 'PERFORMANCE_ISSUES';
      }
      
      logPerformance('database_health_check', overallTime, {
        tradeFlowsTime: results.tradeFlows.time,
        workflowTime: results.workflowSessions.time,
        comtradeTime: results.comtradeReference.time,
        overallStatus: results.overall.status
      });
      
      return results;
      
    } catch (error) {
      const overallTime = Date.now() - startTime;
      results.overall.time = overallTime;
      results.overall.status = 'CRITICAL_FAILURE';
      results.overall.error = error.message;
      
      logError('Database health check failed', {
        error: error.message,
        time: overallTime
      });
      
      return results;
    }
  }
  
  /**
   * EMERGENCY: Performance monitoring and alerting
   * Provides real-time performance metrics for Beast Master optimization
   */
  static async getPerformanceMetrics() {
    const healthCheck = await this.performLightweightHealthCheck();
    
    // Test paginated queries
    const paginatedTest = await this.getTradeFlowsPaginated({ reporterCountry: 'CN' }, 10);
    const batchedTest = await this.getWorkflowSessionsBatched('Electronics', 1);
    
    return {
      timestamp: new Date().toISOString(),
      healthCheck: healthCheck,
      paginatedQuery: {
        time: paginatedTest.queryTime,
        records: paginatedTest.count,
        status: paginatedTest.performanceStatus
      },
      batchedQuery: {
        time: batchedTest.queryTime,
        records: batchedTest.count,
        status: batchedTest.performanceStatus
      },
      recommendations: this.generatePerformanceRecommendations(healthCheck, paginatedTest, batchedTest),
      emergencyMode: true
    };
  }
  
  /**
   * Generate performance recommendations based on test results
   */
  static generatePerformanceRecommendations(healthCheck, paginatedTest, batchedTest) {
    const recommendations = [];
    
    // Check for critical timeouts
    if (healthCheck.overall.status === 'CRITICAL_TIMEOUTS') {
      recommendations.push({
        priority: 'CRITICAL',
        issue: 'Database queries timing out',
        solution: 'Implement emergency query limits and fallback modes',
        impact: 'Beast Master system unusable'
      });
    }
    
    // Check paginated query performance
    if (paginatedTest.queryTime > 1000) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Trade flows queries too slow',
        solution: 'Add additional database indexes on reporter_country, partner_country',
        impact: 'Similarity intelligence degraded'
      });
    }
    
    // Check batched query performance  
    if (batchedTest.queryTime > 2000) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Workflow sessions queries too slow',
        solution: 'Implement smaller batch sizes or additional filtering',
        impact: 'Pattern matching intelligence degraded'
      });
    }
    
    // Overall system health
    if (healthCheck.overall.time > 3000) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Overall database response time high',
        solution: 'Consider connection pooling optimization',
        impact: 'General system performance affected'
      });
    }
    
    // Success case
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'INFO',
        issue: 'No critical performance issues detected',
        solution: 'Continue monitoring and maintain current optimizations',
        impact: 'System performing within acceptable parameters'
      });
    }
    
    return recommendations;
  }
}

export default EmergencyDatabaseOptimizer;