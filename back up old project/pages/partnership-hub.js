import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { useRouter } from 'next/router';
import { Globe, Users, TrendingUp, DollarSign, ArrowRight, Check, AlertCircle, Building2, Package, Ship, Phone, Mail, MapPin, Calendar, Target, Link2 } from 'lucide-react';

export default function PartnershipHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [partnershipData, setPartnershipData] = useState({
    opportunities: [],
    matches: [],
    conversations: [],
    analytics: {}
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: 'all',
    type: 'all',
    volume: 'all',
    industry: 'all'
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

  // Mock data for demonstration - will connect to real database
  const mockOpportunities = [
    {
      id: 1,
      companyName: 'Detroit Auto Parts Inc.',
      country: 'US',
      type: 'importer',
      industry: 'Automotive',
      volume: '$5M-10M',
      products: 'Brake systems, Engine components',
      currentRoute: 'China → USA (Direct)',
      potentialSavings: '$1.5M/year',
      tariffRate: '30%',
      status: 'hot_lead',
      needsPartner: 'Mexican Maquiladora',
      contactName: 'John Smith',
      email: 'john@detroitauto.com',
      phone: '+1-313-555-0100',
      lastContact: '2 days ago',
      notes: 'Urgent - facing 30% tariffs on Q1 shipments',
      matchScore: 95
    },
    {
      id: 2,
      companyName: 'Maquiladora Tijuana S.A.',
      country: 'MX',
      type: 'processor',
      industry: 'Manufacturing Services',
      capacity: '50,000 sq ft warehouse',
      services: 'Repackaging, Assembly, Labeling',
      certifications: 'IMMEX, ISO 9001, C-TPAT',
      location: 'Tijuana (2 miles from border)',
      status: 'partner_ready',
      seekingClients: 'US/Canadian importers',
      contactName: 'Maria Rodriguez',
      email: 'maria@maqtijuana.mx',
      phone: '+52-664-555-0200',
      processingFee: '5-8% of goods value',
      monthlyCapacity: '$10M goods',
      matchScore: 92
    },
    {
      id: 3,
      companyName: 'Toronto Electronics Ltd.',
      country: 'CA',
      type: 'importer',
      industry: 'Electronics',
      volume: '$3M-5M',
      products: 'Consumer electronics, Components',
      currentRoute: 'China → Canada (Direct)',
      potentialSavings: '$900K/year',
      tariffRate: '25%',
      status: 'qualified',
      needsPartner: 'Mexican logistics provider',
      contactName: 'Robert Chen',
      email: 'rchen@torontoelec.ca',
      phone: '+1-416-555-0300',
      timeline: 'Q2 2025',
      matchScore: 88
    },
    {
      id: 4,
      companyName: 'Logistics Monterrey',
      country: 'MX',
      type: 'logistics',
      industry: 'Freight & Logistics',
      services: 'Warehousing, Customs, Transport',
      coverage: 'Mexico, USA, Canada',
      ports: 'Manzanillo, Lazaro Cardenas, Veracruz',
      status: 'verified_partner',
      infrastructure: '5 warehouses, 200 trucks',
      contactName: 'Carlos Mendoza',
      email: 'cmendoza@logisticsmty.mx',
      phone: '+52-81-555-0400',
      specialization: 'Asia-USMCA routing',
      monthlyVolume: '$50M processed',
      matchScore: 90
    }
  ];

  const partnershipAnalytics = {
    totalOpportunities: 47,
    activeConversations: 12,
    successfulMatches: 8,
    monthlyRevenuePotential: '$2.4M',
    topIndustries: ['Automotive', 'Electronics', 'Textiles'],
    hotLeads: 15,
    conversionRate: '32%'
  };

  useEffect(() => {
    loadPartnershipData();
  }, [filters]);

  const loadPartnershipData = async () => {
    setLoading(true);
    try {
      // Load real data from database
      // For now using mock data
      setPartnershipData({
        opportunities: mockOpportunities,
        matches: generateMatches(mockOpportunities),
        conversations: [],
        analytics: partnershipAnalytics
      });
    } catch (error) {
      console.error('Error loading partnership data:', error);
    }
    setLoading(false);
  };

  const generateMatches = (opportunities) => {
    const matches = [];
    const importers = opportunities.filter(o => o.type === 'importer');
    const providers = opportunities.filter(o => ['processor', 'logistics'].includes(o.type));
    
    importers.forEach(importer => {
      providers.forEach(provider => {
        matches.push({
          importer,
          provider,
          matchScore: Math.floor(Math.random() * 30) + 70,
          potentialValue: importer.potentialSavings,
          status: 'pending_introduction'
        });
      });
    });
    
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  };

  const initiatePartnership = (match) => {
    // Create introduction email template
    const emailTemplate = `
Subject: Partnership Opportunity - ${match.importer.companyName} & ${match.provider.companyName}

Dear ${match.importer.contactName} and ${match.provider.contactName},

I'd like to introduce you to a valuable partnership opportunity through our Triangle Intelligence platform.

${match.importer.companyName} (${match.importer.country}):
- Currently importing: ${match.importer.products}
- Volume: ${match.importer.volume}
- Potential savings: ${match.importer.potentialSavings}

${match.provider.companyName} (${match.provider.country}):
- Services: ${match.provider.services || match.provider.capacity}
- Specialization: ${match.provider.specialization || match.provider.certifications}
- Location: ${match.provider.location || match.provider.coverage}

Match Score: ${match.matchScore}%
Potential Annual Value: ${match.potentialValue}

I'll coordinate an introduction call to explore this opportunity.

Best regards,
[Your Name]
Triangle Intelligence Partnership Team
    `;
    
    navigator.clipboard.writeText(emailTemplate);
    alert('Partnership introduction template copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partnership Hub</h1>
                <p className="text-sm text-gray-600">Connect importers with Mexican partners for triangle routing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userAuth && (
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">{userAuth.name}</p>
                  <p className="text-gray-600">{userAuth.role === 'sales_manager' ? 'Sales Manager' : 'Admin'}</p>
                </div>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('salesAuth');
                  router.push('/sales-login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{partnershipAnalytics.totalOpportunities}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hot Leads</p>
                <p className="text-2xl font-bold text-orange-600">{partnershipAnalytics.hotLeads}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Potential</p>
                <p className="text-2xl font-bold text-green-600">{partnershipAnalytics.monthlyRevenuePotential}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{partnershipAnalytics.conversionRate}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              {['opportunities', 'matches', 'pipeline', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Countries</option>
                <option value="US">USA (Importers)</option>
                <option value="CA">Canada (Importers)</option>
                <option value="MX">Mexico (Partners)</option>
              </select>
              
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Types</option>
                <option value="importer">Importers Needing Partners</option>
                <option value="processor">Mexican Processors</option>
                <option value="logistics">Logistics Providers</option>
              </select>
              
              <select
                value={filters.industry}
                onChange={(e) => setFilters({...filters, industry: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Industries</option>
                <option value="Automotive">Automotive</option>
                <option value="Electronics">Electronics</option>
                <option value="Textiles">Textiles</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
              
              <select
                value={filters.volume}
                onChange={(e) => setFilters({...filters, volume: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Volumes</option>
                <option value="small">Under $1M</option>
                <option value="medium">$1M - $5M</option>
                <option value="large">$5M - $10M</option>
                <option value="enterprise">Over $10M</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                {partnershipData.opportunities.map((opp) => (
                  <div key={opp.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold">{opp.companyName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            opp.status === 'hot_lead' ? 'bg-red-100 text-red-800' :
                            opp.status === 'partner_ready' ? 'bg-green-100 text-green-800' :
                            opp.status === 'verified_partner' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {opp.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {opp.country}
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Industry:</span>
                            <span className="ml-2 font-medium">{opp.industry}</span>
                          </div>
                          {opp.volume && (
                            <div>
                              <span className="text-gray-600">Volume:</span>
                              <span className="ml-2 font-medium">{opp.volume}</span>
                            </div>
                          )}
                          {opp.potentialSavings && (
                            <div>
                              <span className="text-gray-600">Savings Potential:</span>
                              <span className="ml-2 font-medium text-green-600">{opp.potentialSavings}</span>
                            </div>
                          )}
                          {opp.services && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Services:</span>
                              <span className="ml-2 font-medium">{opp.services}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 flex items-center space-x-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {opp.contactName}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-1" />
                            {opp.email}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-1" />
                            {opp.phone}
                          </div>
                        </div>
                        
                        {opp.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                            <strong>Note:</strong> {opp.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-blue-600">{opp.matchScore}%</div>
                        <div className="text-xs text-gray-600">Match Score</div>
                        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Recommended Partnership Matches</h3>
                {partnershipData.matches.slice(0, 5).map((match, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{match.matchScore}%</div>
                          <div className="text-xs text-gray-600">Match</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="bg-white rounded-lg p-3 shadow">
                            <h4 className="font-semibold">{match.importer.companyName}</h4>
                            <p className="text-sm text-gray-600">{match.importer.country} - Needs {match.importer.needsPartner}</p>
                            <p className="text-sm text-green-600">{match.importer.potentialSavings} savings</p>
                          </div>
                          
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                          
                          <div className="bg-white rounded-lg p-3 shadow">
                            <h4 className="font-semibold">{match.provider.companyName}</h4>
                            <p className="text-sm text-gray-600">{match.provider.country} - {match.provider.type}</p>
                            <p className="text-sm text-blue-600">{match.provider.services || match.provider.capacity}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => initiatePartnership(match)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Initiate Partnership
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pipeline' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Partnership Pipeline</h3>
                <div className="space-y-6">
                  {['Initial Contact', 'Negotiation', 'Documentation', 'Active Partnership'].map((stage, idx) => (
                    <div key={idx}>
                      <h4 className="font-medium text-gray-700 mb-2">{stage}</h4>
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                        <div className="flex space-x-2">
                          {[1, 2, 3].slice(0, 3 - idx).map((card) => (
                            <div key={card} className="bg-white rounded p-3 shadow flex-1">
                              <div className="text-sm font-medium">Company {card + idx}</div>
                              <div className="text-xs text-gray-600 mt-1">$500K potential</div>
                              <div className="text-xs text-blue-600 mt-1">Last contact: 2 days ago</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Partnership Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Top Industries for Partnerships</h4>
                    {partnershipAnalytics.topIndustries.map((industry, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2">
                        <span>{industry}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${100 - idx * 20}%`}}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{15 - idx * 3} deals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Partnership Success Factors</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Geographic Proximity</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Industry Match</span>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Volume Compatibility</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Certification Alignment</span>
                        <span className="text-sm font-medium">79%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}