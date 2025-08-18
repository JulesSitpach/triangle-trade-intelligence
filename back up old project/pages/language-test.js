/**
 * SIMPLE LANGUAGE SWITCHING TEST
 * Test if the language switcher actually works
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useDatabaseTranslation } from '../hooks/useDatabaseTranslation'
import DatabaseLanguageSwitcher from '../components/DatabaseLanguageSwitcher'

export default function LanguageTest() {
  const { t, language, changeLanguage, refreshTranslations } = useDatabaseTranslation()
  
  useEffect(() => {
    console.log('🌍 REACT STATE: Current language changed to:', language)
  }, [language])

  const handleManualLanguageChange = async (newLang) => {
    console.log(`🔄 MANUAL SWITCH: ${language} → ${newLang}`)
    try {
      await changeLanguage(newLang)
      console.log(`✅ Manual language change to ${newLang} completed`)
    } catch (error) {
      console.error(`❌ Manual language change to ${newLang} failed:`, error)
    }
  }

  return (
    <>
      <Head>
        <title>Language Switching Test - Triangle Intelligence</title>
      </Head>

      <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <h1>🌍 Language Switching Test</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2>Current Language: <strong>{language}</strong></h2>
          <DatabaseLanguageSwitcher />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Translation Test</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <strong>common.next:</strong> {t('common.next')}
            </div>
            <div>
              <strong>common.back:</strong> {t('common.back')}
            </div>
            <div>
              <strong>nav.dashboard:</strong> {t('nav.dashboard')}
            </div>
            <div>
              <strong>actions.calculate:</strong> {t('actions.calculate')}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Manual Language Test</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => handleManualLanguageChange('en')}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: language === 'en' ? '#3b82f6' : '#e5e7eb',
                color: language === 'en' ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              🇺🇸 English
            </button>
            <button 
              onClick={() => handleManualLanguageChange('es')}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: language === 'es' ? '#3b82f6' : '#e5e7eb',
                color: language === 'es' ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              🇲🇽 Español
            </button>
            <button 
              onClick={() => handleManualLanguageChange('fr')}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: language === 'fr' ? '#3b82f6' : '#e5e7eb',
                color: language === 'fr' ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              🇨🇦 Français
            </button>
          </div>
        </div>

        <div>
          <button 
            onClick={refreshTranslations}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Translations
          </button>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <a href="/translation-test" style={{ color: '#3b82f6' }}>← Back to Translation Test</a>
        </div>
      </div>
    </>
  )
}