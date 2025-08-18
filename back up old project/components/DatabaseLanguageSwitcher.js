/**
 * DATABASE-POWERED LANGUAGE SWITCHER
 * Professional multilingual interface with real-time database updates
 * Supports analytics tracking and cultural market positioning
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const DatabaseLanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      flag: '🇺🇸', 
      market: 'North America',
      description: 'Business Standard'
    },
    { 
      code: 'es', 
      name: 'Español', 
      flag: '🇲🇽', 
      market: 'México & Latino US',
      description: 'Mercado Latino'
    },
    { 
      code: 'fr', 
      name: 'Français', 
      flag: '🇨🇦', 
      market: 'Québec & Canada',
      description: 'Marché Canadien'
    }
  ]

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = async (langCode) => {
    try {
      setIsLoading(true)
      
      console.log(`🌍 LANGUAGE SWITCH INITIATED: ${currentLang.code} → ${langCode}`)
      
      // Change language (will trigger database load)
      console.log('🔄 Calling i18n.changeLanguage...')
      await i18n.changeLanguage(langCode)
      console.log('✅ i18n.changeLanguage completed')
      
      // Force refresh translations from database
      console.log('🔄 Forcing refresh from database...')
      if (i18n.refreshFromDatabase) {
        await i18n.refreshFromDatabase()
        console.log('✅ Database refresh completed')
      } else {
        console.log('🔄 Reloading resources...')
        await i18n.reloadResources()
        console.log('✅ Resource reload completed')
      }
      
      // Close dropdown
      setIsOpen(false)
      
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'language_change', {
          event_category: 'internationalization',
          event_label: langCode,
          previous_language: currentLang.code,
          new_language: langCode,
          market_segment: languages.find(l => l.code === langCode)?.market
        })
      }
      
      console.log(`🎉 Language switch COMPLETE: ${langCode}`)
      
    } catch (error) {
      console.error('❌ Language switch failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.database-language-switcher')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="database-language-switcher">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`language-toggle ${isLoading ? 'loading' : ''}`}
        disabled={isLoading}
        title={`Current language: ${currentLang.name} (${currentLang.market})`}
      >
        <span className="flag">{currentLang.flag}</span>
        <span className="code">{currentLang.code.toUpperCase()}</span>
        <span className="chevron">{isOpen ? '▲' : '▼'}</span>
        {isLoading && <span className="loading-spinner">⟳</span>}
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-header">
            <h3>🌍 Choose Language</h3>
            <p>Canada-Mexico Trade Intelligence</p>
          </div>
          
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              disabled={isLoading}
            >
              <span className="flag">{lang.flag}</span>
              <div className="language-info">
                <div className="language-name">{lang.name}</div>
                <div className="market-info">{lang.market}</div>
                <div className="description">{lang.description}</div>
              </div>
              {lang.code === i18n.language && (
                <span className="selected-indicator">✓</span>
              )}
            </button>
          ))}
          
          <div className="dropdown-footer">
            <div className="expertise-note">
              🇨🇦🇲🇽 Powered by Canadian-Mexican Family Expertise
            </div>
            <div className="database-note">
              📊 Translations: Real-time Database • {t('status.connected', 'Connected')}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .database-language-switcher {
          position: relative;
          display: inline-block;
        }

        .language-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          color: #1e293b;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-width: 100px;
        }

        .language-toggle:hover:not(:disabled) {
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
          transform: translateY(-1px);
        }

        .language-toggle:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .language-toggle.loading {
          background: linear-gradient(135deg, #fef3c7, #fed7aa);
          border-color: #f59e0b;
        }

        .flag {
          font-size: 1.25rem;
          line-height: 1;
        }

        .code {
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .chevron {
          font-size: 0.75rem;
          color: #64748b;
          transition: transform 0.2s;
          margin-left: auto;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #f59e0b;
          font-weight: bold;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 2px solid #e2e8f0;
          min-width: 320px;
          z-index: 1000;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border-bottom: 1px solid #cbd5e1;
          text-align: center;
        }

        .dropdown-header h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .dropdown-header p {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          width: 100%;
          border: none;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .language-option:hover:not(:disabled) {
          background: linear-gradient(135deg, #fee2e2, #fef3c7, #ecfdf5);
        }

        .language-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .language-option.active {
          background: linear-gradient(135deg, #dc2626, #f59e0b, #16a34a);
          color: white;
        }

        .language-option.active .market-info,
        .language-option.active .description {
          color: rgba(255, 255, 255, 0.9);
        }

        .language-option .flag {
          font-size: 1.5rem;
        }

        .language-info {
          flex: 1;
          text-align: left;
        }

        .language-name {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.2rem;
        }

        .market-info {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 0.1rem;
        }

        .description {
          font-size: 0.75rem;
          color: #94a3b8;
          font-style: italic;
        }

        .selected-indicator {
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .dropdown-footer {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .expertise-note {
          font-size: 0.8rem;
          color: #1e293b;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .database-note {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .language-dropdown {
            right: -50%;
            min-width: 280px;
          }

          .language-toggle {
            padding: 0.6rem 0.8rem;
            min-width: 85px;
          }

          .language-option {
            padding: 0.875rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default DatabaseLanguageSwitcher