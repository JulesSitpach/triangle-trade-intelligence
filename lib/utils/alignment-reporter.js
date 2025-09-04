
/**
 * ALIGNMENT REPORT GENERATOR
 * Tracks and reports system alignment improvements
 */

export class AlignmentReporter {
  constructor() {
    this.metrics = {
      databaseConnectivity: false,
      apiResponseTimes: [],
      microservicesHealth: {},
      fieldMappingAccuracy: 0,
      configurationCompliance: 0,
      testCoverage: 0
    };
  }

  recordMetric(category, value) {
    this.metrics[category] = value;
  }

  generateReport() {
    const overallScore = this.calculateOverallScore();
    
    return {
      alignmentScore: overallScore,
      level: this.getAlignmentLevel(overallScore),
      metrics: this.metrics,
      recommendations: this.getRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  calculateOverallScore() {
    const weights = {
      databaseConnectivity: 0.25,
      apiPerformance: 0.20,
      microservicesHealth: 0.20,
      fieldMappingAccuracy: 0.15,
      configurationCompliance: 0.10,
      testCoverage: 0.10
    };

    let score = 0;
    
    // Database connectivity (0-25 points)
    if (this.metrics.databaseConnectivity) score += 25;
    
    // API performance (0-20 points) 
    const avgResponseTime = this.metrics.apiResponseTimes.length > 0 
      ? this.metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / this.metrics.apiResponseTimes.length
      : 1000;
    score += Math.max(0, 20 - (avgResponseTime / 50)); // Penalize slow responses
    
    // Microservices health (0-20 points)
    const healthyServices = Object.values(this.metrics.microservicesHealth).filter(h => h).length;
    const totalServices = Object.keys(this.metrics.microservicesHealth).length || 1;
    score += (healthyServices / totalServices) * 20;
    
    // Field mapping accuracy (0-15 points)
    score += this.metrics.fieldMappingAccuracy * 15;
    
    // Configuration compliance (0-10 points)
    score += this.metrics.configurationCompliance * 10;
    
    // Test coverage (0-10 points)
    score += this.metrics.testCoverage * 10;

    return Math.min(100, Math.max(0, score));
  }

  getAlignmentLevel(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'MODERATE';
    if (score >= 60) return 'FAIR';
    return 'POOR';
  }

  getRecommendations() {
    const recommendations = [];
    
    if (!this.metrics.databaseConnectivity) {
      recommendations.push('Fix database connectivity issues');
    }
    
    if (this.metrics.fieldMappingAccuracy < 0.9) {
      recommendations.push('Improve database field mapping accuracy');
    }
    
    return recommendations;
  }
}

export default AlignmentReporter;
