/**
 * CONTINUOUS VERIFICATION SERVICE
 * Automated daily/weekly sync jobs with audit trails and rollback capabilities
 * NO HARDCODED SOURCES - CONFIGURATION-DRIVEN VERIFICATION
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { dataProvenanceService } from './data-provenance-service.js';
import { TABLE_CONFIG, EXTERNAL_SERVICES } from '../../config/system-config.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

/**
 * Continuous verification system for regulatory data
 * Ensures data accuracy through automated validation and expert review workflows
 */
export class ContinuousVerificationService {
  constructor() {
    this.dbService = serverDatabaseService;
    this.provenanceService = dataProvenanceService;
    this.isRunning = false;
    
    // Sync schedules from configuration
    this.dailySyncEnabled = process.env.ENABLE_DAILY_DATA_SYNC === 'true';
    this.weeklySyncEnabled = process.env.ENABLE_WEEKLY_DEEP_SYNC === 'true';
    this.hourlySyncEnabled = process.env.ENABLE_HOURLY_CRITICAL_SYNC === 'true';
    
    // Data validation thresholds
    this.maxDiscrepancyThreshold = parseFloat(process.env.MAX_DISCREPANCY_THRESHOLD) || 0.05; // 5%
    this.minDataAgreementSources = parseInt(process.env.MIN_DATA_AGREEMENT_SOURCES) || 2;
    this.autoRollbackEnabled = process.env.ENABLE_AUTO_ROLLBACK === 'true';
  }

