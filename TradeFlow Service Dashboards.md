import React, { useState } from 'react';
import { Upload, FileText, Users, CheckCircle, AlertCircle, Clock, Download, Send, Search, User, Building2, Globe, Shield, Calendar, Zap } from 'lucide-react';

const ServiceDashboards = () => {
  const [activeService, setActiveService] = useState('supplier-sourcing');
  const [activeStage, setActiveStage] = useState(1);
  const [selectedExpert, setSelectedExpert] = useState('jorge');

  // Service configurations with varying stage complexity
  const services = {
    'supplier-sourcing': {
      title: '🔍 Supplier Sourcing Report',
      price: '$500',
      expert: 'Jorge',
      description: '5-7 pre-screened supplier contacts with capabilities analysis',
      complexity: '4-Stage',
      totalStages: 4,
      stages: {
        1: {
          title: 'Client Information Procurement',
          jorgeActions: [
            'Send digital intake form to client',
            'Follow up to ensure completion',
            'Upload completed client form to system'
          ],
          systemTools: [
            'Generate supplier sourcing intake form',
            'Auto-populate client data from account',
            'Process uploaded form data'
          ]
        },
        2: {
          title: 'Contact Discovery & Information Requests',
          jorgeActions: [
            'Find relevant suppliers in database + web scraping',
            'Send pre-made capability assessment forms',
            'Follow up with suppliers for responses'
          ],
          systemTools: [
            'Web scraper finds 20+ potential suppliers',
            'Generate supplier capability forms',
            'Contact management system'
          ]
        },
        3: {
          title: 'Data Analysis & Validation',
          jorgeActions: [
            'Review system analysis for accuracy',
            'Validate suppliers against local knowledge',
            'Request additional info for gaps'
          ],
          systemTools: [
            'Analyze supplier responses',
            'Cross-reference capabilities',
            'Risk assessment scoring'
          ]
        },
        4: {
          title: 'Report Generation & Delivery',
          jorgeActions: [
            'Review AI-generated report',
            'Add executive summary with recommendations',
            'Approve and send to client'
          ],
          systemTools: [
            'AI generates comprehensive report',
            'Format professional PDF',
            'Client delivery system'
          ]
        }
      }
    },
    'manufacturing-feasibility': {
      title: '🏭 Manufacturing Feasibility Report',
      price: '$650',
      expert: 'Jorge',
      description: 'Location recommendations, regulatory overview, cost analysis',
      complexity: '4-Stage',
      totalStages: 4,
      stages: {
        1: {
          title: 'Client Requirements Procurement',
          jorgeActions: [
            'Send manufacturing requirements form',
            'Collect investment budget details',
            'Upload client specifications'
          ],
          systemTools: [
            'Generate feasibility intake form',
            'Auto-populate client manufacturing data',
            'Process requirements analysis'
          ]
        },
        2: {
          title: 'Location & Partner Discovery',
          jorgeActions: [
            'Contact industrial park managers',
            'Reach out to facility providers',
            'Send location assessment forms'
          ],
          systemTools: [
            'Industrial park database search',
            'Generate location assessment forms',
            'Cost comparison matrices'
          ]
        },
        3: {
          title: 'Feasibility Analysis',
          jorgeActions: [
            'Validate location recommendations',
            'Review cost estimates for accuracy',
            'Assess regulatory compliance'
          ],
          systemTools: [
            'Cost-benefit analysis',
            'Regulatory requirement mapping',
            'Timeline projection modeling'
          ]
        },
        4: {
          title: 'Report Generation',
          jorgeActions: [
            'Review feasibility conclusions',
            'Add local market insights',
            'Deliver comprehensive report'
          ],
          systemTools: [
            'Generate feasibility report',
            'Financial projections',
            'Professional formatting'
          ]
        }
      }
    },
    'market-entry': {
      title: '🚀 Market Entry Report',
      price: '$400',
      expert: 'Jorge',
      description: 'Regulatory requirements, cultural guidance, market entry strategy',
      complexity: '4-Stage',
      totalStages: 4,
      stages: {
        1: {
          title: 'Market Entry Planning',
          jorgeActions: [
            'Send market entry intake form',
            'Collect target market details',
            'Upload client market goals'
          ],
          systemTools: [
            'Generate market entry form',
            'Market opportunity database',
            'Competition analysis tools'
          ]
        },
        2: {
          title: 'Market Intelligence Gathering',
          jorgeActions: [
            'Contact business associations',
            'Reach potential local partners',
            'Send market assessment forms'
          ],
          systemTools: [
            'Business association directory',
            'Partner recommendation engine',
            'Market intelligence forms'
          ]
        },
        3: {
          title: 'Strategy Development',
          jorgeActions: [
            'Validate market opportunities',
            'Review partnership options',
            'Assess cultural considerations'
          ],
          systemTools: [
            'Market size analysis',
            'Cultural business guide',
            'Entry strategy modeling'
          ]
        },
        4: {
          title: 'Strategy Report',
          jorgeActions: [
            'Review market entry strategy',
            'Add cultural insights',
            'Deliver actionable plan'
          ],
          systemTools: [
            'Generate entry strategy report',
            'Implementation timeline',
            'Risk mitigation plans'
          ]
        }
      }
    },
    'usmca-certificate': {
      title: '🛡️ USMCA Certificate Generation',
      price: '$200',
      expert: 'Cristina',
      description: 'Professional USMCA certificate with compliance validation',
      complexity: '3-Stage',
      totalStages: 3,
      stages: {
        1: {
          title: 'Client Documentation',
          cristinaActions: [
            'Send USMCA document request form',
            'Follow up for required documentation',
            'Upload client compliance documents'
          ],
          systemTools: [
            'Generate USMCA document checklist',
            'Auto-populate product data',
            'Document completeness tracker'
          ]
        },
        2: {
          title: 'Expert Validation',
          cristinaActions: [
            'Review qualification rule analysis',
            'Validate against regulatory experience',
            'Request additional documentation if needed'
          ],
          systemTools: [
            'USMCA rule validation engine',
            'Compliance gap identification',
            'Risk assessment analysis'
          ]
        },
        3: {
          title: 'Certificate Generation',
          cristinaActions: [
            'Review AI-generated certificate',
            'Add compliance recommendations',
            'Approve and deliver certificate'
          ],
          systemTools: [
            'Generate professional certificate',
            'Compliance validation report',
            'Certificate delivery system'
          ]
        }
      }
    },
    'hs-classification': {
      title: '📋 HS Code Classification',
      price: '$150',
      expert: 'Cristina',
      description: 'Validated HS code with justification and tariff analysis',
      complexity: '2-Stage',
      totalStages: 2,
      stages: {
        1: {
          title: 'Product Documentation',
          cristinaActions: [
            'Send HS classification form',
            'Collect technical specifications',
            'Upload product documentation'
          ],
          systemTools: [
            'Generate classification intake form',
            'Product specification parser',
            'HS database preparation'
          ]
        },
        2: {
          title: 'Classification & Delivery',
          cristinaActions: [
            'Review classification logic',
            'Validate against tariff implications',
            'Deliver classification package'
          ],
          systemTools: [
            'HS database cross-reference',
            'Tariff rate analysis',
            'Generate classification report'
          ]
        }
      }
    },
    'document-review': {
      title: '📑 Document Review & Validation',
      price: '$250',
      expert: 'Cristina',
      description: 'Comprehensive review with actionable compliance recommendations',
      complexity: '3-Stage',
      totalStages: 3,
      stages: {
        1: {
          title: 'Document Collection',
          cristinaActions: [
            'Request all trade documents',
            'Follow up for complete documentation',
            'Upload document package'
          ],
          systemTools: [
            'Document checklist generator',
            'Multi-document upload system',
            'Document categorization'
          ]
        },
        2: {
          title: 'Expert Review',
          cristinaActions: [
            'Review identified errors',
            'Prioritize compliance gaps by risk',
            'Validate improvement recommendations'
          ],
          systemTools: [
            'Automated error detection',
            'Compliance gap prioritization',
            'Risk impact assessment'
          ]
        },
        3: {
          title: 'Review Report',
          cristinaActions: [
            'Review compliance findings',
            'Add improvement roadmap',
            'Deliver actionable recommendations'
          ],
          systemTools: [
            'Generate comprehensive review',
            'Compliance improvement plan',
            'Action item tracking'
          ]
        }
      }
    },
    'monthly-support': {
      title: '💬 Monthly Compliance Support',
      price: '$99/month',
      expert: 'Cristina',
      description: '2 hours monthly Q&A time with expert',
      complexity: '2-Stage',
      totalStages: 2,
      stages: {
        1: {
          title: 'Session Planning',
          cristinaActions: [
            'Schedule monthly consultation session',
            'Review client compliance history',
            'Prepare discussion agenda'
          ],
          systemTools: [
            'Calendar integration',
            'Compliance history dashboard',
            'Agenda template generator'
          ]
        },
        2: {
          title: 'Consultation & Follow-up',
          cristinaActions: [
            'Conduct 2-hour Q&A session',
            'Document key recommendations',
            'Send follow-up action items'
          ],
          systemTools: [
            'Video conferencing integration',
            'Session recording system',
            'Action item tracking'
          ]
        }
      }
    },
    'crisis-response': {
      title: '🚨 Compliance Crisis Response',
      price: '$450',
      expert: 'Cristina',
      description: '24-48 hour emergency resolution',
      complexity: '3-Stage',
      totalStages: 3,
      stages: {
        1: {
          title: 'Crisis Assessment',
          cristinaActions: [
            'Review crisis documentation immediately',
            'Upload rejected certificates/correspondence',
            'Assess urgency and scope'
          ],
          systemTools: [
            'Emergency intake form',
            'Crisis severity assessment',
            'Regulatory database search'
          ]
        },
        2: {
          title: 'Emergency Resolution',
          cristinaActions: [
            'Develop immediate resolution strategy',
            'Contact emergency compliance experts',
            'Coordinate rapid response'
          ],
          systemTools: [
            'Emergency expert network',
            'Rapid resolution templates',
            'Crisis timeline tracker'
          ]
        },
        3: {
          title: 'Resolution & Prevention',
          cristinaActions: [
            'Deliver crisis resolution plan',
            'Document root cause analysis',
            'Provide prevention recommendations'
          ],
          systemTools: [
            'Resolution plan generator',
            'Root cause analysis tools',
            'Prevention checklist'
          ]
        }
      }
    }
  };

  const currentService = services[activeService];
  const currentStage = currentService.stages[activeStage];
  const isJorgeService = currentService.expert === 'Jorge';

  const expertActions = isJorgeService ? currentStage.jorgeActions : currentStage.cristinaActions;

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case '2-Stage': return 'bg-green-100 text-green-700';
      case '3-Stage': return 'bg-blue-100 text-blue-700';
      case '4-Stage': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getComplexityIcon = (complexity) => {
    switch (complexity) {
      case '2-Stage': return <Zap className="w-4 h-4" />;
      case '3-Stage': return <FileText className="w-4 h-4" />;
      case '4-Stage': return <Search className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TradeFlow Service Dashboards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedExpert('jorge')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  selectedExpert === 'jorge'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                Jorge's Mexico Services
              </button>
              <button
                onClick={() => setSelectedExpert('cristina')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  selectedExpert === 'cristina'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                Cristina's Compliance Services
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Service Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedExpert === 'jorge' ? "Jorge's Services" : "Cristina's Services"}
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(services)
                  .filter(([_, service]) => 
                    selectedExpert === 'jorge' ? service.expert === 'Jorge' : service.expert === 'Cristina'
                  )
                  .map(([key, service]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveService(key);
                        setActiveStage(1);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeService === key
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{service.title}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getComplexityColor(service.complexity)}`}>
                          {getComplexityIcon(service.complexity)}
                          <span>{service.complexity}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">{service.price}</div>
                      <div className="text-xs text-gray-400">{service.description}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-3">
            {/* Service Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{currentService.title}</h2>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getComplexityColor(currentService.complexity)}`}>
                        {getComplexityIcon(currentService.complexity)}
                        <span>{currentService.complexity}</span>
                      </div>
                    </div>
                    <p className="text-gray-600">{currentService.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{currentService.price}</div>
                    <div className="text-sm text-gray-500">Expert: {currentService.expert}</div>
                  </div>
                </div>

                {/* Dynamic Stage Progress */}
                <div className="flex items-center justify-between mb-4">
                  {Array.from({ length: currentService.totalStages }, (_, i) => i + 1).map((stage) => (
                    <div key={stage} className="flex items-center">
                      <button
                        onClick={() => setActiveStage(stage)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          activeStage === stage
                            ? 'bg-blue-600 text-white'
                            : stage < activeStage
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {stage < activeStage ? <CheckCircle className="w-5 h-5" /> : stage}
                      </button>
                      {stage < currentService.totalStages && (
                        <div className={`h-1 w-24 mx-2 transition-colors ${
                          stage < activeStage ? 'bg-green-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Stage Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {Array.from({ length: currentService.totalStages }, (_, i) => i + 1).map((stage) => (
                    <div key={stage} className={`p-2 rounded ${activeStage === stage ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                      Stage {stage}: {currentService.stages[stage].title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Stage {activeStage}: {currentStage.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">In Progress</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Expert Actions */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      {currentService.expert}'s Tasks
                    </h4>
                    <div className="space-y-3">
                      {expertActions.map((action, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                          </div>
                          <p className="text-gray-700">{action}</p>
                        </div>
                      ))}
                    </div>

                    {/* Stage-Specific Action Buttons */}
                    <div className="mt-6 space-y-3">
                      {currentService.totalStages === 2 && activeStage === 1 && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Send className="w-5 h-5 mr-2" />
                            Send Client Form
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload Response
                          </button>
                        </div>
                      )}

                      {currentService.totalStages === 2 && activeStage === 2 && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Complete & Deliver
                          </button>
                        </div>
                      )}

                      {currentService.totalStages >= 3 && activeStage === 1 && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Send className="w-5 h-5 mr-2" />
                            Send Client Form
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload Response
                          </button>
                        </div>
                      )}

                      {currentService.totalStages === 4 && activeStage === 2 && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Search className="w-5 h-5 mr-2" />
                            Discover Contacts
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Send className="w-5 h-5 mr-2" />
                            Send Information Requests
                          </button>
                        </div>
                      )}

                      {((currentService.totalStages === 3 && activeStage === 2) || (currentService.totalStages === 4 && activeStage === 3)) && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Review Analysis
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload Additional Info
                          </button>
                        </div>
                      )}

                      {activeStage === currentService.totalStages && (
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <FileText className="w-5 h-5 mr-2" />
                            Generate Report
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Download className="w-5 h-5 mr-2" />
                            Deliver to Client
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Tools */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-green-600" />
                      Available Tools
                    </h4>
                    <div className="space-y-3">
                      {currentStage.systemTools.map((tool, index) => (
                        <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-green-800">{tool}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sample Data Display */}
                    <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Collected Information</h5>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {activeStage === 1 && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">📋 Client form received</div>
                            <div className="text-sm text-gray-600">✅ Requirements validated</div>
                            <div className="text-sm text-gray-600">🔄 Processing specifications...</div>
                          </div>
                        )}
                        {currentService.totalStages === 4 && activeStage === 2 && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">🔍 Found 23 potential contacts</div>
                            <div className="text-sm text-gray-600">📧 Sent 15 information requests</div>
                            <div className="text-sm text-gray-600">✅ Received 8 responses</div>
                          </div>
                        )}
                        {activeStage === Math.max(2, currentService.totalStages - 1) && currentService.totalStages > 2 && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">📊 Analysis completed</div>
                            <div className="text-sm text-gray-600">⚠️ 2 information gaps identified</div>
                            <div className="text-sm text-gray-600">✅ Validation in progress</div>
                          </div>
                        )}
                        {activeStage === currentService.totalStages && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">📋 Report generated</div>
                            <div className="text-sm text-gray-600">👀 Expert review completed</div>
                            <div className="text-sm text-gray-600">🚀 Ready for delivery</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboards;

Updated Service Complexity:
🟢 2-Stage Services (Simple & Fast)

HS Classification ($150) - Get specs → Validate & deliver
Monthly Support ($99/month) - Schedule → Conduct session

🔵 3-Stage Services (Standard Process)

USMCA Certificate ($200) - Documentation → Validation → Generation
Document Review ($250) - Collection → Review → Report
Crisis Response ($450) - Assessment → Resolution → Prevention

🟣 4-Stage Services (Complex Research)

Supplier Sourcing ($500) - Full contact discovery process
Manufacturing Feasibility ($650) - Comprehensive location analysis
Market Entry ($400) - Complete market intelligence gathering

Key Interface Improvements:
Visual Complexity Indicators: Each service shows its complexity level with color-coded badges:

🟢 2-Stage = Quick/Simple (Zap icon)
🔵 3-Stage = Standard (Document icon)
🟣 4-Stage = Research (Search icon)

Dynamic Progress Bars: The progress tracker adapts to show 2, 3, or 4 stages based on the selected service
Smart Action Buttons: Buttons change contextually:

2-stage services: Send form → Complete & deliver
3-stage services: Include validation/review step
4-stage services: Full contact discovery workflow

Appropriate Stage Labels: Each service has stage names that make sense for its complexity level (no forced artificial stages)
This approach makes the interface much more intuitive - users immediately understand the scope and timeline for each service type, and Jorge/Cristina get workflows that match the natural complexity of each service.