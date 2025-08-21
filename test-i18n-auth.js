/**
 * TEST SCRIPT FOR I18N DATABASE AUTHENTICATION
 * Tests the DatabaseBackend class authentication with proper environment setup
 */

import 'dotenv/config';
import DatabaseBackend from './lib/i18n-database-backend.js';
import { logInfo, logError } from './lib/production-logger.js';

async function testI18nAuthentication() {
  logInfo('Starting i18n database authentication test...');
  
  try {
    // Create database backend instance
    const backend = new DatabaseBackend({}, {});
    
    // Test each language
    const languages = ['en', 'es', 'fr'];
    
    for (const language of languages) {
      logInfo(`Testing language: ${language}`);
      
      await new Promise((resolve, reject) => {
        backend.read(language, 'common', (error, translations) => {
          if (error) {
            logError(`Failed to load ${language} translations`, { error });
            reject(error);
          } else {
            logInfo(`Successfully loaded ${language} translations`, { 
              keys: Object.keys(translations || {}).length,
              sampleKeys: Object.keys(translations || {}).slice(0, 5)
            });
            resolve(translations);
          }
        });
      });
    }
    
    logInfo('i18n authentication test completed successfully');
    return true;
    
  } catch (error) {
    logError('i18n authentication test failed', { error: error.message });
    return false;
  }
}

// Run the test
testI18nAuthentication().then(result => {
  console.log('Test result:', result);
  process.exit(result ? 0 : 1);
});