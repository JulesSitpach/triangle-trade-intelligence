/**
 * 🌍 TRILINGUAL LANGUAGE SWITCHER
 * English/French/Spanish for maximum Canada-Mexico-USA market coverage
 * Authentic family expertise - Canadian English/French + Mexican Spanish
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSafeTranslation } from '../hooks/useSafeTranslation'

export default function LanguageSwitcher({ onLanguageChange }) {
  const { i18n } = useSafeTranslation('common')
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      label: 'EN',
      market: 'North America'
    },
    {
      code: 'fr', 
      name: 'Français',
      flag: '🇨🇦',
      label: 'FR',
      market: 'Quebec & French Canada'
    },
    {
      code: 'es',
      name: 'Español',
      flag: '🇲🇽',
      label: 'ES', 
      market: 'Mexico & Latino USA'
    }
  ]

  useEffect(() => {
    // Sync with i18next current language
    if (i18n.language && i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language)
    }
  }, [i18n.language])

  useEffect(() => {
    // Initialize from localStorage or browser language
    const savedLanguage = localStorage.getItem('triangleIntelligence_language')
    const browserLanguage = navigator.language.split('-')[0]
    
    const initialLanguage = savedLanguage || 
      (languages.find(lang => lang.code === browserLanguage)?.code) || 'en'
    
    setCurrentLanguage(initialLanguage)
    
    // Change i18next language
    if (i18n.changeLanguage) {
      i18n.changeLanguage(initialLanguage)
    }
    
    if (onLanguageChange) {
      onLanguageChange(initialLanguage)
    }
  }, [])

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode)
    localStorage.setItem('triangleIntelligence_language', languageCode)
    
    // Change i18next language - this will trigger UI updates
    if (i18n.changeLanguage) {
      i18n.changeLanguage(languageCode)
    }
    
    // Notify parent component of language change
    if (onLanguageChange) {
      onLanguageChange(languageCode)
    }

    // Add analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'language_change', {
        event_category: 'internationalization',
        event_label: languageCode,
        market_segment: languages.find(lang => lang.code === languageCode)?.market
      })
    }
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0]

  // Prevent hydration mismatches by showing default until mounted
  if (!mounted) {
    return (
      <div className="language-switcher">
        <div className="current-language">
          <span className="flag">🇺🇸</span>
          <span className="label">EN</span>
          <span className="chevron">▼</span>
        </div>
      </div>
    )
  }

  return (
    <div className="language-switcher">
      <div className="current-language" onClick={() => document.getElementById('language-dropdown').classList.toggle('open')}>
        <span className="flag">{currentLang?.flag || '🇺🇸'}</span>
        <span className="label">{currentLang?.label || 'EN'}</span>
        <span className="chevron">▼</span>
      </div>

      <div id="language-dropdown" className="language-dropdown">
        <div className="dropdown-header">
          <span className="header-title">🌍 Choose Language</span>
          <span className="header-subtitle">Canada-Mexico Trade Intelligence</span>
        </div>
        
        {languages.map((language) => (
          <div
            key={language.code}
            className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
            onClick={() => {
              handleLanguageChange(language.code)
              document.getElementById('language-dropdown').classList.remove('open')
            }}
          >
            <span className="flag">{language.flag}</span>
            <div className="language-info">
              <span className="language-name">{language.name}</span>
              <span className="market-info">{language.market}</span>
            </div>
            {currentLanguage === language.code && (
              <span className="selected-indicator">✓</span>
            )}
          </div>
        ))}

        <div className="dropdown-footer">
          <span className="family-expertise">
            🇨🇦🇲🇽 Authentic Family Expertise
          </span>
        </div>
      </div>

      <style jsx>{`
        .language-switcher {
          position: relative;
          display: inline-block;
        }

        .current-language {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          color: #374151;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .current-language:hover {
          border-color: #dc2626;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }

        .flag {
          font-size: 1.2rem;
        }

        .label {
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .chevron {
          font-size: 0.8rem;
          transition: transform 0.2s;
          color: #6b7280;
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: 2px solid #e5e7eb;
          min-width: 280px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s;
          z-index: 1000;
        }

        .language-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .language-dropdown.open .current-language .chevron {
          transform: rotate(180deg);
        }

        .dropdown-header {
          padding: 1rem 1rem 0.5rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
        }

        .header-title {
          display: block;
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .header-subtitle {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f9fafb;
        }

        .language-option:hover {
          background: linear-gradient(135deg, #fee2e2, #fef3c7, #ecfdf5);
        }

        .language-option.active {
          background: linear-gradient(135deg, #dc2626, #f59e0b, #16a34a);
          color: white;
        }

        .language-option.active .market-info {
          color: rgba(255,255,255,0.9);
        }

        .language-option .flag {
          font-size: 1.3rem;
        }

        .language-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .language-name {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.1rem;
        }

        .market-info {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .selected-indicator {
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .dropdown-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #f3f4f6;
          text-align: center;
          background: #f9fafb;
          border-radius: 0 0 0.75rem 0.75rem;
        }

        .family-expertise {
          font-size: 0.8rem;
          color: #374151;
          font-weight: 600;
        }

        /* Close dropdown when clicking outside */
        @media (max-width: var(--breakpoint-sm)) {
          .language-dropdown {
            right: -50%;
            min-width: 250px;
          }

          .current-language {
            padding: 0.4rem 0.8rem;
          }

          .language-option {
            padding: 1rem;
          }
        }
      `}</style>

      <style jsx global>{`
        /* Close dropdown when clicking outside */
        body {
          position: relative;
        }
        
        body.dropdown-open::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }
      `}</style>

      {/* Click outside to close handler */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('language-dropdown');
            const switcher = document.querySelector('.language-switcher');
            
            if (dropdown && switcher && !switcher.contains(event.target)) {
              dropdown.classList.remove('open');
              document.body.classList.remove('dropdown-open');
            }
          });
        `
      }} />
    </div>
  )
}

