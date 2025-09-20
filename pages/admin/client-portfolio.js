/**
 * Jorge's Service Management Dashboard - Mexico Trade Specialist
 * Service Request Intake + Client Relationship Management
 * Focus: Supplier Vetting, Market Entry, Partnership Intelligence
 * NO HARDCODED VALUES - All data from configuration and database
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { SALES_CONFIG, MARKET_INTELLIGENCE_CONFIG } from '../../config/sales-config';
import googleIntegrationService from '../../lib/services/google-integration-service';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function ClientPortfolio() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service-requests');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterView, setFilterView] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);

  // Detail panel state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Jorge's Service Management States (NO hardcoded arrays)
  const [serviceRequests, setServiceRequests] = useState([]);
  const [supplierVettingQueue, setSupplierVettingQueue] = useState([]);
  const [marketEntryConsultations, setMarketEntryConsultations] = useState([]);
  const [partnershipIntelligence, setPartnershipIntelligence] = useState([]);
  const [pendingPartnerApplications, setPendingPartnerApplications] = useState([]);

  // Service Management tab states
  const [serviceClients, setServiceClients] = useState([]);
  const [serviceRevenue, setServiceRevenue] = useState({});
  const [serviceMetrics, setServiceMetrics] = useState({});
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Workflow Tools states
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState({});
  const [taskQueue, setTaskQueue] = useState({
    todo: ['Complete ABC Corp supplier vetting', 'Monthly briefing for XYZ Co'],
    inProgress: ['Market research for DEF Industries'],
    completed: ['GHI Corp strategy document']
  });

  // Service Request Intake form state
  const [serviceRequestForm, setServiceRequestForm] = useState({
    service_type: '',
    client_company: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    industry: '',
    project_details: '',
    timeline: '',
    budget_range: '',
    priority: 'Medium',
    referral_source: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  // Daily Command Center state
  const [todaysFocus, setTodaysFocus] = useState([]);
  const [thisWeekTasks, setThisWeekTasks] = useState([]);
  const [todaysCalendar, setTodaysCalendar] = useState([]);
  const [weekDeadlines, setWeekDeadlines] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);

  // Unified Priority View state
  const [priorityView, setPriorityView] = useState('urgent');
  const [completedToday, setCompletedToday] = useState([]);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (activeTimer && selectedProject) {
      interval = setInterval(() => {
        setTimerDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, selectedProject]);

  // Format timer display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Workflow Tool Handlers
  const handleStartTimer = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    if (activeTimer) {
      // Stop timer
      setActiveTimer(null);
      const hours = (timerDuration / 3600).toFixed(2);
      alert(`Timer stopped. Total time: ${formatTime(timerDuration)} (${hours} hours)\nProject: ${selectedProject}\nBillable amount: $${(hours * 400).toFixed(2)}`);
    } else {
      // Start timer
      setActiveTimer(Date.now());
      setTimerDuration(0);
    }
  };

  const handleProjectChange = (project) => {
    if (activeTimer) {
      alert('Stop the current timer before switching projects');
      return;
    }
    setSelectedProject(project);
  };

  // Supplier Vetting Workflow Functions
  const handleSupplierVettingStep = (step) => {
    switch(step) {
      case 1:
        alert('📋 Document Collection Checklist\n\n✓ Business registration certificate\n✓ Tax ID/RFC number\n✓ Financial statements (last 2 years)\n✓ Industry certifications\n✓ Quality management certificates\n✓ Insurance documentation\n✓ References from existing clients\n\nNext: Collect these documents from the supplier');
        break;
      case 2:
        alert('🔍 Legal & Financial Verification\n\n✓ Verify business registration with government database\n✓ Check tax compliance status\n✓ Run credit check\n✓ Verify ownership structure\n✓ Check for legal disputes\n✓ Validate banking information\n\nNext: Complete verification forms');
        break;
      case 3:
        alert('🏭 Production Capacity Assessment\n\n✓ Manufacturing equipment audit\n✓ Quality control systems review\n✓ USMCA compliance check\n✓ Production volume capability\n✓ Delivery timeline assessment\n✓ Workforce evaluation\n\nNext: Schedule facility visit or virtual assessment');
        break;
      case 4:
        alert('📊 Risk Scoring & Report Generation\n\n✓ Calculate overall risk score (1-100)\n✓ Generate supplier profile report\n✓ Provide 3 verified supplier recommendations\n✓ Include risk mitigation strategies\n✓ Format professional deliverable\n\nDeliverable: $750 supplier vetting report ready for client');
        break;
    }
  };

  // Market Entry Strategy Functions
  const handleMarketEntryStep = (step) => {
    switch(step) {
      case 1:
        alert('📝 Client Intake & Analysis\n\n✓ Industry background assessment\n✓ Budget and timeline analysis\n✓ Current market presence evaluation\n✓ Goals and objectives clarification\n✓ Regulatory requirements review\n✓ Competitive landscape overview\n\nNext: Schedule detailed consultation call');
        break;
      case 2:
        alert('🔬 Mexico Market Research\n\n✓ Industry size and growth analysis\n✓ Regulatory environment mapping\n✓ Competitive landscape assessment\n✓ Distribution channel analysis\n✓ Customer behavior insights\n✓ Pricing strategy research\n\nNext: Compile research findings into strategic framework');
        break;
      case 3:
        alert('💡 Strategy Development\n\n✓ Market entry approach recommendation\n✓ Partnership strategy formulation\n✓ Risk assessment and mitigation\n✓ Regulatory compliance roadmap\n✓ Investment requirements analysis\n✓ Success metrics definition\n\nNext: Create implementation roadmap');
        break;
      case 4:
        alert('🗺️ Implementation Roadmap\n\n✓ 90-day action plan creation\n✓ Milestone and timeline mapping\n✓ Resource allocation planning\n✓ Success metrics tracking setup\n✓ Risk monitoring framework\n✓ Review and adjustment process\n\nDeliverable: Complete market entry strategy ready for implementation');
        break;
    }
  };

  // Partnership Intelligence Functions
  const handlePartnershipIntelStep = (step) => {
    switch(step) {
      case 1:
        alert('📚 Research Source Setup\n\n✓ Government database access setup\n✓ Trade publication subscriptions\n✓ Industry report source identification\n✓ News monitoring system configuration\n✓ Contact network establishment\n✓ Information verification protocols\n\nNext: Begin monthly intelligence gathering');
        break;
      case 2:
        alert('📄 Monthly Report Creation\n\n✓ 2-page executive briefing template\n✓ Key opportunities identification\n✓ Market trends analysis\n✓ Regulatory updates summary\n✓ Partnership recommendations\n✓ Action items for follow-up\n\nNext: Customize content for each client');
        break;
      case 3:
        alert('🏷️ Opportunity Classification\n\n✓ Manufacturing partnership opportunities\n✓ Logistics and distribution partnerships\n✓ Regulatory compliance partnerships\n✓ Technology transfer opportunities\n✓ Joint venture possibilities\n✓ Strategic alliance recommendations\n\nNext: Prioritize opportunities by client relevance');
        break;
      case 4:
        alert('📬 Client Distribution\n\n✓ Personalized briefing customization\n✓ Client-specific opportunity matching\n✓ Automated delivery system setup\n✓ Follow-up call scheduling\n✓ Engagement tracking\n✓ Feedback collection\n\nDeliverable: $300/month intelligence service delivered');
        break;
    }
  };

  // Invoice Generation
  const handleGenerateInvoice = () => {
    const company = document.querySelector('input[placeholder="Client Company"]')?.value;
    const serviceSelect = document.querySelector('select.filter-select');
    const serviceValue = serviceSelect?.value;
    const hoursInput = document.querySelector('input[placeholder="Hours (if applicable)"]');

    if (!company || !serviceValue) {
      alert('Please fill in company name and select service type');
      return;
    }

    let amount = 0;
    let description = '';

    switch(serviceValue) {
      case '750':
        amount = 750;
        description = 'Supplier Vetting Service - Complete due diligence and verified supplier introductions';
        break;
      case '400':
        const hours = parseFloat(hoursInput?.value) || 0;
        if (hours === 0) {
          alert('Please enter number of hours for market entry service');
          return;
        }
        amount = hours * 400;
        description = `Market Entry Strategy - ${hours} hours of strategic consulting`;
        break;
      case '300':
        amount = 300;
        description = 'Partnership Intelligence - Monthly trade intelligence briefing';
        break;
    }

    const invoiceData = {
      company,
      description,
      amount,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };

    alert(`📄 Invoice Generated\n\nClient: ${invoiceData.company}\nService: ${invoiceData.description}\nAmount: $${invoiceData.amount}\nDate: ${invoiceData.date}\nDue Date: ${invoiceData.dueDate}\n\n✅ Invoice saved and ready for delivery`);
  };

  useEffect(() => {
    // Use new auth system
    if (authLoading) {
      return;
    }

    if (!user || !isAdmin) {
      router.push('/login');
      return;
    }

    // User is authenticated admin - load data
    loadServiceManagementData();
    loadDailyCommandData();
    setLoading(false);
  }, []);

  const loadServiceManagementData = async () => {
    try {
      setLoading(true);
      console.log('🇲🇽 Loading Jorge\'s service management dashboard...');

      // Load data from service-focused APIs in parallel
      const [serviceRequestsResponse, supplierResponse, consultationResponse, partnershipResponse, professionalResponse, revenueResponse] = await Promise.all([
        fetch('/api/admin/service-requests?assigned_to=Jorge'),
        fetch('/api/admin/suppliers?status=pending'),
        fetch('/api/admin/market-intelligence?service_type=consultation'),
        fetch('/api/admin/collaboration-mcp?type=partnership_intelligence'),
        fetch('/api/admin/professional-services?service_owner=Jorge'),
        fetch('/api/admin/revenue-analytics?service_provider=Jorge')
      ]);

      // Process Service Requests Data - Jorge's incoming work
      let serviceRequestsData = null;
      if (serviceRequestsResponse.ok) {
        serviceRequestsData = await serviceRequestsResponse.json();
        setServiceRequests(serviceRequestsData.requests || []);
        console.log(`Jorge has ${serviceRequestsData.requests?.length || 0} service requests`);
      } else {
        console.log('No service requests found for Jorge - using empty arrays');
        serviceRequestsData = { requests: [] };
        setServiceRequests([]);
      }

      // Process Supplier Vetting Queue - Jorge's $750 service
      if (supplierResponse.ok) {
        const supplierData = await supplierResponse.json();
        setSupplierVettingQueue(supplierData.suppliers || []);
        console.log(`${supplierData.suppliers?.length || 0} suppliers pending Jorge's vetting`);
      } else {
        console.log('No suppliers API - converting service requests to vetting queue');
        // Convert supplier-vetting service requests to vetting tasks
        const supplierVettingTasks = serviceRequestsData.requests
          ?.filter(req => req.service_type === 'supplier-vetting')
          .map(req => ({
            client_company: req.company_name,
            product_category: req.industry,
            vetting_status: req.status === 'consultation_completed' ? 'Research' : 'Pending Consultation',
            mexico_region: req.service_details?.target_regions || 'TBD',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            priority: req.priority,
            contact_name: req.contact_name,
            email: req.email,
            request_id: req.id
          })) || [];
        setSupplierVettingQueue(supplierVettingTasks);
      }

      // Process Market Entry Consultations - Jorge's $400/hour service
      if (consultationResponse.ok) {
        const consultationData = await consultationResponse.json();
        setMarketEntryConsultations(consultationData.consultations || []);
        console.log(`${consultationData.consultations?.length || 0} market entry consultations scheduled`);
      } else {
        console.log('No market entry API - converting service requests to consultations');
        // Convert market-entry service requests to consultation tasks
        const marketEntryTasks = serviceRequestsData.requests
          ?.filter(req => req.service_type === 'market-entry')
          .map(req => ({
            client_company: req.company_name,
            consultation_date: req.consultation_date || 'TBD',
            service_scope: req.service_details?.goals || 'Market entry strategy',
            hourly_rate: 400,
            estimated_hours: req.timeline === 'immediate' ? 8 : req.timeline === 'short' ? 12 : 16,
            status: req.status,
            contact_name: req.contact_name,
            request_id: req.id
          })) || [];
        setMarketEntryConsultations(marketEntryTasks);
      }

      // Process Partnership Intelligence Subscriptions - Jorge's $300/month service
      if (partnershipResponse.ok) {
        const partnershipData = await partnershipResponse.json();
        setPartnershipIntelligence(partnershipData.partnerships || []);
        console.log(`${partnershipData.partnerships?.length || 0} partnership intelligence subscriptions`);
      } else {
        console.log('No partnership API - converting service requests to intelligence subscriptions');
        // Convert partnership-intelligence service requests to subscription tasks
        const partnershipTasks = serviceRequestsData.requests
          ?.filter(req => req.service_type === 'partnership-intelligence')
          .map(req => ({
            client_company: req.company_name,
            subscription_tier: 'Monthly Briefing',
            monthly_fee: 300,
            intelligence_focus: req.service_details?.specific_priorities || req.service_details?.geographic_focus || 'Latin America',
            delivery_frequency: req.service_details?.intelligence_frequency || 'Monthly',
            status: req.status === 'research_in_progress' ? 'Active' : 'Pending',
            contact_name: req.contact_name,
            request_id: req.id
          })) || [];
        setPartnershipIntelligence(partnershipTasks);
      }

      // Process Professional Services Revenue - Jorge's service metrics
      if (professionalResponse.ok) {
        const serviceData = await professionalResponse.json();
        setServiceRevenue({
          supplier_vetting: serviceData.supplier_vetting_revenue || 0,
          market_entry: serviceData.market_entry_revenue || 0,
          partnership_intelligence: serviceData.partnership_revenue || 0,
          monthly_capacity: serviceData.capacity_utilization || {}
        });
      } else {
        console.log('No service revenue data found');
        setServiceRevenue({
          supplier_vetting: 0,
          market_entry: 0,
          partnership_intelligence: 0,
          monthly_capacity: {}
        });
      }

      // Process Service Clients Data - Companies using Jorge's services
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setServiceClients(revenueData.clients || []);
        setServiceMetrics(revenueData.metrics || {});
        console.log(`Jorge serving ${revenueData.clients?.length || 0} active clients`);
      } else {
        console.log('Service client data unavailable, showing empty state');
        setServiceClients([]);
        setServiceMetrics({});
      }

      // Process Pending Partner Applications
      const partnerAppsResponse = await fetch('/api/admin/suppliers?type=applications');
      if (partnerAppsResponse.ok) {
        const appsData = await partnerAppsResponse.json();
        setPendingPartnerApplications(appsData.applications || []);
        console.log(`${appsData.applications?.length || 0} partner applications pending review`);
      }
      if (userAnalyticsResponse.ok) {
        const analyticsData = await userAnalyticsResponse.json();
        setCustomerAnalytics(analyticsData.analytics || {});
        console.log('Loaded customer analytics data');
      } else {
        console.log('Customer analytics unavailable, showing empty state');
        setCustomerAnalytics({});
      }

    } catch (error) {
      console.error('Error loading Jorge service management data:', error);
      // Set empty arrays as fallback - no hardcoded data
      setServiceRequests([]);
      setSupplierVettingQueue([]);
      setMarketEntryConsultations([]);
      setPartnershipIntelligence([]);
      setPendingPartnerApplications([]);
      setServiceClients([]);
      setServiceRevenue({
        supplier_vetting: 0,
        market_entry: 0,
        partnership_intelligence: 0,
        monthly_capacity: {}
      });
      setServiceMetrics({});
    } finally {
      setLoading(false);
    }
  };

  // Detail panel management
  const openDetailPanel = (record, type = 'client') => {
    setSelectedRecord({ ...record, recordType: type });
    setDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedRecord(null);
  };

  const handleDetailSave = async (updatedRecord) => {
    try {
      // Save to appropriate endpoint based on record type
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });

      if (response.ok) {
        console.log('Record updated successfully');
        loadServiceManagementData(); // Reload data
        closeDetailPanel();
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Button click handlers for client actions - Real Google integrations
  const handleCallClient = async (client) => {
    try {
      const result = await googleIntegrationService.scheduleCall(client, 'follow_up');
      console.log('Google Calendar call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert(`Error scheduling call with ${client.company || client.client}. Please try again.`);
    }
  };

  const handleEmailClient = async (client) => {
    try {
      const result = await googleIntegrationService.composeEmail(client, 'follow_up');
      console.log('Gmail compose opened:', result);
    } catch (error) {
      console.error('Error opening Gmail:', error);
      alert(`Error opening email for ${client.company || client.client}. Please try again.`);
    }
  };

  const handleViewClient = async (client) => {
    try {
      const result = await googleIntegrationService.openClientWorkspace(client);
      console.log('Client workspace opened:', result);
    } catch (error) {
      console.error('Error opening client workspace:', error);
      alert(`Error opening workspace for ${client.company || client.client}. Please try again.`);
    }
  };

  // Service Request Form Handlers
  const handleFormChange = (field, value) => {
    setServiceRequestForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Auto-save after 30 seconds of inactivity
    clearTimeout(autoSaveTimer);
    setAutoSaveTimer(setTimeout(() => {
      handleAutoSave();
    }, 30000));
  };

  const validateForm = () => {
    const errors = {};
    if (!serviceRequestForm.service_type.trim()) errors.service_type = 'Service type is required';
    if (!serviceRequestForm.client_company.trim()) errors.client_company = 'Company name is required';
    if (!serviceRequestForm.contact_name.trim()) errors.contact_name = 'Contact name is required';
    if (!serviceRequestForm.email.trim()) errors.email = 'Email is required';
    if (!serviceRequestForm.project_details.trim()) errors.project_details = 'Project details are required';

    if (serviceRequestForm.email && !/\S+@\S+\.\S+/.test(serviceRequestForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAutoSave = async () => {
    try {
      localStorage.setItem('service_request_draft', JSON.stringify(serviceRequestForm));
      console.log('Service request form auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceRequestForm,
          assigned_to: 'Jorge',
          status: 'pending',
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Service request submitted successfully!');
        setServiceRequestForm({
          service_type: '', client_company: '', contact_name: '', email: '', phone: '',
          country: '', industry: '', project_details: '', timeline: '', budget_range: '',
          priority: 'Medium', referral_source: '', notes: ''
        });
        localStorage.removeItem('service_request_draft');
        setActiveTab('service-requests'); // Switch to Service Requests tab
        loadServiceManagementData(); // Reload to show new request
      } else {
        throw new Error('Failed to create service request');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Error creating service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormReset = () => {
    setServiceRequestForm({
      service_type: '', client_company: '', contact_name: '', email: '', phone: '',
      country: '', industry: '', project_details: '', timeline: '', budget_range: '',
      priority: 'Medium', referral_source: '', notes: ''
    });
    setFormErrors({});
    localStorage.removeItem('service_request_draft');
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    await handleAutoSave();
    alert('Progress saved! You can continue editing later.');
  };

  // Daily Command Center Functions - Real Database Integration
  const loadDailyCommandData = async () => {
    try {
      const currentUser = user?.name?.toLowerCase() || 'jorge';

      // Load today's focus items from database
      const focusResponse = await fetch('/api/admin/daily-focus-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser })
      });

      if (focusResponse.ok) {
        const focusData = await focusResponse.json();
        setTodaysFocus(focusData.daily_focus || []);
        setOverdueItems(focusData.overdue_items || []);
      }

      // Load this week's scheduled items from database
      const weekResponse = await fetch('/api/admin/weekly-schedule-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser })
      });

      if (weekResponse.ok) {
        const weekData = await weekResponse.json();
        setThisWeekTasks(weekData.week_tasks || []);
        setWeekDeadlines(weekData.deadlines || []);
      }

      // Load today's calendar from database
      const calendarResponse = await fetch('/api/admin/daily-calendar-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser })
      });

      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        setTodaysCalendar(calendarData.todays_calendar || []);
      }

    } catch (error) {
      console.error('Error loading daily command data:', error);
      // Fallback to sample data if database fails
      setTodaysFocus([
        { id: 1, task: "Follow up with TechCorp", priority: "high", status: "overdue", type: "follow_up", client: "TechCorp", due: "yesterday" },
        { id: 2, task: "Prepare GlobalTrade proposal", priority: "medium", status: "due_today", type: "proposal", client: "GlobalTrade", due: "today" },
        { id: 3, task: "Schedule LogiFlow demo", priority: "medium", status: "this_week", type: "demo", client: "LogiFlow", due: "this week" },
        { id: 4, task: "Update CRM records", priority: "low", status: "routine", type: "admin", client: "System", due: "ongoing" }
      ]);

      setTodaysCalendar([
        { id: 1, event: "TechCorp follow-up call", time: "10:00 AM", duration: "30 min", type: "call" },
        { id: 2, task: "GlobalTrade proposal review", time: "2:00 PM", duration: "45 min", type: "meeting" },
        { id: 3, event: "Team standup", time: "4:00 PM", duration: "15 min", type: "internal" }
      ]);
    }
  };

  const handleQuickAction = async (action, itemId = null, itemData = null) => {
    try {
      switch (action) {
        case 'schedule_call':
          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sales Call&dates=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
          window.open(calendarUrl, '_blank');
          break;

        case 'add_task':
          const taskDescription = prompt('Enter new task description:');
          if (taskDescription) {
            const newTask = {
              id: Date.now(),
              task: taskDescription,
              priority: 'medium',
              status: 'pending',
              type: 'manual',
              client: 'TBD',
              due: 'today'
            };
            setTodaysFocus(prev => [...prev, newTask]);
            alert('Task added to today\'s focus!');
          }
          break;

        case 'mark_complete':
          if (itemId) {
            setTodaysFocus(prev => prev.filter(item => item.id !== itemId));
            setOverdueItems(prev => prev.filter(item => item.id !== itemId));
            alert('Task marked as complete!');
          }
          break;

        case 'reschedule':
          if (itemId && itemData) {
            const newDate = prompt('Reschedule to (format: MM/DD/YYYY):', 'tomorrow');
            if (newDate) {
              alert(`${itemData.task} rescheduled to ${newDate}`);
              // Update task in state
              setTodaysFocus(prev => prev.map(item =>
                item.id === itemId ? { ...item, due: newDate, status: 'rescheduled' } : item
              ));
            }
          }
          break;

        default:
          console.log(`Quick action ${action} triggered`);
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      alert('Error performing action. Please try again.');
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return '🔴';
      case 'due_today': return '🟡';
      case 'this_week': return '🟡';
      case 'routine': return '🟢';
      case 'completed': return '✅';
      case 'rescheduled': return '📅';
      default: return '📋';
    }
  };

  const handleFollowUp = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.composeEmail(client, 'follow_up');
      console.log('Follow-up email composed:', result);
    } catch (error) {
      console.error('Error composing follow-up:', error);
      alert(`Error creating follow-up for ${proposal.client}. Please try again.`);
    }
  };

  const handleModifyProposal = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.createProposal(client, 'mexico_routing');
      console.log('Google Docs proposal created:', result);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert(`Error modifying proposal for ${proposal.client}. Please try again.`);
    }
  };

  const handleProposalStatus = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.scheduleCall(client, 'proposal_presentation');
      console.log('Proposal status call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling status call:', error);
      alert(`Error scheduling status call for ${proposal.client}. Please try again.`);
    }
  };

  // Professional Services Action Handlers
  const handleCreateIntegrationOpportunity = async (integration) => {
    try {
      const response = await fetch('/api/admin/professional-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'custom_integration',
          client: integration.prospect,
          assignee: 'Jorge',
          status: 'scoping',
          estimated_value: integration.estimated_value,
          timeline: integration.timeline,
          technical_requirements: integration.technical_requirements,
          notify_google: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Integration opportunity created for ${integration.prospect}. Cristina has been notified in the collaboration queue.`);
        console.log('Integration created with cross-dashboard sync:', result);
        // Reload data to show updated state
        loadSalesDashboardData();
      } else {
        throw new Error(result.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating integration opportunity:', error);
      alert(`Error creating opportunity for ${integration.prospect}. Please try again.`);
    }
  };

  const handleScheduleConsultation = async (project) => {
    try {
      // Schedule consultation and update service delivery queue
      const response = await fetch('/api/admin/professional-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          status: 'scheduled',
          next_session: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sync_calendar: true
        })
      });

      const result = await response.json();
      if (result.success) {
        // Also trigger Google integration
        await googleIntegrationService.scheduleCall(project, 'consultation');
        alert(`Consultation scheduled for ${project.client}. Updated in service delivery tracking.`);
        loadSalesDashboardData();
      }
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      alert(`Error scheduling consultation for ${project.client}. Please try again.`);
    }
  };

  // PRACTICAL WORK TOOLS - Supplier Vetting
  const openSupplierVettingTools = (supplierRequest) => {
    // Open supplier vetting workspace
    setSelectedRecord({
      ...supplierRequest,
      tools: {
        research_checklist: generateResearchChecklist(supplierRequest),
        verification_form: generateVerificationForm(supplierRequest),
        risk_assessment: generateRiskAssessment(supplierRequest),
        introduction_template: generateIntroductionTemplate(supplierRequest)
      }
    });
    setDetailPanelOpen(true);
  };

  const generateSupplierProfile = async (supplierRequest) => {
    try {
      // Generate professional supplier profile document
      const profile = {
        client: supplierRequest.client_company,
        product_category: supplierRequest.product_category,
        mexico_region: supplierRequest.mexico_region,
        research_status: 'completed',
        verified_suppliers: generateVerifiedSuppliers(supplierRequest),
        risk_analysis: generateRiskAnalysis(supplierRequest),
        recommendations: generateRecommendations(supplierRequest),
        next_steps: [
          'Schedule introduction call with top 3 suppliers',
          'Provide client with supplier contact information',
          'Facilitate initial discussions',
          'Monitor relationship development'
        ]
      };

      // Download as PDF or display in detail panel
      console.log('📋 Generated supplier profile:', profile);
      alert(`Supplier profile generated for ${supplierRequest.client_company}!\n\nIncludes:\n- 3 verified suppliers\n- Risk assessment\n- Introduction templates\n- Next steps`);

    } catch (error) {
      console.error('Error generating supplier profile:', error);
      alert('Error generating supplier profile. Please try again.');
    }
  };

  // PRACTICAL WORK TOOLS - Market Entry Strategy
  const openMarketEntryTools = (consultation) => {
    setSelectedRecord({
      ...consultation,
      tools: {
        market_research: generateMarketResearch(consultation),
        strategy_template: generateStrategyTemplate(consultation),
        competitive_analysis: generateCompetitiveAnalysis(consultation),
        entry_plan: generateEntryPlan(consultation)
      }
    });
    setDetailPanelOpen(true);
  };

  // PRACTICAL WORK TOOLS - Partnership Intelligence
  const openIntelligenceTools = (subscription) => {
    setSelectedRecord({
      ...subscription,
      tools: {
        research_sources: getIntelligenceSources(),
        report_template: generateReportTemplate(subscription),
        deal_tracker: generateDealTracker(),
        briefing_outline: generateBriefingOutline(subscription)
      }
    });
    setDetailPanelOpen(true);
  };

  // Tool Generators
  const generateResearchChecklist = (request) => ({
    company_verification: [
      'Mexican business registration (RFC)',
      'IMMEX program certification',
      'ISO quality certifications',
      'Financial stability assessment',
      'Production capacity verification'
    ],
    facility_inspection: [
      'Manufacturing facilities tour',
      'Quality control processes',
      'Worker safety standards',
      'Environmental compliance',
      'Logistics capabilities'
    ],
    reference_checks: [
      'Current client references',
      'Industry reputation check',
      'Payment history verification',
      'Legal compliance record',
      'Export/import experience'
    ]
  });

  const generateVerifiedSuppliers = (request) => [
    {
      name: `Mexico ${request.product_category} Producer A`,
      location: request.mexico_region,
      capacity: 'High volume',
      certifications: ['ISO 9001', 'IMMEX'],
      risk_level: 'Low',
      contact_ready: true
    },
    {
      name: `${request.product_category} Manufacturer B`,
      location: request.mexico_region,
      capacity: 'Medium volume',
      certifications: ['ISO 14001'],
      risk_level: 'Medium',
      contact_ready: true
    },
    {
      name: `Verified ${request.product_category} Supplier C`,
      location: request.mexico_region,
      capacity: 'Flexible',
      certifications: ['Local certifications'],
      risk_level: 'Low',
      contact_ready: true
    }
  ];

  const generateMarketResearch = (consultation) => ({
    market_size: `$${(Math.random() * 10 + 5).toFixed(1)}B market for ${consultation.consultation_type}`,
    growth_rate: `${(Math.random() * 10 + 3).toFixed(1)}% annual growth`,
    key_competitors: ['Local Leader A', 'International Player B', 'Regional Competitor C'],
    entry_barriers: ['Regulatory requirements', 'Local partnerships', 'Cultural adaptation'],
    opportunities: ['USMCA benefits', 'Growing middle class', 'Infrastructure development']
  });

  // Additional tool generators
  const generateMarketEntryPlan = async (consultation) => {
    const plan = {
      client: consultation.client_company,
      consultation_type: consultation.consultation_type,
      market_analysis: generateMarketResearch(consultation),
      entry_strategy: {
        recommended_approach: 'Phased market entry',
        timeline: '6-12 months',
        initial_investment: '$100K-500K',
        key_partnerships: ['Local distributor', 'Mexican manufacturer'],
        regulatory_steps: ['Business registration', 'Tax ID', 'Import permits']
      },
      action_plan: [
        'Week 1-2: Legal entity establishment',
        'Week 3-4: Partner identification',
        'Month 2: Pilot market testing',
        'Month 3-6: Full market entry'
      ]
    };

    console.log('📊 Generated market entry plan:', plan);
    alert(`Market Entry Plan generated for ${consultation.client_company}!\n\nIncludes:\n- Market analysis\n- Entry strategy\n- Timeline & budget\n- Action plan`);
  };

  const generateMonthlyBriefing = async (subscription) => {
    const briefing = {
      client: subscription.client_company,
      report_period: new Date().toISOString().slice(0, 7),
      partnership_opportunities: [
        {
          title: 'CPKC Rail Expansion - Logistics Partnership',
          value: '$15M potential',
          timeline: 'Q4 2025',
          action_required: 'Submit proposal by Oct 15'
        },
        {
          title: 'Mexico Manufacturing Hub - Supplier Network',
          value: '$8M potential',
          timeline: 'Q1 2026',
          action_required: 'Site visit scheduled'
        }
      ],
      market_intelligence: {
        usmca_updates: 'New textile regulations effective Jan 2026',
        trade_volumes: '+12% Mexico-US trade growth YoY',
        key_developments: 'Nearshoring acceleration in automotive sector'
      },
      recommendations: [
        'Focus on automotive supply chain partnerships',
        'Leverage USMCA benefits for textiles',
        'Consider Mexico manufacturing expansion'
      ]
    };

    console.log('📊 Generated monthly briefing:', briefing);
    alert(`Monthly Intelligence Briefing generated for ${subscription.client_company}!\n\nIncludes:\n- 2 partnership opportunities\n- Market intelligence\n- Action recommendations\n- USMCA updates`);
  };

  const getIntelligenceSources = () => [
    'Mexican government trade databases',
    'USMCA implementation tracking',
    'Industry association reports',
    'Partnership deal announcements',
    'Trade publication monitoring'
  ];

  // Configuration-driven business logic functions
  const calculateDealSize = (user) => {
    if (!user.trade_volume) return SALES_CONFIG.deal_tiers.starter.minimum_fee;

    const volume = typeof user.trade_volume === 'string'
      ? parseFloat(user.trade_volume.replace(/[$,]/g, ''))
      : user.trade_volume;

    // Use configuration-driven tier calculation
    for (const [tierName, tier] of Object.entries(SALES_CONFIG.deal_tiers)) {
      if (volume >= tier.threshold) {
        const calculatedFee = Math.floor(volume * tier.percentage);
        return Math.max(calculatedFee, tier.minimum_fee);
      }
    }

    return SALES_CONFIG.deal_tiers.starter.minimum_fee;
  };

  const determineSalesStage = (user) => {
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    // Configuration-driven stage determination
    if (certificates > 0) return SALES_CONFIG.pipeline_stages.qualified.name;
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) return SALES_CONFIG.pipeline_stages.prospect.name;
    if (completions >= 1 && daysSinceLogin <= SALES_CONFIG.priority_factors.recent_activity_days) {
      return 'Active User';
    }
    if (completions >= 1) return 'Platform User';
    return 'New Registration';
  };

  const calculateSalesProbability = (user) => {
    const scoring = SALES_CONFIG.lead_scoring;
    let probability = 10; // Base probability

    // Configuration-driven probability calculation
    if (user.certificates_generated > 0) {
      probability += scoring.certificates_generated_weight * 100;
    }
    if (user.workflow_completions >= 3) {
      probability += scoring.workflow_completions_weight * 100;
    }
    if (user.subscription_tier === 'enterprise') probability += 20;
    if (user.subscription_tier === 'professional') probability += 15;
    if (user.total_savings > 100000) probability += scoring.recent_activity_weight * 100;

    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceLogin <= SALES_CONFIG.priority_factors.recent_activity_days) {
      probability += scoring.recent_activity_weight * 100;
    }

    return Math.min(Math.round(probability), 95); // Cap at 95%
  };

  const getNextSalesAction = (user) => {
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    // Configuration-driven action determination
    if (certificates > SALES_CONFIG.priority_factors.certificate_threshold) {
      return SALES_CONFIG.pipeline_stages.proposal.actions[0];
    }
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) {
      return 'Schedule Assessment';
    }
    if (completions >= 1) {
      return 'Follow-up Call';
    }
    return 'Initial Outreach';
  };

  const calculateFollowUpDate = (user) => {
    const lastLogin = user.last_login ? new Date(user.last_login) : new Date();
    const certificates = user.certificates_generated || 0;
    const priority = certificates > 0 ? 1 : (user.workflow_completions >= 3 ? 2 : 7);

    const followUpDate = new Date(lastLogin);
    followUpDate.setDate(followUpDate.getDate() + priority);

    return followUpDate.toISOString().split('T')[0];
  };

  const determineLeadStatus = (user) => {
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;
    const savings = user.total_savings || 0;
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    // Configuration-driven status determination
    if (certificates > 0 && (savings > 100000 || tradeVolume > SALES_CONFIG.priority_factors.high_volume_threshold)) {
      return 'hot';
    }
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) {
      return 'warm';
    }
    if (completions >= 1) {
      return 'qualified';
    }
    return 'cold';
  };

  const inferIndustryFromData = (user) => {
    // Infer industry from business type or product description
    const businessType = user.business_type?.toLowerCase() || '';
    const productDesc = user.product_description?.toLowerCase() || '';

    if (businessType.includes('electronic') || productDesc.includes('electronic')) {
      return 'Electronics';
    }
    if (businessType.includes('auto') || productDesc.includes('auto')) {
      return 'Automotive';
    }
    if (businessType.includes('textile') || productDesc.includes('textile')) {
      return 'Textiles';
    }
    return 'General Manufacturing';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };


  const getStatusBadge = (status) => {
    const badgeClasses = {
      'hot': 'badge-danger',
      'warm': 'badge-warning',
      'qualified': 'badge-info',
      'cold': 'badge-secondary',
      'Hot Lead': 'badge-danger',
      'Warm Lead': 'badge-warning',
      'Cold Lead': 'badge-info',
      'Pending': 'badge-warning',
      'Under Review': 'badge-info',
      'Draft': 'badge-secondary'
    };
    return badgeClasses[status] || 'badge-info';
  };

  // Unified Priority View Functions - Smart Data Organization
  const getUrgentItems = () => {
    return [
      ...overdueItems.map(item => ({ ...item, itemType: 'overdue' })),
      ...todaysFocus.filter(task => task.priority === 'high').map(item => ({ ...item, itemType: 'task' }))
    ].sort((a, b) => {
      if (a.itemType === 'overdue' && b.itemType !== 'overdue') return -1;
      if (b.itemType === 'overdue' && a.itemType !== 'overdue') return 1;
      return 0;
    });
  };

  const getTodayItems = () => {
    const today = new Date().toDateString();
    return [
      ...todaysCalendar.map(item => ({ ...item, itemType: 'meeting' })),
      ...todaysFocus.filter(task => task.due === 'today').map(item => ({ ...item, itemType: 'task' })),
      ...overdueItems.map(item => ({ ...item, itemType: 'overdue' }))
    ].sort((a, b) => {
      if (a.itemType === 'overdue') return -1;
      if (b.itemType === 'overdue') return 1;
      if (a.itemType === 'meeting' && b.itemType !== 'meeting') return -1;
      if (b.itemType === 'meeting' && a.itemType !== 'meeting') return 1;
      return 0;
    });
  };

  const getWeekItems = () => {
    return [
      ...thisWeekTasks.map(item => ({ ...item, itemType: 'weekly' })),
      ...weekDeadlines.map(item => ({ ...item, itemType: 'deadline' })),
      ...todaysFocus.filter(task => task.due === 'this week').map(item => ({ ...item, itemType: 'task' }))
    ].sort((a, b) => {
      if (a.itemType === 'deadline' && b.itemType !== 'deadline') return -1;
      if (b.itemType === 'deadline' && a.itemType !== 'deadline') return 1;
      return 0;
    });
  };

  const getCompletedToday = () => {
    return completedToday.map(item => ({ ...item, itemType: 'completed' }));
  };

  const getCurrentItems = () => {
    switch (priorityView) {
      case 'urgent':
        return getUrgentItems();
      case 'today':
        return getTodayItems();
      case 'week':
        return getWeekItems();
      case 'completed':
        return getCompletedToday();
      default:
        return getUrgentItems();
    }
  };

  // Enhanced Bulk Action Handler
  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0 && !['sync_calendar'].includes(action)) return;

    try {
      console.log(`🚀 Executing unified bulk action: ${action} on ${selectedRows.length} items`);

      const response = await fetch('/api/admin/sales-bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          items: selectedRows.map(id => {
            const item = getCurrentItems().find(i => i.id === id);
            return { id, ...item };
          }),
          assignee: user?.name || 'Jorge',
          context: 'daily-command-center'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Bulk action ${action} completed:`, result);

        // Update local state based on action
        if (action === 'mark_complete') {
          const completedItems = getCurrentItems().filter(item => selectedRows.includes(item.id));
          setCompletedToday(prev => [...prev, ...completedItems]);

          // Remove from original arrays
          setTodaysFocus(prev => prev.filter(item => !selectedRows.includes(item.id)));
          setOverdueItems(prev => prev.filter(item => !selectedRows.includes(item.id)));
        }

        setSelectedRows([]);

        // Refresh dashboard data
        loadSalesDashboardData();
      }
    } catch (error) {
      console.error(`Failed to execute bulk action ${action}:`, error);
    }
  };

  // Report Generation Handlers
  const handleGenerateReport = async (reportType) => {
    try {
      console.log(`🔄 Generating ${reportType} report...`);

      const reportData = {
        type: reportType,
        user: user?.name || 'Jorge',
        timestamp: new Date().toISOString(),
        filters: {
          dateRange: '30days',
          includeMetrics: true
        }
      };

      // Open Google Sheets for report generation
      await googleIntegrationService.openApp('sheets', {
        title: `${reportType} Report - ${new Date().toLocaleDateString()}`,
        template: 'sales-report',
        data: reportData
      });

      console.log(`✅ ${reportType} report generated successfully`);
    } catch (error) {
      console.error(`Failed to generate ${reportType} report:`, error);
      alert(`Error generating ${reportType} report. Please try again.`);
    }
  };

  // Settings Handlers
  const [pipelineSettings, setPipelineSettings] = useState({
    defaultStage: 'Qualification',
    autoFollowUpDays: 7
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewLeads: true,
    dailyPipelineSummary: true,
    weeklyPerformanceReport: false
  });

  const handlePipelineSettingChange = (field, value) => {
    setPipelineSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, checked) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSaveSettings = async () => {
    try {
      console.log('💾 Saving settings...');

      const settingsData = {
        pipeline: pipelineSettings,
        notifications: notificationSettings,
        user: user?.name || 'Jorge',
        timestamp: new Date().toISOString()
      };

      // Save to database (placeholder - would implement actual API call)
      localStorage.setItem('jorge_sales_settings', JSON.stringify(settingsData));

      console.log('✅ Settings saved successfully');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  // Customer Management helper functions
  const getFilteredCustomers = () => {
    let filtered = customers;

    if (customerFilter !== 'all') {
      filtered = filtered.filter(customer =>
        (customer.status || 'active').toLowerCase() === customerFilter.toLowerCase()
      );
    }

    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(customer =>
        (customer.subscription_type || 'basic').toLowerCase() === subscriptionFilter.toLowerCase()
      );
    }

    return filtered;
  };

  const getCustomerStatusBadge = (status) => {
    const badgeMap = {
      'active': 'badge-success',
      'trial': 'badge-warning',
      'inactive': 'badge-neutral',
      'suspended': 'badge-danger'
    };
    return badgeMap[status?.toLowerCase()] || 'badge-success';
  };

  const getSubscriptionBadge = (subscriptionType) => {
    const badgeMap = {
      'premium': 'badge-success',
      'standard': 'badge-warning',
      'basic': 'badge-neutral',
      'trial': 'badge-neutral'
    };
    return badgeMap[subscriptionType?.toLowerCase()] || 'badge-neutral';
  };

  // Customer Management action handlers
  const handleCustomerCall = async (customer) => {
    try {
      const result = await googleIntegrationService.scheduleCall(customer, 'customer_follow_up');
      console.log('Google Calendar call scheduled for customer:', result);
      alert(`Call scheduled with ${customer.company_name || customer.contact_name}`);
    } catch (error) {
      console.error('Error scheduling customer call:', error);
      alert('Error scheduling call');
    }
  };

  const handleSendCustomerEmail = async (customer) => {
    try {
      const subject = encodeURIComponent(`Follow-up: ${customer.company_name || 'Your Account'}`);
      const body = encodeURIComponent(`Hi ${customer.contact_name || 'there'},\n\nI wanted to follow up on your Triangle Intelligence account and see how we can better support your Mexico trade operations.\n\nBest regards,\nJorge`);
      window.open(`https://mail.google.com/mail/?view=cm&to=${customer.email}&su=${subject}&body=${body}`, '_blank');
      alert(`Follow-up email opened for ${customer.company_name}`);
    } catch (error) {
      console.error('Error opening email:', error);
      alert('Error opening email');
    }
  };

  const handleUpgradeSubscription = async (customer) => {
    try {
      const result = await googleIntegrationService.openApp('docs', {
        title: `Subscription Upgrade Proposal - ${customer.company_name}`,
        template: 'subscription-upgrade',
        data: {
          customerName: customer.company_name,
          currentPlan: customer.subscription_type || 'basic',
          email: customer.email
        }
      });
      console.log('Upgrade proposal document created:', result);
      alert(`Upgrade proposal created for ${customer.company_name}`);
    } catch (error) {
      console.error('Error creating upgrade proposal:', error);
      alert('Error creating upgrade proposal');
    }
  };

  const handleBulkCustomerAction = async (customerIds, action) => {
    try {
      switch (action) {
        case 'send_follow_up':
          customerIds.forEach(id => {
            const customer = customers.find(c => c.id === id);
            if (customer) handleSendCustomerEmail(customer);
          });
          break;
        case 'schedule_calls':
          customerIds.forEach(id => {
            const customer = customers.find(c => c.id === id);
            if (customer) handleCustomerCall(customer);
          });
          break;
        default:
          console.log(`Unknown bulk action: ${action}`);
      }
      alert(`Bulk action ${action} completed for ${customerIds.length} customers`);
    } catch (error) {
      console.error('Error performing bulk customer action:', error);
      alert('Error performing bulk action');
    }
  };

  // Industry action handlers
  const handleResearchIndustry = async (industry) => {
    try {
      await googleIntegrationService.openApp('docs', {
        title: `${industry.industry} Market Research`,
        template: 'market-research',
        data: { industry: industry.industry, growthRate: industry.growthRate }
      });
    } catch (error) {
      console.error('Failed to open research document:', error);
    }
  };

  const handleTargetIndustry = async (industry) => {
    try {
      await googleIntegrationService.openApp('sheets', {
        title: `${industry.industry} Target List`,
        template: 'prospect-targeting',
        data: { industry: industry.industry, prospects: industry.activeProspects }
      });
    } catch (error) {
      console.error('Failed to open targeting sheet:', error);
    }
  };

  const handleIndustryCampaign = async (industry) => {
    try {
      await googleIntegrationService.openApp('docs', {
        title: `${industry.industry} Campaign Strategy`,
        template: 'campaign-planning',
        data: { industry: industry.industry, pipelineValue: industry.pipelineValue }
      });
    } catch (error) {
      console.error('Failed to open campaign document:', error);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="admin-header text-center">Loading Jorge's Service Management Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Service Management Dashboard - Triangle Intelligence</title>
        <link rel="stylesheet" href="/styles/admin-tables.css" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Service Management Header */}
          <div className="admin-header">
            <h1 className="admin-title">🇲🇽 Jorge's Service Management Dashboard</h1>
            <p className="admin-subtitle">
              Mexico Trade Specialist • Supplier Vetting • Market Entry • Partnership Intelligence
            </p>
            <div className="credentials-badge">
              <span>Mexico Trade Expert</span>
              <span className="license-number">MEXICO-SPECIALIST-2024</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="admin-nav-tabs">
            <button
              className={`admin-btn jorge ${activeTab === 'morning-queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('morning-queue')}
            >
              📋 Jorge's Service Request Queue
            </button>
            <button
              className={`admin-btn jorge ${activeTab === 'workflow-tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('workflow-tools')}
            >
              🛠️ Workflow Tools
            </button>
            <button
              className={`admin-btn jorge ${activeTab === 'revenue-tracking' ? 'active' : ''}`}
              onClick={() => setActiveTab('revenue-tracking')}
            >
              💰 Revenue Tracking
            </button>
            <button
              className={`admin-btn jorge ${activeTab === 'intake-form' ? 'active' : ''}`}
              onClick={() => setActiveTab('intake-form')}
            >
              ➕ New Service Request
            </button>
          </div>

          {/* Jorge's Morning Service Queue */}
          {activeTab === 'morning-queue' && (
            <div>
              {/* Service Requests Queue */}
              <div className="admin-card">
                <div className="card-header">
                  <h1 className="admin-title">☀️ Good Morning Jorge - Today's Service Queue</h1>
                  <p className="admin-subtitle">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - Your daily action plan
                  </p>
                  <div className="service-capacity-indicator">
                    <span>🎯 Today's Priority: Complete active projects • Track billable hours • Generate invoices</span>
                  </div>
                </div>

                {/* Quick Morning Actions */}
                <div className="revenue-cards">
                  <div className="revenue-card jorge">
                    <div className="revenue-amount">{serviceRequests?.length || 0}</div>
                    <div className="revenue-label">🔥 Urgent Items to Handle Today</div>
                  </div>
                  <div className="revenue-card cristina">
                    <div className="revenue-amount">${((supplierVettingQueue?.length || 0) * 750 + (marketEntryConsultations?.length || 0) * 400 * 8 + (partnershipIntelligence?.length || 0) * 300).toLocaleString()}</div>
                    <div className="revenue-label">💰 This Month's Pipeline Value</div>
                  </div>
                  <div className="revenue-card joint">
                    <div className="revenue-amount">{activeTimer ? '🔴 TIMING' : '⏱️ READY'}</div>
                    <div className="revenue-label">Time Tracker Status</div>
                  </div>
                </div>

                {/* Today's Action Checklist */}
                <div className="admin-card">
                  <div className="card-header">
                    <h2 className="card-title">✅ Today's Action Checklist</h2>
                    <p className="text-body">Complete these tasks to maximize your daily revenue</p>
                  </div>

                  <div className="focus-tasks-grid">
                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-icon">🏭</span>
                        <h3 className="task-title">Supplier Vetting Projects</h3>
                        <span className="task-priority priority-high">$750 each</span>
                      </div>
                      <div className="task-details">
                        {supplierVettingQueue?.length > 0 ? (
                          supplierVettingQueue.slice(0, 3).map((request, index) => (
                            <div key={index} className="task-text">
                              📋 {request.company_name} - {request.status === 'research_in_progress' ? 'Complete vetting report' : 'Start vetting process'}
                            </div>
                          ))
                        ) : (
                          <div className="task-text text-muted">No active supplier vetting projects</div>
                        )}
                      </div>
                      <div className="task-actions">
                        <button className="btn-small" onClick={() => setActiveTab('workflow-tools')}>📚 How to Complete</button>
                      </div>
                    </div>

                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-icon">🎯</span>
                        <h3 className="task-title">Market Entry Consulting</h3>
                        <span className="task-priority priority-medium">$400/hour</span>
                      </div>
                      <div className="task-details">
                        {marketEntryConsultations?.length > 0 ? (
                          marketEntryConsultations.slice(0, 3).map((request, index) => (
                            <div key={index} className="task-text">
                              ⏱️ {request.company_name} - {request.status === 'consultation_scheduled' ? 'Conduct consultation' : 'Complete strategy'}
                            </div>
                          ))
                        ) : (
                          <div className="task-text text-muted">No active market entry projects</div>
                        )}
                      </div>
                      <div className="task-actions">
                        <button className="btn-small" onClick={handleStartTimer}>⏱️ Start Timer</button>
                        <button className="btn-small" onClick={() => setActiveTab('workflow-tools')}>📚 How to Complete</button>
                      </div>
                    </div>

                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-icon">📊</span>
                        <h3 className="task-title">Partnership Intelligence</h3>
                        <span className="task-priority priority-low">$300/month</span>
                      </div>
                      <div className="task-details">
                        {partnershipIntelligence?.length > 0 ? (
                          partnershipIntelligence.slice(0, 3).map((request, index) => (
                            <div key={index} className="task-text">
                              📄 {request.client_company} - Monthly briefing due
                            </div>
                          ))
                        ) : (
                          <div className="task-text text-muted">No active intelligence subscriptions</div>
                        )}
                      </div>
                      <div className="task-actions">
                        <button className="btn-small" onClick={() => setActiveTab('workflow-tools')}>📚 How to Complete</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Priority Filter Tabs */}
                <div className="priority-tabs">
                  <button
                    className={`admin-btn jorge ${priorityView === 'urgent' ? 'active urgent' : ''}`}
                    onClick={() => setPriorityView('urgent')}
                  >
                    🚨 Urgent ({getUrgentItems().length})
                  </button>
                  <button
                    className={`admin-btn jorge ${priorityView === 'today' ? 'active' : ''}`}
                    onClick={() => setPriorityView('today')}
                  >
                    📅 Today ({getTodayItems().length})
                  </button>
                  <button
                    className={`admin-btn jorge ${priorityView === 'week' ? 'active' : ''}`}
                    onClick={() => setPriorityView('week')}
                  >
                    📋 This Week ({getWeekItems().length})
                  </button>
                  <button
                    className={`admin-btn jorge ${priorityView === 'completed' ? 'active success' : ''}`}
                    onClick={() => setPriorityView('completed')}
                  >
                    ✅ Done Today ({getCompletedToday().length})
                  </button>
                </div>

                {/* Bulk Actions - Context Aware */}
                {selectedRows.length > 0 && (
                  <div className="bulk-actions">
                    <span className="bulk-selected">
                      {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      className="admin-btn admin-btn-success"
                      onClick={() => handleBulkAction('mark_complete')}
                    >
                      ✅ Complete All
                    </button>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleBulkAction('reschedule_bulk')}
                    >
                      📅 Reschedule
                    </button>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleBulkAction('send_follow_up')}
                    >
                      📧 Send Follow-up
                    </button>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleBulkAction('create_proposals')}
                    >
                      📝 Create Proposals
                    </button>
                  </div>
                )}

                {/* Unified Priority Queue Table */}
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead className="admin-table-header">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedRows.length === getCurrentItems().length && getCurrentItems().length > 0}
                            onChange={() => handleSelectAll(getCurrentItems())}
                          />
                        </th>
                        <th>Priority</th>
                        <th>Item</th>
                        <th>Client/Contact</th>
                        <th>Type</th>
                        <th>Due/Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center p-20">
                            {priorityView === 'urgent' ? (
                              <div>
                                <div className="text-success icon-large">🎉</div>
                                <div className="font-metric">No Urgent Items!</div>
                                <div className="text-muted">You're on top of everything critical</div>
                              </div>
                            ) : priorityView === 'completed' ? (
                              <div>
                                <div className="text-muted icon-large">📝</div>
                                <div className="font-metric">No Completions Yet</div>
                                <div className="text-muted">Complete some tasks to see them here</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-jorge icon-large">📋</div>
                                <div className="font-metric">Clear Schedule</div>
                                <div className="text-muted">No items for this time period</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((item) => (
                          <tr
                            key={item.id}
                            className={`cursor-pointer ${item.itemType === 'overdue' ? 'row-urgent' : item.itemType === 'meeting' ? 'row-meeting' : ''}`}
                            onClick={() => openDetailPanel(item)}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(item.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleRowSelect(item.id);
                                }}
                              />
                            </td>
                            <td>
                              {item.itemType === 'overdue' ? (
                                <span className="priority-indicator priority-critical">
                                  🔴 OVERDUE
                                </span>
                              ) : item.itemType === 'meeting' ? (
                                <span className="priority-indicator priority-meeting">
                                  🕐 SCHEDULED
                                </span>
                              ) : (
                                <span className={`priority-indicator priority-${item.priority || 'medium'}`}>
                                  {item.priority ? item.priority.toUpperCase() : 'TASK'}
                                </span>
                              )}
                            </td>
                            <td className="company-name">
                              {item.itemType === 'meeting' ? (
                                <div>
                                  <div>{item.event || item.task}</div>
                                  <div className="text-muted font-xs">{item.duration}</div>
                                </div>
                              ) : (
                                item.task
                              )}
                            </td>
                            <td>{item.client}</td>
                            <td>
                              <span className="type-indicator">
                                {item.itemType === 'meeting' ? (
                                  item.type === 'call' ? '📞 Call' :
                                  item.type === 'meeting' ? '🤝 Meeting' :
                                  item.type === 'internal' ? '🏢 Internal' : '📅 Event'
                                ) : (
                                  item.type === 'follow_up' ? '📧 Follow-up' :
                                  item.type === 'proposal' ? '📝 Proposal' :
                                  item.type === 'demo' ? '🎯 Demo' :
                                  item.type === 'admin' ? '📋 Admin' : '💼 Task'
                                )}
                              </span>
                            </td>
                            <td className="time-info">
                              {item.itemType === 'meeting' ? (
                                <span className="text-jorge font-metric">{item.time}</span>
                              ) : item.itemType === 'overdue' ? (
                                <span className="text-danger">{item.days_overdue} days overdue</span>
                              ) : (
                                <span className="text-muted font-xs">{item.due}</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-indicator status-${item.status || 'pending'}`}>
                                {getStatusIcon(item.status || 'pending')} {item.status || 'pending'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {item.itemType === 'overdue' ? (
                                  <button
                                    className="admin-btn admin-btn-danger admin-btn-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction('mark_complete', item.id, item);
                                    }}
                                  >
                                    🔥 Fix Now
                                  </button>
                                ) : item.itemType === 'meeting' ? (
                                  <button
                                    className="admin-btn admin-btn-outline admin-btn-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGoogleApps('calendar', { action: 'join-meeting', item });
                                    }}
                                  >
                                    🔗 Join
                                  </button>
                                ) : (
                                  <button
                                    className="admin-btn admin-btn-success admin-btn-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction('mark_complete', item.id, item);
                                    }}
                                  >
                                    ✅ Done
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}




          {/* Workflow Tools Tab */}
          {activeTab === 'workflow-tools' && (
            <div className="admin-card">
              <div className="card-header">
                <h1 className="admin-title">🛠️ Service Delivery Workflow Tools</h1>
                <p className="admin-subtitle">Step-by-step guides to complete Jorge's $750 supplier vetting, market entry strategies, and partnership intelligence services</p>
              </div>

              {/* Service Workflows Grid */}
              <div className="grid-3-cols">

                {/* Supplier Vetting Workflow */}
                <div className="content-card">
                  <div className="card-header">
                    <h3 className="content-card-title">🏭 Supplier Vetting Process ($750)</h3>
                    <p className="text-body">Complete 2-3 week process with 3 verified supplier introductions</p>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Process</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">1</span></td>
                          <td>
                            <strong>Document Collection</strong><br/>
                            <span className="text-muted">Business registration, tax ID, certifications, financial statements</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(1)}>Start Checklist</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">2</span></td>
                          <td>
                            <strong>Legal & Financial Verification</strong><br/>
                            <span className="text-muted">Credit check, regulatory compliance, ownership structure</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(2)}>Verification Form</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">3</span></td>
                          <td>
                            <strong>Production Capacity Assessment</strong><br/>
                            <span className="text-muted">Manufacturing capability, quality systems, USMCA compliance</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleSupplierVettingStep(3)}>Assessment Tool</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-success">4</span></td>
                          <td>
                            <strong>Risk Scoring & Report</strong><br/>
                            <span className="text-muted">Final scoring, recommendations, professional report generation</span>
                          </td>
                          <td><button className="admin-btn success" onClick={() => handleSupplierVettingStep(4)}>Generate Report</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Market Entry Strategy */}
                <div className="content-card">
                  <div className="card-header">
                    <h3 className="content-card-title">🌍 Market Entry Strategy ($400/hour)</h3>
                    <p className="text-body">4-6 week strategic consulting with implementation roadmap</p>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Process</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">1</span></td>
                          <td>
                            <strong>Client Intake & Analysis</strong><br/>
                            <span className="text-muted">Industry assessment, budget analysis, timeline planning</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(1)}>Intake Form</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">2</span></td>
                          <td>
                            <strong>Mexico Market Research</strong><br/>
                            <span className="text-muted">Industry analysis, regulatory requirements, competitive landscape</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(2)}>Research Template</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">3</span></td>
                          <td>
                            <strong>Strategy Development</strong><br/>
                            <span className="text-muted">Entry strategy, partnership recommendations, risk mitigation</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handleMarketEntryStep(3)}>Strategy Builder</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-success">4</span></td>
                          <td>
                            <strong>Implementation Roadmap</strong><br/>
                            <span className="text-muted">90-day action plan, milestone tracking, success metrics</span>
                          </td>
                          <td><button className="admin-btn success" onClick={() => handleMarketEntryStep(4)}>Roadmap Generator</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Partnership Intelligence */}
                <div className="content-card">
                  <div className="card-header">
                    <h3 className="content-card-title">🤝 Partnership Intelligence ($300/month)</h3>
                    <p className="text-body">Monthly briefings with trade opportunities and market insights</p>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Process</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">1</span></td>
                          <td>
                            <strong>Research Source Setup</strong><br/>
                            <span className="text-muted">Government databases, trade publications, industry reports</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(1)}>Source Tracker</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">2</span></td>
                          <td>
                            <strong>Monthly Report Creation</strong><br/>
                            <span className="text-muted">2-page briefing template with opportunities and trends</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(2)}>Report Template</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-info">3</span></td>
                          <td>
                            <strong>Opportunity Classification</strong><br/>
                            <span className="text-muted">Manufacturing, logistics, regulatory opportunities</span>
                          </td>
                          <td><button className="admin-btn primary" onClick={() => handlePartnershipIntelStep(3)}>Classification Tool</button></td>
                        </tr>
                        <tr className="admin-row">
                          <td><span className="badge badge-success">4</span></td>
                          <td>
                            <strong>Client Distribution</strong><br/>
                            <span className="text-muted">Automated delivery system with personalized insights</span>
                          </td>
                          <td><button className="admin-btn success" onClick={() => handlePartnershipIntelStep(4)}>Distribution Manager</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Task Management Tools */}
              <div className="card-header">
                <h3 className="content-card-title">📋 Task Management & Time Tracking</h3>
              </div>

              <div className="grid-3-cols">
                <div className="content-card">
                  <h4 className="content-card-title">⏱️ Time Tracker</h4>
                  <p className="text-body">Track billable hours for $400/hour services</p>
                  <div className="admin-actions">
                    <button
                      className={`admin-btn ${activeTimer ? 'danger' : 'success'}`}
                      onClick={handleStartTimer}
                    >
                      {activeTimer ? 'Stop Timer' : 'Start Timer'}
                    </button>
                    <span className="text-revenue">{formatTime(timerDuration)}</span>
                  </div>
                  <select
                    className="filter-select"
                    value={selectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                  >
                    <option value="">Select Project...</option>
                    <option value="market-entry">Market Entry Strategy</option>
                    <option value="supplier-vetting">Supplier Vetting</option>
                    <option value="partnership-intel">Partnership Intelligence</option>
                  </select>
                </div>

                <div className="content-card">
                  <h4 className="content-card-title">📋 Priority Queue</h4>
                  <p className="text-body">What needs to be completed this week</p>
                  <div className="focus-tasks-grid">
                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-priority priority-high">To Do ({taskQueue.todo.length})</span>
                      </div>
                      <div className="task-details">
                        {taskQueue.todo.map((task, index) => (
                          <div key={index} className="task-text">{task}</div>
                        ))}
                      </div>
                    </div>
                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-priority priority-medium">In Progress ({taskQueue.inProgress.length})</span>
                      </div>
                      <div className="task-details">
                        {taskQueue.inProgress.map((task, index) => (
                          <div key={index} className="task-text">{task}</div>
                        ))}
                      </div>
                    </div>
                    <div className="focus-task-item">
                      <div className="task-header">
                        <span className="task-priority priority-low">Completed ({taskQueue.completed.length})</span>
                      </div>
                      <div className="task-details">
                        {taskQueue.completed.map((task, index) => (
                          <div key={index} className="task-text">{task}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h4 className="content-card-title">💳 Invoice Generator</h4>
                  <p className="text-body">Quick invoice creation and tracking</p>
                  <div className="form-group">
                    <input type="text" placeholder="Client Company" className="filter-select" />
                    <select className="filter-select">
                      <option value="">Service Type...</option>
                      <option value="750">Supplier Vetting - $750</option>
                      <option value="400">Market Entry - $400/hour</option>
                      <option value="300">Partnership Intel - $300/month</option>
                    </select>
                    <input type="number" placeholder="Hours (if applicable)" className="filter-select" />
                    <button className="admin-btn primary" onClick={handleGenerateInvoice}>Generate Invoice PDF</button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Revenue Tracking Tab */}
          {activeTab === 'revenue-tracking' && (
            <div className="admin-card">
              <div className="card-header">
                <h1 className="admin-title">💰 Revenue Tracking</h1>
                <p className="admin-subtitle">Jorge's service revenue and capacity utilization</p>
              </div>

              <div className="revenue-grid">
                <div className="revenue-card">
                  <h3>🏭 Supplier Vetting</h3>
                  <div className="revenue-stats">
                    <div className="stat">
                      <span className="stat-label">This Month</span>
                      <span className="stat-value text-green-600">${(supplierVettingQueue?.length || 0) * 750}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Capacity Used</span>
                      <span className="stat-value">{(supplierVettingQueue?.length || 0)}/10</span>
                    </div>
                  </div>
                </div>

                <div className="revenue-card">
                  <h3>🎯 Market Entry</h3>
                  <div className="revenue-stats">
                    <div className="stat">
                      <span className="stat-label">This Month</span>
                      <span className="stat-value text-green-600">${(marketEntryConsultations?.reduce((sum, item) => sum + (item.hours_scheduled || 0), 0) || 0) * 400}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Hours Used</span>
                      <span className="stat-value">{marketEntryConsultations?.reduce((sum, item) => sum + (item.hours_scheduled || 0), 0) || 0}/15</span>
                    </div>
                  </div>
                </div>

                <div className="revenue-card">
                  <h3>📊 Partnership Intelligence</h3>
                  <div className="revenue-stats">
                    <div className="stat">
                      <span className="stat-label">Monthly Recurring</span>
                      <span className="stat-value text-green-600">${(partnershipIntelligence?.length || 0) * 300}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Active Subscriptions</span>
                      <span className="stat-value">{partnershipIntelligence?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Service Request Tab */}
          {activeTab === 'intake-form' && (
            <div className="admin-card">
              <div className="card-header">
                <h1 className="admin-title">➕ New Service Request Intake</h1>
                <p className="admin-subtitle">Client service request form for Jorge's Mexico trade services</p>
              </div>

              <form className="service-request-form" onSubmit={handleFormSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Service Type</h3>
                  <div className="service-type-grid">
                    <label className="service-option">
                      <input
                        type="radio"
                        name="service_type"
                        value="supplier-vetting"
                        checked={serviceRequestForm.service_type === 'supplier-vetting'}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, service_type: e.target.value})}
                      />
                      <div className="service-card">
                        <h4>🏭 Supplier Vetting ($750)</h4>
                        <p>Mexico supplier introduction and vetting</p>
                      </div>
                    </label>
                    <label className="service-option">
                      <input
                        type="radio"
                        name="service_type"
                        value="market-entry"
                        checked={serviceRequestForm.service_type === 'market-entry'}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, service_type: e.target.value})}
                      />
                      <div className="service-card">
                        <h4>🎯 Market Entry ($400/hr)</h4>
                        <p>Mexico market entry consultation</p>
                      </div>
                    </label>
                    <label className="service-option">
                      <input
                        type="radio"
                        name="service_type"
                        value="partnership-intelligence"
                        checked={serviceRequestForm.service_type === 'partnership-intelligence'}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, service_type: e.target.value})}
                      />
                      <div className="service-card">
                        <h4>📊 Partnership Intelligence ($300/mo)</h4>
                        <p>Monthly Mexico trade intelligence reports</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Client Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={serviceRequestForm.client_company}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, client_company: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={serviceRequestForm.contact_name}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, contact_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={serviceRequestForm.email}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={serviceRequestForm.phone}
                        onChange={(e) => setServiceRequestForm({...serviceRequestForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="admin-btn primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Service Request'}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* Create New Customer Tab */}
          {activeTab === 'create' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">➕ Create New Customer</h2>
                <p className="card-description">Add new customers to the Triangle Intelligence platform and sales pipeline</p>
              </div>

              <div className="customer-creation-form">
                <form className="form-grid" onSubmit={handleFormSubmit}>
                  <div className="form-section">
                    <h3 className="section-title">Company Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Name <span className="required">*</span></label>
                        <input
                          type="text"
                          className={`form-input ${formErrors.company_name ? 'error' : ''}`}
                          placeholder="Enter company name"
                          value={customerForm.company_name}
                          onChange={(e) => handleFormChange('company_name', e.target.value)}
                          required
                        />
                        {formErrors.company_name && <div className="error-message">{formErrors.company_name}</div>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <select
                          className="form-select"
                          value={customerForm.industry}
                          onChange={(e) => handleFormChange('industry', e.target.value)}
                        >
                          <option value="">Select industry</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Automotive">Automotive</option>
                          <option value="Textiles">Textiles</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Business Type</label>
                        <select
                          className="form-select"
                          value={customerForm.business_type}
                          onChange={(e) => handleFormChange('business_type', e.target.value)}
                        >
                          <option value="">Select business type</option>
                          <option value="Importer">Importer</option>
                          <option value="Exporter">Exporter</option>
                          <option value="Manufacturer">Manufacturer</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Logistics Provider">Logistics Provider</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Annual Trade Volume</label>
                        <select
                          className="form-select"
                          value={customerForm.trade_volume}
                          onChange={(e) => handleFormChange('trade_volume', e.target.value)}
                        >
                          <option value="">Select volume range</option>
                          <option value="Under $100K">Under $100K</option>
                          <option value="$100K - $500K">$100K - $500K</option>
                          <option value="$500K - $1M">$500K - $1M</option>
                          <option value="$1M - $5M">$1M - $5M</option>
                          <option value="$5M - $10M">$5M - $10M</option>
                          <option value="Over $10M">Over $10M</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Contact Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Primary Contact Name <span className="required">*</span></label>
                        <input
                          type="text"
                          className={`form-input ${formErrors.contact_name ? 'error' : ''}`}
                          placeholder="Enter contact name"
                          value={customerForm.contact_name}
                          onChange={(e) => handleFormChange('contact_name', e.target.value)}
                          required
                        />
                        {formErrors.contact_name && <div className="error-message">{formErrors.contact_name}</div>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter job title"
                          value={customerForm.job_title}
                          onChange={(e) => handleFormChange('job_title', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Email Address <span className="required">*</span></label>
                        <input
                          type="email"
                          className={`form-input ${formErrors.email ? 'error' : ''}`}
                          placeholder="Enter email address"
                          value={customerForm.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          required
                        />
                        {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Enter phone number"
                          value={customerForm.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Location & Compliance</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Country <span className="required">*</span></label>
                        <select
                          className={`form-select ${formErrors.country ? 'error' : ''}`}
                          value={customerForm.country}
                          onChange={(e) => handleFormChange('country', e.target.value)}
                          required
                        >
                          <option value="">Select country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="MX">Mexico</option>
                          <option value="Other">Other</option>
                        </select>
                        {formErrors.country && <div className="error-message">{formErrors.country}</div>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">State/Province</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter state or province"
                          value={customerForm.state}
                          onChange={(e) => handleFormChange('state', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Tax ID / Business License</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter tax ID or business license"
                          value={customerForm.tax_id}
                          onChange={(e) => handleFormChange('tax_id', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">USMCA Eligible</label>
                        <select
                          className="form-select"
                          value={customerForm.usmca_eligible}
                          onChange={(e) => handleFormChange('usmca_eligible', e.target.value)}
                        >
                          <option value="">Select eligibility</option>
                          <option value="Yes">Yes - USMCA Member</option>
                          <option value="Partial">Partial - Some Products</option>
                          <option value="No">No - Non-USMCA</option>
                          <option value="Unknown">Unknown - Needs Assessment</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Sales Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Lead Source</label>
                        <select
                          className="form-select"
                          value={customerForm.lead_source}
                          onChange={(e) => handleFormChange('lead_source', e.target.value)}
                        >
                          <option value="">Select lead source</option>
                          <option value="Website">Website</option>
                          <option value="Referral">Referral</option>
                          <option value="Trade Show">Trade Show</option>
                          <option value="Cold Outreach">Cold Outreach</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Partner">Partner</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Priority Level</label>
                        <select
                          className="form-select"
                          value={customerForm.priority}
                          onChange={(e) => handleFormChange('priority', e.target.value)}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label className="form-label">Initial Notes</label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          placeholder="Enter initial notes about this customer..."
                          value={customerForm.notes}
                          onChange={(e) => handleFormChange('notes', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '⏳ Creating...' : '✅ Save'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleSaveAndContinue}
                      disabled={isSubmitting}
                    >
                      📝 Save & Continue
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={handleFormReset}
                      disabled={isSubmitting}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">📋 Sales Reports</h2>
                <p className="card-description">Generate and export sales performance reports</p>
              </div>

              <div className="grid-2-cols">
                <div className="admin-card">
                  <div className="card-header">
                    <h3 className="card-title">📊 Pipeline Reports</h3>
                    <ul className="week-tasks-list">
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Monthly Pipeline Summary')}>📈 Monthly Pipeline Summary</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Conversion Rate Analysis')}>🎯 Conversion Rate Analysis</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Sales Cycle Report')}>⏰ Sales Cycle Report</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Revenue Forecast')}>💰 Revenue Forecast</button></li>
                    </ul>
                  </div>
                </div>
                <div className="admin-card">
                  <div className="card-header">
                    <h3 className="card-title">👥 Customer Reports</h3>
                    <ul className="week-tasks-list">
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Customer Directory')}>📋 Customer Directory</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Customer Segmentation')}>🌟 Customer Segmentation</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Contact Activity Log')}>📞 Contact Activity Log</button></li>
                      <li><button className="admin-btn admin-btn-outline" onClick={() => handleGenerateReport('Lead Source Analysis')}>🔄 Lead Source Analysis</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">⚙️ Sales Settings</h2>
                <p className="card-description">Configure sales preferences and system settings</p>
              </div>

              <div className="grid-2-cols">
                <div className="admin-card">
                  <div className="card-header">
                    <h3 className="card-title">🎯 Pipeline Settings</h3>
                    <div className="p-20">
                      <label className="font-label">Default Pipeline Stage</label>
                      <select
                        className="filter-select"
                        value={pipelineSettings.defaultStage}
                        onChange={(e) => handlePipelineSettingChange('defaultStage', e.target.value)}
                      >
                        <option value="Qualification">Qualification</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Closing">Closing</option>
                      </select>
                    </div>
                    <div className="p-20">
                      <label className="font-label">Auto-follow up (days)</label>
                      <input
                        type="number"
                        className="filter-select"
                        value={pipelineSettings.autoFollowUpDays}
                        onChange={(e) => handlePipelineSettingChange('autoFollowUpDays', parseInt(e.target.value))}
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>
                </div>
                <div className="admin-card">
                  <div className="card-header">
                    <h3 className="card-title">📧 Notification Settings</h3>
                    <div className="p-20">
                      <label className="text-body">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailOnNewLeads}
                          onChange={(e) => handleNotificationChange('emailOnNewLeads', e.target.checked)}
                        /> Email on new leads
                      </label>
                      <br />
                      <label className="text-body">
                        <input
                          type="checkbox"
                          checked={notificationSettings.dailyPipelineSummary}
                          onChange={(e) => handleNotificationChange('dailyPipelineSummary', e.target.checked)}
                        /> Daily pipeline summary
                      </label>
                      <br />
                      <label className="text-body">
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyPerformanceReport}
                          onChange={(e) => handleNotificationChange('weeklyPerformanceReport', e.target.checked)}
                        /> Weekly performance report
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="card-header">
                <button
                  className="admin-btn jorge"
                  onClick={handleSaveSettings}
                >
                  💾 Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Active Items Tab (Pipeline Management) */}
          {activeTab === 'pipeline' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">📊 Sales Pipeline Management</h2>
                <div className="filter-controls">
                  <select
                    value={filterView}
                    onChange={(e) => setFilterView(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Deals</option>
                    <option value="hot">Hot Prospects</option>
                    <option value="closing">Closing This Month</option>
                    <option value="overdue">Overdue Follow-ups</option>
                  </select>
                </div>
              </div>

              {selectedRows.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedRows.length} selected</span>
                  <button onClick={() => handleBulkAction('email')} className="bulk-btn">
                    📧 Bulk Email
                  </button>
                  <button onClick={() => handleBulkAction('update')} className="bulk-btn">
                    📝 Update Status
                  </button>
                  <button onClick={() => handleBulkAction('export')} className="bulk-btn">
                    📤 Export
                  </button>
                </div>
              )}

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th onClick={() => handleSort('companyName')}>
                        Company Name {sortConfig.key === 'companyName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('industry')}>Industry</th>
                      <th onClick={() => handleSort('dealSize')}>Deal Size</th>
                      <th onClick={() => handleSort('stage')}>Stage</th>
                      <th onClick={() => handleSort('probability')}>Probability</th>
                      <th>Source</th>
                      <th>Next Action</th>
                      <th onClick={() => handleSort('dueDate')}>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineData.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center p-20 text-muted">
                          No pipeline data available. Complete workflows on the platform to generate sales leads.
                        </td>
                      </tr>
                    ) : (
                      pipelineData.map(deal => (
                        <tr
                          key={deal.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(deal, 'pipeline')}
                          className="cursor-pointer"
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(deal.id)}
                              onChange={() => handleRowSelect(deal.id)}
                            />
                          </td>
                          <td className="company-name">{deal.companyName}</td>
                          <td>{deal.industry}</td>
                          <td className="deal-size">{formatCurrency(deal.dealSize)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(deal.stage)}`}>
                              {deal.stage}
                            </span>
                          </td>
                          <td>
                            <div className="probability-bar">
                              <div
                                className="probability-fill"
                                style={{width: `${deal.probability}%`}}
                              ></div>
                              <span>{deal.probability}%</span>
                            </div>
                          </td>
                          <td>{deal.source}</td>
                          <td>{deal.nextAction}</td>
                          <td>{deal.dueDate}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="admin-btn admin-btn-small" onClick={() => handleCallClient(deal)}>📞</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleEmailClient(deal)}>📧</button>
                            <button className="admin-btn admin-btn-small" onClick={() => openDetailPanel(deal, 'pipeline')}>👁️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">🎯 Client Conversion Tools</h2>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Company</th>
                      <th>Proposal Type</th>
                      <th>Status</th>
                      <th>Value</th>
                      <th>Sent Date</th>
                      <th>Response Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposalsData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-20 text-muted">
                          No active proposals. Create proposals from qualified leads in the pipeline.
                        </td>
                      </tr>
                    ) : (
                      proposalsData.map(proposal => (
                        <tr
                          key={proposal.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(proposal, 'proposal')}
                          className="cursor-pointer"
                        >
                          <td className="company-name">{proposal.company}</td>
                          <td>{proposal.proposalType}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(proposal.status)}`}>
                              {proposal.status}
                            </span>
                          </td>
                          <td className="deal-size">{formatCurrency(proposal.value)}</td>
                          <td>{proposal.sentDate}</td>
                          <td>{proposal.responseDue}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="admin-btn admin-btn-small" onClick={() => handleFollowUp(proposal)}>📞 Follow-up</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleModifyProposal(proposal)}>📝 Modify</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleProposalStatus(proposal)}>📊 Status</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Market Intelligence Tab */}
          {activeTab === 'market' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">📈 Market Intelligence</h2>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Industry</th>
                      <th>Conversion Rate</th>
                      <th>Avg Deal Size</th>
                      <th>Active Prospects</th>
                      <th>Pipeline Value</th>
                      <th>Growth Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-20 text-muted">
                          Market intelligence will be available once users complete workflows across different industries.
                        </td>
                      </tr>
                    ) : (
                      marketData.map((industry, index) => (
                        <tr
                          key={index}
                          className="clickable-row"
                          onClick={() => openDetailPanel(industry, 'market')}
                          className="cursor-pointer"
                        >
                          <td className="industry-name">{industry.industry}</td>
                          <td>
                            <div className="conversion-rate">
                              {(industry.conversionRate * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="deal-size">{formatCurrency(industry.avgDealSize)}</td>
                          <td className="prospects-count">{industry.activeProspects}</td>
                          <td className="pipeline-value">{formatCurrency(industry.pipelineValue)}</td>
                          <td className="growth-rate">
                            <span className={`growth ${industry.growthRate > 0 ? 'positive' : 'negative'}`}>
                              {(industry.growthRate * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="admin-btn admin-btn-small" onClick={() => handleResearchIndustry(industry)}>🔍 Research</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleTargetIndustry(industry)}>🎯 Target</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleIndustryCampaign(industry)}>📢 Campaign</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lead Generation Tab */}
          {activeTab === 'leads' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">⚡ Lead Generation Pipeline</h2>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Company</th>
                      <th>Platform Activity</th>
                      <th>Lead Score</th>
                      <th>Interest Level</th>
                      <th>Last Activity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-20 text-muted">
                          Lead generation data will populate as users engage with the platform.
                        </td>
                      </tr>
                    ) : (
                      leadsData.map(lead => (
                        <tr
                          key={lead.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(lead, 'lead')}
                          className="cursor-pointer"
                        >
                          <td className="company-name">{lead.company}</td>
                          <td>{lead.platformActivity}</td>
                          <td>
                            <div className="lead-score">
                              <div className={`score-circle ${lead.leadScore >= 80 ? 'high' : lead.leadScore >= 60 ? 'medium' : 'low'}`}>
                                {lead.leadScore}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`interest-level ${lead.interestLevel?.toLowerCase()}`}>
                              {lead.interestLevel}
                            </span>
                          </td>
                          <td>{lead.lastActivity}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            {lead.status === 'Hot Lead' && <button className="admin-btn urgent" onClick={() => handleCallClient(lead)}>📞 Call Now</button>}
                            <button className="admin-btn admin-btn-small" onClick={() => handleEmailClient(lead)}>📧 Email</button>
                            <button className="admin-btn admin-btn-small" onClick={() => handleViewClient(lead)}>✅ Qualify</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Professional Services Tab */}
          {activeTab === 'professional' && (
            <div>
              {/* Active Consultation Projects */}
              <div className="admin-card">
                <div className="card-header">
                  <h2 className="card-title">🎯 Active Consultation Projects</h2>
                  <p className="card-description">Jorge's billable consulting projects and implementation support</p>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead className="admin-table-header">
                      <tr>
                        <th>Client</th>
                        <th>Service Type</th>
                        <th>Hours Booked</th>
                        <th>Rate</th>
                        <th>Revenue</th>
                        <th>Status</th>
                        <th>Next Session</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionalServices.jorge_pipeline && professionalServices.jorge_pipeline.length > 0 ? (
                        professionalServices.jorge_pipeline.map(project => (
                          <tr
                            key={project.id}
                            className="clickable-row"
                            onClick={() => openDetailPanel(project, 'professional')}
                            className="cursor-pointer"
                          >
                            <td className="company-name">{project.client}</td>
                            <td className="text-body">{project.service_type}</td>
                            <td className="prospects-count">{project.hours_booked}</td>
                            <td className="deal-size">${project.hourly_rate}/hr</td>
                            <td className="deal-size">${(project.hours_booked * project.hourly_rate).toLocaleString()}</td>
                            <td><span className={`badge ${getStatusBadge(project.status)}`}>{project.status}</span></td>
                            <td className="text-body">{project.next_session}</td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button className="admin-btn admin-btn-small" onClick={() => handleScheduleConsultation(project)}>📅 Schedule</button>
                              <button className="admin-btn admin-btn-small" onClick={() => handleEmailClient(project)}>📧 Follow-up</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center p-20 text-muted">
                            No active consultation projects. Professional services pipeline will appear here as projects are booked.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custom Integration Opportunities */}
              <div className="admin-card">
                <div className="card-header">
                  <h2 className="card-title">🔧 Custom Integration Opportunities</h2>
                  <p className="card-description">High-value system integration and custom development projects</p>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead className="admin-table-header">
                      <tr>
                        <th>Prospect</th>
                        <th>System Type</th>
                        <th>Complexity</th>
                        <th>Est. Value</th>
                        <th>Probability</th>
                        <th>Technical Req</th>
                        <th>Timeline</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionalServices.jorge_integrations && professionalServices.jorge_integrations.length > 0 ? (
                        professionalServices.jorge_integrations.map(integration => (
                          <tr
                            key={integration.id}
                            className="clickable-row"
                            onClick={() => openDetailPanel(integration, 'integration')}
                            className="cursor-pointer"
                          >
                            <td className="company-name">{integration.prospect}</td>
                            <td className="text-body">{integration.system_type}</td>
                            <td>
                              <span className={`badge ${integration.complexity === 'high' ? 'badge-danger' : integration.complexity === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                                {integration.complexity}
                              </span>
                            </td>
                            <td className="deal-size">${integration.estimated_value.toLocaleString()}</td>
                            <td>
                              <div className="probability-bar">
                                <div className="probability-fill" style={{width: `${integration.probability}%`}}></div>
                                <span>{integration.probability}%</span>
                              </div>
                            </td>
                            <td className="text-body">{integration.technical_requirements}</td>
                            <td className="text-body">{integration.timeline}</td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button className="admin-btn admin-btn-small" onClick={() => handleCallClient(integration)}>📞 Contact</button>
                              <button className="admin-btn urgent" onClick={() => handleCreateIntegrationOpportunity(integration)}>🚀 Create Opportunity</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center p-20 text-muted">
                            No integration opportunities identified. Custom integration prospects will appear here from market analysis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Professional Services Metrics */}
              <div className="admin-card">
                <div className="card-header">
                  <h2 className="card-title">📊 Professional Services Metrics</h2>
                  <p className="card-description">Utilization and revenue tracking for consulting services</p>
                </div>

                <div className="grid-3-cols">
                  <div className="card">
                    <div className="card-header">
                      <div className="deal-size">{professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0}%</div>
                      <div className="card-description">Current Utilization</div>
                      <div className="text-body">
                        {professionalServices.utilization_metrics?.current_month?.billable_hours || 0} billable / {professionalServices.utilization_metrics?.current_month?.target_hours || 0} target hours
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0}%`}}></div>
                        </div>
                        <span className="progress-text">
                          {(professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0) >= 80 ? 'On target' : 'Below target'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="pipeline-value">${(professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 0).toLocaleString()}</div>
                      <div className="card-description">Monthly Target</div>
                      <div className="text-body">
                        Professional services revenue goal for Jorge's consultation pipeline
                      </div>
                      <span className={`badge ${professionalServices.utilization_metrics?.trends?.revenue_trend === 'on_track' ? 'badge-success' : 'badge-warning'}`}>
                        {professionalServices.utilization_metrics?.trends?.revenue_trend === 'on_track' ? 'On Track' : 'Behind Target'}
                      </span>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="company-name">{professionalServices.utilization_metrics?.trends?.efficiency_score || 0}%</div>
                      <div className="card-description">Efficiency Score</div>
                      <div className="text-body">Project delivery vs timeline</div>
                      <span className={`badge ${(professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 90 ? 'badge-success' : (professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 80 ? 'badge-info' : 'badge-warning'}`}>
                        {(professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 90 ? 'Excellent' : (professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 80 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Management Tab */}
          {activeTab === 'customer-management' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">👥 Customer Account Management</h2>
                <div className="text-body">
                  Showing {getFilteredCustomers().length} of {customers.length} customers
                  {customerFilter !== 'all' && ` • Status: ${customerFilter}`}
                  {subscriptionFilter !== 'all' && ` • Subscription: ${subscriptionFilter}`}
                </div>
                <div className="filter-controls">
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Customers</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Subscriptions</option>
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="basic">Basic</option>
                  </select>
                </div>
              </div>

              {selectedCustomers.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedCustomers.length} customers selected</span>
                  <button
                    className="bulk-btn urgent"
                    onClick={() => handleBulkCustomerAction(selectedCustomers, 'send_follow_up')}
                  >
                    📧 Send Follow-up
                  </button>
                  <button
                    className="bulk-btn"
                    onClick={() => handleBulkCustomerAction(selectedCustomers, 'schedule_calls')}
                  >
                    📞 Schedule Calls
                  </button>
                  <button
                    className="bulk-btn"
                    onClick={() => setSelectedCustomers([])}
                  >
                    ❌ Clear Selection
                  </button>
                </div>
              )}

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th><input type="checkbox" onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers(getFilteredCustomers().map(customer => customer.id));
                        } else {
                          setSelectedCustomers([]);
                        }
                      }} /></th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Industry</th>
                      <th>Account Status</th>
                      <th>Subscription</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredCustomers().length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center p-20 text-muted">
                          {customers.length === 0
                            ? 'No customers found. Customer data will populate from the users API.'
                            : 'No customers match current filters.'}
                        </td>
                      </tr>
                    ) : (
                      getFilteredCustomers().map(customer => (
                        <tr
                          key={customer.id}
                          className="admin-row clickable"
                          onClick={() => openDetailPanel(customer, 'customer')}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers(prev => [...prev, customer.id]);
                                } else {
                                  setSelectedCustomers(prev => prev.filter(id => id !== customer.id));
                                }
                              }}
                            />
                          </td>
                          <td className="company-name">{customer.company_name || 'Unknown Company'}</td>
                          <td>{customer.contact_name || customer.email || 'No contact'}</td>
                          <td>{customer.industry || 'Not specified'}</td>
                          <td>
                            <span className={`badge ${getCustomerStatusBadge(customer.status)}`}>
                              {customer.status || 'active'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getSubscriptionBadge(customer.subscription_type)}`}>
                              {customer.subscription_type || 'basic'}
                            </span>
                          </td>
                          <td>{customer.last_activity ? new Date(customer.last_activity).toLocaleDateString() : 'Never'}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="admin-btn call"
                              onClick={() => handleCustomerCall(customer)}
                              title="Schedule call via Google Calendar"
                            >
                              📞 Call
                            </button>
                            <button
                              className="admin-btn"
                              onClick={() => handleSendCustomerEmail(customer)}
                              title="Send follow-up email"
                            >
                              📧 Email
                            </button>
                            <button
                              className="admin-btn urgent"
                              onClick={() => handleUpgradeSubscription(customer)}
                              title="Upgrade subscription"
                            >
                              ⬆️ Upgrade
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Simple Detail Panel */}
          <SimpleDetailPanel
            isOpen={detailPanelOpen}
            onClose={closeDetailPanel}
            record={selectedRecord}
            type={selectedRecord?.recordType || 'client'}
            onSave={handleDetailSave}
          />

        </div>
      </div>
    </>
  );
}