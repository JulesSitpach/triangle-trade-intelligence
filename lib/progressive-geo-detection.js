/**
 * PROGRESSIVE GEO DETECTION SYSTEM
 * Automatically detects user location and sets appropriate language
 * TIER 1: Passive Detection (No Permission Required)
 */

import { logInfo, logError } from './production-logger';

// Cache location data to avoid repeated API calls
let locationCache = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const detectUserLocation = async () => {
  try {
    logInfo('Progressive geo detection started', { tier: 1, method: 'passive' });
    
    // Check cache first
    if (locationCache && (Date.now() - locationCache.timestamp) < CACHE_DURATION) {
      logInfo('Using cached location data', { country: locationCache.country });
      return locationCache.data;
    }
    
    // TIER 1: Passive Detection - No permissions required
    const passiveLocation = await performPassiveDetection();
    
    // Cache the result
    locationCache = {
      data: passiveLocation,
      timestamp: Date.now()
    };
    
    logInfo('Progressive geo detection completed', {
      country: passiveLocation.country,
      confidence: passiveLocation.confidence,
      language: passiveLocation.suggestedLanguage
    });
    
    return passiveLocation;
    
  } catch (error) {
    logError('Progressive geo detection failed', { error: error.message });
    
    // Return safe fallback
    return {
      country: 'unknown',
      region: 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      suggestedLanguage: 'en',
      confidence: 0,
      source: 'fallback',
      error: error.message
    };
  }
};

async function performPassiveDetection() {
  // Collect multiple passive signals
  const signals = await Promise.allSettled([
    getIPBasedLocation(),
    getTimezoneInfo(),
    getBrowserLanguageInfo(),
    getNavigatorInfo()
  ]);
  
  // Process all signals
  const ipLocation = signals[0].status === 'fulfilled' ? signals[0].value : null;
  const timezoneInfo = signals[1].status === 'fulfilled' ? signals[1].value : null;
  const browserLang = signals[2].status === 'fulfilled' ? signals[2].value : null;
  const navigatorInfo = signals[3].status === 'fulfilled' ? signals[3].value : null;
  
  // Combine signals for best guess
  return combineLocationSignals(ipLocation, timezoneInfo, browserLang, navigatorInfo);
}

