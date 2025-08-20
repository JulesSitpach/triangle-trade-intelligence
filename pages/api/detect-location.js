// API route for IP-based location detection
// No user permissions required - passive detection

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests are supported' });
  }

  try {
    // Get client IP from request headers
    const clientIP = getClientIP(req);
    
    // IP-based geo detection using multiple free services
    const locationData = await detectLocationFromIP(clientIP);
    
    // Return location data with confidence scoring
    return res.status(200).json({
      country: locationData.country,
      region: locationData.region,
      city: locationData.city,
      confidence: locationData.confidence,
      suggestedLanguage: mapCountryToLanguage(locationData.country),
      timezone: locationData.timezone,
      source: 'ip_geolocation',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Location detection error:', error);
    
    // Fallback response
    return res.status(200).json({
      country: 'unknown',
      region: 'unknown', 
      confidence: 0,
      suggestedLanguage: 'en',
      source: 'fallback',
      error: 'Detection failed - using defaults'
    });
  }
}

function getClientIP(req) {
  // Check various headers for real client IP
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.headers['x-client-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

async function detectLocationFromIP(ip) {
  // Skip detection for localhost/development
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: 'US', // Default for development
      region: 'Development',
      city: 'Local',
      confidence: 50,
      timezone: 'America/New_York'
    };
  }
  
  try {
    // Free IP geolocation service (no API key required)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Triangle Intelligence Platform/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geolocation API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Geolocation error: ${data.reason}`);
    }
    
    // Map response to our format
    return {
      country: data.country_code || 'unknown',
      region: data.region || 'unknown',
      city: data.city || 'unknown',
      confidence: calculateConfidence(data),
      timezone: data.timezone || 'UTC'
    };
    
  } catch (error) {
    console.error('IP geolocation failed:', error);
    
    // Fallback to backup service
    try {
      return await fallbackGeolocation(ip);
    } catch (fallbackError) {
      console.error('Fallback geolocation failed:', fallbackError);
      
      // Final fallback
      return {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        confidence: 0,
        timezone: 'UTC'
      };
    }
  }
}

async function fallbackGeolocation(ip) {
  // Backup free service (ip-api.com)
  const response = await fetch(`http://ip-api.com/json/${ip}`, {
    timeout: 2000
  });
  
  if (!response.ok) {
    throw new Error(`Fallback API failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(`Fallback API error: ${data.message}`);
  }
  
  return {
    country: data.countryCode || 'unknown',
    region: data.regionName || 'unknown', 
    city: data.city || 'unknown',
    confidence: 70, // Slightly lower confidence for fallback
    timezone: data.timezone || 'UTC'
  };
}

function calculateConfidence(data) {
  let confidence = 50; // Base confidence
  
  // Increase confidence based on data quality
  if (data.country_code && data.country_code !== 'unknown') confidence += 20;
  if (data.region && data.region !== 'unknown') confidence += 10;
  if (data.city && data.city !== 'unknown') confidence += 10;
  if (data.timezone) confidence += 10;
  
  return Math.min(confidence, 95); // Cap at 95% (never 100% for IP detection)
}

function mapCountryToLanguage(countryCode) {
  // Map countries to Triangle Intelligence supported languages
  const countryLanguageMap = {
    // USMCA Countries (Primary Markets)
    'US': 'en',    // United States → English
    'CA': 'fr',    // Canada → French (though could be 'en' too)
    'MX': 'es',    // Mexico → Spanish
    
    // Spanish-speaking countries
    'ES': 'es',    // Spain
    'AR': 'es',    // Argentina  
    'CO': 'es',    // Colombia
    'CL': 'es',    // Chile
    'PE': 'es',    // Peru
    'VE': 'es',    // Venezuela
    'EC': 'es',    // Ecuador
    'GT': 'es',    // Guatemala
    'CR': 'es',    // Costa Rica
    'PA': 'es',    // Panama
    
    // French-speaking countries
    'FR': 'fr',    // France
    'BE': 'fr',    // Belgium (could be Dutch too)
    'CH': 'fr',    // Switzerland (could be German/Italian too)
    'LU': 'fr',    // Luxembourg
    'MC': 'fr',    // Monaco
    
    // English-speaking countries
    'GB': 'en',    // United Kingdom
    'AU': 'en',    // Australia
    'NZ': 'en',    // New Zealand
    'IE': 'en',    // Ireland
    'ZA': 'en',    // South Africa
    'SG': 'en',    // Singapore
    'HK': 'en',    // Hong Kong
    
    // Default fallback
    'unknown': 'en'
  };
  
  return countryLanguageMap[countryCode] || 'en';
}