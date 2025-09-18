/**
 * Jorge-Cristina Collaboration Workspace - Salesforce-Style Team Coordination
 * High-value client management requiring both sales and broker expertise
 * Cross-team revenue coordination and joint project management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';
import TableWorkspace from '../../components/admin/TableWorkspace';

// Helper functions for MCP data processing
const extractClientFromTitle = (title) => {
  if (!title) return 'Unknown Client';
  const match = title.match(/Internal Note: (.+)/);
  return match ? match[1] : title;
};

const determineNoteCategory = (description, assignedTo) => {
  if (!description) return 'coordination';
  const desc = description.toLowerCase();

  if (desc.includes('revenue') || desc.includes('split') || desc.includes('commission')) {
    return 'revenue';
  }
  if (desc.includes('handoff') || desc.includes('transfer')) {
    return 'handoff';
  }
  if (desc.includes('follow') || desc.includes('reminder')) {
    return 'followup';
  }
  if (desc.includes('strategy') || desc.includes('plan')) {
    return 'strategy';
  }

  return 'coordination';
};

const calculateDueDate = (priority) => {
  const now = new Date();
  const daysToAdd = {
    'urgent': 1,
    'high': 3,
    'medium': 7,
    'low': 14
  };

  now.setDate(now.getDate() + (daysToAdd[priority] || 7));
  return now.toISOString().split('T')[0];
};

export default function CollaborationWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('handoff-protocols');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState([]);

  // Workspace states for inline editing
  const [openWorkspaces, setOpenWorkspaces] = useState({});
  const [workspaceData, setWorkspaceData] = useState({});

  // Database-driven data states
  const [handoffQueue, setHandoffQueue] = useState([]);
  const [jointClientsData, setJointClientsData] = useState([]);
  const [coordinationData, setCoordinationData] = useState([]);
  const [highValueOpportunities, setHighValueOpportunities] = useState([]);
  const [revenueAttribution, setRevenueAttribution] = useState([]);

  // Notes management states
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNote, setNewNote] = useState({ client: '', category: 'coordination', note: '', priority: 'medium' });
  const [editingNote, setEditingNote] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(stored);
      if (!userData.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
      loadCollaborationData();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCollaborationData = async () => {
    try {
      setLoading(true);

      // Load data from multiple database-driven APIs in parallel
      const [usersResponse, collaborationResponse, opportunitiesResponse, mcpCollaborationResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/team-collaboration'),
        fetch('/api/admin/high-value-opportunities'),
        fetch('/api/admin/collaboration-mcp') // Load MCP collaboration data
      ]);

      // Generate handoff queue from user data
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        const handoffItems = userData.users?.filter(user =>
          requiresHandoff(user)
        ).map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          currentStage: determineHandoffStage(user),
          currentOwner: getCurrentOwner(user),
          nextAction: getNextHandoffAction(user),
          stageProgress: calculateStageProgress(user),
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          certificates: user.certificates_generated || 0,
          completions: user.workflow_completions || 0,
          lastActivity: user.last_login,
          handoffReady: isReadyForHandoff(user),
          estimatedRevenue: estimateJorgeRevenue(user) + estimateCristinaRevenue(user)
        })) || [];
        setHandoffQueue(handoffItems);
      }

      // Process Users Data for Joint Client Management + Add Sample Data
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        let jointClients = userData.users?.filter(user =>
          requiresBothServices(user)
        ).map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          industry: user.industry || 'General',
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          serviceType: determineServiceType(user),
          jorgeRevenue: estimateJorgeRevenue(user),
          cristinaRevenue: estimateCristinaRevenue(user),
          totalRevenue: estimateJorgeRevenue(user) + estimateCristinaRevenue(user),
          status: getCollaborationStatus(user),
          phase: getCurrentPhase(user),
          timeline: getProjectTimeline(user),
          lastActivity: user.last_login
        })) || [];

        // Joint clients will populate from real database data when users require both services
        setJointClientsData(jointClients);
      }

      // Process Team Collaboration Data
      if (collaborationResponse.ok) {
        const collabData = await collaborationResponse.json();
        setCoordinationData(collabData.coordination || []);
      } else {
        console.log('Using sample coordination data');
        setCoordinationData([]);
      }

      // Process High-Value Opportunities
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json();
        setHighValueOpportunities(opportunitiesData.opportunities || []);
      } else {
        console.log('Using sample opportunities data');
        setHighValueOpportunities([]);
      }

      // Generate revenue attribution data
      generateRevenueAttribution(userData.users || [], jointClients);

      // Load collaboration data from MCP database
      if (mcpCollaborationResponse.ok) {
        const mcpData = await mcpCollaborationResponse.json();

        // Convert database collaboration items to internal notes format
        const databaseNotes = mcpData.collaboration_items
          ?.filter(item => item.item_type === 'internal_note')
          .map(item => ({
            id: item.id,
            client: extractClientFromTitle(item.title),
            category: determineNoteCategory(item.description, item.assigned_to),
            note: item.description,
            priority: item.priority,
            timestamp: item.created_at,
            author: item.requested_by,
            lastUpdated: item.updated_at,
            databaseId: item.id,
            databaseSynced: true
          })) || [];

        // Merge with existing local notes (if any)
        setInternalNotes(prev => {
          const existing = prev.filter(note => !note.databaseSynced);
          return [...databaseNotes, ...existing];
        });

        console.log(`📝 Loaded ${databaseNotes.length} collaboration items from database`);
      } else {
        console.log('Using sample collaboration data, initializing sample notes');
        // Initialize sample internal notes for demo only if no database data
        initializeSampleNotes();
      }

    } catch (error) {
      console.error('Error loading collaboration workspace data:', error);
      // Set empty arrays as fallback
      setJointClientsData([]);
      setCoordinationData([]);
      setHighValueOpportunities([]);
      setRevenueAttribution([]);
      setInternalNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced interaction handlers for collaboration actions
  const handleJointCall = async (client) => {
    try {
      const result = await googleIntegrationService.scheduleCall(client, 'joint_call');
      console.log('Joint Google Calendar call scheduled:', result);

      // Track revenue attribution for this interaction
      addCommunicationRecord(client, 'Joint Call Scheduled', `Jorge & Cristina joint call - ${client.company}`, 'high');
    } catch (error) {
      console.error('Error scheduling joint call:', error);
      alert(`Error scheduling joint call with ${client.client || client.company}. Please try again.`);
    }
  };

  const handleCreateProposal = async (client) => {
    try {
      const result = await googleIntegrationService.createProposal(client, 'mexico_routing');
      console.log('Google Docs joint proposal created:', result);

      // Track proposal creation for revenue attribution
      addCommunicationRecord(client, 'Joint Proposal Created', `Comprehensive proposal for ${client.company} - Value: ${formatCurrency(client.totalRevenue)}`, 'high');
    } catch (error) {
      console.error('Error creating joint proposal:', error);
      alert(`Error creating proposal for ${client.client || client.company}. Please try again.`);
    }
  };

  const handleCoordinate = async (client) => {
    try {
      const result = await googleIntegrationService.openClientWorkspace(client);
      console.log('Client coordination workspace opened:', result);

      addCommunicationRecord(client, 'Coordination Session', `Team coordination for ${client.company}`, 'medium');
    } catch (error) {
      console.error('Error opening coordination workspace:', error);
      alert(`Error opening workspace for ${client.client || client.company}. Please try again.`);
    }
  };

  // Communication interaction handlers
  const handleReplyToCommunication = async (communication) => {
    try {
      const client = { company: communication.client, email: 'client@company.com' };
      await googleIntegrationService.composeEmail(client, 'follow_up');
      alert(`Reply composed for ${communication.client}`);
    } catch (error) {
      alert(`Error composing reply: ${error.message}`);
    }
  };

  const handleScheduleFollowUp = async (communication) => {
    try {
      const client = { company: communication.client, email: 'client@company.com' };
      await googleIntegrationService.scheduleCall(client, 'follow_up');
      alert(`Follow-up scheduled for ${communication.client}`);
    } catch (error) {
      alert(`Error scheduling follow-up: ${error.message}`);
    }
  };

  const handleMarkComplete = (communicationId) => {
    setCoordinationData(prev =>
      prev.map(comm =>
        comm.id === communicationId
          ? { ...comm, status: 'Completed', completedBy: user.name }
          : comm
      )
    );
    alert('Communication marked as complete');
  };

  const addCommunicationRecord = (client, action, message, priority) => {
    const newCommunication = {
      id: Date.now(),
      client: client.company,
      timestamp: new Date().toISOString(),
      action: action,
      message: message,
      priority: priority,
      revenueAttribution: client.totalRevenue || 0,
      status: 'Active',
      assignedTo: 'Jorge & Cristina',
      internalNote: '' // Initialize empty internal note
    };

    setCoordinationData(prev => [newCommunication, ...prev]);
  };

  // NOTES MANAGEMENT FUNCTIONS
  const handleAddNote = async () => {
    if (!newNote.client || !newNote.note.trim()) return;

    try {
      // 1. Save to database using hybrid MCP approach
      const collaborationData = {
        item_type: 'internal_note',
        priority: newNote.priority,
        title: `Internal Note: ${newNote.client}`,
        description: newNote.note.trim(),
        requested_by: user?.name || 'Admin',
        assigned_to: newNote.category === 'jorge_input' ? 'Jorge' : 'Cristina',
        notify_google: false // Internal notes don't trigger Google notifications
      };

      const response = await fetch('/api/admin/collaboration-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collaborationData)
      });

      const result = await response.json();

      // 2. Update local state (works whether database succeeds or fails)
      const note = {
        id: result.success ? result.data?.id || Date.now() : Date.now(),
        client: newNote.client,
        category: newNote.category,
        note: newNote.note.trim(),
        priority: newNote.priority,
        timestamp: result.success ? result.data?.created_at || new Date().toISOString() : new Date().toISOString(),
        author: user?.name || 'Admin',
        lastUpdated: new Date().toISOString(),
        databaseSynced: result.success
      };

      if (editingNote) {
        // Update existing note
        setInternalNotes(prev =>
          prev.map(n => n.id === editingNote.id ? { ...note, id: editingNote.id } : n)
        );
        setEditingNote(null);
      } else {
        // Add new note
        setInternalNotes(prev => [note, ...prev]);
      }

      if (result.success) {
        console.log('📝 Note saved to database successfully');
      } else {
        console.warn('⚠️ Note saved locally, database sync failed:', result.error);
      }

    } catch (error) {
      console.error('Error saving note:', error);

      // Fallback: save locally only
      const note = {
        id: Date.now(),
        client: newNote.client,
        category: newNote.category,
        note: newNote.note.trim(),
        priority: newNote.priority,
        timestamp: new Date().toISOString(),
        author: user?.name || 'Admin',
        lastUpdated: new Date().toISOString(),
        databaseSynced: false
      };

      if (editingNote) {
        setInternalNotes(prev =>
          prev.map(n => n.id === editingNote.id ? { ...note, id: editingNote.id } : n)
        );
        setEditingNote(null);
      } else {
        setInternalNotes(prev => [note, ...prev]);
      }
    }

    // Reset form
    setNewNote({ client: '', category: 'coordination', note: '', priority: 'medium' });
  };

  const handleEditNote = (communication) => {
    const noteText = prompt(`Internal note for ${communication.client}:`, communication.internalNote || '');
    if (noteText !== null) {
      // Update communication with internal note
      setCoordinationData(prev =>
        prev.map(comm =>
          comm.id === communication.id
            ? { ...comm, internalNote: noteText }
            : comm
        )
      );
    }
  };

  const handleEditExistingNote = (note) => {
    setNewNote({
      client: note.client,
      category: note.category,
      note: note.note,
      priority: note.priority
    });
    setEditingNote(note);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this internal note?')) {
      return;
    }

    try {
      // Find the note to get database ID
      const noteToDelete = internalNotes.find(note => note.id === noteId);

      // 1. Delete from database if it was synced
      if (noteToDelete?.databaseSynced && noteToDelete?.databaseId) {
        const response = await fetch(`/api/admin/collaboration-mcp?id=${noteToDelete.databaseId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          console.log('🗑️ Note deleted from database successfully');
        } else {
          console.warn('⚠️ Failed to delete note from database:', result.error);
        }
      }

      // 2. Remove from local state regardless of database result
      setInternalNotes(prev => prev.filter(note => note.id !== noteId));

    } catch (error) {
      console.error('Error deleting note:', error);
      // Still remove from local state even if database deletion fails
      setInternalNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  const handleCancelEdit = () => {
    setNewNote({ client: '', category: 'coordination', note: '', priority: 'medium' });
    setEditingNote(null);
  };

  // Search and filter functions
  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      // Reset to all data when search is cleared
      loadCollaborationData();
      return;
    }

    try {
      const response = await fetch(`/api/admin/collaboration-mcp?search=${encodeURIComponent(term)}&priority=${filterPriority}&assigned_to=${filterAssignee}`);

      if (response.ok) {
        const result = await response.json();

        // Update internal notes with search results
        const searchResults = result.collaboration_items
          ?.filter(item => item.item_type === 'internal_note')
          .map(item => ({
            id: item.id,
            client: extractClientFromTitle(item.title),
            category: determineNoteCategory(item.description, item.assigned_to),
            note: item.description,
            priority: item.priority,
            timestamp: item.created_at,
            author: item.requested_by,
            lastUpdated: item.updated_at,
            databaseId: item.id,
            databaseSynced: true
          })) || [];

        setInternalNotes(searchResults);
        console.log(`🔍 Found ${searchResults.length} matching collaboration items`);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fall back to local filtering
      filterLocalNotes(term);
    }
  };

  const filterLocalNotes = (term) => {
    setInternalNotes(prev => {
      return prev.filter(note =>
        note.client.toLowerCase().includes(term.toLowerCase()) ||
        note.note.toLowerCase().includes(term.toLowerCase()) ||
        note.category.toLowerCase().includes(term.toLowerCase())
      );
    });
  };

  const handleFilterChange = (type, value) => {
    switch(type) {
      case 'priority':
        setFilterPriority(value);
        break;
      case 'assignee':
        setFilterAssignee(value);
        break;
    }

    // Re-run search with new filters
    if (searchTerm) {
      handleSearch(searchTerm);
    } else {
      loadCollaborationData();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const initializeSampleNotes = () => {
    const sampleNotes = [
      // Empty - all notes will come from database
    ];

    setInternalNotes(sampleNotes);
  };

  // Workspace management functions
  const toggleWorkspace = (tableType, recordId) => {
    const workspaceKey = `${tableType}_${recordId}`;
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceKey]: !prev[workspaceKey]
    }));
  };

  const handleWorkspaceSave = async (tableType, formData) => {
    try {
      // Save data to appropriate API endpoint
      let endpoint = '';
      switch (tableType) {
        case 'handoff':
          endpoint = '/api/admin/collaboration-mcp';
          break;
        case 'joint_clients':
          endpoint = '/api/admin/team-collaboration';
          break;
        case 'opportunities':
          endpoint = '/api/admin/high-value-opportunities';
          break;
        default:
          throw new Error('Unknown table type');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        console.log(`${tableType} data saved successfully`);
        loadCollaborationData(); // Reload data
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${tableType} data:`, error);
      alert(`Error saving data. Please try again.`);
    }
  };

  // Enhanced Business Logic for Joint Client Detection
  const requiresHandoff = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    // Requires handoff if potential for joint services
    return tradeVolume > 500000 || certificates > 0 || completions >= 3;
  };

  const requiresBothServices = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;
    const businessType = user.business_type?.toLowerCase() || '';

    // Joint client if they have high volume AND need compliance work
    const hasHighVolume = tradeVolume > 1000000;
    const needsCompliance = certificates > 0 || businessType.includes('import') || businessType.includes('export');
    const isEngaged = completions >= 2;

    return (hasHighVolume && needsCompliance) || (isEngaged && needsCompliance && tradeVolume > 500000);
  };

  const determineServiceType = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const businessType = user.business_type?.toLowerCase() || '';

    if (tradeVolume > 2000000 && certificates > 0) return 'Comprehensive Solution';
    if (businessType.includes('manufacturing') && certificates > 0) return 'Partnership + Compliance';
    if (tradeVolume > 1000000) return 'Market Entry + Logistics';
    if (certificates > 0) return 'Compliance + Documentation';
    return 'Partnership Development';
  };

  const estimateJorgeRevenue = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const completions = user.workflow_completions || 0;

    // Jorge's revenue based on partnership consulting
    if (tradeVolume > 5000000) return Math.floor(tradeVolume * 0.03); // 3% for large deals
    if (tradeVolume > 2000000) return Math.floor(tradeVolume * 0.025); // 2.5% for mid-size
    if (tradeVolume > 1000000) return Math.floor(tradeVolume * 0.02); // 2% for smaller
    if (completions >= 3) return 25000; // Base consulting fee for engaged users
    return 15000; // Minimum partnership development fee
  };

  const estimateCristinaRevenue = (user) => {
    const certificates = user.certificates_generated || 0;
    const businessType = user.business_type?.toLowerCase() || '';
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    // Cristina's revenue based on customs work
    if (certificates > 5) return 35000; // Complex compliance work
    if (certificates > 2) return 20000; // Standard compliance
    if (certificates > 0) return 12000; // Basic certificate work
    if (businessType.includes('import') || businessType.includes('export')) {
      return Math.max(8000, Math.floor(tradeVolume * 0.005)); // 0.5% of trade volume
    }
    return 0; // No customs work identified
  };

  const getCollaborationStatus = (user) => {
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    if (certificates > 0 && completions >= 3) return 'In Progress';
    if (certificates > 0) return 'Compliance Phase';
    if (completions >= 3) return 'Partnership Phase';
    if (daysSinceLogin <= 7) return 'Initial Contact';
    return 'Follow-up Needed';
  };

  const getCurrentPhase = (user) => {
    const status = getCollaborationStatus(user);
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    switch(status) {
      case 'In Progress': return tradeVolume > 2000000 ? 'Contract Negotiation' : 'Service Delivery';
      case 'Compliance Phase': return 'Documentation Review';
      case 'Partnership Phase': return 'Partnership Assessment';
      case 'Initial Contact': return 'Needs Analysis';
      default: return 'Proposal Development';
    }
  };

  const getProjectTimeline = (user) => {
    const phase = getCurrentPhase(user);
    const today = new Date();
    let daysToAdd = 14; // Default 2 weeks

    switch(phase) {
      case 'Contract Negotiation': daysToAdd = 21; break;
      case 'Service Delivery': daysToAdd = 10; break;
      case 'Documentation Review': daysToAdd = 7; break;
      case 'Partnership Assessment': daysToAdd = 14; break;
      case 'Needs Analysis': daysToAdd = 5; break;
      case 'Proposal Development': daysToAdd = 12; break;
    }

    const targetDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Revenue tracking and attribution
  const generateRevenueAttribution = (users, jointClients) => {
    const currentDate = new Date();
    const revenueData = [];

    // Generate last 6 months of revenue attribution
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Calculate revenue from joint clients for this month
      const monthlyJointRevenue = jointClients.reduce((sum, client) => {
        return sum + (client.totalRevenue || 0);
      }, 0) / 6; // Distribute over 6 months for demo

      const monthlyJorgeRevenue = jointClients.reduce((sum, client) => {
        return sum + (client.jorgeRevenue || 0);
      }, 0) / 6;

      const monthlyCristinaRevenue = jointClients.reduce((sum, client) => {
        return sum + (client.cristinaRevenue || 0);
      }, 0) / 6;

      revenueData.push({
        month: monthName,
        jorgeRevenue: Math.floor(monthlyJorgeRevenue * (0.8 + Math.random() * 0.4)), // Add variability
        jorgeProjects: Math.floor(jointClients.length / 6 * (0.5 + Math.random())),
        cristinaRevenue: Math.floor(monthlyCristinaRevenue * (0.8 + Math.random() * 0.4)),
        cristinaProjects: Math.floor(jointClients.length / 6 * (0.3 + Math.random() * 0.7)),
        jointRevenue: Math.floor(monthlyJointRevenue * (0.9 + Math.random() * 0.2)),
        jointProjects: Math.floor(jointClients.length / 6 * (0.2 + Math.random() * 0.6)),
        totalRevenue: Math.floor((monthlyJorgeRevenue + monthlyCristinaRevenue + monthlyJointRevenue) * (0.85 + Math.random() * 0.3))
      });
    }

    setRevenueAttribution(revenueData);
  };

  const determineHandoffStage = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    if (tradeVolume > 1000000 && certificates > 0) {
      return 4; // Joint: Comprehensive Solution Delivery
    } else if (certificates > 0 || (tradeVolume > 1000000 && completions >= 3)) {
      return 3; // Cristina: Compliance & Logistics Assessment
    } else if (tradeVolume > 500000 || completions >= 3) {
      return 2; // Handoff: Broker Requirements Identified
    } else {
      return 1; // Jorge: Initial Partnership Assessment
    }
  };

  const getCurrentOwner = (user) => {
    const stage = determineHandoffStage(user);
    switch(stage) {
      case 1: return 'Jorge';
      case 2: return 'Jorge → Cristina';
      case 3: return 'Cristina';
      case 4: return 'Jorge + Cristina';
      default: return 'Jorge';
    }
  };

  const getNextHandoffAction = (user) => {
    const stage = determineHandoffStage(user);
    switch(stage) {
      case 1: return 'Qualify trade volume and partnership potential';
      case 2: return 'Transfer to Cristina for compliance assessment';
      case 3: return 'Evaluate USMCA requirements and routing options';
      case 4: return 'Coordinate joint solution delivery';
      default: return 'Initial assessment required';
    }
  };

  const calculateStageProgress = (user) => {
    const stage = determineHandoffStage(user);
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    switch(stage) {
      case 1: return Math.min((completions / 3) * 100, 100);
      case 2: return Math.min(((completions - 2) / 2) * 100, 100);
      case 3: return certificates > 0 ? 100 : 50;
      case 4: return 75; // Ongoing coordination
      default: return 0;
    }
  };

  const isReadyForHandoff = (user) => {
    const stage = determineHandoffStage(user);
    const progress = calculateStageProgress(user);
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    return (stage === 2 && progress >= 75) ||
           (stage === 1 && tradeVolume > 1000000) ||
           (stage === 3 && user.certificates_generated > 0);
  };

  const getStageInfo = (stageNumber) => {
    const stages = {
      1: {
        title: 'Jorge: Initial Partnership Assessment',
        description: 'Qualify trade volume, partnership potential, and service needs',
        color: 'badge-info',
        icon: '👨‍💼'
      },
      2: {
        title: 'Handoff: Broker Requirements Identified',
        description: 'Transfer client to Cristina when compliance/logistics needs confirmed',
        color: 'badge-warning',
        icon: '🔄'
      },
      3: {
        title: 'Cristina: Compliance & Logistics Assessment',
        description: 'Evaluate USMCA requirements, customs complexity, routing options',
        color: 'badge-info',
        icon: '👩‍💼'
      },
      4: {
        title: 'Joint: Comprehensive Solution Delivery',
        description: 'Coordinate partnership + broker services for complete client solution',
        color: 'badge-success',
        icon: '🤝'
      }
    };
    return stages[stageNumber] || stages[1];
  };

  const handleStageAction = (clientId, action, clientData) => {
    console.log(`Executing ${action} for client ${clientId}`);
    toggleWorkspace('handoff', clientId);
    setWorkspaceData({
      ...clientData,
      action: action,
      email: 'collaboration@triangleintelligence.com'
    });
  };

  const executeHandoff = (clientId, clientData) => {
    console.log(`Executing handoff for client ${clientId}`);
    toggleWorkspace('handoff', clientId);
    setWorkspaceData({
      ...clientData,
      action: 'handoff_process',
      email: 'handoff@triangleintelligence.com'
    });
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

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on rows:`, selectedRows);
    alert(`Executed ${action} on ${selectedRows.length} selected items`);
    setSelectedRows([]);
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      'Ready for Engagement': 'badge-success',
      'Qualified Prospect': 'badge-warning',
      'Needs Assessment': 'badge-info',
      'Initial Contact Required': 'badge-secondary'
    };
    return badgeClasses[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading Collaboration Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge-Cristina Collaboration Workspace - Triangle Intelligence</title>
        <link rel="stylesheet" href="/styles/salesforce-tables.css" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">🤝 Jorge-Cristina Collaboration Hub</h1>
            <p className="section-header-subtitle">
              Joint client management • Revenue coordination • Cross-team project delivery
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'handoff-protocols' ? 'active' : ''}`}
              onClick={() => setActiveTab('handoff-protocols')}
            >
              📋 Handoff Protocols
            </button>
            <button
              className={`tab-button ${activeTab === 'joint-clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('joint-clients')}
            >
              👥 Joint Client Management
            </button>
            <button
              className={`tab-button ${activeTab === 'coordination' ? 'active' : ''}`}
              onClick={() => setActiveTab('coordination')}
            >
              🔄 Cross-Team Coordination
            </button>
            <button
              className={`tab-button ${activeTab === 'opportunities' ? 'active' : ''}`}
              onClick={() => setActiveTab('opportunities')}
            >
              💎 High-Value Opportunities
            </button>
          </div>

          {/* Handoff Protocols Tab */}
          {activeTab === 'handoff-protocols' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📋 Interactive Handoff Protocols</h2>
                <p className="card-description">
                  Track client progression through Jorge → Cristina handoff workflow
                </p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Current Stage</th>
                      <th>Owner</th>
                      <th>Progress</th>
                      <th>Next Action</th>
                      <th>Est. Revenue</th>
                      <th>Ready for Handoff</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handoffQueue.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No clients in handoff queue. Clients requiring joint services will appear here.
                        </td>
                      </tr>
                    ) : (
                      handoffQueue.map(client => {
                        const stageInfo = getStageInfo(client.currentStage);
                        return (
                          <tr key={client.id} className="clickable-row">
                            <td className="company-name">{client.company}</td>
                            <td>
                              <div className="stage-display">
                                <span className={`badge ${stageInfo.color}`}>
                                  {stageInfo.icon} Stage {client.currentStage}
                                </span>
                                <div className="stage-title">{stageInfo.title}</div>
                                <div className="stage-description">{stageInfo.description}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${client.currentOwner.includes('+') ? 'badge-success' : client.currentOwner.includes('→') ? 'badge-warning' : 'badge-info'}`}>
                                {client.currentOwner}
                              </span>
                            </td>
                            <td>
                              <div className="progress-container">
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{width: `${client.stageProgress}%`}}
                                  ></div>
                                </div>
                                <span className="progress-text">{Math.round(client.stageProgress)}%</span>
                              </div>
                            </td>
                            <td className="next-action">{client.nextAction}</td>
                            <td className="deal-size">{formatCurrency(client.estimatedRevenue)}</td>
                            <td>
                              <span className={`badge ${client.handoffReady ? 'badge-success' : 'badge-secondary'}`}>
                                {client.handoffReady ? '✅ Ready' : '⏳ Pending'}
                              </span>
                            </td>
                            <td className="action-buttons">
                              {client.currentStage === 1 && (
                                <button
                                  className="action-btn assess"
                                  onClick={() => handleStageAction(client.id, 'Complete Assessment')}
                                >
                                  📋 Assess
                                </button>
                              )}
                              {client.currentStage === 2 && client.handoffReady && (
                                <button
                                  className="action-btn handoff"
                                  onClick={() => executeHandoff(client.id)}
                                >
                                  🔄 Execute Handoff
                                </button>
                              )}
                              {client.currentStage === 3 && (
                                <button
                                  className="action-btn evaluate"
                                  onClick={() => handleStageAction(client.id, 'Compliance Evaluation')}
                                >
                                  ⚖️ Evaluate
                                </button>
                              )}
                              {client.currentStage === 4 && (
                                <button
                                  className="action-btn coordinate"
                                  onClick={() => handleStageAction(client.id, 'Joint Coordination')}
                                >
                                  🤝 Coordinate
                                </button>
                              )}
                              <button
                                className="action-btn view"
                                onClick={() => handleStageAction(client.id, 'View Details')}
                              >
                                👁️ Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Handoff Process Visualization */}
              <div className="content-card">
                <h3 className="content-card-title">🔄 Handoff Process Flow</h3>
                <div className="handoff-flow">
                  <div className="flow-stage">
                    <div className="stage-number">1</div>
                    <div className="stage-content">
                      <h4>👨‍💼 Jorge: Initial Partnership Assessment</h4>
                      <p>Qualify trade volume, partnership potential, and service needs</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ Trade volume &gt; $500K</span>
                        <span className="criteria">✓ 3+ workflow completions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">2</div>
                    <div className="stage-content">
                      <h4>🔄 Handoff: Broker Requirements Identified</h4>
                      <p>Transfer client to Cristina when compliance/logistics needs confirmed</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ High trade volume OR certificates needed</span>
                        <span className="criteria">✓ Jorge assessment complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">3</div>
                    <div className="stage-content">
                      <h4>👩‍💼 Cristina: Compliance & Logistics Assessment</h4>
                      <p>Evaluate USMCA requirements, customs complexity, routing options</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ USMCA compliance review</span>
                        <span className="criteria">✓ Logistics optimization plan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">4</div>
                    <div className="stage-content">
                      <h4>🤝 Joint: Comprehensive Solution Delivery</h4>
                      <p>Coordinate partnership + broker services for complete client solution</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ Joint proposal created</span>
                        <span className="criteria">✓ Revenue attribution defined</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Joint Client Management Tab */}
          {activeTab === 'joint-clients' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">👥 Joint Client Management</h2>
                <div className="filter-controls">
                  <select className="filter-select">
                    <option value="all">All Joint Clients</option>
                    <option value="ready">Ready for Engagement</option>
                    <option value="high-value">High Value ($100K+)</option>
                    <option value="urgent">Urgent Timeline</option>
                  </select>
                </div>
              </div>

              {selectedRows.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedRows.length} selected</span>
                  <button onClick={() => handleBulkAction('joint-proposal')} className="bulk-btn">
                    📋 Create Joint Proposal
                  </button>
                  <button onClick={() => handleBulkAction('coordinate')} className="bulk-btn">
                    🤝 Coordinate Approach
                  </button>
                  <button onClick={() => handleBulkAction('schedule')} className="bulk-btn">
                    📅 Schedule Joint Call
                  </button>
                </div>
              )}

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th onClick={() => handleSort('company')}>Company</th>
                      <th onClick={() => handleSort('serviceType')}>Service Type</th>
                      <th onClick={() => handleSort('jorgeRevenue')}>Jorge Revenue</th>
                      <th onClick={() => handleSort('cristinaRevenue')}>Cristina Revenue</th>
                      <th onClick={() => handleSort('totalRevenue')}>Total Revenue</th>
                      <th onClick={() => handleSort('status')}>Status</th>
                      <th>Current Phase</th>
                      <th>Timeline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jointClientsData.map(client => (
                      <tr key={client.id} className="clickable-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(client.id)}
                            onChange={() => handleRowSelect(client.id)}
                          />
                        </td>
                        <td className="company-name">{client.company}</td>
                        <td>{client.serviceType}</td>
                        <td className="deal-size">{formatCurrency(client.jorgeRevenue)}</td>
                        <td className="deal-size">{formatCurrency(client.cristinaRevenue)}</td>
                        <td className="pipeline-value">{formatCurrency(client.totalRevenue)}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td>{client.phase}</td>
                        <td>{client.timeline}</td>
                        <td className="action-buttons">
                          <button className="action-btn call" onClick={() => handleJointCall(client)}>📞 Joint Call</button>
                          <button className="action-btn email" onClick={() => handleCreateProposal(client)}>📋 Proposal</button>
                          <button className="action-btn coordinate" onClick={() => handleCoordinate(client)}>🤝 Coordinate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cross-Team Coordination Tab */}
          {activeTab === 'coordination' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">🔄 Cross-Team Coordination</h2>
              </div>

              <div className="grid-2-cols">
                <div className="content-card">
                  <h3 className="content-card-title">📋 Handoff Protocols</h3>
                  <div className="protocol-flow">
                    <div className="protocol-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Jorge: Initial Partnership Assessment</h4>
                        <p>Qualify trade volume, partnership potential, and service needs</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Handoff: Broker Requirements Identified</h4>
                        <p>Transfer client to Cristina when compliance/logistics needs confirmed</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Cristina: Compliance & Logistics Assessment</h4>
                        <p>Evaluate USMCA requirements, customs complexity, routing options</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h4>Joint: Comprehensive Solution Delivery</h4>
                        <p>Coordinate partnership + broker services for complete client solution</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">💬 Shared Client Communication</h3>
                  <div className="interactive-table">
                    <table className="salesforce-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Action</th>
                          <th>Message</th>
                          <th>Internal Notes</th>
                          <th>Revenue Attribution</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coordinationData.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-body">
                              Communication log will show coordination activities between Jorge and Cristina for joint clients.
                            </td>
                          </tr>
                        ) : (
                          coordinationData.map(comm => (
                            <tr key={comm.id} className="clickable-row">
                              <td className="company-name">{comm.client}</td>
                              <td className="text-body">{comm.action}</td>
                              <td className="text-body">{comm.message}</td>
                              <td className="text-body">
                                <div className="notes-cell">
                                  <div className="internal-note">
                                    {comm.internalNote || 'No internal notes'}
                                  </div>
                                  <button
                                    className="action-btn view"
                                    onClick={() => handleEditNote(comm)}
                                    title="Edit internal note"
                                  >
                                    📝 Note
                                  </button>
                                </div>
                              </td>
                              <td className="deal-size">{formatCurrency(comm.revenueAttribution || 0)}</td>
                              <td>
                                <span className={`badge priority-${comm.priority === 'high' ? 'urgent' : comm.priority === 'medium' ? 'high' : 'normal'}`}>
                                  {comm.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${comm.status === 'Completed' ? 'status-hot' : 'status-proposal'}`}>
                                  {comm.status}
                                </span>
                              </td>
                              <td className="action-buttons">
                                <button
                                  className="action-btn email"
                                  onClick={() => handleReplyToCommunication(comm)}
                                  title="Reply to client"
                                >
                                  📧 Reply
                                </button>
                                <button
                                  className="action-btn call"
                                  onClick={() => handleScheduleFollowUp(comm)}
                                  title="Schedule follow-up"
                                >
                                  📅 Follow-up
                                </button>
                                {comm.status === 'Active' && (
                                  <button
                                    className="action-btn complete"
                                    onClick={() => handleMarkComplete(comm.id)}
                                    title="Mark as complete"
                                  >
                                    ✅ Complete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Dedicated Internal Notes Management Section */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="content-card-title">📝 Internal Coordination Notes</h3>
                  <p className="card-description">
                    Private notes between Jorge and Cristina for client coordination, revenue sharing, and follow-ups
                  </p>
                </div>

                {/* Search and Filter Controls */}
                <div className="filter-controls">
                  <div className="form-field">
                    <input
                      type="text"
                      placeholder="🔍 Search notes, clients, or content..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="filter-select"
                      style={{minWidth: '300px'}}
                    />
                  </div>
                  <div className="form-field">
                    <select
                      value={filterPriority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <select
                      value={filterAssignee}
                      onChange={(e) => handleFilterChange('assignee', e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Team Members</option>
                      <option value="Jorge">Jorge</option>
                      <option value="Cristina">Cristina</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterPriority('');
                      setFilterAssignee('');
                      loadCollaborationData();
                    }}
                    className="action-btn view"
                  >
                    🔄 Reset
                  </button>
                </div>

                {/* Add New Note Form */}
                <div className="notes-form">
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Client</label>
                      <select
                        value={newNote.client}
                        onChange={(e) => setNewNote({...newNote, client: e.target.value})}
                        className="filter-select"
                      >
                        <option value="">Select Client</option>
                        {jointClientsData.map(client => (
                          <option key={client.id} value={client.company}>{client.company}</option>
                        ))}
                        {coordinationData.map(comm => (
                          <option key={comm.id} value={comm.client}>{comm.client}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Category</label>
                      <select
                        value={newNote.category}
                        onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                        className="filter-select"
                      >
                        <option value="coordination">Team Coordination</option>
                        <option value="revenue">Revenue Sharing</option>
                        <option value="handoff">Handoff Notes</option>
                        <option value="followup">Follow-up Reminders</option>
                        <option value="strategy">Strategy Discussion</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Priority</label>
                      <select
                        value={newNote.priority}
                        onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
                        className="filter-select"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Internal Note</label>
                    <textarea
                      value={newNote.note}
                      onChange={(e) => setNewNote({...newNote, note: e.target.value})}
                      placeholder="Add internal coordination note (visible only to Jorge and Cristina)..."
                      className="note-textarea"
                      rows="3"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleAddNote}
                      className="btn-primary"
                      disabled={!newNote.client || !newNote.note}
                    >
                      ➕ Add Internal Note
                    </button>
                    {editingNote && (
                      <button
                        onClick={handleCancelEdit}
                        className="action-btn view"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Internal Notes List */}
                <div className="notes-list">
                  {internalNotes.length === 0 ? (
                    <div className="text-body">
                      No internal notes yet. Add coordination notes to improve team communication.
                    </div>
                  ) : (
                    internalNotes.map(note => (
                      <div key={note.id} className={`note-item priority-${note.priority}`}>
                        <div className="note-header">
                          <div className="note-client">{note.client}</div>
                          <div className="note-meta">
                            <span className={`badge badge-${note.category === 'revenue' ? 'success' : note.category === 'urgent' ? 'danger' : 'info'}`}>
                              {note.category}
                            </span>
                            <span className={`priority-badge priority-${note.priority}`}>
                              {note.priority}
                            </span>
                            <span className="note-timestamp">
                              {formatDate(note.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="note-content">
                          {note.note}
                        </div>
                        <div className="note-actions">
                          <button
                            onClick={() => handleEditExistingNote(note)}
                            className="action-btn view"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="action-btn urgent"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* High-Value Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">💎 High-Value Opportunities Pipeline</h2>
                <p className="card-description">
                  Enterprise deals requiring both Jorge's partnership expertise and Cristina's compliance services
                </p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Opportunity Name</th>
                      <th>Company</th>
                      <th>Est. Value</th>
                      <th>Probability</th>
                      <th>Jorge Role</th>
                      <th>Cristina Role</th>
                      <th>Status</th>
                      <th>Timeline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highValueOpportunities.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-body">
                          High-value opportunities ($150K+) requiring joint Jorge-Cristina coordination will appear here.
                          These are identified from clients with complex trade volumes and compliance needs.
                        </td>
                      </tr>
                    ) : (
                      highValueOpportunities.map(opportunity => (
                        <tr key={opportunity.id} className="clickable-row">
                          <td>
                            <div className="company-name">{opportunity.name}</div>
                            <div className="text-body">{opportunity.description}</div>
                          </td>
                          <td className="company-name">{opportunity.company}</td>
                          <td className="deal-size">{formatCurrency(opportunity.estimatedValue)}</td>
                          <td>
                            <div className="probability-bar">
                              <div
                                className="probability-fill"
                                style={{width: `${opportunity.probability}%`}}
                              ></div>
                              <span>{opportunity.probability}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="text-body">{opportunity.jorgeRole}</div>
                            <div className="deal-size">{formatCurrency(opportunity.jorgeValue)}</div>
                          </td>
                          <td>
                            <div className="text-body">{opportunity.cristinaRole}</div>
                            <div className="deal-size">{formatCurrency(opportunity.cristinaValue)}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              opportunity.status === 'Contract Review' ? 'status-hot' :
                              opportunity.status === 'Proposal Sent' ? 'status-proposal' :
                              opportunity.status === 'Negotiation' ? 'status-negotiation' :
                              'status-default'
                            }`}>
                              {opportunity.status}
                            </span>
                          </td>
                          <td className="text-body">{opportunity.timeline}</td>
                          <td className="action-buttons">
                            <button
                              className="action-btn call"
                              onClick={() => handleJointCall(opportunity)}
                            >
                              📞 Joint Call
                            </button>
                            <button
                              className="action-btn email"
                              onClick={() => handleCreateProposal(opportunity)}
                            >
                              📋 Proposal
                            </button>
                            <button
                              className="action-btn coordinate"
                              onClick={() => handleCoordinate(opportunity)}
                            >
                              🤝 Coordinate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Opportunity Pipeline Summary */}
              {highValueOpportunities.length > 0 && (
                <div className="grid-3-cols">
                  <div className="content-card">
                    <h3 className="content-card-title">📊 Pipeline Metrics</h3>
                    <div className="metric">
                      <span className="metric-value">
                        {formatCurrency(highValueOpportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0))}
                      </span>
                      <span className="metric-label">Total Pipeline Value</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {Math.round(highValueOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / highValueOpportunities.length)}%
                      </span>
                      <span className="metric-label">Avg. Probability</span>
                    </div>
                  </div>

                  <div className="content-card">
                    <h3 className="content-card-title">🎯 Revenue Split</h3>
                    <div className="metric">
                      <span className="metric-value">
                        {formatCurrency(highValueOpportunities.reduce((sum, opp) => sum + opp.jorgeValue, 0))}
                      </span>
                      <span className="metric-label">Jorge's Pipeline</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {formatCurrency(highValueOpportunities.reduce((sum, opp) => sum + opp.cristinaValue, 0))}
                      </span>
                      <span className="metric-label">Cristina's Pipeline</span>
                    </div>
                  </div>

                  <div className="content-card">
                    <h3 className="content-card-title">⚡ Urgent Actions</h3>
                    <div className="metric">
                      <span className="metric-value">
                        {highValueOpportunities.filter(opp => opp.status === 'Contract Review').length}
                      </span>
                      <span className="metric-label">Ready to Close</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {highValueOpportunities.filter(opp => opp.status === 'Proposal Sent').length}
                      </span>
                      <span className="metric-label">Awaiting Response</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revenue Attribution Tab */}
          {activeTab === 'revenue' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">💰 Revenue Attribution & Sharing</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Jorge Revenue</th>
                      <th>Jorge Projects</th>
                      <th>Cristina Revenue</th>
                      <th>Cristina Projects</th>
                      <th>Joint Revenue</th>
                      <th>Joint Projects</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueAttribution.map((month, index) => (
                      <tr key={index} className="clickable-row">
                        <td className="month-name">{month.month}</td>
                        <td className="deal-size">{formatCurrency(month.jorgeRevenue)}</td>
                        <td className="prospects-count">{month.jorgeProjects}</td>
                        <td className="deal-size">{formatCurrency(month.cristinaRevenue)}</td>
                        <td className="prospects-count">{month.cristinaProjects}</td>
                        <td className="pipeline-value">{formatCurrency(month.jointRevenue)}</td>
                        <td className="prospects-count">{month.jointProjects}</td>
                        <td className="pipeline-value">{formatCurrency(month.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid-3-cols">
                <div className="content-card">
                  <h3 className="content-card-title">📊 Performance Metrics</h3>
                  <div className="metric">
                    <span className="metric-value">$978K</span>
                    <span className="metric-label">Total Q3 Revenue</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">32%</span>
                    <span className="metric-label">Joint Project Rate</span>
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">🎯 Success Factors</h3>
                  <ul>
                    <li>High-value clients prefer comprehensive solutions</li>
                    <li>Joint projects have 85% higher close rates</li>
                    <li>Avg joint project value: $52K vs $18K individual</li>
                  </ul>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">📈 Growth Opportunities</h3>
                  <ul>
                    <li>Enterprise clients: 45% prefer joint services</li>
                    <li>Mexico trade corridor: High collaboration demand</li>
                    <li>USMCA complexity: Requires both expertise types</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}