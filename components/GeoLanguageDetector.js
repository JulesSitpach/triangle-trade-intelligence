/**
 * GEO LANGUAGE DETECTOR COMPONENT
 * Shows progressive detection status and allows manual language override
 * Integrates seamlessly with existing LanguageSwitcher
 */

import React from 'react';
import { useProgressiveLanguage } from '../hooks/useProgressiveLanguage';
import { smartT } from '../lib/smartT';

const GeoLanguageDetector = ({ showDetectionStatus = false, showCountryInfo = false }) => {
  const {
    locationData,
    isDetecting,
    autoDetectionComplete,
    currentLanguage,
    isAutoDetected,
    isUserChoice
  } = useProgressiveLanguage();
  
  // Don't show anything if user doesn't want detection status
  if (!showDetectionStatus && !showCountryInfo) {
    return null;
  }
  
  // Show subtle detection indicator
  if (isDetecting) {
    return (
      <div className="geo-detection-status detecting">
        <span className="detection-spinner">🌍</span>
        <span className="detection-text">{smartT('geoDetectionDetecting', 'Detecting location...')}</span>
      </div>
    );
  }
  
  // Show country info if detected and requested
  if (showCountryInfo && locationData && locationData.country !== 'unknown') {
    const countryFlags = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'ES': '🇪🇸', 'FR': '🇫🇷', 'GB': '🇬🇧',
      'DE': '🇩🇪', 'IT': '🇮🇹', 'AR': '🇦🇷', 'CO': '🇨🇴', 'CL': '🇨🇱', 'AU': '🇦🇺'
    };
    
    const flag = countryFlags[locationData.country] || '🌍';
    
    return (
      <div className="geo-country-info">
        <span className="country-flag">{flag}</span>
        <span className="country-text">
          {locationData.country !== 'unknown' ? locationData.country : smartT('geoDetectionWorldwide', 'Worldwide')}
        </span>
      </div>
    );
  }
  
  // Show detection status if requested
  if (showDetectionStatus && autoDetectionComplete) {
    return (
      <div className="geo-detection-status complete">
        {isAutoDetected && (
          <div className="auto-detected-notice">
            <span className="status-icon">🎯</span>
            <span className="status-text">
              {smartT('geoDetectionAutoDetected', 'Language auto-detected')}
              {locationData && locationData.country !== 'unknown' && (
                <span className="detected-country"> ({locationData.country})</span>
              )}
            </span>
          </div>
        )}
        
        {isUserChoice && (
          <div className="user-choice-notice">
            <span className="status-icon">👤</span>
            <span className="status-text">
              {smartT('geoDetectionUserChoice', 'Manual language selection')}
            </span>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

// Enhanced Language Switcher with Geo Detection
export const LanguageSwitcherWithGeo = ({ className = '' }) => {
  const { changeLanguage, currentLanguage, locationData, isAutoDetected } = useProgressiveLanguage();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', countries: ['US', 'GB', 'AU', 'CA'] },
    { code: 'es', name: 'Español', flag: '🇲🇽', countries: ['MX', 'ES', 'AR', 'CO', 'CL'] },
    { code: 'fr', name: 'Français', flag: '🇨🇦', countries: ['CA', 'FR', 'BE', 'CH'] }
  ];
  
  const handleLanguageChange = async (languageCode) => {
    await changeLanguage(languageCode);
  };
  
  return (
    <div className={`language-switcher-with-geo ${className}`}>
      <div className="language-options">
        {languages.map((lang) => {
          const isActive = currentLanguage === lang.code;
          const isRecommended = locationData && 
            locationData.suggestedLanguage === lang.code && 
            locationData.confidence > 60 &&
            !isAutoDetected;
          
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`language-option ${isActive ? 'active' : ''} ${isRecommended ? 'recommended' : ''}`}
              title={isRecommended ? smartT('geoDetectionRecommendedForLocation', 'Recommended for your location') : lang.name}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {isRecommended && <span className="recommendation-indicator">⭐</span>}
              {isActive && isAutoDetected && <span className="auto-indicator">🎯</span>}
            </button>
          );
        })}
      </div>
      
      <GeoLanguageDetector showCountryInfo={true} />
    </div>
  );
};

export default GeoLanguageDetector;

// CSS styles (add to your global CSS or styled-components)
export const geoDetectionStyles = `
.geo-detection-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.geo-detection-status.detecting {
  color: #0066cc;
}

.detection-spinner {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.geo-country-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
  margin-left: 8px;
}

.language-switcher-with-geo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.language-options {
  display: flex;
  gap: 8px;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.language-option:hover {
  background: #f5f5f5;
  border-color: #0066cc;
}

.language-option.active {
  background: #0066cc;
  color: white;
  border-color: #0066cc;
}

.language-option.recommended {
  border-color: #ff9500;
  background: #fff5e6;
}

.recommendation-indicator {
  font-size: 10px;
  color: #ff9500;
}

.auto-indicator {
  font-size: 10px;
  color: #00cc66;
}

.auto-detected-notice,
.user-choice-notice {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.status-icon {
  font-size: 10px;
}

.detected-country {
  font-weight: 500;
  color: #0066cc;
}
`;