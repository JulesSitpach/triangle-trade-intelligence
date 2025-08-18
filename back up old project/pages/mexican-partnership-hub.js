import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { useRouter } from 'next/router';
import { Globe, Users, TrendingUp, DollarSign, ArrowRight, Check, AlertCircle, Building2, Package, Ship, Phone, Mail, MapPin, Calendar, Target, Link2, Flag, Star, StarHalf, Shield, AlertTriangle } from 'lucide-react';

export default function MexicanPartnershipHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('us-importers');
  const [partnershipData, setPartnershipData] = useState({
    usImporters: [],
    canadianImporters: [],
    mexicanPartners: [],
    activeDeals: [],
    analytics: {}
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    urgency: 'all',
    industry: 'all',
    volume: 'all',
    location: 'all'
  });
  const [userAuth, setUserAuth] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const auth = localStorage.getItem('salesAuth');
    if (!auth) {
      router.push('/sales-login');
      return;
    }
    
    const authData = JSON.parse(auth);
    // Check if login is still valid (24 hour expiry)
    const loginTime = new Date(authData.loginTime);
    const now = new Date();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('salesAuth');
      router.push('/sales-login');
      return;
    }
    
    setUserAuth(authData);
  }, [router]);

  // Mock data specifically for your husband's role
  const usImportersNeedingMexicanPartners = [
    {
      id: 1,
      companyName: 'Detroit Auto Manufacturing',
      contact: 'John Rodriguez',
      email: 'j.rodriguez@detroitauto.com',
      phone: '+1-313-555-0156',
      location: 'Detroit, Michigan',
      industry: 'Automotive Parts',
      currentSupplier: 'Shanghai Auto Components',
      importVolume: '$8.2M annually',
      products: 'Brake systems, transmission parts, engine components',
      currentTariffs: '30% China tariffs',
      potentialSavings: '$2.46M annually',
      urgency: 'HIGH',
      timeline: 'Need partner by March 2025',
      notes: 'Speaks Spanish - worked 5 years in Mexico City. Prefers Mexican cultural approach to business.',
      mexicanPartnerNeeds: 'IMMEX certified facility within 50km of Tijuana border',
      lastContact: '2 days ago',
      status: 'hot_prospect'
    },
    {
      id: 2,
      companyName: 'Silicon Valley Electronics',
      contact: 'Maria Chen-Lopez',
      email: 'm.chenlopez@svelec.com',
      phone: '+1-408-555-0299',
      location: 'San Jose, California',
      industry: 'Consumer Electronics',
      currentSupplier: 'Shenzhen Tech Manufacturing',
      importVolume: '$12M annually',
      products: 'Smart home devices, IoT sensors, mobile accessories',
      currentTariffs: '25% China tariffs',
      potentialSavings: '$3M annually',
      urgency: 'MEDIUM',
      timeline: 'Q2 2025',
      notes: 'Bilingual team, already has Mexican supply chain experience. Looking for premium quality partner.',
      mexicanPartnerNeeds: 'ISO 9001 certified electronics manufacturer in Guadalajara tech corridor',
      lastContact: '5 days ago',
      status: 'qualified'
    },
    {
      id: 3,
      companyName: 'SolarTech USA',
      contact: 'Jennifer Wong-Rodriguez',
      email: 'jwong@solartech-usa.com',
      phone: '+1-480-555-0888',
      location: 'Phoenix, Arizona',
      industry: 'Energy & Solar',
      currentSupplier: 'Shenzhen Solar Manufacturing',
      importVolume: '$18M annually',
      products: 'Solar panels, inverters, mounting systems, energy storage',
      currentTariffs: '100% China solar tariffs + Section 201 tariffs',
      potentialSavings: '$9M annually',
      urgency: 'EXTREME',
      timeline: 'IMMEDIATE - Facing bankruptcy due to tariffs',
      notes: 'Bilingual owner, deep Mexico connections. Current China supplier costs killing business.',
      mexicanPartnerNeeds: 'IMMEX solar panel assembly facility near US border',
      lastContact: 'Today',
      status: 'hot_prospect'
    },
    {
      id: 4,
      companyName: 'Midwest Medical Devices',
      contact: 'Robert Martinez',
      email: 'rmartinez@midwestmed.com',
      phone: '+1-312-555-0444',
      location: 'Chicago, Illinois',
      industry: 'Medical Equipment',
      currentSupplier: 'Taipei Medical Manufacturing',
      importVolume: '$5.5M annually',
      products: 'Surgical instruments, diagnostic equipment, medical consumables',
      currentTariffs: '15% + FDA compliance issues',
      potentialSavings: '$825K annually',
      urgency: 'HIGH',
      timeline: 'URGENT - Current supplier failing FDA inspections',
      notes: 'FDA compliance is critical. Needs FDA-registered Mexican facility immediately.',
      mexicanPartnerNeeds: 'FDA-registered Class II medical device manufacturer',
      lastContact: '1 day ago',
      status: 'hot_prospect'
    },
    {
      id: 5,
      companyName: 'Texas Construction Supply',
      contact: 'Mike Johnson',
      email: 'mjohnson@texasconstruction.com',
      phone: '+1-214-555-0777',
      location: 'Dallas, Texas',
      industry: 'Construction Materials',
      currentSupplier: 'Beijing Steel & Aluminum',
      importVolume: '$22M annually',
      products: 'Steel rebar, aluminum sheets, construction hardware',
      currentTariffs: '25% steel tariffs destroying margins',
      potentialSavings: '$5.5M annually',
      urgency: 'HIGH',
      timeline: 'Q1 2025 - Construction season starting',
      notes: 'Major contractor relationships depend on cost savings. Open to Mexican partnerships.',
      mexicanPartnerNeeds: 'Steel processing facility with IMMEX certification',
      lastContact: '3 days ago',
      status: 'qualified'
    },
    {
      id: 6,
      companyName: 'Pacific Electronics Import',
      contact: 'David Kim-Martinez',
      email: 'dkim@pacificelec.com',
      phone: '+1-206-555-0999',
      location: 'Seattle, Washington',
      industry: 'Electronics',
      currentSupplier: 'Taiwan Semiconductor Assembly',
      importVolume: '$15M annually',
      products: 'Semiconductors, circuit boards, consumer electronics',
      currentTariffs: '25% China/Taiwan tech tariffs',
      potentialSavings: '$3.75M annually',
      urgency: 'HIGH',
      timeline: 'Q1 2025 - New product launches',
      notes: 'Korean-American owner, excellent Mexico relationships. Needs high-tech assembly.',
      mexicanPartnerNeeds: 'High-tech electronics facility with clean room capabilities',
      lastContact: '1 week ago',
      status: 'qualified'
    },
    {
      id: 7,
      companyName: 'Midwest Textile Imports',
      contact: 'Sarah Bangladesh-Rodriguez',
      email: 'srodriguez@midwesttextile.com',
      phone: '+1-312-555-1111',
      location: 'Chicago, Illinois',
      industry: 'Textiles',
      currentSupplier: 'Dhaka Garment Manufacturing',
      importVolume: '$8M annually',
      products: 'Apparel, home textiles, fashion accessories',
      currentTariffs: '15% textile tariffs + compliance costs',
      potentialSavings: '$1.2M annually',
      urgency: 'MEDIUM',
      timeline: 'Fall 2025 fashion season',
      notes: 'Bilingual team with Bangladesh connections. Sustainability focus.',
      mexicanPartnerNeeds: 'Sustainable textile manufacturing with fair trade certification',
      lastContact: '4 days ago',
      status: 'qualified'
    }
  ];

  const canadianImportersNeedingMexicanPartners = [
    {
      id: 4,
      companyName: 'Vancouver Outdoor Gear',
      contact: 'Sophie Dubois',
      email: 's.dubois@vanoutdoor.ca',
      phone: '+1-604-555-0678',
      location: 'Vancouver, BC',
      industry: 'Sporting Goods',
      currentSupplier: 'Guangzhou Sports Equipment',
      importVolume: '$3.2M annually',
      products: 'Camping equipment, outdoor apparel, sports accessories',
      currentTariffs: '18% China tariffs',
      potentialSavings: '$576K annually',
      urgency: 'MEDIUM',
      timeline: 'Fall 2025 for winter season prep',
      notes: 'Francophone company, appreciates personal relationship approach. Eco-conscious brand.',
      mexicanPartnerNeeds: 'Sustainable manufacturing practices, English/French communication',
      lastContact: '3 days ago',
      status: 'qualified'
    }
  ];

  const mexicanPartners = [
    {
      id: 101,
      companyName: 'Maquiladora Industrial Tijuana',
      contact: 'Carlos Mendoza',
      email: 'cmendoza@maqtijuana.mx',
      phone: '+52-664-555-1234',
      location: 'Tijuana, Baja California',
      specialization: 'Automotive & Electronics',
      capacity: 'Up to $15M monthly processing',
      certifications: 'IMMEX, ISO 9001, TS 16949, C-TPAT',
      services: 'Assembly, packaging, quality control, logistics coordination',
      languages: 'Spanish, English, basic Mandarin',
      experience: '15 years with US automotive companies (Ford, GM subcontractors)',
      fees: '4-6% of goods value',
      availability: 'Immediate - has 40% unused capacity',
      culturalNotes: 'Very relationship-focused, prefers face-to-face meetings, strong family business values',
      // NEW RATING SYSTEM
      averageRating: 4.8,
      totalReviews: 23,
      successRate: 94,
      recentReviews: [
        {
          id: 1,
          company: 'Detroit Manufacturing Co.',
          rating: 5,
          date: '2024-11-15',
          review: 'Outstanding partner! Carlos and his team delivered exactly as promised. Setup took only 3 weeks and we\'re saving $180K annually.',
          verified: true,
          partnership: 'Active 8 months'
        },
        {
          id: 2,
          company: 'Phoenix Auto Parts',
          rating: 4,
          date: '2024-10-20',
          review: 'Great facility and team. Minor delays during initial setup but excellent ongoing performance.',
          verified: true,
          partnership: 'Active 6 months'
        }
      ],
      platformRating: 'User-reviewed partner',
      riskLevel: 'Low (23 successful partnerships)'
    },
    {
      id: 102,
      companyName: 'Guadalajara Electronics Hub',
      contact: 'Elena Rodriguez-Kim',
      email: 'erodriguez@gdlelec.mx',
      phone: '+52-33-555-5678',
      location: 'Guadalajara, Jalisco',
      specialization: 'High-tech Electronics & Medical Devices',
      capacity: 'Up to $25M monthly processing',
      certifications: 'IMMEX, ISO 13485 (Medical), FDA Registration, IPC Standards',
      services: 'SMT assembly, testing, FDA compliance documentation, clean room manufacturing',
      languages: 'Spanish, English, Korean (owner lived in Seoul)',
      experience: '12 years, worked with Samsung Mexico, LG Electronics',
      fees: '5-8% of goods value (higher for medical compliance)',
      availability: 'Available Q2 2025',
      culturalNotes: 'Technology-focused, very detail-oriented, appreciates technical discussions',
      // NEW RATING SYSTEM
      averageRating: 4.9,
      totalReviews: 18,
      successRate: 98,
      recentReviews: [
        {
          id: 3,
          company: 'Silicon Valley MedTech',
          rating: 5,
          date: '2024-12-01',
          review: 'Elena\'s team exceeded expectations. FDA compliance was flawless and quality control is exceptional.',
          verified: true,
          partnership: 'Active 4 months'
        },
        {
          id: 4,
          company: 'Austin Electronics',
          rating: 5,
          date: '2024-11-10',
          review: 'Perfect partner for high-tech assembly. Korean language skills helped with our Asian component suppliers.',
          verified: true,
          partnership: 'Active 7 months'
        }
      ],
      platformRating: 'User-reviewed partner',
      riskLevel: 'Very Low (18 successful partnerships)'
    },
    {
      id: 103,
      companyName: 'Energía Solar Frontera',
      contact: 'Ricardo Morales-Chen',
      email: 'rmorales@energiasolar.mx',
      phone: '+52-656-555-9999',
      location: 'Ciudad Juárez, Chihuahua (5km from El Paso border)',
      specialization: 'Solar Panel Assembly & Energy Storage',
      capacity: 'Up to $30M monthly solar panel processing',
      certifications: 'IMMEX, IEC 61215 (Solar), UL 1703, NABCEP Partner, ISO 14001',
      services: 'Solar panel assembly, inverter integration, energy storage systems, quality testing',
      languages: 'Spanish, English, Mandarin (worked in Shenzhen)',
      experience: '8 years solar, former operations manager at JinkoSolar Mexico facility',
      fees: '3-5% of goods value (lowest rate for high volume solar)',
      availability: 'IMMEDIATE - New facility with 60% unused capacity',
      culturalNotes: 'Solar industry specialist, understands urgent tariff pressures, very responsive to US clients',
      // NEW RATING SYSTEM
      averageRating: 4.7,
      totalReviews: 31,
      successRate: 91,
      recentReviews: [
        {
          id: 5,
          company: 'Arizona Solar Systems',
          rating: 5,
          date: '2024-12-05',
          review: 'AMAZING! Ricardo saved our company from bankruptcy. Trump tariffs were killing us, now we\'re profitable again.',
          verified: true,
          partnership: 'Active 2 months'
        },
        {
          id: 6,
          company: 'California Green Energy',
          rating: 4,
          date: '2024-11-25',
          review: 'Great solar expertise. Some initial communication issues but Ricardo resolved everything quickly.',
          verified: true,
          partnership: 'Active 5 months'
        }
      ],
      platformRating: 'User-reviewed partner',
      riskLevel: 'Low (31 successful partnerships)'
    }
  ];

  const partnershipAnalytics = {
    totalUSImporters: 67,
    totalCanadianImporters: 28,
    activeMexicanPartners: 18,
    dealsInProgress: 16,
    monthlyCommissionPotential: '$240K',
    averageDealValue: '$4.1M',
    successRate: '87%',
    averageTimeToClose: '28 days',
    topSourceCountries: ['China', 'Vietnam', 'Taiwan', 'South Korea', 'Bangladesh'],
    topIndustries: ['Energy & Solar', 'Electronics', 'Construction Materials', 'Automotive', 'Textiles']
  };

  useEffect(() => {
    // Load data and set up for your husband's workflow
    setPartnershipData({
      usImporters: usImportersNeedingMexicanPartners,
      canadianImporters: canadianImportersNeedingMexicanPartners,
      mexicanPartners: mexicanPartners,
      activeDeals: [],
      analytics: partnershipAnalytics
    });
    setLoading(false);
  }, []);

  const connectPartners = (importer, partner) => {
    const introEmail = `
Estimados ${importer.contact} y ${partner.contact},

Me da mucho gusto presentarles esta oportunidad de colaboración a través de Triangle Intelligence.

⚠️ IMPORTANTE: Triangle Intelligence conecta empresas pero no media en negociaciones. Todos los términos, contratos y acuerdos son directamente entre ustedes.

${importer.companyName} (${importer.location}):
• Volumen actual: ${importer.importVolume}
• Productos: ${importer.products}
• Ahorro potencial: ${importer.potentialSavings}
• Necesidades específicas: ${importer.mexicanPartnerNeeds}

${partner.companyName} (${partner.location}) - ⭐ ${partner.averageRating}/5.0 (${partner.totalReviews} reseñas de usuarios):
• Especialización: ${partner.specialization}
• Capacidad: ${partner.capacity}
• Certificaciones: ${partner.certifications}
• Experiencia: ${partner.experience}
• Tasa de éxito: ${partner.successRate}%

Esta alianza estratégica les permitirá:
✓ Eliminar aranceles del 30% con ruta triangular USMCA
✓ Reducir tiempos de entrega
✓ Crear una relación comercial a largo plazo

📋 PRÓXIMOS PASOS SUGERIDOS:
1. Llamada de introducción (recomendamos esta semana)
2. Negociación directa de términos entre ustedes
3. Diligencia debida independiente de ambas partes
4. Acuerdo contractual directo (sin intermediarios)

DESCARGO DE RESPONSABILIDAD: Triangle Intelligence facilita conexiones pero no garantiza resultados. Realicen su propia diligencia debida.

Saludos cordiales,
${userAuth?.name || 'Mexican Partnership Specialist'}
Triangle Intelligence Partnership Team
    `;
    
    navigator.clipboard.writeText(introEmail);
    alert('¡Email de introducción copiado! Recuerda: eres facilitador, no mediador. Las empresas negocian directamente.');
  };

  const renderStarRating = (rating, totalReviews) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
        ))}
        {hasHalfStar && <StarHalf size={16} fill="#fbbf24" color="#fbbf24" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={16} color="#d1d5db" />
        ))}
        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
          {rating}/5.0 ({totalReviews} reseñas)
        </span>
      </div>
    );
  };

  const [selectedPartnerForReviews, setSelectedPartnerForReviews] = useState(null);

  const showPartnerReviews = (partner) => {
    setSelectedPartnerForReviews(partner);
  };

  const closeReviews = () => {
    setSelectedPartnerForReviews(null);
  };

  if (loading || !userAuth) {
    return <div className="partnership-hub"><div className="partnership-container">Cargando...</div></div>;
  }

  return (
    <div className="partnership-hub">
      {/* Header - Personalized for your husband */}
      <div className="partnership-header">
        <div className="partnership-header-content">
          <div className="partnership-header-left">
            <Flag className="partnership-header-icon" style={{color: '#dc2626'}} />
            <div>
              <h1 className="partnership-header-title">🇲🇽 Hub de Partnerships Mexicanos</h1>
              <p className="partnership-header-subtitle">Conectando importadores con socios mexicanos para routing triangular USMCA</p>
            </div>
          </div>
          <div className="partnership-header-right">
            {userAuth && (
              <div className="partnership-user-info">
                <p className="partnership-user-name">{userAuth.name}</p>
                <p className="partnership-user-role">Especialista en Partnerships Mexicanos</p>
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('salesAuth');
                router.push('/sales-login');
              }}
              className="partnership-logout-btn"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Analytics - Focused on your husband's KPIs */}
      <div className="partnership-container">
        <div className="partnership-analytics">
          <div className="partnership-analytics-card">
            <div className="partnership-analytics-content">
              <div className="partnership-analytics-text">
                <h3>Importadores US Activos</h3>
                <p style={{color: '#dc2626'}}>{partnershipAnalytics.totalUSImporters}</p>
              </div>
              <Users className="partnership-analytics-icon" style={{color: '#dc2626'}} />
            </div>
          </div>
          
          <div className="partnership-analytics-card">
            <div className="partnership-analytics-content">
              <div className="partnership-analytics-text">
                <h3>Importadores Canadienses</h3>
                <p style={{color: '#dc2626'}}>{partnershipAnalytics.totalCanadianImporters}</p>
              </div>
              <Flag className="partnership-analytics-icon" style={{color: '#dc2626'}} />
            </div>
          </div>
          
          <div className="partnership-analytics-card">
            <div className="partnership-analytics-content">
              <div className="partnership-analytics-text">
                <h3>Partners Mexicanos</h3>
                <p style={{color: '#16a34a'}}>{partnershipAnalytics.activeMexicanPartners}</p>
              </div>
              <Building2 className="partnership-analytics-icon" style={{color: '#16a34a'}} />
            </div>
          </div>
          
          <div className="partnership-analytics-card">
            <div className="partnership-analytics-content">
              <div className="partnership-analytics-text">
                <h3>Comisión Mensual Potencial</h3>
                <p style={{color: '#059669'}}>{partnershipAnalytics.monthlyCommissionPotential}</p>
              </div>
              <DollarSign className="partnership-analytics-icon" style={{color: '#059669'}} />
            </div>
          </div>
        </div>

        {/* Main Content - Tabs focused on your husband's workflow */}
        <div className="partnership-main-content">
          <div className="partnership-tabs">
            <div className="partnership-tabs-list">
              {['us-importers', 'canadian-importers', 'mexican-partners', 'active-deals'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`partnership-tab ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab === 'us-importers' && '🇺🇸 Importadores US'}
                  {tab === 'canadian-importers' && '🇨🇦 Importadores Canadá'}
                  {tab === 'mexican-partners' && '🇲🇽 Partners Mexicanos'}
                  {tab === 'active-deals' && '💼 Deals Activos'}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="partnership-filters">
            <div className="partnership-filters-container">
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                className="partnership-filter-select"
              >
                <option value="all">Todas las urgencias</option>
                <option value="HIGH">🔥 ALTA urgencia</option>
                <option value="MEDIUM">⚡ Urgencia media</option>
                <option value="LOW">📅 Baja prioridad</option>
              </select>
              
              <select
                value={filters.industry}
                onChange={(e) => setFilters({...filters, industry: e.target.value})}
                className="partnership-filter-select"
              >
                <option value="all">Todas las industrias</option>
                <option value="Energy & Solar">🔋 Energía y Solar (¡Alta demanda!)</option>
                <option value="Construction Materials">🏗️ Materiales de construcción</option>
                <option value="Automotive">🚗 Automotriz</option>
                <option value="Electronics">💻 Electrónicos</option>
                <option value="Chemicals & Plastics">⚗️ Químicos y plásticos</option>
                <option value="Industrial Equipment">🛠️ Equipo industrial</option>
                <option value="Medical">🏥 Dispositivos médicos</option>
                <option value="Textiles">🧵 Textiles</option>
                <option value="Food & Agriculture">🌽 Alimentos y agricultura</option>
                <option value="Sporting Goods">⚽ Artículos deportivos</option>
                <option value="Other">📦 Otros</option>
              </select>
              
              <select
                value={filters.volume}
                onChange={(e) => setFilters({...filters, volume: e.target.value})}
                className="partnership-filter-select"
              >
                <option value="all">Todos los volúmenes</option>
                <option value="large">💰 +$10M (Premium)</option>
                <option value="medium">💵 $5M-$10M (Grande)</option>
                <option value="small">💴 $1M-$5M (Mediano)</option>
              </select>
            </div>
          </div>

          {/* Content - Specialized for your husband's role */}
          <div className="partnership-content">
            {activeTab === 'us-importers' && (
              <div className="partnership-opportunities">
                <h3 className="partnership-matches-title">🇺🇸 Importadores Estadounidenses Buscando Partners Mexicanos</h3>
                {partnershipData.usImporters.map((importer) => (
                  <div key={importer.id} className="partnership-opportunity-card">
                    <div className="partnership-opportunity-header">
                      <div className="partnership-opportunity-title">
                        <h3 className="partnership-opportunity-name">{importer.companyName}</h3>
                        <span className={`partnership-status-badge ${
                          importer.status === 'hot_prospect' ? 'partnership-status-hot' : 'partnership-status-qualified'
                        }`}>
                          {importer.urgency}
                        </span>
                        <span className="partnership-opportunity-location">
                          <MapPin className="partnership-contact-icon" />
                          {importer.location}
                        </span>
                      </div>
                      
                      <div className="partnership-opportunity-score">
                        <div className="partnership-score-number" style={{color: '#dc2626'}}>🔥</div>
                        <div className="partnership-score-label">{importer.timeline}</div>
                        <button 
                          className="partnership-view-btn"
                          onClick={() => {
                            const bestMatch = mexicanPartners.find(p => 
                              p.specialization.includes(importer.industry) || 
                              importer.mexicanPartnerNeeds.toLowerCase().includes(p.location.toLowerCase())
                            );
                            if (bestMatch) {
                              connectPartners(importer, bestMatch);
                            } else {
                              alert('Buscando el mejor partner mexicano para este cliente...');
                            }
                          }}
                        >
                          Conectar Partner
                        </button>
                      </div>
                    </div>
                    
                    <div className="partnership-opportunity-details">
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Industria:</span>
                        <span className="partnership-detail-value">{importer.industry}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Volumen anual:</span>
                        <span className="partnership-detail-value">{importer.importVolume}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Ahorro potencial:</span>
                        <span className="partnership-detail-value green">{importer.potentialSavings}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Necesita partner:</span>
                        <span className="partnership-detail-value">{importer.mexicanPartnerNeeds}</span>
                      </div>
                    </div>
                    
                    <div className="partnership-opportunity-contacts">
                      <div className="partnership-contact-item">
                        <Users className="partnership-contact-icon" />
                        {importer.contact}
                      </div>
                      <div className="partnership-contact-item">
                        <Mail className="partnership-contact-icon" />
                        {importer.email}
                      </div>
                      <div className="partnership-contact-item">
                        <Phone className="partnership-contact-icon" />
                        {importer.phone}
                      </div>
                    </div>
                    
                    {importer.notes && (
                      <div className="partnership-opportunity-notes">
                        <strong>Notas culturales/importantes:</strong> {importer.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'canadian-importers' && (
              <div className="partnership-opportunities">
                <h3 className="partnership-matches-title">🇨🇦 Importadores Canadienses Buscando Partners Mexicanos</h3>
                {partnershipData.canadianImporters.map((importer) => (
                  <div key={importer.id} className="partnership-opportunity-card">
                    <div className="partnership-opportunity-header">
                      <div className="partnership-opportunity-title">
                        <h3 className="partnership-opportunity-name">{importer.companyName}</h3>
                        <span className="partnership-status-badge partnership-status-qualified">
                          {importer.urgency}
                        </span>
                        <span className="partnership-opportunity-location">
                          <MapPin className="partnership-contact-icon" />
                          {importer.location}
                        </span>
                      </div>
                      
                      <div className="partnership-opportunity-score">
                        <div className="partnership-score-number" style={{color: '#dc2626'}}>🍁</div>
                        <div className="partnership-score-label">{importer.timeline}</div>
                        <button 
                          className="partnership-view-btn"
                          onClick={() => {
                            const bestMatch = mexicanPartners[0]; // For demo, use first partner
                            connectPartners(importer, bestMatch);
                          }}
                        >
                          Conectar Partner
                        </button>
                      </div>
                    </div>
                    
                    <div className="partnership-opportunity-details">
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Industria:</span>
                        <span className="partnership-detail-value">{importer.industry}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Volumen anual:</span>
                        <span className="partnership-detail-value">{importer.importVolume}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Ahorro potencial:</span>
                        <span className="partnership-detail-value green">{importer.potentialSavings}</span>
                      </div>
                      <div className="partnership-detail-item">
                        <span className="partnership-detail-label">Necesita partner:</span>
                        <span className="partnership-detail-value">{importer.mexicanPartnerNeeds}</span>
                      </div>
                    </div>
                    
                    <div className="partnership-opportunity-contacts">
                      <div className="partnership-contact-item">
                        <Users className="partnership-contact-icon" />
                        {importer.contact}
                      </div>
                      <div className="partnership-contact-item">
                        <Mail className="partnership-contact-icon" />
                        {importer.email}
                      </div>
                      <div className="partnership-contact-item">
                        <Phone className="partnership-contact-icon" />
                        {importer.phone}
                      </div>
                    </div>
                    
                    {importer.notes && (
                      <div className="partnership-opportunity-notes">
                        <strong>Notas culturales/importantes:</strong> {importer.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mexican-partners' && (
              <div className="partnership-matches">
                <h3 className="partnership-matches-title">🇲🇽 Partners Mexicanos Disponibles</h3>
                {partnershipData.mexicanPartners.map((partner) => (
                  <div key={partner.id} className="partnership-match-card">
                    <div className="partnership-match-content">
                      <div className="partnership-match-left">
                        <div className="partnership-match-companies">
                          <div className="partnership-match-company">
                            <h4 className="partnership-match-company-name">🏭 {partner.companyName}</h4>
                            
                            {/* NEW RATING SYSTEM DISPLAY */}
                            <div style={{ margin: '8px 0', padding: '8px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' }}>
                              {renderStarRating(partner.averageRating, partner.totalReviews)}
                              <div style={{ marginTop: '4px', fontSize: '12px', color: '#0369a1' }}>
                                <Shield size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                {partner.platformRating} • Tasa de éxito: {partner.successRate}%
                              </div>
                              <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                                {partner.riskLevel}
                              </div>
                              <button 
                                style={{ 
                                  background: '#0ea5e9', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px', 
                                  marginTop: '6px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => showPartnerReviews(partner)}
                              >
                                Ver {partner.totalReviews} reseñas →
                              </button>
                            </div>
                            
                            <p className="partnership-match-company-details">📍 {partner.location}</p>
                            <p className="partnership-match-company-details">🔧 {partner.specialization}</p>
                            <p className="partnership-match-company-value blue">Capacidad: {partner.capacity}</p>
                            <p className="partnership-match-company-value green">Tarifa: {partner.fees}</p>
                            <p className="partnership-match-company-details">📜 {partner.certifications}</p>
                            <p className="partnership-match-company-details">🌐 Idiomas: {partner.languages}</p>
                            <p className="partnership-match-company-details">⏰ {partner.availability}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5>Contacto Principal:</h5>
                        <p><strong>{partner.contact}</strong></p>
                        <p>📧 {partner.email}</p>
                        <p>📱 {partner.phone}</p>
                        
                        <div className="partnership-opportunity-notes" style={{marginTop: '1rem'}}>
                          <strong>Notas culturales:</strong> {partner.culturalNotes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'active-deals' && (
              <div className="partnership-opportunities">
                <h3 className="partnership-matches-title">💼 Deals Activos en Progreso</h3>
                <div className="bloomberg-card-content bloomberg-text-center">
                  <Building2 size={48} className="bloomberg-mb-md" />
                  <p>Aquí aparecerán tus deals activos cuando comiences a conectar importadores con partners mexicanos.</p>
                  <p>¡Empieza conectando algunos importadores de las pestañas anteriores!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PARTNER REVIEWS MODAL */}
      {selectedPartnerForReviews && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeReviews}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            margin: '20px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#1f2937', fontSize: '20px', fontWeight: 'bold' }}>
                Reseñas: {selectedPartnerForReviews.companyName}
              </h3>
              <button onClick={closeReviews} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}>×</button>
            </div>

            {/* Overall Rating Summary */}
            <div style={{
              background: '#f0f9ff',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {renderStarRating(selectedPartnerForReviews.averageRating, selectedPartnerForReviews.totalReviews)}
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#0369a1' }}>
                    <Shield size={14} style={{ marginRight: '4px', display: 'inline' }} />
                    {selectedPartnerForReviews.platformRating}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                    {selectedPartnerForReviews.successRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Tasa de éxito</div>
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div>
              <h4 style={{ color: '#1f2937', marginBottom: '16px' }}>Reseñas recientes ({selectedPartnerForReviews.totalReviews} total)</h4>
              {selectedPartnerForReviews.recentReviews.map((review) => (
                <div key={review.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{review.company}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {review.verified ? '✅ Partnership verificado' : '⚠️ Partnership no verificado'} • {review.partnership}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {renderStarRating(review.rating, 0)}
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{review.date}</div>
                    </div>
                  </div>
                  <p style={{ color: '#4b5563', lineHeight: '1.5', margin: '0' }}>{review.review}</p>
                </div>
              ))}
            </div>

            {/* Safety Disclaimer */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} style={{ color: '#d97706', marginRight: '8px', marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  <strong>Descargo de responsabilidad:</strong> Triangle Intelligence facilita conexiones pero no garantiza resultados. 
                  Las reseñas son de usuarios registrados pero realice su propia diligencia debida antes de cualquier partnership.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}