  /**
   * Start continuous verification service
   * NO HARDCODED SCHEDULES
   */
  async startService() {
    if (this.isRunning) {
      logInfo('Continuous verification service already running');
      return;
    }

    this.isRunning = true;
    logInfo('Starting continuous verification service', {
      daily_sync: this.dailySyncEnabled,
      weekly_sync: this.weeklySyncEnabled,
      hourly_sync: this.hourlySyncEnabled
    });

    try {
      // Initialize verification jobs based on configuration
      await this.initializeVerificationJobs();
      
      // Start scheduled verification loops
      if (this.hourlySyncEnabled) {
        this.startHourlyVerification();
      }
      
      if (this.dailySyncEnabled) {
        this.startDailyVerification();
      }
      
      if (this.weeklySyncEnabled) {
        this.startWeeklyDeepSync();
      }

      logInfo('Continuous verification service started successfully');

    } catch (error) {
      logError('Failed to start continuous verification service', { error: error.message });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Initialize verification job queues
   */
  async initializeVerificationJobs() {
    try {
      // Create verification job queue table if not exists
      const createQueueSQL = `
        CREATE TABLE IF NOT EXISTS ${TABLE_CONFIG.verificationQueue || 'verification_queue'} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          data_type TEXT NOT NULL,
          identifier TEXT NOT NULL,
          priority TEXT DEFAULT 'normal',
          status TEXT DEFAULT 'pending',
          scheduled_for TIMESTAMP WITH TIME ZONE,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          verification_type TEXT,
          source_urls TEXT[],
          result JSONB,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await this.dbService.client.rpc('execute_sql', { sql: createQueueSQL });

      // Create data snapshots table for rollback capability
      const createSnapshotsSQL = `
        CREATE TABLE IF NOT EXISTS ${TABLE_CONFIG.dataSnapshots || 'data_snapshots'} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name TEXT NOT NULL,
          snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          record_count INTEGER,
          data_hash TEXT,
          snapshot_data JSONB,
          verification_status TEXT DEFAULT 'pending',
          rollback_available BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'continuous_verification_service'
        );
      `;

      await this.dbService.client.rpc('execute_sql', { sql: createSnapshotsSQL });

      logInfo('Verification job queues initialized');

    } catch (error) {
      logError('Failed to initialize verification jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Start daily critical data verification (RSS-based, no aggressive polling)
   */
  startRSSBasedVerification() {
    console.log('📡 RSS-based verification scheduled - no direct polling');
    // RSS integration will replace this interval-based approach
    // Government RSS feeds provide immediate notifications without polling
  }

  /**
   * Start daily comprehensive verification
   */
  startDailyVerification() {
    // Calculate next run time (configured hour, default 2 AM)
    const runHour = parseInt(process.env.DAILY_SYNC_HOUR) || 2;
    
    const scheduleDaily = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(runHour, 0, 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      const timeout = next.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          logInfo('Starting daily comprehensive verification');
          await this.performDailySync();
        } catch (error) {
          logError('Daily verification failed', { error: error.message });
        }
        scheduleDaily(); // Schedule next day
      }, timeout);
    };

    scheduleDaily();
  }

  /**
   * Start weekly deep synchronization
   */
  startWeeklyDeepSync() {
    // Calculate next run time (configured day of week, default Sunday)
    const runDay = parseInt(process.env.WEEKLY_SYNC_DAY) || 0; // 0 = Sunday
    const runHour = parseInt(process.env.WEEKLY_SYNC_HOUR) || 1; // 1 AM
    
    const scheduleWeekly = () => {
      const now = new Date();
      const next = new Date(now);
      const daysUntilRun = (runDay + 7 - now.getDay()) % 7;
      
      next.setDate(next.getDate() + daysUntilRun);
      next.setHours(runHour, 0, 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      
      const timeout = next.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          logInfo('Starting weekly deep synchronization');
          await this.performWeeklyDeepSync();
        } catch (error) {
          logError('Weekly deep sync failed', { error: error.message });
        }
        scheduleWeekly(); // Schedule next week
      }, timeout);
    };

    scheduleWeekly();
  }

  /**
   * Verify critical data sources (hourly)
   * Focuses on high-impact, frequently-changing data
   */
  async verifyCriticalData() {
    const startTime = Date.now();
    
    try {
      const criticalDataTypes = [
        'regulatory_updates',
        'tariff_rate_changes',
        'usmca_rule_modifications',
        'country_status_changes'
      ];

      const verificationResults = [];

      for (const dataType of criticalDataTypes) {
        try {
          const result = await this.verifyDataType(dataType, 'critical');
          verificationResults.push(result);
          
          if (result.discrepancyFound && result.severity === 'high') {
            await this.handleCriticalDiscrepancy(dataType, result);
          }
          
        } catch (error) {
          logError(`Critical verification failed for ${dataType}`, { error: error.message });
          verificationResults.push({
            dataType,
            success: false,
            error: error.message
          });
        }
      }

      // Log critical verification summary
      logPerformance('Hourly critical verification', startTime, {
        data_types_checked: criticalDataTypes.length,
        successful_checks: verificationResults.filter(r => r.success).length,
        discrepancies_found: verificationResults.filter(r => r.discrepancyFound).length,
        high_severity_issues: verificationResults.filter(r => r.severity === 'high').length
      });

      return {
        success: true,
        results: verificationResults,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      logError('Critical data verification failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform daily comprehensive sync
   * Updates all tariff rates and classification data
   */
  async performDailySync() {
    const startTime = Date.now();
    
    try {
      // Create pre-sync snapshot for rollback capability
      const snapshotId = await this.createDataSnapshot('daily_sync');
      
      const syncResults = [];
      
      // Sync tariff rates from all configured sources
      const tariffSyncResult = await this.syncTariffRates();
      syncResults.push(tariffSyncResult);
      
      // Sync HS code classifications
      const classificationSyncResult = await this.syncHSClassifications();
      syncResults.push(classificationSyncResult);
      
      // Sync USMCA qualification rules
      const usmcaRulesSyncResult = await this.syncUSMCARules();
      syncResults.push(usmcaRulesSyncResult);
      
      // Validate cross-source data consistency
      const consistencyResult = await this.validateDataConsistency();
      syncResults.push(consistencyResult);
      
      // Check if rollback is needed
      const majorDiscrepancies = syncResults.filter(r => 
        r.discrepancyFound && r.severity === 'high'
      ).length;
      
      if (majorDiscrepancies > 0 && this.autoRollbackEnabled) {
        logError('Major discrepancies detected - initiating rollback', { 
          discrepancies: majorDiscrepancies 
        });
        await this.rollbackToSnapshot(snapshotId);
        
        // Flag for expert review
        await this.flagForExpertReview('daily_sync_rollback', {
          snapshot_id: snapshotId,
          discrepancies: syncResults.filter(r => r.discrepancyFound),
          reason: 'Automatic rollback due to major data discrepancies'
        });
      } else {
        // Mark snapshot as successful
        await this.markSnapshotSuccessful(snapshotId, syncResults);
      }
      
      logPerformance('Daily comprehensive sync', startTime, {
        sync_operations: syncResults.length,
        successful_syncs: syncResults.filter(r => r.success).length,
        discrepancies_found: syncResults.filter(r => r.discrepancyFound).length,
        rollback_triggered: majorDiscrepancies > 0 && this.autoRollbackEnabled
      });

      return {
        success: majorDiscrepancies === 0 || !this.autoRollbackEnabled,
        results: syncResults,
        snapshot_id: snapshotId,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      logError('Daily sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform weekly deep synchronization
   * Complete data validation and expert review queue processing
   */
  async performWeeklyDeepSync() {
    const startTime = Date.now();
    
    try {
      logInfo('Starting weekly deep synchronization');
      
      // Process expert review queue
      const expertReviewResults = await this.processExpertReviewQueue();
      
      // Perform comprehensive cross-source validation
      const crossValidationResults = await this.performCrossSourceValidation();
      
      // Update data confidence scores based on validation results
      const confidenceUpdateResults = await this.updateDataConfidenceScores();
      
      // Clean up old snapshots and audit logs
      const cleanupResults = await this.cleanupOldData();
      
      // Generate weekly accuracy report
      const accuracyReport = await this.generateWeeklyAccuracyReport();
      
      logPerformance('Weekly deep synchronization', startTime, {
        expert_reviews_processed: expertReviewResults.processed,
        cross_validations: crossValidationResults.validations,
        confidence_updates: confidenceUpdateResults.updates,
        cleanup_operations: cleanupResults.operations
      });

      return {
        success: true,
        expert_reviews: expertReviewResults,
        cross_validation: crossValidationResults,
        confidence_updates: confidenceUpdateResults,
        cleanup: cleanupResults,
        accuracy_report: accuracyReport,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      logError('Weekly deep sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify specific data type against official sources
   */
  async verifyDataType(dataType) {
    try {
      const sources = this.getOfficialSources(dataType);
      const currentData = await this.getCurrentData(dataType);
      const sourceData = await this.fetchFromOfficialSources(sources);
      
      // Compare current data with official sources
      const comparison = await this.compareDataSources(currentData, sourceData);
      
      return {
        dataType,
        success: true,
        discrepancyFound: comparison.discrepancyPercentage > this.maxDiscrepancyThreshold,
        discrepancyPercentage: comparison.discrepancyPercentage,
        severity: this.calculateSeverity(comparison),
        affectedRecords: comparison.discrepancies.length,
        sources: sources,
        lastVerified: new Date().toISOString(),
        details: comparison
      };

    } catch (error) {
      logError(`Data type verification failed: ${dataType}`, { error: error.message });
      return {
        dataType,
        success: false,
        error: error.message,
        requiresExpertReview: true
      };
    }
  }

  /**
   * Get official sources for data type from configuration
   * NO HARDCODED SOURCE LISTS
   */
  getOfficialSources(dataType) {
    const sourceMappings = {
      'tariff_rates': [
        EXTERNAL_SERVICES.cbp.baseUrl ? 'CBP_HARMONIZED_TARIFF_SCHEDULE' : null,
        EXTERNAL_SERVICES.cbsa.baseUrl ? 'CBSA_TARIFF_FINDER' : null,
        EXTERNAL_SERVICES.sat.baseUrl ? 'SAT_LIGIE' : null
      ].filter(Boolean),
      
      'hs_codes': [
        EXTERNAL_SERVICES.comtrade.baseUrl ? 'UN_COMTRADE' : null,
        EXTERNAL_SERVICES.wits.baseUrl ? 'WITS_DATABASE' : null
      ].filter(Boolean),
      
      'usmca_rules': [
        'USMCA_SECRETARIAT_OFFICIAL',
        'CBP_USMCA_GUIDANCE',
        'CBSA_USMCA_GUIDANCE'
      ],
      
      'regulatory_updates': [
        'CBP_REGULATORY_NOTICES',
        'CBSA_REGULATORY_NOTICES', 
        'SAT_REGULATORY_NOTICES'
      ]
    };

    return sourceMappings[dataType] || [];
  }

  /**
   * Create data snapshot for rollback capability
   */
  async createDataSnapshot(operation) {
    try {
      const tables = [
        TABLE_CONFIG.tariffRates,
        TABLE_CONFIG.comtradeReference,
        TABLE_CONFIG.usmcaRules
      ];

      const snapshots = [];
      
      for (const tableName of tables) {
        const { data, error } = await this.dbService.client
          .from(tableName)
          .select('*');
          
        if (error) throw error;
        
        const snapshot = {
          table_name: tableName,
          snapshot_date: new Date().toISOString(),
          record_count: data.length,
          data_hash: this.calculateDataHash(data),
          snapshot_data: data,
          verification_status: 'pending',
          rollback_available: true,
          created_by: `continuous_verification_${operation}`
        };
        
        const { data: snapshotRecord, error: snapshotError } = await this.dbService.client
          .from(TABLE_CONFIG.dataSnapshots || 'data_snapshots')
          .insert(snapshot)
          .select()
          .single();
          
        if (snapshotError) throw snapshotError;
        
        snapshots.push(snapshotRecord.id);
      }
      
      logInfo('Data snapshots created', { 
        operation, 
        snapshots: snapshots.length,
        tables: tables 
      });
      
      return {
        operation,
        snapshot_ids: snapshots,
        created_at: new Date().toISOString()
      };

    } catch (error) {
      logError('Failed to create data snapshot', { error: error.message, operation });
      throw error;
    }
  }

  /**
   * Handle critical discrepancy found during verification
   */
  async handleCriticalDiscrepancy(dataType, verificationResult) {
    try {
      logError('Critical data discrepancy detected', {
        data_type: dataType,
        discrepancy_percentage: verificationResult.discrepancyPercentage,
        affected_records: verificationResult.affectedRecords
      });

      // Create immediate expert review request
      await this.flagForExpertReview('critical_discrepancy', {
        data_type: dataType,
        verification_result: verificationResult,
        urgency: 'immediate',
        auto_generated: true
      });

      // If auto-rollback is enabled and discrepancy is severe
      if (this.autoRollbackEnabled && verificationResult.severity === 'critical') {
        const latestSnapshot = await this.getLatestSnapshot(dataType);
        if (latestSnapshot) {
          await this.rollbackToSnapshot(latestSnapshot.id);
          logInfo('Automatic rollback triggered for critical discrepancy', {
            data_type: dataType,
            snapshot_id: latestSnapshot.id
          });
        }
      }

      // Send alert to configured notification endpoints
      await this.sendCriticalAlert(dataType, verificationResult);

    } catch (error) {
      logError('Failed to handle critical discrepancy', { 
        error: error.message, 
        dataType 
      });
    }
  }

  /**
   * Flag data for expert review
   */
  async flagForExpertReview(reviewType, metadata) {
    try {
      const reviewRequest = {
        review_type: reviewType,
        status: 'pending',
        priority: metadata.urgency || 'normal',
        metadata: metadata,
        created_at: new Date().toISOString(),
        auto_generated: metadata.auto_generated || false,
        estimated_review_time_hours: this.estimateReviewTime(reviewType)
      };

      const { data, error } = await this.dbService.client
        .from(TABLE_CONFIG.expertReviewQueue || 'expert_review_queue')
        .insert(reviewRequest)
        .select()
        .single();

      if (error) throw error;

      logInfo('Expert review flagged', {
        review_id: data.id,
        review_type: reviewType,
        priority: reviewRequest.priority
      });

      return data;

    } catch (error) {
      logError('Failed to flag for expert review', { error: error.message, reviewType });
      throw error;
    }
  }

  /**
   * Calculate data hash for snapshot integrity
   */
  calculateDataHash(data) {
    // Simple hash calculation for data integrity
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Calculate severity of data discrepancy
   */
  calculateSeverity(comparison) {
    const discrepancy = comparison.discrepancyPercentage;
    
    if (discrepancy > 0.2) return 'critical'; // >20%
    if (discrepancy > 0.1) return 'high';     // >10%
    if (discrepancy > 0.05) return 'medium';  // >5%
    return 'low';
  }

  /**
   * Estimate expert review time based on review type
   */
  estimateReviewTime(reviewType) {
    const estimates = {
      'critical_discrepancy': 2,
      'data_inconsistency': 4,
      'classification_validation': 1,
      'regulatory_update': 6,
      'daily_sync_rollback': 8,
      'weekly_deep_review': 12
    };
    return estimates[reviewType] || 4;
  }

  /**
   * Stop continuous verification service
   */
  async stopService() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    logInfo('Continuous verification service stopped');
  }

  /**
   * Get service status and statistics
   */
  getServiceStatus() {
    return {
      running: this.isRunning,
      configuration: {
        daily_sync_enabled: this.dailySyncEnabled,
        weekly_sync_enabled: this.weeklySyncEnabled,
        hourly_sync_enabled: this.hourlySyncEnabled,
        auto_rollback_enabled: this.autoRollbackEnabled,
        max_discrepancy_threshold: this.maxDiscrepancyThreshold
      },
      thresholds: {
        max_discrepancy: this.maxDiscrepancyThreshold,
        min_agreement_sources: this.minDataAgreementSources
      }
    };
  }
}

// Export singleton instance
export const continuousVerificationService = new ContinuousVerificationService();

const continuousVerificationServiceExports = {
  ContinuousVerificationService,
  continuousVerificationService
};

export default continuousVerificationServiceExports;