/**
 * SMART RSS MONITORING SYSTEM
 * Adaptive polling frequency based on crisis detection and business hours
 * Scales to thousands of users with minimal server load
 */

import { logInfo, logError } from '../utils/production-logger.js';

class SmartRSSMonitor {
  constructor() {
    this.currentMode = 'baseline';
    this.crisisStartTime = null;
    this.monitoringInterval = null;
    
    // Crisis keywords that trigger high-frequency polling
    this.crisisKeywords = [
      'section 301',
      'trump tariff', 
      'usmca withdrawal',
      'trade war',
      'emergency tariff',
      'cbp implements',
      'usitc announces',
      'ustr review'
    ];
    
    // Government RSS feeds to monitor
    this.rssFeeds = [
      {
        url: 'https://www.cbp.gov/newsroom/rss',
        name: 'CBP News',
        priority: 'high'
      },
      {
        url: 'https://www.usitc.gov/press_room/news_releases/rss',
        name: 'USITC Press Releases', 
        priority: 'critical'
      },
      {
        url: 'https://ustr.gov/about-us/policy-offices/press-office/rss',
        name: 'USTR Press',
        priority: 'high'
      }
    ];

    this.alertQueue = [];
    this.lastProcessedItems = new Map(); // Prevent duplicate processing
  }

  /**
   * Get adaptive polling frequency based on current mode and time
   */
  getPollingFrequency() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isHoliday = this.isGovernmentHoliday(now);

    // Crisis mode: High-frequency polling for 48 hours
    if (this.currentMode === 'crisis') {
      return 15 * 60 * 1000; // 15 minutes
    }

    // Weekend: Minimal government activity
    if (isWeekend) {
      return 6 * 60 * 60 * 1000; // 6 hours
    }

    // Government holidays: Very low activity
    if (isHoliday) {
      return 12 * 60 * 60 * 1000; // 12 hours
    }

    // Overnight (11PM - 7AM EST): Low activity
    if (hour < 7 || hour > 23) {
      return 8 * 60 * 60 * 1000; // 8 hours
    }

