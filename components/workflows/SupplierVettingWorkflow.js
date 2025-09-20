/**
 * Comprehensive Supplier Vetting Workflow System
 * Complete "business-in-a-box" for Mexico supplier vetting operations
 */

import { useState } from 'react';

export default function SupplierVettingWorkflow({ project, onUpdateProject }) {
  const [activePhase, setActivePhase] = useState('intake');
  const [completedItems, setCompletedItems] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [riskFlags, setRiskFlags] = useState([]);

  const vettingPhases = {
    intake: {
      title: 'Initial Client Intake',
      timeline: 'Day 1-2',
      items: [
        {
          id: 'client_requirements',
          title: 'Client Requirements Analysis',
          description: 'Detailed understanding of what the client needs',
          checklist: [
            'Product specifications and quality requirements',
            'Volume requirements (minimum/maximum order quantities)',
            'Budget parameters and pricing expectations',
            'Delivery timeline and logistics requirements',
            'Certification requirements (ISO, FDA, industry-specific)',
            'Geographic preferences within Mexico',
            'Communication language preferences',
            'Payment terms and financial requirements'
          ]
        },
        {
          id: 'project_scope',
          title: 'Project Scope Definition',
          description: 'Clear boundaries and expectations for the vetting process',
          checklist: [
            'Number of suppliers to vet (typically 3-5 for final 3)',
            'Depth of due diligence required',
            'Site visit requirements (virtual/physical)',
            'Timeline expectations and milestone dates',
            'Deliverable format preferences',
            'Success criteria definition',
            'Confidentiality requirements',
            'Post-introduction support level'
          ]
        }
      ]
    },

    research: {
      title: 'Supplier Research & Identification',
      timeline: 'Day 3-7',
      items: [
        {
          id: 'supplier_identification',
          title: 'Supplier Database Research',
          description: 'Systematic identification of potential suppliers',
          resources: [
            'ProMéxico business directory',
            'IMMEX program participant database',
            'Mexican Chamber of Commerce listings',
            'Industry association member directories',
            'LinkedIn and professional networks',
            'Trade show exhibitor lists',
            'Existing Triangle Intelligence supplier network'
          ],
          checklist: [
            'Initial list of 10-15 potential suppliers compiled',
            'Basic company information gathered (name, location, size)',
            'Product/service alignment confirmed',
            'Contact information verified',
            'Initial website and online presence review',
            'Geographic distribution assessed',
            'Company age and stability indicators noted'
          ]
        },
        {
          id: 'preliminary_screening',
          title: 'Preliminary Screening',
          description: 'First-pass evaluation to narrow the field',
          redFlags: [
            'No physical address or only P.O. Box',
            'Website doesn\'t match claimed business',
            'No business registration information available',
            'Suspiciously low prices with no explanation',
            'Poor or no online presence',
            'Unresponsive to initial contact attempts',
            'Claims capabilities far beyond apparent size'
          ],
          checklist: [
            'Business registration status verified (RFC)',
            'Physical address confirmed via Google Maps/Street View',
            'Website quality and professionalism assessed',
            'Social media presence and activity reviewed',
            'Basic financial information gathered (if public)',
            'Industry reputation research completed',
            'Initial responsiveness test conducted',
            'Shortlist of 5-7 candidates finalized'
          ]
        }
      ]
    },

    verification: {
      title: 'Legal & Financial Verification',
      timeline: 'Day 8-12',
      items: [
        {
          id: 'legal_verification',
          title: 'Legal Documentation Review',
          description: 'Comprehensive legal standing verification',
          requiredDocuments: [
            'RFC (Tax ID) certificate',
            'Business registration certificate',
            'IMMEX program certification (if applicable)',
            'Export license documentation',
            'Quality certifications (ISO 9001, ISO 14001, etc.)',
            'Industry-specific certifications',
            'Insurance certificates',
            'Legal representative authorization'
          ],
          verificationSteps: [
            'Cross-reference RFC with SAT (tax authority) database',
            'Verify business registration with state government',
            'Confirm IMMEX status if claimed',
            'Validate export license authenticity',
            'Check certification validity with issuing bodies',
            'Review legal structure and ownership',
            'Assess compliance history',
            'Document any legal issues or proceedings'
          ]
        },
        {
          id: 'financial_assessment',
          title: 'Financial Health Evaluation',
          description: 'Assessment of financial stability and reliability',
          assessmentCriteria: [
            {
              category: 'Credit Rating',
              weight: 25,
              items: ['Credit bureau reports', 'Payment history', 'Outstanding debts']
            },
            {
              category: 'Financial Statements',
              weight: 30,
              items: ['Revenue trends', 'Profit margins', 'Cash flow stability']
            },
            {
              category: 'Business Stability',
              weight: 20,
              items: ['Years in operation', 'Customer retention', 'Staff turnover']
            },
            {
              category: 'Growth Indicators',
              weight: 15,
              items: ['Facility expansion', 'Equipment investment', 'Market expansion']
            },
            {
              category: 'Risk Factors',
              weight: 10,
              items: ['Debt-to-equity ratio', 'Dependency on single client', 'Economic sensitivity']
            }
          ],
          scoringGuide: {
            'Excellent (90-100)': 'Strong financial position, minimal risk',
            'Good (75-89)': 'Stable finances, acceptable risk level',
            'Fair (60-74)': 'Some concerns, requires monitoring',
            'Poor (Below 60)': 'Significant risks, not recommended'
          }
        }
      ]
    },

    assessment: {
      title: 'Production & Quality Assessment',
      timeline: 'Day 13-16',
      items: [
        {
          id: 'facility_evaluation',
          title: 'Facility Assessment',
          description: 'Production capability and quality control evaluation',
          virtualAssessmentProtocol: [
            'Live video tour of production areas',
            'Equipment and machinery demonstration',
            'Quality control process walkthrough',
            'Staff interviews and capability assessment',
            'Safety protocol demonstration',
            'Environmental compliance review',
            'Storage and logistics facility tour',
            'Documentation of processes and procedures'
          ],
          physicalVisitProtocol: [
            'Facility cleanliness and organization',
            'Equipment condition and modernity',
            'Safety protocols and compliance',
            'Quality control systems in action',
            'Staff competency and training',
            'Environmental standards adherence',
            'Production capacity verification',
            'Logistics and shipping capabilities'
          ],
          evaluationCriteria: [
            'Production capacity vs. claimed capabilities',
            'Quality control system sophistication',
            'Equipment condition and maintenance',
            'Facility organization and cleanliness',
            'Staff professionalism and knowledge',
            'Safety and environmental compliance',
            'Technology adoption and modernization',
            'Scalability and expansion potential'
          ]
        },
        {
          id: 'quality_systems',
          title: 'Quality Management Systems',
          description: 'Assessment of quality control and assurance processes',
          isoRequirements: {
            'ISO 9001 (Quality Management)': {
              requirement: 'Quality management system certification',
              verification: 'Certificate validity and scope review',
              assessment: 'Implementation depth and effectiveness'
            },
            'ISO 14001 (Environmental)': {
              requirement: 'Environmental management system',
              verification: 'Environmental compliance documentation',
              assessment: 'Sustainability practices and policies'
            },
            'ISO 45001 (Occupational Health)': {
              requirement: 'Workplace safety management',
              verification: 'Safety record and incident reports',
              assessment: 'Safety culture and training programs'
            }
          },
          qualityChecklist: [
            'Incoming material inspection procedures',
            'In-process quality control checkpoints',
            'Final product inspection protocols',
            'Non-conformance handling procedures',
            'Corrective and preventive action systems',
            'Customer complaint handling process',
            'Continuous improvement programs',
            'Quality documentation and records'
          ]
        }
      ]
    },

    references: {
      title: 'Reference Checks & Reputation',
      timeline: 'Day 17-19',
      items: [
        {
          id: 'client_references',
          title: 'Current Client Reference Verification',
          description: 'Verification with existing clients about performance',
          referenceScript: `
            "Hello, this is [Your Name] from Triangle Intelligence. We're conducting due diligence on [Supplier Name] for a potential client partnership. Could you spare 10 minutes to share your experience working with them?"

            Questions to ask:
            1. How long have you been working with this supplier?
            2. What products/services do they provide for you?
            3. How would you rate their quality consistency (1-10)?
            4. How is their delivery performance and reliability?
            5. How responsive are they to issues or concerns?
            6. Have you had any significant problems? How were they resolved?
            7. How do they handle pricing and payment terms?
            8. Would you recommend them to other companies?
            9. Are there any areas where they could improve?
            10. What's their capacity for handling larger orders?
          `,
          referenceTargets: [
            'Top 3 current clients (by volume)',
            'Longest-standing client relationship',
            'Most recent client addition',
            'International clients (if any)',
            'Clients in similar industry to prospect'
          ],
          verificationChecklist: [
            'Minimum 3 client references contacted',
            'Reference authenticity verified',
            'Consistent feedback across references',
            'Specific examples of performance provided',
            'Any negative feedback documented and investigated',
            'Overall satisfaction scores calculated',
            'Improvement areas identified',
            'Growth capacity assessments obtained'
          ]
        },
        {
          id: 'industry_reputation',
          title: 'Industry Reputation Research',
          description: 'Broader industry standing and reputation assessment',
          researchSources: [
            'Industry association feedback',
            'Trade publication mentions',
            'Online review platforms',
            'Social media sentiment analysis',
            'Competitor intelligence',
            'Chamber of Commerce standing',
            'Government/regulatory feedback',
            'Trade show participation and reception'
          ],
          reputationIndicators: [
            'Awards and recognition received',
            'Industry certifications and memberships',
            'Trade show participation and booth quality',
            'Media coverage and press releases',
            'Customer testimonials and case studies',
            'Online reviews and ratings',
            'Professional network connections',
            'Community involvement and CSR activities'
          ]
        }
      ]
    },

    reporting: {
      title: 'Final Assessment & Reporting',
      timeline: 'Day 20-21',
      items: [
        {
          id: 'risk_assessment',
          title: 'Comprehensive Risk Assessment',
          description: 'Final risk evaluation and scoring',
          riskCategories: [
            {
              category: 'Financial Risk',
              weight: 25,
              factors: ['Credit rating', 'Financial stability', 'Payment history'],
              scoring: 'Low (1-3), Medium (4-6), High (7-10)'
            },
            {
              category: 'Operational Risk',
              weight: 20,
              factors: ['Production capacity', 'Quality systems', 'Delivery reliability'],
              scoring: 'Low (1-3), Medium (4-6), High (7-10)'
            },
            {
              category: 'Compliance Risk',
              weight: 20,
              factors: ['Legal standing', 'Certifications', 'Regulatory compliance'],
              scoring: 'Low (1-3), Medium (4-6), High (7-10)'
            },
            {
              category: 'Reputation Risk',
              weight: 15,
              factors: ['Client feedback', 'Industry standing', 'Track record'],
              scoring: 'Low (1-3), Medium (4-6), High (7-10)'
            },
            {
              category: 'Strategic Risk',
              weight: 20,
              factors: ['Cultural fit', 'Communication', 'Long-term viability'],
              scoring: 'Low (1-3), Medium (4-6), High (7-10)'
            }
          ],
          overallRiskCalculation: 'Weighted average of all categories',
          recommendationMatrix: {
            'Low Risk (1-3)': 'Highly recommended, minimal monitoring required',
            'Medium Risk (4-6)': 'Recommended with specific monitoring protocols',
            'High Risk (7-10)': 'Not recommended, significant risk factors present'
          }
        },
        {
          id: 'final_report',
          title: 'Final Vetting Report Generation',
          description: 'Comprehensive report compilation and client presentation',
          reportStructure: [
            'Executive Summary (1 page)',
            'Client Requirements Summary',
            'Supplier Profiles (Top 3 recommended)',
            'Detailed Assessment Results',
            'Risk Analysis and Scoring',
            'Reference Check Summaries',
            'Introduction Recommendations',
            'Implementation Roadmap',
            'Appendices (Certificates, Documentation)'
          ],
          deliverableFormats: [
            'Professional PDF report (primary)',
            'Executive summary presentation (PowerPoint)',
            'Supplier comparison matrix (Excel)',
            'Contact information database',
            'Due diligence documentation package'
          ]
        }
      ]
    }
  };

  const toggleItemComplete = (phaseId, itemId) => {
    const key = `${phaseId}_${itemId}`;
    const newCompleted = new Set(completedItems);
    if (completedItems.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }
    setCompletedItems(newCompleted);
  };

  const addRiskFlag = (flag) => {
    setRiskFlags([...riskFlags, { ...flag, timestamp: new Date().toISOString() }]);
  };

  const updateNotes = (key, value) => {
    setNotes({ ...notes, [key]: value });
  };

  const calculateProgress = () => {
    const totalItems = Object.values(vettingPhases).reduce((total, phase) => total + phase.items.length, 0);
    const completedCount = completedItems.size;
    return Math.round((completedCount / totalItems) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Vetting Workflow: {project?.company_name}
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive Mexico supplier vetting process
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{calculateProgress()}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Phase Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {Object.entries(vettingPhases).map(([phaseId, phase]) => (
              <button
                key={phaseId}
                onClick={() => setActivePhase(phaseId)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activePhase === phaseId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {phase.title}
                <div className="text-xs text-gray-400">{phase.timeline}</div>
              </button>
            ))}
          </nav>
        </div>

        {/* Phase Content */}
        <div className="p-6">
          {Object.entries(vettingPhases).map(([phaseId, phase]) => (
            <div key={phaseId} className={activePhase === phaseId ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{phase.title}</h2>
                <p className="text-gray-600">Timeline: {phase.timeline}</p>
              </div>

              <div className="space-y-8">
                {phase.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={completedItems.has(`${phaseId}_${item.id}`)}
                          onChange={() => toggleItemComplete(phaseId, item.id)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          <p className="text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Checklist */}
                    {item.checklist && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Checklist:</h4>
                        <ul className="space-y-1">
                          {item.checklist.map((checkItem, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                              {checkItem}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {item.resources && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Research Sources:</h4>
                        <ul className="space-y-1">
                          {item.resources.map((resource, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-300 rounded-full mr-3"></span>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Red Flags */}
                    {item.redFlags && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-600 mb-2">🚨 Red Flag Indicators:</h4>
                        <ul className="space-y-1">
                          {item.redFlags.map((flag, idx) => (
                            <li key={idx} className="flex items-center text-sm text-red-600">
                              <span className="w-2 h-2 bg-red-300 rounded-full mr-3"></span>
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes Section */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes & Findings:
                      </label>
                      <textarea
                        value={notes[`${phaseId}_${item.id}`] || ''}
                        onChange={(e) => updateNotes(`${phaseId}_${item.id}`, e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Document findings, concerns, or important details..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Risk Flags Panel */}
        {riskFlags.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-medium text-red-600 mb-4">🚨 Risk Flags Identified</h3>
            <div className="space-y-2">
              {riskFlags.map((flag, idx) => (
                <div key={idx} className="flex items-center justify-between bg-red-50 p-3 rounded">
                  <span className="text-red-800">{flag.description}</span>
                  <span className="text-xs text-red-600">{new Date(flag.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}