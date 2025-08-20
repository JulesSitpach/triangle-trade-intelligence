/**
 * SPECIALIST NETWORK MANAGER - Bloomberg Terminal Style
 * Manages Mexican specialist network for Triangle Intelligence sales
 * Integrated with lead qualification and commission tracking
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Star, MapPin, Clock, DollarSign, Users, Award, ChevronDown } from 'lucide-react';
import { useSmartT } from '../lib/smartT';

export default function SpecialistNetworkManager() {
  const { smartT } = useSmartT();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: 'all',
    specialty: 'all',
    status: 'all',
    rating: 'all'
  });
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSpecialists();
  }, []);

  const loadSpecialists = async () => {
    try {
      // In production, this would call an API
      const mockSpecialists = [
        {
          id: 'spec_001',
          name: 'Carlos Mendez',
          location: 'Mexico City',
          specialty: 'Electronics Manufacturing',
          status: 'available',
          rating: 4.9,
          responseTime: '2.3h',
          languages: ['ES', 'EN'],
          certifications: ['USMCA Certified', 'Electronics Compliance', 'ISO 9001'],
          experience: '12 years',
          activeDeals: 5,
          completedDeals: 47,
          totalRevenue: 2150000,
          avgDealSize: 387500,
          successRate: 94,
          clientSatisfaction: 4.8,
          lastActive: '2 hours ago',
          contact: {
            email: 'carlos.mendez@trianglespecialists.mx',
            phone: '+52 55 1234 5678',
            whatsapp: '+52 55 1234 5678'
          },
          specialties: [
            'Maquiladora Setup',
            'Electronics Compliance',
            'Quality Certifications',
            'USMCA Navigation'
          ],
          serviceAreas: ['Mexico City', 'Guadalajara', 'Monterrey'],
          bio: 'Electronics manufacturing specialist with 12+ years in maquiladora operations and USMCA compliance.'
        },
        {
          id: 'spec_002',
          name: 'Ana Gutierrez',
          location: 'Guadalajara',
          specialty: 'Industrial Manufacturing',
          status: 'busy',
          rating: 4.8,
          responseTime: '1.8h',
          languages: ['ES', 'EN'],
          certifications: ['USMCA Certified', 'Manufacturing Excellence', 'Lean Six Sigma'],
          experience: '15 years',
          activeDeals: 4,
          completedDeals: 52,
          totalRevenue: 2750000,
          avgDealSize: 412500,
          successRate: 96,
          clientSatisfaction: 4.9,
          lastActive: '1 hour ago',
          contact: {
            email: 'ana.gutierrez@trianglespecialists.mx',
            phone: '+52 33 2345 6789',
            whatsapp: '+52 33 2345 6789'
          },
          specialties: [
            'Industrial Manufacturing',
            'Process Optimization',
            'Supply Chain Management',
            'Quality Control'
          ],
          serviceAreas: ['Guadalajara', 'Leon', 'Aguascalientes'],
          bio: 'Industrial manufacturing expert specializing in automotive and machinery sectors with deep USMCA knowledge.'
        },
        {
          id: 'spec_003',
          name: 'Roberto Silva',
          location: 'Tijuana',
          specialty: 'Automotive',
          status: 'available',
          rating: 4.7,
          responseTime: '3.1h',
          languages: ['ES', 'EN'],
          certifications: ['USMCA Certified', 'Automotive Excellence', 'TS 16949'],
          experience: '10 years',
          activeDeals: 3,
          completedDeals: 38,
          totalRevenue: 1980000,
          avgDealSize: 297500,
          successRate: 92,
          clientSatisfaction: 4.7,
          lastActive: '4 hours ago',
          contact: {
            email: 'roberto.silva@trianglespecialists.mx',
            phone: '+52 664 3456 7890',
            whatsapp: '+52 664 3456 7890'
          },
          specialties: [
            'Automotive Manufacturing',
            'Just-in-Time Logistics',
            'Border Crossing Optimization',
            'Supplier Management'
          ],
          serviceAreas: ['Tijuana', 'Mexicali', 'Ensenada'],
          bio: 'Automotive specialist with extensive cross-border logistics experience and strong relationships with US automotive manufacturers.'
        },
        {
          id: 'spec_004',
          name: 'Maria Rodriguez',
          location: 'Monterrey',
          specialty: 'Textiles & Apparel',
          status: 'available',
          rating: 4.9,
          responseTime: '1.5h',
          languages: ['ES', 'EN'],
          certifications: ['USMCA Certified', 'Textile Excellence', 'WRAP Certified'],
          experience: '8 years',
          activeDeals: 6,
          completedDeals: 29,
          totalRevenue: 1650000,
          avgDealSize: 225000,
          successRate: 98,
          clientSatisfaction: 4.9,
          lastActive: '30 minutes ago',
          contact: {
            email: 'maria.rodriguez@trianglespecialists.mx',
            phone: '+52 81 4567 8901',
            whatsapp: '+52 81 4567 8901'
          },
          specialties: [
            'Textile Manufacturing',
            'Apparel Production',
            'Labor Compliance',
            'Quality Assurance'
          ],
          serviceAreas: ['Monterrey', 'Saltillo', 'Torreon'],
          bio: 'Textile and apparel manufacturing specialist with proven track record in high-volume production and quality control.'
        }
      ];

      setSpecialists(mockSpecialists);
    } catch (error) {
      console.error('Failed to load specialists:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'var(--bloomberg-green)';
      case 'busy': return 'var(--bloomberg-orange)';
      case 'offline': return 'var(--bloomberg-gray-500)';
      default: return 'var(--bloomberg-blue)';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      available: smartT('specialists.status.available', 'Available'),
      busy: smartT('specialists.status.busy', 'Busy'),
      offline: smartT('specialists.status.offline', 'Offline')
    };
    return statusMap[status] || status;
  };

  const filteredSpecialists = specialists.filter(specialist => {
    const matchesSearch = specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialist.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filters.location === 'all' || specialist.location === filters.location;
    const matchesSpecialty = filters.specialty === 'all' || specialist.specialty.includes(filters.specialty);
    const matchesStatus = filters.status === 'all' || specialist.status === filters.status;
    const matchesRating = filters.rating === 'all' || specialist.rating >= parseFloat(filters.rating);
    
    return matchesSearch && matchesLocation && matchesSpecialty && matchesStatus && matchesRating;
  });

  if (loading) {
    return (
      <div className="bloomberg-container">
        <div className="bloomberg-card">
          <div className="bloomberg-text-center bloomberg-p-xl">
            <div className="loading-spinner"></div>
            <h3>{smartT('specialists.loading', 'Loading Specialist Network...')}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-container">
      {/* Header */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <div>
            <h1 className="bloomberg-card-title">
              🇲🇽 {smartT('specialists.title', 'Mexican Specialist Network')}
            </h1>
            <p className="bloomberg-text-muted">
              {smartT('specialists.subtitle', 'Certified USMCA trade specialists and implementation partners')}
            </p>
          </div>
          <div className="bloomberg-status bloomberg-status-success">
            <div className="bloomberg-status-dot"></div>
            {specialists.length} {smartT('specialists.active', 'ACTIVE SPECIALISTS')}
          </div>
        </div>

        {/* Network Overview Metrics */}
        <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-lg">
          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">
                {specialists.filter(s => s.status === 'available').length}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('specialists.metrics.available', 'Available Now')}
              </div>
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-info">
                {(specialists.reduce((sum, s) => sum + s.rating, 0) / specialists.length).toFixed(1)}⭐
              </div>
              <div className="bloomberg-metric-label">
                {smartT('specialists.metrics.avgRating', 'Average Rating')}
              </div>
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-warning">
                {formatCurrency(specialists.reduce((sum, s) => sum + s.totalRevenue, 0))}
              </div>
              <div className="bloomberg-metric-label">
                {smartT('specialists.metrics.totalRevenue', 'Total Revenue')}
              </div>
            </div>
          </div>

          <div className="bloomberg-metric-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">
                {Math.round(specialists.reduce((sum, s) => sum + s.successRate, 0) / specialists.length)}%
              </div>
              <div className="bloomberg-metric-label">
                {smartT('specialists.metrics.successRate', 'Success Rate')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-flex bloomberg-justify-between bloomberg-items-center bloomberg-mb-md">
          <div className="bloomberg-flex bloomberg-gap-md bloomberg-flex-1">
            <div className="bloomberg-search-container bloomberg-flex-1">
              <Search size={16} className="bloomberg-search-icon" />
              <input
                type="text"
                placeholder={smartT('specialists.search.placeholder', 'Search specialists by name, specialty, or location...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bloomberg-input bloomberg-pl-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bloomberg-btn bloomberg-btn-secondary bloomberg-flex bloomberg-items-center bloomberg-gap-sm"
            >
              <Filter size={16} />
              {smartT('specialists.filters.title', 'Filters')}
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bloomberg-grid bloomberg-grid-4 bloomberg-gap-md bloomberg-p-md bloomberg-bg-gray-800 bloomberg-rounded">
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="bloomberg-select"
            >
              <option value="all">{smartT('specialists.filters.allLocations', 'All Locations')}</option>
              <option value="Mexico City">Mexico City</option>
              <option value="Guadalajara">Guadalajara</option>
              <option value="Tijuana">Tijuana</option>
              <option value="Monterrey">Monterrey</option>
            </select>

            <select
              value={filters.specialty}
              onChange={(e) => setFilters({...filters, specialty: e.target.value})}
              className="bloomberg-select"
            >
              <option value="all">{smartT('specialists.filters.allSpecialties', 'All Specialties')}</option>
              <option value="Electronics">Electronics</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Automotive">Automotive</option>
              <option value="Textiles">Textiles</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bloomberg-select"
            >
              <option value="all">{smartT('specialists.filters.allStatuses', 'All Statuses')}</option>
              <option value="available">{smartT('specialists.status.available', 'Available')}</option>
              <option value="busy">{smartT('specialists.status.busy', 'Busy')}</option>
            </select>

            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="bloomberg-select"
            >
              <option value="all">{smartT('specialists.filters.allRatings', 'All Ratings')}</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>
        )}
      </div>

      {/* Specialists Grid */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-gap-lg">
        {filteredSpecialists.map((specialist) => (
          <div key={specialist.id} className="bloomberg-card bloomberg-card-hover">
            <div className="bloomberg-card-header">
              <div className="bloomberg-flex bloomberg-items-start bloomberg-justify-between">
                <div>
                  <h3 className="bloomberg-card-title">{specialist.name}</h3>
                  <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-sm bloomberg-text-muted bloomberg-text-sm">
                    <MapPin size={14} />
                    {specialist.location}
                    <span>•</span>
                    {specialist.experience}
                  </div>
                  <p className="bloomberg-text-sm bloomberg-text-muted bloomberg-mt-xs">
                    {specialist.specialty}
                  </p>
                </div>
                <div className="bloomberg-text-right">
                  <div 
                    className="bloomberg-status bloomberg-status-sm bloomberg-mb-xs"
                    style={{ backgroundColor: getStatusColor(specialist.status) }}
                  >
                    {getStatusText(specialist.status)}
                  </div>
                  <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-xs bloomberg-text-sm">
                    <Star size={12} className="text-yellow-400" fill="currentColor" />
                    {specialist.rating}
                  </div>
                </div>
              </div>
            </div>

            <div className="bloomberg-card-content">
              {/* Performance Metrics */}
              <div className="bloomberg-grid bloomberg-grid-3 bloomberg-gap-md bloomberg-mb-md">
                <div className="bloomberg-metric-small">
                  <div className="bloomberg-metric-value">{specialist.activeDeals}</div>
                  <div className="bloomberg-metric-label">{smartT('specialists.activeDeals', 'Active')}</div>
                </div>
                <div className="bloomberg-metric-small">
                  <div className="bloomberg-metric-value">{formatCurrency(specialist.avgDealSize)}</div>
                  <div className="bloomberg-metric-label">{smartT('specialists.avgDeal', 'Avg Deal')}</div>
                </div>
                <div className="bloomberg-metric-small">
                  <div className="bloomberg-metric-value">{specialist.successRate}%</div>
                  <div className="bloomberg-metric-label">{smartT('specialists.successRate', 'Success')}</div>
                </div>
              </div>

              {/* Specialties */}
              <div className="bloomberg-mb-md">
                <h5 className="bloomberg-text-sm bloomberg-font-semibold bloomberg-mb-xs">
                  {smartT('specialists.specialties', 'Specialties')}
                </h5>
                <div className="bloomberg-flex bloomberg-flex-wrap bloomberg-gap-xs">
                  {specialist.specialties.slice(0, 3).map((specialty, index) => (
                    <span key={index} className="bloomberg-badge bloomberg-badge-secondary">
                      {specialty}
                    </span>
                  ))}
                  {specialist.specialties.length > 3 && (
                    <span className="bloomberg-badge bloomberg-badge-ghost">
                      +{specialist.specialties.length - 3} {smartT('common.more', 'more')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bloomberg-grid bloomberg-grid-2 bloomberg-gap-sm bloomberg-text-xs bloomberg-text-muted bloomberg-mb-md">
                <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-xs">
                  <Clock size={12} />
                  {smartT('specialists.responseTime', 'Response')}: {specialist.responseTime}
                </div>
                <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-xs">
                  <Users size={12} />
                  {specialist.languages.join('/')}
                </div>
                <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-xs">
                  <DollarSign size={12} />
                  {formatCurrency(specialist.totalRevenue)} {smartT('specialists.revenue', 'revenue')}
                </div>
                <div className="bloomberg-flex bloomberg-items-center bloomberg-gap-xs">
                  <Award size={12} />
                  {specialist.completedDeals} {smartT('specialists.completed', 'completed')}
                </div>
              </div>

              {/* Actions */}
              <div className="bloomberg-flex bloomberg-gap-sm">
                <button
                  onClick={() => setSelectedSpecialist(specialist)}
                  className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-sm bloomberg-flex-1"
                >
                  {smartT('specialists.actions.viewProfile', 'View Profile')}
                </button>
                <button className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-sm">
                  {smartT('specialists.actions.contact', 'Contact')}
                </button>
                <button className="bloomberg-btn bloomberg-btn-ghost bloomberg-btn-sm">
                  {smartT('specialists.actions.assign', 'Assign')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSpecialists.length === 0 && (
        <div className="bloomberg-card">
          <div className="bloomberg-text-center bloomberg-p-xl bloomberg-text-muted">
            <h4>{smartT('specialists.noResults', 'No specialists found')}</h4>
            <p>{smartT('specialists.noResultsDesc', 'Try adjusting your search criteria or filters')}</p>
          </div>
        </div>
      )}

      {/* Specialist Detail Modal */}
      {selectedSpecialist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <div className="bloomberg-flex bloomberg-justify-between bloomberg-items-start">
                  <div>
                    <h2 className="bloomberg-card-title">{selectedSpecialist.name}</h2>
                    <p className="bloomberg-text-muted">{selectedSpecialist.specialty}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSpecialist(null)}
                    className="bloomberg-btn bloomberg-btn-ghost bloomberg-btn-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="bloomberg-card-content">
                <p className="bloomberg-mb-lg">{selectedSpecialist.bio}</p>

                <div className="bloomberg-grid bloomberg-grid-2 bloomberg-gap-lg">
                  <div>
                    <h4 className="bloomberg-font-semibold bloomberg-mb-md">
                      {smartT('specialists.contact', 'Contact Information')}
                    </h4>
                    <div className="bloomberg-space-y-sm bloomberg-text-sm">
                      <div>📧 {selectedSpecialist.contact.email}</div>
                      <div>📞 {selectedSpecialist.contact.phone}</div>
                      <div>💬 {selectedSpecialist.contact.whatsapp}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="bloomberg-font-semibold bloomberg-mb-md">
                      {smartT('specialists.serviceAreas', 'Service Areas')}
                    </h4>
                    <div className="bloomberg-flex bloomberg-flex-wrap bloomberg-gap-xs">
                      {selectedSpecialist.serviceAreas.map((area, index) => (
                        <span key={index} className="bloomberg-badge bloomberg-badge-secondary">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bloomberg-mt-lg">
                  <h4 className="bloomberg-font-semibold bloomberg-mb-md">
                    {smartT('specialists.certifications', 'Certifications')}
                  </h4>
                  <div className="bloomberg-flex bloomberg-flex-wrap bloomberg-gap-xs">
                    {selectedSpecialist.certifications.map((cert, index) => (
                      <span key={index} className="bloomberg-badge bloomberg-badge-primary">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bloomberg-flex bloomberg-gap-md bloomberg-mt-lg">
                  <button className="bloomberg-btn bloomberg-btn-primary">
                    {smartT('specialists.actions.assignLead', 'Assign Lead')}
                  </button>
                  <button className="bloomberg-btn bloomberg-btn-secondary">
                    {smartT('specialists.actions.sendMessage', 'Send Message')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}