    // Business hours baseline
    return 4 * 60 * 60 * 1000; // 4 hours
  }

  /**
   * Check if date is a US government holiday
   */
  isGovernmentHoliday(date) {
    const holidays = [
      '2025-01-01', // New Year's Day
      '2025-01-20', // Martin Luther King Jr. Day
      '2025-02-17', // Presidents' Day
      '2025-05-26', // Memorial Day
      '2025-07-04', // Independence Day
      '2025-09-01', // Labor Day
      '2025-10-13', // Columbus Day
      '2025-11-11', // Veterans Day
      '2025-11-27', // Thanksgiving
      '2025-12-25'  // Christmas
    ];

    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  }

  /**
   * Start the smart monitoring system
   */
  startMonitoring() {
    logInfo('Starting smart RSS monitoring system', {
      initialMode: this.currentMode,
      feedCount: this.rssFeeds.length,
      pollingFrequency: this.getPollingFrequency() / 1000 / 60 + ' minutes'
    });

    this.scheduleNextCheck();
  }

  /**
   * Schedule the next RSS check based on adaptive frequency
   */
  scheduleNextCheck() {
    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
    }

    const frequency = this.getPollingFrequency();
    
    this.monitoringInterval = setTimeout(async () => {
      try {
        await this.procesAllFeeds();
        this.scheduleNextCheck(); // Schedule next check
      } catch (error) {
        logError('RSS monitoring error', error);
        // Retry in 30 minutes on error
        this.monitoringInterval = setTimeout(() => this.scheduleNextCheck(), 30 * 60 * 1000);
      }
    }, frequency);

    logInfo('Next RSS check scheduled', {
      mode: this.currentMode,
      nextCheckIn: frequency / 1000 / 60 + ' minutes',
      scheduledTime: new Date(Date.now() + frequency).toLocaleTimeString()
    });
  }

  /**
   * Process all RSS feeds for crisis detection
   */
  async procesAllFeeds() {
    logInfo('Processing RSS feeds', {
      mode: this.currentMode,
      feedCount: this.rssFeeds.length
    });

    const feedPromises = this.rssFeeds.map(feed => this.processSingleFeed(feed));
    const feedResults = await Promise.allSettled(feedPromises);

    let totalItems = 0;
    let crisisItemsFound = 0;

    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalItems += result.value.itemCount;
        crisisItemsFound += result.value.crisisCount;
      } else {
        logError(`Failed to process feed: ${this.rssFeeds[index].name}`, result.reason);
      }
    });

    logInfo('RSS feed processing completed', {
      totalItems,
      crisisItemsFound,
      currentMode: this.currentMode,
      alertsQueued: this.alertQueue.length
    });

    return {
      success: true,
      totalItems,
      crisisItemsFound,
      alertsQueued: this.alertQueue.length
    };
  }

  /**
   * Process a single RSS feed
   */
  async processSingleFeed(feed) {
    try {
      // In production, this would fetch the actual RSS feed
      // For now, simulate RSS processing
      const mockItems = this.generateMockRSSItems(feed);
      
      let itemCount = 0;
      let crisisCount = 0;

      for (const item of mockItems) {
        itemCount++;
        
        // Skip if already processed
        const itemHash = this.generateItemHash(item);
        if (this.lastProcessedItems.has(itemHash)) {
          continue;
        }

        // Check for crisis keywords
        const isCrisis = this.detectCrisisContent(item);
        if (isCrisis) {
          crisisCount++;
          await this.handleCrisisDetection(item, feed);
        }

        // Mark as processed
        this.lastProcessedItems.set(itemHash, Date.now());
      }

      return { itemCount, crisisCount };

    } catch (error) {
      logError(`Error processing RSS feed: ${feed.name}`, error);
      return { itemCount: 0, crisisCount: 0 };
    }
  }

  /**
   * Generate mock RSS items for testing (replace with actual RSS parsing)
   */
  generateMockRSSItems(feed) {
    // In crisis mode, occasionally return crisis items for testing
    if (this.currentMode === 'crisis' && Math.random() < 0.3) {
      return [{
        title: `${feed.name}: Section 301 Electronics Tariff Investigation`,
        description: 'USITC announces investigation of electronics imports with potential 25% tariff rates',
        link: `${feed.url}/crisis-announcement`,
        pubDate: new Date().toISOString(),
        guid: `crisis-${Date.now()}-${Math.random()}`
      }];
    }

    // Normal mode: minimal items
    if (Math.random() < 0.1) {
      return [{
        title: `${feed.name}: Routine Trade Update`,
        description: 'Standard trade compliance announcement',
        link: `${feed.url}/routine-update`,
        pubDate: new Date().toISOString(),
        guid: `routine-${Date.now()}-${Math.random()}`
      }];
    }

    return []; // Most checks return no new items
  }

  /**
   * Detect crisis keywords in RSS content
   */
  detectCrisisContent(item) {
    const content = `${item.title} ${item.description}`.toLowerCase();
    return this.crisisKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Handle crisis detection and escalate monitoring
   */
  async handleCrisisDetection(item, feed) {
    logInfo('Crisis detected in RSS feed', {
      feedName: feed.name,
      itemTitle: item.title,
      currentMode: this.currentMode
    });

    // Escalate to crisis mode if not already
    if (this.currentMode !== 'crisis') {
      this.escalateToCrisisMode();
    }

    // Queue crisis alert for processing
    this.alertQueue.push({
      type: 'crisis',
      source: feed,
      item: item,
      detectedAt: new Date().toISOString(),
      processedAt: null
    });

    // In production, trigger crisis alert service
    try {
      await this.triggerCrisisProcessing(item, feed);
    } catch (error) {
      logError('Failed to trigger crisis processing', error);
    }
  }

  /**
   * Escalate to crisis mode with 15-minute polling
   */
  escalateToCrisisMode() {
    logInfo('Escalating to crisis monitoring mode', {
      previousMode: this.currentMode,
      newPollingFrequency: '15 minutes'
    });

    this.currentMode = 'crisis';
    this.crisisStartTime = Date.now();

    // Auto-return to baseline after 48 hours
    setTimeout(() => {
      this.returnToBaselineMode();
    }, 48 * 60 * 60 * 1000);

    // Immediately reschedule with crisis frequency
    this.scheduleNextCheck();
  }

  /**
   * Return to baseline monitoring mode
   */
  returnToBaselineMode() {
    logInfo('Returning to baseline monitoring mode', {
      previousMode: this.currentMode,
      crisisModeDuration: this.crisisStartTime ? 
        (Date.now() - this.crisisStartTime) / (60 * 60 * 1000) + ' hours' : 'unknown'
    });

    this.currentMode = 'baseline';
    this.crisisStartTime = null;

    // Reschedule with baseline frequency
    this.scheduleNextCheck();
  }

  /**
   * Trigger crisis alert processing
   */
  async triggerCrisisProcessing(item, feed) {
    // This would integrate with your crisis alert service
    logInfo('Triggering crisis alert processing', {
      feedName: feed.name,
      itemTitle: item.title
    });
    
    // Return mock result for now
    return {
      success: true,
      alertsGenerated: Math.floor(Math.random() * 10) + 1,
      estimatedImpact: `$${(Math.random() * 500000 + 100000).toFixed(0)}`
    };
  }

  /**
   * Generate unique hash for RSS item to prevent duplicate processing
   */
  generateItemHash(item) {
    return `${item.link}-${item.pubDate}`;
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      currentMode: this.currentMode,
      pollingFrequency: this.getPollingFrequency() / 1000 / 60 + ' minutes',
      crisisMode: this.currentMode === 'crisis',
      crisisModeActive: this.crisisStartTime ? 
        (Date.now() - this.crisisStartTime) / (60 * 60 * 1000) + ' hours' : null,
      alertsQueued: this.alertQueue.length,
      feedsMonitored: this.rssFeeds.length,
      lastProcessedCount: this.lastProcessedItems.size
    };
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logInfo('Smart RSS monitoring stopped', {
      finalMode: this.currentMode,
      alertsQueued: this.alertQueue.length
    });
  }

  /**
   * Clean up old processed items (prevent memory growth)
   */
  cleanupProcessedItems() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [hash, timestamp] of this.lastProcessedItems.entries()) {
      if (timestamp < oneWeekAgo) {
        this.lastProcessedItems.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logInfo('Cleaned up old processed items', { itemsCleaned: cleaned });
    }
  }
}

// Singleton instance for application-wide use
export const smartRSSMonitor = new SmartRSSMonitor();

// Auto-start monitoring when module loads
if (typeof window === 'undefined') {
  // Server-side: start monitoring
  smartRSSMonitor.startMonitoring();
  
  // Cleanup processed items weekly
  setInterval(() => {
    smartRSSMonitor.cleanupProcessedItems();
  }, 24 * 60 * 60 * 1000); // Daily cleanup
}

export default SmartRSSMonitor;