async function getIPBasedLocation() {
  try {
    const response = await fetch('/api/detect-location', {
      method: 'GET',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`Location API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    logInfo('IP-based location detected', {
      country: data.country,
      confidence: data.confidence
    });
    
    return data;
    
  } catch (error) {
    logError('IP-based location detection failed', { error: error.message });
    return null;
  }
}

function getTimezoneInfo() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to likely countries
    const timezoneCountryMap = {
      // North America
      'America/New_York': 'US',
      'America/Chicago': 'US', 
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'America/Montreal': 'CA',
      'America/Mexico_City': 'MX',
      'America/Tijuana': 'MX',
      
      // Europe
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Madrid': 'ES',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Zurich': 'CH',
      
      // Latin America
      'America/Argentina/Buenos_Aires': 'AR',
      'America/Bogota': 'CO',
      'America/Santiago': 'CL',
      'America/Lima': 'PE',
      'America/Caracas': 'VE',
      
      // Asia Pacific
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Seoul': 'KR',
      'Asia/Singapore': 'SG',
      'Asia/Hong_Kong': 'HK',
      'Australia/Sydney': 'AU',
      'Pacific/Auckland': 'NZ'
    };
    
    const likelyCountry = timezoneCountryMap[timezone] || 'unknown';
    
    return {
      timezone,
      likelyCountry,
      confidence: likelyCountry !== 'unknown' ? 60 : 20
    };
    
  } catch (error) {
    logError('Timezone detection failed', { error: error.message });
    return { timezone: 'UTC', likelyCountry: 'unknown', confidence: 0 };
  }
}

function getBrowserLanguageInfo() {
  try {
    const browserLang = navigator.language; // e.g., "es-MX", "en-US", "fr-CA"
    const languages = navigator.languages || [browserLang];
    
    // Extract primary language and country
    const [primaryLang, countryCode] = browserLang.split('-');
    
    // Map language codes to Triangle Intelligence languages
    const languageMap = {
      'es': 'es', // Spanish
      'en': 'en', // English
      'fr': 'fr'  // French
    };
    
    const supportedLanguage = languageMap[primaryLang] || 'en';
    
    return {
      browserLanguage: browserLang,
      allLanguages: languages,
      primaryLanguage: primaryLang,
      countryFromLang: countryCode,
      suggestedLanguage: supportedLanguage,
      confidence: 70 // Browser language is usually reliable
    };
    
  } catch (error) {
    logError('Browser language detection failed', { error: error.message });
    return {
      browserLanguage: 'en-US',
      suggestedLanguage: 'en',
      confidence: 0
    };
  }
}

function getNavigatorInfo() {
  try {
    // Additional navigator properties that might give location hints
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    // Look for mobile indicators that might suggest region
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    
    return {
      platform,
      isMobile,
      userAgent: userAgent.substring(0, 200), // Truncate for privacy
      confidence: 10 // Low confidence, just supplementary data
    };
    
  } catch (error) {
    return { confidence: 0 };
  }
}

function combineLocationSignals(ipLocation, timezoneInfo, browserLang, navigatorInfo) {
  // Start with IP location as primary source
  let result = {
    country: 'unknown',
    region: 'unknown',
    timezone: 'UTC',
    suggestedLanguage: 'en',
    confidence: 0,
    source: 'combined_passive',
    signals: {
      ip: !!ipLocation,
      timezone: !!timezoneInfo,
      browser: !!browserLang,
      navigator: !!navigatorInfo
    }
  };
  
  // Use IP location if available (highest confidence)
  if (ipLocation && ipLocation.confidence > 50) {
    result.country = ipLocation.country;
    result.region = ipLocation.region;
    result.timezone = ipLocation.timezone;
    result.suggestedLanguage = ipLocation.suggestedLanguage;
    result.confidence = ipLocation.confidence;
  }
  // Fallback to timezone-based detection
  else if (timezoneInfo && timezoneInfo.confidence > 30) {
    result.country = timezoneInfo.likelyCountry;
    result.timezone = timezoneInfo.timezone;
    result.confidence = timezoneInfo.confidence;
  }
  
  // Override language if browser language is more reliable
  if (browserLang && browserLang.confidence > result.confidence) {
    result.suggestedLanguage = browserLang.suggestedLanguage;
    
    // Update country if browser has country code
    if (browserLang.countryFromLang && result.country === 'unknown') {
      result.country = browserLang.countryFromLang;
    }
  }
  
  // Ensure we have a valid timezone
  if (!result.timezone || result.timezone === 'unknown') {
    result.timezone = timezoneInfo?.timezone || 'UTC';
  }
  
  // Calculate final confidence
  result.confidence = calculateFinalConfidence(ipLocation, timezoneInfo, browserLang);
  
  return result;
}

function calculateFinalConfidence(ipLocation, timezoneInfo, browserLang) {
  let confidence = 0;
  let signals = 0;
  
  if (ipLocation && ipLocation.confidence > 0) {
    confidence += ipLocation.confidence * 0.6; // IP gets 60% weight
    signals++;
  }
  
  if (timezoneInfo && timezoneInfo.confidence > 0) {
    confidence += timezoneInfo.confidence * 0.2; // Timezone gets 20% weight
    signals++;
  }
  
  if (browserLang && browserLang.confidence > 0) {
    confidence += browserLang.confidence * 0.2; // Browser lang gets 20% weight
    signals++;
  }
  
  // Reduce confidence if we have fewer signals
  if (signals < 2) {
    confidence *= 0.7;
  }
  
  return Math.min(Math.round(confidence), 90); // Cap at 90% for passive detection
}

// Helper function to automatically set language based on detection
export const autoSetLanguageFromLocation = async (i18n) => {
  try {
    const location = await detectUserLocation();
    
    // Only auto-switch if we have reasonable confidence
    if (location.confidence > 60 && location.suggestedLanguage) {
      const currentLanguage = i18n.language;
      
      // Don't switch if user already manually set a language
      const userHasSetLanguage = localStorage.getItem('triangle-user-language-choice');
      
      if (!userHasSetLanguage && currentLanguage !== location.suggestedLanguage) {
        logInfo('Auto-switching language based on location', {
          from: currentLanguage,
          to: location.suggestedLanguage,
          country: location.country,
          confidence: location.confidence
        });
        
        await i18n.changeLanguage(location.suggestedLanguage);
        
        // Store the auto-detection result but don't mark as user choice
        localStorage.setItem('triangle-auto-detected-language', location.suggestedLanguage);
      }
    }
    
    return location;
    
  } catch (error) {
    logError('Auto language setting failed', { error: error.message });
    return null;
  }
};

export default {
  detectUserLocation,
  autoSetLanguageFromLocation
};