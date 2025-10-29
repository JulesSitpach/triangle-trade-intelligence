/**
 * USMCA 2026 RENEGOTIATION CONFIGURATION
 * Dynamic content based on user's company country (US, CA, MX)
 */

export const USMCA_2026_CONFIG = {
  reviewDate: '2026-07-01',
  publicCommentDeadline: '2026-01-15',

  // Country-specific positions and resources
  countries: {
    US: {
      fullName: 'United States',
      position: 'offensive', // Pushing for changes
      priorities: [
        'Increase RVC thresholds to protect US jobs',
        'Enforce China transshipment rules',
        'Ensure North American content is authentic',
        'Strengthen labor provisions'
      ],

      scenarios: {
        A: {
          name: 'Minimal Changes',
          probability: 40, // Lower for US (US wants changes)
          description: 'Agreement extends 16 years with minor tweaks',
          userImpact: 'Maintain current qualification, monitor for process improvements'
        },
        B: {
          name: 'Moderate Changes',
          probability: 45, // Higher for US
          description: 'RVC increases to 70%, stricter China tracking',
          userImpact: 'Increase Mexico content, enhance documentation'
        },
        C: {
          name: 'Major Overhaul',
          probability: 15, // US could push hard
          description: 'RVC 75% + China component ban + bilateral deals',
          userImpact: 'Full supply chain restructure, replace China suppliers'
        }
      },

      governmentAgencies: [
        {
          name: 'U.S. Trade Representative (USTR)',
          role: 'Lead USMCA negotiations',
          contact: 'https://ustr.gov',
          phone: '202-395-3230',
          publicComment: 'https://ustr.gov/public-comment',
          services: ['Submit public comments', 'Track proposals', 'Download position papers']
        },
        {
          name: 'U.S. Small Business Administration (SBA)',
          role: 'SMB trade guidance',
          contact: 'https://sba.gov/international-trade',
          phone: '1-800-827-5722',
          services: ['Free trade counseling', 'USMCA Navigator tool', 'Webinars']
        },
        {
          name: 'U.S. Customs & Border Protection (CBP)',
          role: 'Compliance & rulings',
          contact: 'https://cbp.gov',
          phone: '877-CBP-5511',
          services: ['Binding rulings', 'Certificate guidance', 'Compliance checklists']
        },
        {
          name: 'International Trade Administration (ITA)',
          role: 'Market intelligence',
          contact: 'https://trade.gov',
          phone: '1-800-USA-TRAD',
          services: ['Supplier diversification', 'Market reports', 'Monthly webinars']
        }
      ],

      industryAssociations: [
        {
          name: 'National Association of Manufacturers (NAM)',
          position: 'Support RVC increases',
          website: 'https://nam.org/usmca-review',
          membership: '$500-2000/year',
          benefits: ['Congressional lobbying', 'Unified public comment', 'Member briefings']
        },
        {
          name: 'Electronics Importers Coalition',
          position: 'Defend 65% RVC for electronics',
          website: 'https://electronics-coalition.org',
          membership: '$500/year',
          benefits: ['Industry advocacy', 'Legal support', 'USMCA defense strategy']
        }
      ],

      actionPriorities: [
        {
          priority: 1,
          action: 'Submit USTR Public Comment',
          deadline: '2026-01-15',
          description: 'Defend your position on RVC thresholds',
          template: 'ustr-comment-template'
        },
        {
          priority: 2,
          action: 'Increase RVC Buffer',
          deadline: '2026-03-01',
          description: 'Target 75% RVC (10% buffer above minimum)',
          costEstimate: '$2,000-5,000'
        },
        {
          priority: 3,
          action: 'Join Industry Coalition',
          deadline: '2025-12-15',
          description: 'Amplify your voice through industry groups',
          costEstimate: '$500/year'
        }
      ]
    },

    CA: {
      fullName: 'Canada',
      position: 'defensive', // Protecting status quo
      priorities: [
        'Maintain 65% RVC threshold',
        'Defend existing trade benefits',
        'Prevent US bilateral deals',
        'Preserve supply chain stability'
      ],

      scenarios: {
        A: {
          name: 'Status Quo Maintained',
          probability: 55, // Higher for Canada (Canada wants no changes)
          description: 'Agreement extends with minimal adjustments',
          userImpact: 'Continue current operations, maintain competitiveness'
        },
        B: {
          name: 'US Pushes Changes',
          probability: 35,
          description: 'RVC increases, new compliance requirements',
          userImpact: 'Adjust sourcing to maintain USMCA benefits'
        },
        C: {
          name: 'US Bilateral Deals',
          probability: 10, // Low for Canada (worst case)
          description: 'US negotiates outside USMCA, tariffs return',
          userImpact: 'Face 10% US tariffs, diversify to Asia/Europe'
        }
      },

      governmentAgencies: [
        {
          name: 'Global Affairs Canada',
          role: 'Lead CUSMA negotiations',
          contact: 'https://international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum',
          phone: '1-800-267-8376',
          publicComment: 'https://international.gc.ca/trade-commerce/consultations',
          services: ['Policy consultations', 'Trade law support', 'CUSMA guidance']
        },
        {
          name: 'Canada Border Services Agency (CBSA)',
          role: 'Customs compliance',
          contact: 'https://cbsa-asfc.gc.ca',
          phone: '1-800-461-9999',
          services: ['Advance rulings', 'Origin verification', 'Certificate support']
        },
        {
          name: 'Export Development Canada (EDC)',
          role: 'Trade financing & risk',
          contact: 'https://edc.ca',
          phone: '1-800-229-0575',
          services: ['Trade financing', 'Risk assessment', 'Market intelligence']
        },
        {
          name: 'Canadian Commercial Corporation (CCC)',
          role: 'US government contracts',
          contact: 'https://ccc.ca',
          phone: '1-800-748-8191',
          services: ['US procurement', 'Contract facilitation', 'USMCA navigation']
        }
      ],

      industryAssociations: [
        {
          name: 'Canadian Manufacturers & Exporters (CME)',
          position: 'Defend CUSMA benefits',
          website: 'https://cme-mec.ca',
          membership: '$500-3000/year',
          benefits: ['Ottawa advocacy', 'Member consultations', 'Policy submissions']
        },
        {
          name: 'Canadian Chamber of Commerce',
          position: 'Maintain trade stability',
          website: 'https://chamber.ca',
          membership: '$400-1500/year',
          benefits: ['Government relations', 'CUSMA working group', 'Member briefings']
        }
      ],

      actionPriorities: [
        {
          priority: 1,
          action: 'Submit Consultation to Global Affairs',
          deadline: '2026-01-15',
          description: 'Defend 65% RVC threshold and current benefits',
          template: 'global-affairs-consultation-template'
        },
        {
          priority: 2,
          action: 'Document US Market Dependency',
          deadline: '2026-02-01',
          description: 'Show impact if CUSMA benefits lost',
          costEstimate: '$500-1000'
        },
        {
          priority: 3,
          action: 'Identify Alternative Markets',
          deadline: '2026-03-01',
          description: 'Prepare for worst case (Asia, Europe)',
          costEstimate: '$2,000-5,000'
        }
      ]
    },

    MX: {
      fullName: 'Mexico',
      fullNameES: 'México',
      position: 'mixed', // Expand benefits, resist restrictions
      priorities: [
        'Expand maquiladora benefits',
        'Defend against wage requirements',
        'Increase Mexico content in supply chains',
        'Maintain competitive advantage vs Asia'
      ],
      prioritiesES: [
        'Expandir beneficios de maquiladoras',
        'Defender contra requisitos salariales',
        'Aumentar contenido mexicano en cadenas de suministro',
        'Mantener ventaja competitiva vs Asia'
      ],

      scenarios: {
        A: {
          name: 'Extension with Improvements',
          nameES: 'Extensión con Mejoras',
          probability: 50,
          description: 'Maintain benefits, minor improvements',
          descriptionES: 'Mantener beneficios, mejoras menores',
          userImpact: 'Continue growth, invest in Mexico operations',
          userImpactES: 'Continuar crecimiento, invertir en operaciones mexicanas'
        },
        B: {
          name: 'Wage Requirements Added',
          nameES: 'Requisitos Salariales Añadidos',
          probability: 40,
          description: '$16/hr minimum wage for all sectors',
          descriptionES: 'Salario mínimo $16/hr para todos los sectores',
          userImpact: 'Verify supplier wage compliance, possible cost increase',
          userImpactES: 'Verificar cumplimiento salarial, posible aumento de costos'
        },
        C: {
          name: 'Restrictive Changes',
          nameES: 'Cambios Restrictivos',
          probability: 10,
          description: 'Higher RVC + strict labor rules hurt competitiveness',
          descriptionES: 'RVC mayor + reglas laborales estrictas afectan competitividad',
          userImpact: 'May lose cost advantage vs Asia',
          userImpactES: 'Puede perder ventaja de costo vs Asia'
        }
      },

      governmentAgencies: [
        {
          name: 'Secretaría de Economía',
          nameES: 'Secretaría de Economía',
          role: 'Lead T-MEC negotiations',
          roleES: 'Liderazgo negociaciones T-MEC',
          contact: 'https://www.gob.mx/se',
          phone: '800-083-3863',
          publicComment: 'https://www.gob.mx/se/acciones-y-programas/consultas-publicas',
          services: ['Public consultations', 'T-MEC guidance', 'Certificate support'],
          servicesES: ['Consultas públicas', 'Orientación T-MEC', 'Apoyo certificados']
        },
        {
          name: 'Servicio de Administración Tributaria (SAT)',
          nameES: 'Servicio de Administración Tributaria (SAT)',
          role: 'Customs & tax administration',
          roleES: 'Administración aduanera y tributaria',
          contact: 'https://sat.gob.mx',
          phone: '800-463-7263',
          services: ['Customs clearance', 'Origin certification', 'Compliance guidance'],
          servicesES: ['Despacho aduanero', 'Certificación origen', 'Orientación cumplimiento']
        },
        {
          name: 'ProMéxico',
          nameES: 'ProMéxico',
          role: 'Export promotion',
          roleES: 'Promoción de exportaciones',
          contact: 'https://promexico.gob.mx',
          phone: '800-123-4567',
          services: ['Market intelligence', 'Buyer connections', 'Trade missions'],
          servicesES: ['Inteligencia de mercado', 'Conexiones compradores', 'Misiones comerciales']
        }
      ],

      industryAssociations: [
        {
          name: 'Consejo Nacional de la Industria Maquiladora (INDEX)',
          nameES: 'Consejo Nacional de la Industria Maquiladora (INDEX)',
          position: 'Defend maquiladora benefits',
          positionES: 'Defender beneficios maquiladoras',
          website: 'https://index.org.mx',
          membership: '$5,000-15,000 MXN/year',
          benefits: ['Government lobbying', 'Labor law guidance', 'T-MEC defense'],
          benefitsES: ['Cabildeo gubernamental', 'Orientación laboral', 'Defensa T-MEC']
        },
        {
          name: 'Cámara Nacional de la Industria de Transformación (CANACINTRA)',
          nameES: 'Cámara Nacional de la Industria de Transformación (CANACINTRA)',
          position: 'Support Mexico manufacturing',
          positionES: 'Apoyar manufactura mexicana',
          website: 'https://canacintra.org.mx',
          membership: '$3,000-10,000 MXN/year',
          benefits: ['Industry representation', 'Policy consultations', 'Member networking'],
          benefitsES: ['Representación industrial', 'Consultas políticas', 'Red de miembros']
        }
      ],

      actionPriorities: [
        {
          priority: 1,
          action: 'Submit Consultation to Secretaría de Economía',
          actionES: 'Enviar consulta a Secretaría de Economía',
          deadline: '2026-01-15',
          description: 'Defend maquiladora benefits and competitive advantage',
          descriptionES: 'Defender beneficios maquiladoras y ventaja competitiva',
          template: 'secretaria-economia-template'
        },
        {
          priority: 2,
          action: 'Verify Wage Compliance',
          actionES: 'Verificar cumplimiento salarial',
          deadline: '2026-02-01',
          description: 'Document supplier wages meet potential $16/hr requirement',
          descriptionES: 'Documentar salarios proveedores cumplen posible requisito $16/hr',
          costEstimate: '$500-1,500'
        },
        {
          priority: 3,
          action: 'Increase North American Content',
          actionES: 'Aumentar contenido norteamericano',
          deadline: '2026-03-01',
          description: 'Target 75% RVC with Mexico suppliers',
          descriptionES: 'Objetivo 75% CVR con proveedores mexicanos',
          costEstimate: '$1,000-3,000'
        }
      ],

      // Spanish language support
      language: {
        scenarioPlanningTitle: 'Planeación de Escenarios T-MEC 2026',
        governmentResourcesTitle: 'Recursos Gubernamentales',
        industryAssociationsTitle: 'Asociaciones Industriales',
        actionChecklistTitle: 'Lista de Acciones Prioritarias',
        deadline: 'Fecha límite',
        cost: 'Costo estimado',
        probability: 'Probabilidad',
        impact: 'Impacto en tu negocio'
      }
    }
  },

  // Shared timeline for all countries
  timeline: [
    {
      date: '2025-12-10',
      event: 'Brookings Institution USMCA Webinar',
      url: 'https://brookings.edu/usmca-2026',
      relevantFor: ['US', 'CA', 'MX']
    },
    {
      date: '2026-01-15',
      event: 'Public Comment Deadline',
      description: 'Submit feedback to government agencies',
      relevantFor: ['US', 'CA', 'MX']
    },
    {
      date: '2026-02-05',
      event: 'Senate Finance Committee Hearing (US)',
      url: 'https://finance.senate.gov',
      relevantFor: ['US']
    },
    {
      date: '2026-03-01',
      event: 'Preparation Deadline',
      description: 'Complete supply chain adjustments before review',
      relevantFor: ['US', 'CA', 'MX']
    },
    {
      date: '2026-07-01',
      event: 'USMCA Joint Review',
      description: 'Mandatory 6-year review begins',
      relevantFor: ['US', 'CA', 'MX']
    }
  ]
};

