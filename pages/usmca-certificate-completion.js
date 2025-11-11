/**
 * USMCA Certificate Completion Page
 * Uses the AuthorizationStep component for certificate generation
 * Updated with dashboard-user.css styling for consistency
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import AuthorizationStep from '../components/workflow/AuthorizationStep';
import EditableCertificatePreview from '../components/workflow/EditableCertificatePreview';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import { calculateDynamicTrustScore, getFallbackTrustScore } from '../lib/utils/trust-score-calculator.js';
import workflowStorage from '../lib/services/workflow-storage-adapter.js';
// Removed: unified-workflow-data-service (over-engineered)
// Certificate page loads from localStorage directly (user is still in active session)

export default function USMCACertificateCompletion() {
  const router = useRouter();
  const [workflowData, setWorkflowData] = useState(null);
  const [dynamicTrustData, setDynamicTrustData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  // ✅ Removed generatedPDF state - old PDF system no longer used
  const [userTier, setUserTier] = useState('Trial'); // Default to Trial for safety
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Track whether to show preview or authorization
  const [previewEditedData, setPreviewEditedData] = useState(null); // Store edits from preview

  // ✅ RESET showPreview on fresh page load (when coming from results page)
  // Note: Don't reset if we're loading from dashboard with workflow_id
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('workflow_id');

    // Only reset preview if NOT loading from dashboard
    if (!workflowId) {
      setShowPreview(false);
    }
  }, []); // Empty dependency = run once on mount
  const [certificateData, setCertificateData] = useState({
    company_info: {},
    product_details: {},
    authorization: {},
    blanket_period: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    }
  });

  // Fetch user subscription tier on mount
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const response = await fetch('/api/dashboard-data', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const tier = data.user_profile?.subscription_tier || 'Trial';
          setUserTier(tier);
          console.log('User subscription tier:', tier);
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        // Default to Trial on error for safety
        setUserTier('Trial');
      }
    };
    fetchUserTier();
  }, []);

  useEffect(() => {
    // ✅ Load workflow data from database (if workflow_id in URL) OR localStorage
    const loadData = async () => {
      try {
        // ⚠️ Don't load old data if user just clicked "+ New Analysis"
        const urlParams = new URLSearchParams(window.location.search);
        const isResetting = urlParams.get('reset') === 'true';
        const workflowId = urlParams.get('workflow_id');

        if (isResetting) {
          console.log('🔄 Certificate page: User clicked "+ New Analysis" - redirecting to start');
          router.push('/usmca-workflow');
          return;
        }

        // ✅ FIX (Nov 7): If workflow_id in URL, fetch from database
        if (workflowId) {
          console.log('📂 Loading workflow from database:', workflowId);
          const response = await fetch(`/api/workflow/${workflowId}`, {
            credentials: 'include'
          });

          if (response.ok) {
            const { workflow } = await response.json();
            console.log('✅ Workflow loaded from database:', workflow);

            // ✅ FIXED (Nov 7): Use top-level columns as primary source, JSONB as fallback
            // Top-level columns: company_name, company_country, destination_country
            // JSONB workflow_data might be incomplete or missing these fields
            const dbData = workflow.workflow_data || {};

            // ✅ DEBUG: Log what contact data is in the database
            console.log('🔍 [CERTIFICATE] Contact person from database:', {
              from_workflow_data: dbData.company?.contact_person,
              from_workflow_data_phone: dbData.company?.contact_phone,
              from_workflow_data_email: dbData.company?.contact_email,
              company_name: workflow.company_name
            });

            const initialData = {
              company: {
                // ✅ Use top-level columns first, then JSONB fallback
                company_name: workflow.company_name || dbData.company?.company_name || dbData.company?.name || '',
                name: workflow.company_name || dbData.company?.company_name || dbData.company?.name || '',
                company_country: workflow.company_country || dbData.company?.company_country || dbData.company?.country || '',
                company_address: dbData.company?.company_address || dbData.company?.address || '',
                business_type: dbData.company?.business_type || '',
                trade_volume: dbData.company?.trade_volume || 0,
                tax_id: dbData.company?.tax_id || '',
                contact_person: dbData.company?.contact_person || '',
                contact_phone: dbData.company?.contact_phone || '',
                contact_email: dbData.company?.contact_email || ''
              },
              product: dbData.product || {},
              components: dbData.components || workflow.component_origins || [],
              usmca: dbData.usmca || {},
              trust: dbData.trust || {},
              savings: dbData.savings || {},
              destination_country: workflow.destination_country,
              authorization: dbData.authorization || {}, // ✅ Load saved authorization
              source: 'database'
            };

            setWorkflowData(initialData);

            // ✅ FIX (Nov 7): Auto-populate certificate data and show preview if authorization exists
            if (dbData.authorization && dbData.authorization.signatory_name) {
              console.log('✅ Authorization data found, auto-generating certificate preview');

              // Auto-populate certificate data
              setCertificateData(prev => ({
                ...prev,
                authorization: dbData.authorization
              }));

              // Auto-generate certificate preview
              // ✅ FIX (Nov 9): Pass initialData directly instead of waiting for state
              setTimeout(async () => {
                await handlePreviewCertificate(dbData.authorization, initialData);
              }, 100);
            } else if (dbData.authorization) {
              console.log('⚠️ Authorization data exists but incomplete (missing signatory_name) - showing form');
              // Still populate what we have so user can edit
              setCertificateData(prev => ({
                ...prev,
                authorization: dbData.authorization
              }));
            }

            return; // Skip localStorage loading
          } else {
            console.warn('⚠️ Failed to load workflow from database, falling back to localStorage');
          }
        }

        // Load workflow results from localStorage
        const workflowResults = workflowStorage.getItem('usmca_workflow_results');
        const formData = workflowStorage.getItem('triangleUserData');
        const storedAuth = workflowStorage.getItem('usmca_authorization_data');

        if (!workflowResults && !formData) {
          console.log('[CertificateCompletion] No workflow data found - redirecting to start');
          router.push('/usmca-workflow');
          return;
        }

        // Parse workflow data
        const parsedResults = workflowResults ? JSON.parse(workflowResults) : null;
        const parsedForm = formData ? JSON.parse(formData) : null;

        // Merge both sources (results take priority)
        const initialData = {
          company: parsedResults?.company || {
            name: parsedForm?.company_name,
            company_name: parsedForm?.company_name,
            company_country: parsedForm?.company_country,
            company_address: parsedForm?.company_address,
            business_type: parsedForm?.business_type,
            trade_volume: parsedForm?.trade_volume,
            tax_id: parsedForm?.tax_id,
            contact_person: parsedForm?.contact_person,
            contact_phone: parsedForm?.contact_phone,
            contact_email: parsedForm?.contact_email
          },
          product: parsedResults?.product || {
            description: parsedForm?.product_description,
            hs_code: parsedForm?.product_hs_code
          },
          components: parsedResults?.components || parsedForm?.component_origins || [],
          usmca: parsedResults?.usmca || {},
          trust: parsedResults?.trust || {},
          savings: parsedResults?.savings || {},
          destination_country: parsedForm?.destination_country,
          source: 'localStorage'
        };

        // ✅ DEBUG: Check what country data we have
        console.log('🔍 [Certificate] Loading workflow data - Country check:', {
          source: initialData?.source,
          has_initialData: !!initialData,
          company_country: initialData?.company?.company_country,
          company_object: initialData?.company
        });

        if (initialData) {
          console.log(`✅ Loading workflow data from ${initialData.source}:`, initialData);
          setWorkflowData(initialData);

        // Calculate dynamic trust score
        let calculatedTrustData = null;
        try {
          calculatedTrustData = calculateDynamicTrustScore(initialData);
          console.log('Dynamic trust score calculated:', calculatedTrustData);
          setDynamicTrustData(calculatedTrustData);
        } catch (error) {
          console.error('Failed to calculate dynamic trust score:', error);
          calculatedTrustData = getFallbackTrustScore();
          setDynamicTrustData(calculatedTrustData);
        }

        // Create unified analysis results structure
        const analysisResults = {
          trust_score: initialData.trust?.score ? (initialData.trust.score / 100) :
                      calculatedTrustData?.trust_score,
          regional_content: initialData.usmca?.regional_content ||
                           initialData.usmca?.north_american_content ||
                           100.0,
          qualification_status: initialData.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          origin_criterion: initialData.usmca?.preference_criterion,
          hs_code: initialData.product?.hs_code || '',
          manufacturing_location: initialData.usmca?.manufacturing_location || parsedForm?.manufacturing_location || '',
          component_breakdown: initialData.components || [],
          calculated_at: new Date().toISOString(),

          // ✅ FIX (Nov 6): Add missing certificate fields 7-11 for EditableCertificatePreview
          // These fields are required for official USMCA Certificate of Origin (Form D)
          preference_criterion: initialData.usmca?.preference_criterion || 'B',  // Field 8: Origin Criterion (A/B/C/D)
          is_producer: parsedForm?.business_type === 'Manufacturer',  // Field 9: Producer (YES/NO)
          qualification_method: initialData.usmca?.qualification_method || 'RVC',  // Field 10: Method (RVC/TV/PE)
          country_of_origin: parsedForm?.manufacturing_location || parsedForm?.company_country || ''  // Field 11: Country of Origin
        };

        // ✅ FIX (Nov 7): Restore authorization data from database OR localStorage
        // Priority: database (parsedResults.authorization) > localStorage (storedAuth)
        let restoredAuthData = {};
        const dbAuthData = parsedResults?.authorization;
        const localAuthData = storedAuth ? JSON.parse(storedAuth) : null;

        // Use database data first, fallback to localStorage
        const authDataSource = dbAuthData || localAuthData;

        if (authDataSource) {
          try {
            console.log('✅ [CERTIFICATE-COMPLETION] Restoring authorization from:', dbAuthData ? 'database' : 'localStorage');
            restoredAuthData = {
              authorization: {
                signatory_name: authDataSource.signatory_name || '',
                signatory_title: authDataSource.signatory_title || '',
                signatory_email: authDataSource.signatory_email || '',
                signatory_phone: authDataSource.signatory_phone || '',
                certifier_type: authDataSource.certifier_type || 'EXPORTER'
              },
              exporter_same_as_company: authDataSource.exporter_same_as_company,
              producer_same_as_exporter: authDataSource.producer_same_as_exporter,
              // Exporter details
              exporter_name: authDataSource.exporter_name || '',
              exporter_address: authDataSource.exporter_address || '',
              exporter_country: authDataSource.exporter_country || '',
              exporter_tax_id: authDataSource.exporter_tax_id || '',
              exporter_phone: authDataSource.exporter_phone || '',
              exporter_email: authDataSource.exporter_email || '',
              // Importer details
              importer_name: authDataSource.importer_name || '',
              importer_address: authDataSource.importer_address || '',
              importer_country: authDataSource.importer_country || '',
              importer_tax_id: authDataSource.importer_tax_id || '',
              importer_phone: authDataSource.importer_phone || '',
              importer_email: authDataSource.importer_email || '',
              // Producer details
              producer_name: authDataSource.producer_name || '',
              producer_address: authDataSource.producer_address || '',
              producer_country: authDataSource.producer_country || '',
              producer_tax_id: authDataSource.producer_tax_id || '',
              producer_phone: authDataSource.producer_phone || '',
              producer_email: authDataSource.producer_email || ''
            };
          } catch (e) {
            console.error('Failed to restore authorization data:', e);
          }
        }

        // Auto-populate certificate data (merge with restored authorization data)
        setCertificateData(prev => ({
          ...prev,
          ...restoredAuthData,
          analysis_results: analysisResults,
          company_info: {
            exporter_name: initialData.company?.name || initialData.company?.company_name || '',
            exporter_address: initialData.company?.company_address || initialData.company?.address || '',
            exporter_country: initialData.company?.company_country || '',  // FIXED: Use company_country field
            exporter_tax_id: initialData.company?.tax_id || '',
            exporter_phone: initialData.company?.contact_phone || '',
            exporter_email: initialData.company?.contact_email || '',
          },
          product_details: {
            hs_code: analysisResults.hs_code,
            commercial_description: initialData.product?.description || '',
            manufacturing_location: analysisResults.manufacturing_location
          }
        }));
        }
      } catch (error) {
        console.error('Error loading workflow data:', error);
      }
    };

    // Load data from localStorage
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ NEW: Restore certificate edits from localStorage on page load
  useEffect(() => {
    try {
      const savedEdits = workflowStorage.getItem('usmca_certificate_edits');
      if (savedEdits) {
        const parsed = JSON.parse(savedEdits);
        console.log('🔄 Restoring certificate edits from localStorage:', {
          timestamp: parsed.timestamp,
          has_certificate: !!parsed.certificate,
          product_description: parsed.product_description
        });

        // Restore to preview data if we have a certificate
        if (parsed.certificate && showPreview) {
          setPreviewData(prev => ({
            ...prev,
            professional_certificate: parsed.certificate
          }));
          console.log('✅ Certificate edits restored successfully');
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to restore certificate edits from localStorage:', error);
    }
  }, [showPreview]); // Run when preview is shown

  const updateCertificateData = (section, data) => {
    setCertificateData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handlePreviewCertificate = async (authData, passedWorkflowData = null) => {
    console.log('Generating certificate and opening preview for editing...');

    // ✅ FIX (Nov 9): Use passedWorkflowData if provided (from database load)
    const dataToUse = passedWorkflowData || workflowData;

    // Store authorization data for use in certificate generation
    setCertificateData(prev => ({
      ...prev,
      authorization: authData
    }));

    // ✅ FIX (Nov 7): Save authorization data to database for dashboard reload
    try {
      const response = await fetch('/api/workflow-session/update-authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          authorization_data: authData
        })
      });

      if (response.ok) {
        console.log('✅ [CERTIFICATE-COMPLETION] Authorization data saved to database');
      } else {
        console.warn('⚠️ [CERTIFICATE-COMPLETION] Failed to save authorization (will use localStorage)');
      }
    } catch (error) {
      console.error('❌ [CERTIFICATE-COMPLETION] Error saving authorization:', error);
    }

    // Generate certificate and show editable preview (pass both authData and workflowData)
    await generateAndDownloadCertificate(authData, dataToUse);
  };

  const handlePreviewDownload = async (editedPreviewData) => {
    // Update workflow data with any edits from preview
    if (editedPreviewData) {
      setWorkflowData(prev => ({
        ...prev,
        usmca: {
          ...prev?.usmca,
          north_american_content: editedPreviewData.rvc,
          regional_content: editedPreviewData.rvc,
          preference_criterion: editedPreviewData.preference_criterion
        },
        components: editedPreviewData.components
      }));
      setPreviewEditedData(editedPreviewData);
    }

    // Now generate the certificate with potentially updated data
    await generateAndDownloadCertificate();
  };

  const generateAndDownloadCertificate = async (passedAuthData = null, passedWorkflowData = null) => {
    // ✅ FIX (Nov 9): Use passedWorkflowData if provided (from database load)
    const dataToUse = passedWorkflowData || workflowData;

    const authData = passedAuthData || certificateData.authorization || {};
    const preview = {
      ...certificateData,
      authorization: authData,
      certificate_number: `CERT-${Date.now()}`,
      date: new Date().toLocaleDateString()
    };

    console.log('Generating professional certificate with data:', preview);

    // CRITICAL DEBUG: Log what company_country value we have
    console.log('🔍 CERTIFICATE PAGE - Company Country Check:', {
      has_dataToUse: !!dataToUse,
      has_company: !!dataToUse?.company,
      company_country_value: dataToUse?.company?.company_country,
      company_country_type: typeof dataToUse?.company?.company_country,
      full_company_object: dataToUse?.company
    });

    // ✅ P0-4 FIX: Validate required fields BEFORE API call
    const missingFields = [];

    // Check company_country (can be ISO code or full name after conversion)
    const companyCountry = dataToUse?.company?.company_country ||
                          dataToUse?.company?.country ||
                          certificateData?.company_info?.exporter_country;

    if (!companyCountry) {
      missingFields.push('Company Country (required for Box 2 & 3)');
      console.error('❌ Missing company country. Workflow data:', {
        company: dataToUse?.company,
        certificate_data: certificateData?.company_info
      });
    }

    // Check company_name
    const companyName = dataToUse?.company?.company_name || dataToUse?.company?.name;

    if (!companyName) {
      missingFields.push('Company Name (required for Box 3)');
    }

    if (!authData?.signatory_name) {
      missingFields.push('Signatory Name (required for Box 12)');
    }
    if (!authData?.signatory_title) {
      missingFields.push('Signatory Title (required for Box 12)');
    }

    if (missingFields.length > 0) {
      const errorMessage = `❌ Certificate Generation Failed\n\nMissing required fields:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nPlease go back to the Company Information step and complete all required information.`;

      console.error('Certificate validation failed:', {
        missingFields,
        workflowData: workflowData?.company,
        authData
      });

      alert(errorMessage);
      return;
    }

    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_certificate',
          certificateData: {
            // ✅ FIX #4: Get certifier_type from authData (Step 4 selection), not from company object
            // authData.certifier_type is set when user selects IMPORTER/EXPORTER/PRODUCER in AuthorizationStep
            certifier_type: authData?.certifier_type || 'EXPORTER',
            company_info: {
              exporter_name: authData?.exporter_name || dataToUse?.company?.company_name || dataToUse?.company?.name || '',
              exporter_address: authData?.exporter_address || dataToUse?.company?.company_address || '',
              exporter_country: authData?.exporter_country || companyCountry,  // FIXED: Prefer authData, fallback to validated company country
              // ✅ FIX (Nov 4): Prefer authData.exporter_tax_id if available (user may have corrected it in AuthorizationStep)
              exporter_tax_id: authData?.exporter_tax_id || dataToUse?.company?.tax_id || '',
              exporter_phone: authData?.exporter_phone || dataToUse?.company?.contact_phone || '',
              exporter_email: authData?.exporter_email || dataToUse?.company?.contact_email || '',
              // ✅ FIX (Nov 4): Use authData.exporter_* fields when producer_same_as_exporter is true
              // This ensures producer gets the correct data even if dataToUse.company is incomplete
              producer_name: authData?.producer_same_as_exporter
                ? (authData?.exporter_name || dataToUse?.company?.company_name || dataToUse?.company?.name || '')
                : (authData.producer_name || ''),
              producer_address: authData?.producer_same_as_exporter
                ? (authData?.exporter_address || dataToUse?.company?.company_address || '')
                : (authData.producer_address || ''),
              producer_country: authData?.producer_same_as_exporter
                ? (authData?.exporter_country || dataToUse?.company?.company_country || '')
                : (authData.producer_country || ''),
              producer_tax_id: authData?.producer_same_as_exporter
                ? (authData?.exporter_tax_id || dataToUse?.company?.tax_id || '')
                : (authData.producer_tax_id || ''),
              producer_phone: authData?.producer_same_as_exporter
                ? (authData?.exporter_phone || dataToUse?.company?.contact_phone || '')
                : (authData.producer_phone || ''),
              producer_email: authData?.producer_same_as_exporter
                ? (authData?.exporter_email || dataToUse?.company?.contact_email || '')
                : (authData.producer_email || ''),
              importer_name: authData.importer_name || '',
              importer_address: authData.importer_address || '',
              importer_country: authData.importer_country || '',
              importer_tax_id: authData.importer_tax_id || '',
              importer_phone: authData.importer_phone || '',
              importer_email: authData.importer_email || ''
            },
            product_details: {
              hs_code: dataToUse?.product?.hs_code || certificateData?.analysis_results?.hs_code || '',
              product_description: dataToUse?.product?.description || '',
              commercial_description: dataToUse?.product?.description || '',
              manufacturing_location: dataToUse?.usmca?.manufacturing_location || certificateData?.analysis_results?.manufacturing_location || '',
              tariff_classification_verified: true,
              verification_source: 'Database-verified'
            },
            supply_chain: {
              manufacturing_location: certificateData?.analysis_results?.manufacturing_location || dataToUse?.product?.manufacturing_location || '',
              // ✅ FIX (Nov 9): Use dataToUse (from database) when certificateData.analysis_results doesn't exist
              regional_value_content: certificateData?.analysis_results?.regional_content || dataToUse?.usmca?.regional_content || dataToUse?.usmca?.north_american_content || 0,
              component_origins: certificateData?.analysis_results?.component_breakdown || dataToUse?.components || [],
              supply_chain_verified: true,
              qualified: (certificateData?.analysis_results?.qualification_status === 'QUALIFIED') || (dataToUse?.usmca?.qualification_status === 'QUALIFIED') || false,
              rule: dataToUse?.usmca?.rule,
              threshold_applied: dataToUse?.usmca?.threshold_applied,
              // ✅ FIX (Nov 6): Use new explicit certificate fields from analysisResults
              preference_criterion: certificateData?.analysis_results?.preference_criterion || certificateData?.analysis_results?.origin_criterion || dataToUse?.usmca?.preference_criterion || 'B',
              method_of_qualification: certificateData?.analysis_results?.qualification_method || dataToUse?.usmca?.qualification_method || 'RVC',
              // ✅ FIX (Nov 9): is_producer should be based on business_type (Manufacturer = YES)
              is_producer: dataToUse?.company?.business_type === 'Manufacturer' || certificateData?.analysis_results?.is_producer || false,
              country_of_origin: certificateData?.analysis_results?.country_of_origin || dataToUse?.destination_country || '',
              trust_score: certificateData?.analysis_results?.trust_score || dataToUse?.trust?.overall_score || 0,
              verification_status: dataToUse?.usmca?.verification_status
            },
            authorization: {
              signatory_name: authData.signatory_name || '',
              signatory_title: authData.signatory_title || '',
              signatory_email: authData.signatory_email || '',
              signatory_phone: authData.signatory_phone || '',
              signatory_date: new Date().toISOString(),
              declaration_accepted: authData.accuracy_certification && authData.authority_certification
            }
          }
        })
      });

      // 🔍 DEBUG: Log what authorization data we're sending
      console.log('🔍 [Certificate] Authorization data being sent to API:', {
        signatory_name: authData.signatory_name,
        signatory_title: authData.signatory_title,
        signatory_email: authData.signatory_email,
        signatory_phone: authData.signatory_phone
      });

      const result = await response.json();

      if (result.success) {
        console.log('Professional certificate generated:', result);

        // Use professional_certificate from response
        const cert = result.professional_certificate;

        // Save certificate to localStorage for alerts
        try {
          const completionData = {
            company: cert.exporter,
            product: cert.product,
            certificate: cert,
            completion_date: new Date().toISOString(),
            timestamp: Date.now(),
            trust: {
              overall_trust_score: cert.trust_verification?.overall_trust_score || null
            },
            usmca: {
              // ✅ FIX (Nov 4): Removed optimistic defaults - fail loudly if data is missing
              qualified: cert.usmca_analysis?.qualified ?? false,  // Use false instead of true
              regional_content: cert.usmca_analysis?.regional_content ?? 0,  // Use 0 instead of 100
              north_american_content: cert.usmca_analysis?.regional_content ?? 0,  // Use 0 instead of 100

              // ✅ FIX (Nov 6): Persist certificate fields 7-11 to localStorage
              preference_criterion: cert.preference_criterion || certificateData.analysis_results.preference_criterion || 'B',
              qualification_method: cert.qualification_method?.method || certificateData.analysis_results.qualification_method || 'RVC',
              manufacturing_location: cert.country_of_origin || certificateData.analysis_results.country_of_origin || '',
              is_producer: cert.producer_declaration?.is_producer ?? certificateData.analysis_results.is_producer ?? false
            }
          };

          // ✅ FIXED: Removed duplicate keys - only use usmca_workflow_results
          workflowStorage.setItem('usmca_workflow_results', JSON.stringify(completionData));

          console.log('🎯 Certificate saved to localStorage for alerts (with fields 7-11)');
        } catch (error) {
          console.error('Failed to save completion data:', error);
        }

        setPreviewData({
          ...preview,
          professional_certificate: cert
        });
        setShowPreview(true);

        console.log('✅ Certificate generated successfully');
        console.log('🔍 showPreview should now be TRUE - preview should display on same page');
        console.log('🔍 If you see navigation to alerts page, something else is triggering it');
      } else {
        throw new Error(result.error || 'Certificate generation failed');
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  // ✅ Removed old PDF functions (Oct 30, 2025):
  // - generatePDFFromCertificate (used old black/white PDF generator)
  // - handleDownloadCertificate (downloaded old PDF)
  // - handleViewCertificatePreview (previewed old PDF)
  // - handleEmailToImporter (emailed old PDF)
  // New blue/white editable certificate (EditableCertificatePreview) handles PDF download internally via html2pdf.js

  if (!workflowData) {
    return (
      <TriangleLayout>
        <div className="dashboard-container">
          <div className="form-section">
            <div className="dashboard-header">
              <h1 className="dashboard-title">USMCA Certificate Authorization</h1>
              <p className="text-body">Loading workflow data...</p>
            </div>
            <p className="text-body">Please complete the USMCA workflow first.</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="user-dashboard-page">
        <div className="dashboard-container">
          {/* Workflow Progress Indicator - Visual Only (Not Clickable) */}
          <WorkflowProgress
            currentStep={4}
            isStepClickable={false}
            onStepClick={(step) => {
              // Steps are never clickable - use Previous/Continue buttons for navigation
            }}
          />

          <div className="form-section">
            <div className="dashboard-header">
              <h1 className="dashboard-title">
                {showPreview ? '📋 Review Your Certificate' : '✍️ USMCA Certificate Authorization'}
              </h1>
              <p className="text-body">
                {showPreview
                  ? 'Review and edit all certificate details before downloading'
                  : 'Complete authorization details to proceed with certificate generation'
                }
              </p>
            </div>
          </div>

          <div>
            {/* STEP 1: Authorization Form - ALWAYS VISIBLE */}
            <AuthorizationStep
              formData={certificateData.authorization || {}}
              updateFormData={(field, value) => updateCertificateData('authorization', { [field]: value })}
              workflowData={workflowData}
              certificateData={certificateData}
              onPreviewCertificate={handlePreviewCertificate}
              // ✅ Removed old PDF props (Oct 30): onDownloadCertificate, onEmailToImporter, generatedPDF
              previewData={previewData}
              userTier={userTier}
              showPreview={showPreview}
            />

            {/* STEP 2: Editable Certificate Preview - Shows BELOW authorization form when ready */}
            {showPreview && previewData && (
              <div style={{ marginTop: '2rem' }}>
                <EditableCertificatePreview
                  previewData={previewData}
                  userTier={userTier}
                  onSave={async (editedCertificate) => {
                    // ✅ Update preview data with edits but KEEP preview visible
                    setPreviewData(prev => ({
                      ...prev,
                      professional_certificate: editedCertificate
                    }));

                    // ✅ TIER 2: Save to localStorage FIRST (immediate backup, no network dependency)
                    try {
                      const localStorageBackup = {
                        certificate: editedCertificate,
                        timestamp: new Date().toISOString(),
                        product_description: workflowData?.product?.description || workflowData?.product?.product_description,
                        hs_code: workflowData?.product?.hs_code || editedCertificate?.hs_classification?.code
                      };
                      workflowStorage.setItem('usmca_certificate_edits', JSON.stringify(localStorageBackup));
                      console.log('💾 ✅ Certificate edits saved to localStorage (backup)');
                    } catch (localStorageError) {
                      console.error('⚠️ localStorage save failed:', localStorageError);
                    }

                    // ✅ TIER 1: Save to database (permanent, cross-device)
                    try {
                      console.log('💾 Saving certificate edits to database...');

                      const savePayload = {
                        // Product description from workflow data (API has 3-strategy fallback)
                        product_description: workflowData?.product?.description ||
                                            workflowData?.product?.product_description,
                        hs_code: workflowData?.product?.hs_code ||
                                editedCertificate?.hs_classification?.code,
                        certificate_data: editedCertificate
                      };

                      console.log('💾 Database save payload:', JSON.stringify(savePayload, null, 2));

                      const response = await fetch('/api/workflow-session/update-certificate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(savePayload)
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error('❌ Database save failed:', errorData);
                        // Don't show alert - localStorage backup already saved
                        console.log('ℹ️ Certificate edits preserved in localStorage backup');
                      } else {
                        const result = await response.json();
                        console.log('✅ ✅ Certificate saved to database + localStorage - fully protected!');
                      }
                    } catch (error) {
                      console.error('❌ Database save error:', error);
                      console.log('ℹ️ Certificate edits preserved in localStorage backup');
                    }

                    // DO NOT close preview - user wants it to stay visible after download
                  }}
                  onCancel={() => setShowPreview(false)}
                />
              </div>
            )}
          </div>

          {/* Upgrade Modal for Trial Users */}
          {showUpgradeModal && (
            <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>🚀 Upgrade Required for Certificate Download</h2>
                  <button onClick={() => setShowUpgradeModal(false)} className="modal-close">×</button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <div className="alert-content">
                      <div className="alert-title">Free Trial - Preview Only</div>
                      <div className="text-body">
                        Your free trial allows you to preview the certificate with a watermark,
                        but downloading official certificates requires a paid subscription.
                      </div>
                    </div>
                  </div>

                  <p className="text-body">
                    Official USMCA certificates must be accepted by customs authorities.
                    Subscribe to download certificates that are valid for customs submissions
                    and backed by professional compliance verification.
                  </p>

                  <div style={{background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem'}}>
                    <h3 style={{marginTop: 0}}>Starter Plan - $99/mo</h3>
                    <ul style={{marginBottom: 0}}>
                      <li>✓ 10 USMCA analyses per month</li>
                      <li>✓ 10 components per analysis</li>
                      <li>✓ Full certificate download (no watermark)</li>
                      <li>✓ Email crisis alerts (high/critical)</li>
                      <li>✓ Valid for customs submissions</li>
                    </ul>
                  </div>

                  <div style={{background: '#ede9fe', padding: '1.5rem', borderRadius: '8px'}}>
                    <h3 style={{marginTop: 0}}>
                      Professional Plan - $299/mo
                      <span style={{background: '#8b5cf6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '0.875rem'}}>POPULAR</span>
                    </h3>
                    <ul style={{marginBottom: 0}}>
                      <li>✓ Unlimited USMCA analyses</li>
                      <li>✓ 25 components per analysis</li>
                      <li>✓ Full certificate download</li>
                      <li>✓ All email alerts</li>
                      <li>✓ 15% service discounts</li>
                      <li>✓ Priority support (48hr)</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => setShowUpgradeModal(false)} className="btn-secondary">
                    Close
                  </button>
                  <Link href="/pricing" className="btn-primary">
                    View Plans &amp; Upgrade
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TriangleLayout>
  );
}
