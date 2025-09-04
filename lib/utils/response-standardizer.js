
/**
 * MICROSERVICES RESPONSE STANDARDIZER
 * Ensures consistent response structure across all trust microservices
 */

export function standardizeResponse(success, data, error = null, metadata = {}) {
  const response = {
    success,
    data: success ? data : null,
    error: success ? null : error,
    timestamp: new Date().toISOString(),
    processingTimeMs: metadata.processingTime || 0,
    service: metadata.serviceName || 'unknown'
  };

  // Add trust indicators for successful responses
  if (success && data) {
    response.trustIndicators = {
      dataSource: metadata.dataSource || 'database',
      verificationStatus: metadata.verified || false,
      confidenceScore: metadata.confidence || 0.85
    };
  }

  return response;
}

export function withStandardResponse(handler, serviceName) {
  return async (req, res) => {
    const startTime = Date.now();
    
    try {
      const result = await handler(req, res);
      
      if (!res.headersSent) {
        const standardized = standardizeResponse(true, result, null, {
          processingTime: Date.now() - startTime,
          serviceName
        });
        return res.status(200).json(standardized);
      }
      
    } catch (error) {
      if (!res.headersSent) {
        const standardized = standardizeResponse(false, null, error.message, {
          processingTime: Date.now() - startTime,
          serviceName
        });
        return res.status(500).json(standardized);
      }
    }
  };
}