/**
 * Get country-specific USMCA 2026 configuration
 */
export function getCountryConfig(companyCountry, preferredLanguage = 'en') {
  // Normalize country codes
  const normalizedCountry = normalizeCountryCode(companyCountry);

  const config = USMCA_2026_CONFIG.countries[normalizedCountry];

  if (!config) {
    // Default to US if country not recognized
    return USMCA_2026_CONFIG.countries.US;
  }

  // For Mexico, return Spanish if preferred
  if (normalizedCountry === 'MX' && preferredLanguage === 'es') {
    return {
      ...config,
      useSpanish: true
    };
  }

  return config;
}

/**
 * Normalize country codes
 */
function normalizeCountryCode(country) {
  if (!country) return 'US';

  const normalized = country.toUpperCase();

  if (normalized.includes('UNITED STATES') || normalized === 'USA' || normalized === 'US') {
    return 'US';
  }
  if (normalized.includes('CANADA') || normalized === 'CA') {
    return 'CA';
  }
  if (normalized.includes('MEXICO') || normalized === 'MX' || normalized.includes('MÉXICO')) {
    return 'MX';
  }

  return 'US'; // Default
}

/**
 * Get relevant timeline events for user's country
 */
export function getCountryTimeline(companyCountry) {
  const country = normalizeCountryCode(companyCountry);

  return USMCA_2026_CONFIG.timeline.filter(event =>
    event.relevantFor.includes(country)
  );
}

export default USMCA_2026_CONFIG;
