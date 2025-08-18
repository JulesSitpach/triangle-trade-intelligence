import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { useRouter } from 'next/router';
import { 
  Globe, Users, TrendingUp, DollarSign, ArrowRight, Check, AlertCircle, 
  Building2, Package, Ship, Phone, Mail, MapPin, Calendar, Target, Link2,
  Network, BarChart3, Brain, Handshake, Crown, Activity, Star, Trophy,
  Zap, Rocket, Eye, Settings, Filter, Search, Download, RefreshCw
} from 'lucide-react';

export default function PartnershipEcosystemManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ecosystem');
  const [partnershipData, setPartnershipData] = useState({
    opportunities: [],
    matches: [],
    revenue: {},
    globalNetwork: {},
    intelligence: {},
    pipeline: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    country: 'all',
    industry: 'all',
    value: 'all',
    priority: 'all'
  });
  const [userAuth, setUserAuth] = useState(null);

  // Authentication check
  useEffect(() => {
    const auth = localStorage.getItem('salesAuth');
    if (!auth) {
      router.push('/sales-login');
      return;
    }
    
    const authData = JSON.parse(auth);
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

  // Enhanced mock data for USMCA Partnership Ecosystem
  const ecosystemAnalytics = {
    // Revenue Optimization Metrics
    revenue: {
      monthlyPotential: '$12.5M',
      partnershipFees: '$180K',
      clientRetention: '94%',
      mexPartnerRevenue: '$2.4M',
      familyBusinessROI: '340%',
      avgDealSize: '$15K',
      monthlyClosures: 12,
      pipelineValue: '$3.2M'
    },
    
    // Global Network Intelligence  
    network: {
      activeCountries: 34,
      incomingQueries: 127,
      livePlatformUsers: 892,
      mexPartners: 156,
      usPlatformUsers: 445,
      caPartformUsers: 127,
      hotOpportunities: 23,
      matchingAlerts: 8
    },
    
    // Business Intelligence
    intelligence: {
      topDemandCountries: ['US', 'CA', 'DE', 'JP', 'UK'],
      highValueIndustries: ['Automotive', 'Electronics', 'Pharmaceuticals', 'Aerospace', 'Textiles'],
      trendingProducts: ['EV Components', 'Semiconductors', 'Medical Devices', 'Solar Equipment'],
      seasonalPeaks: 'Q4_HEAVY',
      conversionRate: 28,
      avgTimeToClose: '45 days',
      partnerSatisfaction: 92
    }
  };

  const liveOpportunities = [
    {
      id: 1,
      timestamp: '2 hours ago',
      company: 'BMW Manufacturing USA',
      country: 'US',
      industry: 'Automotive',
      products: 'EV battery components, brake systems',
      currentTariffs: '30% China',
      volume: '$50M annually',
      urgency: 'critical',
      savings: '$15M/year',
      mexPartnerNeeds: 'IMMEX maquiladora with automotive certification',
      contactQuality: 'VP Operations',
      probability: 95,
      estimatedFee: '$25K',
      status: 'hot_lead',
      culturalNotes: 'German precision standards required',
      timeToClose: '30 days'
    },
    {
      id: 2,
      timestamp: '4 hours ago', 
      company: 'Canadian Solar Corp',
      country: 'CA',
      industry: 'Renewable Energy',
      products: 'Solar panels, inverters, mounting systems',
      currentTariffs: '25% China', 
      volume: '$25M annually',
      urgency: 'high',
      savings: '$6.2M/year',
      mexPartnerNeeds: 'Solar equipment logistics specialist',
      contactQuality: 'Procurement Director',
      probability: 88,
      estimatedFee: '$18K',
      status: 'qualified',
      culturalNotes: 'ESG compliance essential',
      timeToClose: '45 days'
    },
    {
      id: 3,
      timestamp: '6 hours ago',
      company: 'Samsung Electronics America', 
      country: 'US',
      industry: 'Electronics',
      products: 'Semiconductor components, displays',
      currentTariffs: '50% Various',
      volume: '$75M annually', 
      urgency: 'critical',
      savings: '$37M/year',
      mexPartnerNeeds: 'High-tech clean room facility',
      contactQuality: 'Supply Chain VP',
      probability: 92,
      estimatedFee: '$35K',
      status: 'hot_lead',
      culturalNotes: 'Korean business protocols preferred',
      timeToClose: '60 days'
    }
  ];

  const mexPartnerDatabase = [
    {
      id: 1,
      company: 'Tijuana Advanced Manufacturing',
      location: 'Tijuana, BC (1.5 mi from border)',
      specialization: 'Automotive & Electronics',
      certifications: 'IMMEX, ISO/TS 16949, C-TPAT, ISO 14001',
      capacity: '200,000 sq ft, 1,200 employees',
      monthlyVolume: '$25M processed',
      industries: ['Automotive', 'Electronics', 'Aerospace'], 
      revenueGenerated: '$480K/year',
      activePartnerships: 8,
      satisfaction: 94,
      culturalStrength: 'Excellent US business integration',
      contactName: 'Ing. Maria Elena Rodriguez',
      responseTime: '2 hours average',
      successRate: 89
    },
    {
      id: 2,
      company: 'Monterrey Precision Logistics',
      location: 'Monterrey, NL (Strategic inland hub)', 
      specialization: 'High-value goods processing',
      certifications: 'IMMEX, C-TPAT, AEO, ISO 27001',
      capacity: '500,000 sq ft, rail & air connectivity',
      monthlyVolume: '$40M processed',
      industries: ['Pharmaceuticals', 'Medical Devices', 'Aerospace'],
      revenueGenerated: '$720K/year',
      activePartnerships: 12,
      satisfaction: 96,
      culturalStrength: 'Bilingual executive team',
      contactName: 'Lic. Carlos Alberto Mendoza',
      responseTime: '1 hour average',
      successRate: 91
    }
  ];

  const smartMatches = [
    {
      id: 1,
      importer: liveOpportunities[0],
      mexPartner: mexPartnerDatabase[0],
      matchScore: 96,
      matchingFactors: [
        'Automotive specialization alignment',
        'IMMEX + automotive certifications',
        'Border proximity for JIT delivery',
        'Volume capacity match',
        'Cultural compatibility score: 94%'
      ],
      estimatedValue: '$25K introduction fee + $480K annual partner revenue',
      timeToImplement: '30-45 days',
      riskLevel: 'Low',
      successProbability: 94,
      nextSteps: [
        'Executive introduction call',
        'Facility virtual tour',
        'Pilot shipment planning',
        'IMMEX compliance review'
      ]
    },
    {
      id: 2, 
      importer: liveOpportunities[1],
      mexPartner: mexPartnerDatabase[1],
      matchScore: 91,
      matchingFactors: [
        'Clean energy expertise alignment',
        'Monterrey inland strategic location',
        'ESG compliance capabilities',
        'Rail connectivity for bulk goods',
        'Track record with Canadian companies'
      ],
      estimatedValue: '$18K introduction fee + $320K annual partner revenue',
      timeToImplement: '45-60 days',
      riskLevel: 'Low-Medium',
      successProbability: 88,
      nextSteps: [
        'ESG compliance verification',
        'Logistics capacity assessment', 
        'Canadian trade regulations review',
        'Pilot program design'
      ]
    }
  ];

  const revenuePipeline = [
    {
      stage: 'Hot Leads',
      deals: 8,
      value: '$216K',
      conversion: '92%',
      avgDays: 15,
      deals_data: [
        { company: 'BMW Manufacturing', value: '$25K', probability: 95, days: 12 },
        { company: 'Samsung Electronics', value: '$35K', probability: 92, days: 18 },
        { company: 'Ford Motor Co.', value: '$22K', probability: 89, days: 8 }
      ]
    },
    {
      stage: 'Negotiation', 
      deals: 12,
      value: '$284K',
      conversion: '78%',
      avgDays: 30,
      deals_data: [
        { company: 'Toyota Motors', value: '$28K', probability: 85, days: 25 },
        { company: 'Apple Inc.', value: '$42K', probability: 82, days: 35 },
        { company: 'General Electric', value: '$19K', probability: 76, days: 28 }
      ]
    },
    {
      stage: 'Documentation',
      deals: 6,
      value: '$142K', 
      conversion: '95%',
      avgDays: 45,
      deals_data: [
        { company: 'Siemens AG', value: '$31K', probability: 98, days: 42 },
        { company: 'Johnson & Johnson', value: '$24K', probability: 96, days: 38 }
      ]
    },
    {
      stage: 'Active Partnerships',
      deals: 24,
      value: '$2.4M annual',
      retention: '94%',
      avgRevenue: '$100K',
      partners: [
        { company: 'Mercedes-Benz USA', annual: '$180K', satisfaction: 96, years: 2.5 },
        { company: 'Pfizer Inc.', annual: '$145K', satisfaction: 93, years: 1.8 },
        { company: 'Tesla Motors', annual: '$220K', satisfaction: 98, years: 3.2 }
      ]
    }
  ];

  useEffect(() => {
    loadEcosystemData();
  }, [filters]);

  const loadEcosystemData = async () => {
    setLoading(true);
    try {
      // In production, this would connect to real-time data feeds
      setPartnershipData({
        opportunities: liveOpportunities,
        matches: smartMatches,
        revenue: ecosystemAnalytics.revenue,
        network: ecosystemAnalytics.network,
        intelligence: ecosystemAnalytics.intelligence,
        pipeline: revenuePipeline
      });
    } catch (error) {
      console.error('Error loading ecosystem data:', error);
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadEcosystemData();
    setRefreshing(false);
  };

  const initiatePartnership = (match) => {
    const emailTemplate = `
Subject: 🤝 High-Value Partnership Opportunity - ${match.importer.company} & ${match.mexPartner.company}

Dear ${match.importer.company} and ${match.mexPartner.company} Teams,

I'm excited to introduce a strategic partnership opportunity through our USMCA Partnership Ecosystem that could generate significant value for both organizations.

🏢 ${match.importer.company} (${match.importer.country}):
• Products: ${match.importer.products}
• Annual Volume: ${match.importer.volume}  
• Current Challenge: ${match.importer.currentTariffs} tariffs
• Potential Savings: ${match.importer.savings}
• Timeline: ${match.importer.timeToClose}

🇲🇽 ${match.mexPartner.company}:
• Location: ${match.mexPartner.location}
• Specialization: ${match.mexPartner.specialization}
• Certifications: ${match.mexPartner.certifications}
• Capacity: ${match.mexPartner.capacity}
• Track Record: ${match.mexPartner.successRate}% success rate

🎯 PARTNERSHIP INTELLIGENCE:
• Match Score: ${match.matchScore}% (Exceptional)
• Success Probability: ${match.successProbability}%
• Implementation Timeline: ${match.timeToImplement}
• Annual Partnership Value: ${match.estimatedValue}

💡 KEY SUCCESS FACTORS:
${match.matchingFactors.map(factor => `• ${factor}`).join('\n')}

🚀 NEXT STEPS:
${match.nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

As your USMCA Partnership Ecosystem Manager, I'll personally coordinate this introduction and ensure seamless execution.

Best regards,
${userAuth?.name || 'Partnership Team'}
Triangle Intelligence - USMCA Partnership Ecosystem
📞 Direct Line | 📧 Secure Channel

---
This partnership opportunity was identified through our AI-powered matching system analyzing 34 countries, 892 platform users, and $12.5M monthly partnership potential.
    `;
    
    navigator.clipboard.writeText(emailTemplate);
    alert('🚀 Partnership introduction template copied! This match has 94% success probability.');
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-10 w-10 text-gradient bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 text-white" />
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  USMCA Partnership Ecosystem Manager
                </h1>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Globe className="h-4 w-4 mr-1" />
                  Managing $12.5M monthly partnership potential across 34 countries
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Live Data'}</span>
              </button>
              
              {userAuth && (
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                    {userAuth.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {userAuth.role === 'sales_manager' ? '🚀 Ecosystem Manager' : '👑 Admin'}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  localStorage.removeItem('salesAuth');
                  router.push('/sales-login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Dashboard Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Monthly Revenue Potential</p>
                <p className="text-3xl font-bold">{partnershipData.revenue.monthlyPotential}</p>
                <p className="text-sm text-green-200 mt-1">+23% vs last month</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Global Network Users</p>
                <p className="text-3xl font-bold">{partnershipData.network.livePlatformUsers}</p>
                <p className="text-sm text-blue-200 mt-1">{partnershipData.network.incomingQueries} queries today</p>
              </div>
              <Globe className="h-12 w-12 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Smart Matches</p>
                <p className="text-3xl font-bold">{partnershipData.network.hotOpportunities}</p>
                <p className="text-sm text-purple-200 mt-1">{partnershipData.network.matchingAlerts} new alerts</p>
              </div>
              <Brain className="h-12 w-12 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Partnership Success</p>
                <p className="text-3xl font-bold">{partnershipData.intelligence.conversionRate}%</p>
                <p className="text-sm text-orange-200 mt-1">94% client retention</p>
              </div>
              <Target className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-0 px-6 bg-gray-50">
              {[
                { key: 'ecosystem', label: '🌍 Live Ecosystem', icon: Globe },
                { key: 'matching', label: '🧠 Smart Matching', icon: Brain },
                { key: 'revenue', label: '💰 Revenue Pipeline', icon: DollarSign },
                { key: 'intelligence', label: '📊 Business Intel', icon: BarChart3 },
                { key: 'network', label: '🤝 Global Network', icon: Network }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-6 border-b-3 font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-wrap gap-4 items-center">
              <Search className="h-5 w-5 text-gray-400" />
              
              <select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🌍 All Countries</option>
                <option value="US">🇺🇸 USA (Importers)</option>
                <option value="CA">🇨🇦 Canada (Importers)</option> 
                <option value="MX">🇲🇽 Mexico (Partners)</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="JP">🇯🇵 Japan</option>
              </select>
              
              <select
                value={filters.industry}
                onChange={(e) => setFilters({...filters, industry: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🏭 All Industries</option>
                <option value="Automotive">🚗 Automotive</option>
                <option value="Electronics">⚡ Electronics</option>
                <option value="Pharmaceuticals">💊 Pharmaceuticals</option>
                <option value="Aerospace">✈️ Aerospace</option>
              </select>
              
              <select
                value={filters.value}
                onChange={(e) => setFilters({...filters, value: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">💰 All Values</option>
                <option value="high">💎 High Value ($20M+)</option>
                <option value="medium">💵 Medium ($5M-20M)</option>
                <option value="small">💳 Small (Under $5M)</option>
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🎯 All Priorities</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
              </select>
              
              <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="p-6">
            {activeTab === 'ecosystem' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center">
                    <Activity className="h-6 w-6 mr-2 text-green-500" />
                    Live Partnership Opportunities
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time feed</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {partnershipData.opportunities.map((opp) => (
                    <div key={opp.id} className="border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h4 className="text-xl font-bold text-gray-900">{opp.company}</h4>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(opp.urgency)}`}>
                              {opp.urgency.toUpperCase()}
                            </span>
                            <span className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {opp.country}
                            </span>
                            <span className="text-xs text-gray-500">{opp.timestamp}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Industry:</span>
                              <div className="font-semibold text-blue-700">{opp.industry}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Annual Volume:</span>
                              <div className="font-semibold text-green-700">{opp.volume}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Potential Savings:</span>
                              <div className="font-semibold text-purple-700">{opp.savings}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Est. Partnership Fee:</span>
                              <div className="font-semibold text-orange-700">{opp.estimatedFee}</div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <span className="text-gray-600">Products: </span>
                            <span className="font-medium">{opp.products}</span>
                          </div>
                          
                          <div className="mb-3">
                            <span className="text-gray-600">Partner Requirements: </span>
                            <span className="font-medium text-blue-700">{opp.mexPartnerNeeds}</span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {opp.contactQuality}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {opp.timeToClose} to close
                            </div>
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              Success: {opp.probability}%
                            </div>
                          </div>
                          
                          {opp.culturalNotes && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-2 text-amber-600" />
                                <span className="font-semibold text-amber-800">Cultural Intelligence:</span>
                              </div>
                              <p className="text-sm text-amber-700 mt-1">{opp.culturalNotes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6 text-right">
                          <div className="text-3xl font-bold text-green-600">{opp.probability}%</div>
                          <div className="text-xs text-gray-600 mb-3">Success Rate</div>
                          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold">
                            Engage Partnership
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'matching' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Brain className="h-6 w-6 mr-2 text-purple-500" />
                  AI-Powered Partnership Matching
                </h3>
                
                {partnershipData.matches.map((match, idx) => (
                  <div key={idx} className="border-2 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center bg-white rounded-lg p-3 shadow">
                          <div className="text-3xl font-bold text-green-600">{match.matchScore}%</div>
                          <div className="text-xs text-gray-600">AI Match Score</div>
                        </div>
                        
                        <Zap className="h-8 w-8 text-yellow-500" />
                        
                        <div className="text-center bg-white rounded-lg p-3 shadow">
                          <div className="text-2xl font-bold text-blue-600">{match.successProbability}%</div>
                          <div className="text-xs text-gray-600">Success Probability</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => initiatePartnership(match)}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-lg"
                      >
                        🚀 Launch Partnership
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Importer Details */}
                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <h4 className="font-bold text-lg mb-2 flex items-center">
                          <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                          {match.importer.company}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Volume:</span> {match.importer.volume}</div>
                          <div><span className="font-medium">Products:</span> {match.importer.products}</div>
                          <div><span className="font-medium">Savings:</span> <span className="text-green-600 font-semibold">{match.importer.savings}</span></div>
                          <div><span className="font-medium">Timeline:</span> {match.importer.timeToClose}</div>
                        </div>
                      </div>
                      
                      {/* Mexican Partner Details */}
                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <h4 className="font-bold text-lg mb-2 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-500" />
                          {match.mexPartner.company}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Location:</span> {match.mexPartner.location}</div>
                          <div><span className="font-medium">Capacity:</span> {match.mexPartner.capacity}</div>
                          <div><span className="font-medium">Success Rate:</span> <span className="text-green-600 font-semibold">{match.mexPartner.successRate}%</span></div>
                          <div><span className="font-medium">Revenue Generated:</span> <span className="text-purple-600 font-semibold">{match.mexPartner.revenueGenerated}</span></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Matching Intelligence */}
                    <div className="mt-4 bg-white rounded-xl p-4 shadow-md">
                      <h5 className="font-semibold mb-2 flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-600" />
                        AI Matching Intelligence
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-medium text-sm mb-1">Success Factors:</h6>
                          <ul className="text-xs space-y-1">
                            {match.matchingFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-center">
                                <Check className="h-3 w-3 mr-1 text-green-500" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-medium text-sm mb-1">Next Steps:</h6>
                          <ol className="text-xs space-y-1">
                            {match.nextSteps.map((step, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-4 h-4 flex items-center justify-center text-xs mr-1 mt-0.5">
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800">Partnership Value:</div>
                        <div className="text-lg font-bold text-green-700">{match.estimatedValue}</div>
                        <div className="text-xs text-green-600">Implementation: {match.timeToImplement} • Risk: {match.riskLevel}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-green-500" />
                  Revenue Pipeline & Optimization
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  {partnershipData.pipeline.map((stage, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-lg p-4">
                      <h4 className="font-bold text-gray-700 mb-2">{stage.stage}</h4>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{stage.value}</div>
                      <div className="text-sm text-gray-600 mb-3">{stage.deals} deals</div>
                      
                      {stage.conversion && (
                        <div className="flex justify-between text-xs">
                          <span>Conversion:</span>
                          <span className="font-semibold text-green-600">{stage.conversion}</span>
                        </div>
                      )}
                      
                      {stage.avgDays && (
                        <div className="flex justify-between text-xs">
                          <span>Avg Days:</span>
                          <span className="font-semibold">{stage.avgDays}</span>
                        </div>
                      )}
                      
                      {stage.retention && (
                        <div className="flex justify-between text-xs">
                          <span>Retention:</span>
                          <span className="font-semibold text-purple-600">{stage.retention}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Family Business ROI Dashboard */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
                  <h4 className="text-xl font-bold mb-4 flex items-center">
                    <Crown className="h-6 w-6 mr-2" />
                    Family Business ROI Dashboard
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">$180K</div>
                      <div className="text-yellow-100 text-sm">Monthly Partnership Fees</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">$2.4M</div>
                      <div className="text-yellow-100 text-sm">Mexican Partner Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">340%</div>
                      <div className="text-yellow-100 text-sm">Annual ROI</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">94%</div>
                      <div className="text-yellow-100 text-sm">Client Retention</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-indigo-500" />
                  Business Intelligence & Market Analysis
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="font-bold mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                      High-Demand Industries
                    </h4>
                    {partnershipData.intelligence.highValueIndustries.map((industry, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{industry}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                              style={{width: `${90 - idx * 15}%`}}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-700">{90 - idx * 15}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="font-bold mb-4 flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-blue-500" />
                      Top Demand Countries
                    </h4>
                    {partnershipData.intelligence.topDemandCountries.map((country, idx) => {
                      const flags = {'US': '🇺🇸', 'CA': '🇨🇦', 'DE': '🇩🇪', 'JP': '🇯🇵', 'UK': '🇬🇧'};
                      return (
                        <div key={idx} className="flex justify-between items-center py-2 border-b">
                          <span className="flex items-center">
                            <span className="text-lg mr-2">{flags[country]}</span>
                            <span className="font-medium">{country}</span>
                          </span>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{45 - idx * 8} requests</div>
                            <div className="text-xs text-gray-500">This month</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="font-bold mb-4 flex items-center">
                    <Rocket className="h-5 w-5 mr-2 text-purple-500" />
                    Trending Products & Opportunities
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {partnershipData.intelligence.trendingProducts.map((product, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-center">
                        <div className="text-lg font-bold text-purple-700">{product}</div>
                        <div className="text-sm text-gray-600">+{25 + idx * 5}% demand</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Network className="h-6 w-6 mr-2 text-cyan-500" />
                  Global USMCA Partnership Network
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="font-bold mb-4 text-blue-700">🇺🇸 US Platform Users</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{partnershipData.network.usPlatformUsers}</div>
                    <div className="text-sm text-gray-600">Active importers seeking partnerships</div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="font-bold mb-4 text-red-700">🇨🇦 Canadian Users</h4>
                    <div className="text-3xl font-bold text-red-600 mb-2">{partnershipData.network.caPartformUsers}</div>
                    <div className="text-sm text-gray-600">Growing Canadian market presence</div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="font-bold mb-4 text-green-700">🇲🇽 Mexican Partners</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">{partnershipData.network.mexPartners}</div>
                    <div className="text-sm text-gray-600">Verified IMMEX & logistics partners</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="font-bold mb-4 flex items-center">
                    <Handshake className="h-5 w-5 mr-2 text-green-500" />
                    Success Stories & Impact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="font-semibold text-green-800">Mercedes-Benz USA</div>
                      <div className="text-sm text-green-700">Partnership with Tijuana Advanced Mfg</div>
                      <div className="text-2xl font-bold text-green-600 mt-2">$180K/year</div>
                      <div className="text-xs text-green-600">2.5 years active • 96% satisfaction</div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="font-semibold text-blue-800">Tesla Motors</div>
                      <div className="text-sm text-blue-700">EV component processing partnership</div>
                      <div className="text-2xl font-bold text-blue-600 mt-2">$220K/year</div>
                      <div className="text-xs text-blue-600">3.2 years active • 98% satisfaction</div>
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