// Translation strings for the main platform
export const translations = {
  en: {
    // Navigation
    calculator: "USMCA Calculator",
    specialistDashboard: "Specialist Dashboard",
    
    // Main Calculator
    pageTitle: "🇨🇦🇲🇽 Canada-Mexico USMCA Advantage Calculator",
    subtitle: "Optimize Your Trade Route • Save Millions • Connect with Specialists",
    
    // Form Fields
    companyName: "Company Name",
    businessType: "Business Type",
    importVolume: "Annual Import Volume",
    supplierCountry: "Primary Supplier Country",
    timelinePriority: "Timeline Priority",
    
    // Business Types
    electronics: "Electronics",
    manufacturing: "Manufacturing",
    automotive: "Automotive",
    medical: "Medical Devices",
    textiles: "Textiles",
    machinery: "Machinery",
    
    // Results
    totalSavings: "Total Annual Savings",
    implementationTimeline: "Implementation Timeline",
    governmentCredibility: "Government Data Credibility",
    specialistFee: "Specialist Fee Pool",
    
    // Call to Action
    calculateAdvantage: "Calculate USMCA Advantage",
    connectSpecialist: "Connect with Mexico Specialist",
    
    // Footer
    copyright: "© 2025 Triangle Intelligence Platform. All rights reserved.",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy"
  },
  
  fr: {
    // Navigation
    calculator: "Calculateur AEUMC",
    specialistDashboard: "Tableau de Bord Spécialiste",
    
    // Main Calculator
    pageTitle: "🇨🇦🇲🇽 Calculateur d'Avantages AEUMC Canada-Mexique",
    subtitle: "Optimisez Votre Route Commerciale • Économisez des Millions • Connectez-vous aux Spécialistes",
    
    // Form Fields
    companyName: "Nom de l'Entreprise",
    businessType: "Type d'Entreprise",
    importVolume: "Volume d'Importation Annuel",
    supplierCountry: "Pays Fournisseur Principal",
    timelinePriority: "Priorité de Calendrier",
    
    // Business Types
    electronics: "Électronique",
    manufacturing: "Fabrication",
    automotive: "Automobile",
    medical: "Dispositifs Médicaux",
    textiles: "Textiles",
    machinery: "Machinerie",
    
    // Results
    totalSavings: "Économies Annuelles Totales",
    implementationTimeline: "Calendrier de Mise en Œuvre",
    governmentCredibility: "Crédibilité des Données Gouvernementales",
    specialistFee: "Pool de Honoraires Spécialiste",
    
    // Call to Action
    calculateAdvantage: "Calculer l'Avantage AEUMC",
    connectSpecialist: "Connecter avec Spécialiste Mexicain",
    
    // Footer
    copyright: "© 2025 Plateforme Triangle Intelligence. Tous droits réservés.",
    termsOfService: "Conditions de Service",
    privacyPolicy: "Politique de Confidentialité"
  },
  
  es: {
    // Navigation
    calculator: "Calculadora T-MEC",
    specialistDashboard: "Panel de Especialistas",
    
    // Main Calculator
    pageTitle: "🇨🇦🇲🇽 Calculadora de Ventajas T-MEC Canadá-México",
    subtitle: "Optimiza Tu Ruta Comercial • Ahorra Millones • Conéctate con Especialistas",
    
    // Form Fields
    companyName: "Nombre de la Empresa",
    businessType: "Tipo de Negocio",
    importVolume: "Volumen de Importación Anual",
    supplierCountry: "País Proveedor Principal",
    timelinePriority: "Prioridad de Cronograma",
    
    // Business Types
    electronics: "Electrónicos",
    manufacturing: "Manufactura",
    automotive: "Automotriz",
    medical: "Dispositivos Médicos",
    textiles: "Textiles",
    machinery: "Maquinaria",
    
    // Results
    totalSavings: "Ahorros Anuales Totales",
    implementationTimeline: "Cronograma de Implementación",
    governmentCredibility: "Credibilidad de Datos Gubernamentales",
    specialistFee: "Fondo de Honorarios Especialista",
    
    // Call to Action
    calculateAdvantage: "Calcular Ventaja T-MEC",
    connectSpecialist: "Conectar con Especialista Mexicano",
    
    // Footer
    copyright: "© 2025 Plataforma Triangle Intelligence. Todos los derechos reservados.",
    termsOfService: "Términos de Servicio",
    privacyPolicy: "Política de Privacidad"
  }
}

// Hook for using translations
export function useTranslation(language = 'en') {
  return {
    t: (key) => {
      const keys = key.split('.')
      let value = translations[language]
      
      for (const k of keys) {
        value = value?.[k]
      }
      
      return value || translations.en[key] || key
    },
    language,
    isRTL: false // None of our languages are right-to-left
  }
}