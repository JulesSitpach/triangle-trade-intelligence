/**
 * PROGRESSIVE LANGUAGE DETECTION HOOK
 * Automatically detects user location and suggests appropriate language
 * Integrates with existing i18n system
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { detectUserLocation, autoSetLanguageFromLocation } from '../lib/progressive-geo-detection';
import { logInfo, logError } from '../lib/production-logger';

export const useProgressiveLanguage = () => {
  const { i18n } = useTranslation();
  const [locationData, setLocationData] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [autoDetectionComplete, setAutoDetectionComplete] = useState(false);
  
  useEffect(() => {
    // Only run auto-detection once per session
    if (autoDetectionComplete) return;
    
    const runProgressiveDetection = async () => {
      try {
        setIsDetecting(true);
        
        // Check if user has already manually set a language
        const userLanguageChoice = localStorage.getItem('triangle-user-language-choice');
        const autoDetectedLanguage = localStorage.getItem('triangle-auto-detected-language');
        
        // Skip if user has made a manual choice
        if (userLanguageChoice) {
          logInfo('Skipping auto-detection - user has manual language choice', { 
            userChoice: userLanguageChoice 
          });
          setAutoDetectionComplete(true);
          return;
        }
        
        // Detect location and get language suggestion
        const location = await detectUserLocation();
        setLocationData(location);
        
        // Only auto-switch if we have good confidence and it's different from current
        if (location.confidence > 60 && location.suggestedLanguage) {
          const currentLanguage = i18n.language;
          
          // Don't switch if we already auto-detected the same language
          if (autoDetectedLanguage === location.suggestedLanguage && currentLanguage === location.suggestedLanguage) {
            logInfo('Language already auto-detected and set', { 
              language: location.suggestedLanguage 
            });
            setAutoDetectionComplete(true);
            return;
          }
          
          // Auto-switch language if different
          if (currentLanguage !== location.suggestedLanguage) {
            logInfo('Auto-switching language based on progressive detection', {
              from: currentLanguage,
              to: location.suggestedLanguage,
              country: location.country,
              confidence: location.confidence,
              source: location.source
            });
            
            await i18n.changeLanguage(location.suggestedLanguage);
            
            // Store the auto-detection result
            localStorage.setItem('triangle-auto-detected-language', location.suggestedLanguage);
            localStorage.setItem('triangle-auto-detected-country', location.country);
            
            // Show subtle notification to user about language switch
            showLanguageSwitchNotification(location);
          }
        }
        
      } catch (error) {
        logError('Progressive language detection failed', { error: error.message });
      } finally {
        setIsDetecting(false);
        setAutoDetectionComplete(true);
      }
    };
    
    // Run detection after a short delay to not block initial page load
    const detectionTimeout = setTimeout(runProgressiveDetection, 1000);
    
    return () => clearTimeout(detectionTimeout);
  }, [i18n, autoDetectionComplete]);
  
  // Manual language change handler
  const changeLanguage = async (newLanguage) => {
    try {
      await i18n.changeLanguage(newLanguage);
      
      // Mark as user choice to prevent future auto-switching
      localStorage.setItem('triangle-user-language-choice', newLanguage);
      localStorage.removeItem('triangle-auto-detected-language');
      
      logInfo('User manually changed language', { 
        to: newLanguage,
        wasAutoDetected: !!localStorage.getItem('triangle-auto-detected-language')
      });
      
    } catch (error) {
      logError('Manual language change failed', { 
        targetLanguage: newLanguage, 
        error: error.message 
      });
    }
  };
  
  // Get suggested language without auto-switching
  const getSuggestedLanguage = async () => {
    try {
      const location = await detectUserLocation();
      return {
        language: location.suggestedLanguage,
        country: location.country,
        confidence: location.confidence
      };
    } catch (error) {
      logError('Language suggestion failed', { error: error.message });
      return { language: 'en', country: 'unknown', confidence: 0 };
    }
  };
  
  return {
    // Current state
    locationData,
    isDetecting,
    autoDetectionComplete,
    currentLanguage: i18n.language,
    
    // Actions
    changeLanguage,
    getSuggestedLanguage,
    
    // Utils
    isAutoDetected: !!localStorage.getItem('triangle-auto-detected-language'),
    isUserChoice: !!localStorage.getItem('triangle-user-language-choice')
  };
};

function showLanguageSwitchNotification(location) {
  // Create subtle notification about auto language switch
  // This could be enhanced with a toast notification system
  if (typeof window !== 'undefined') {
    const languageNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français'
    };
    
    const countryFlags = {
      'US': '🇺🇸',
      'CA': '🇨🇦', 
      'MX': '🇲🇽',
      'ES': '🇪🇸',
      'FR': '🇫🇷',
      'GB': '🇬🇧'
    };
    
    const languageName = languageNames[location.suggestedLanguage] || location.suggestedLanguage;
    const flag = countryFlags[location.country] || '🌍';
    
    console.log(`🌍 Triangle Intelligence: Auto-switched to ${languageName} based on your location ${flag}`);
    
    // Could add a subtle UI notification here if desired
    // For now, just console log so it's not intrusive
  }
}

export default useProgressiveLanguage;