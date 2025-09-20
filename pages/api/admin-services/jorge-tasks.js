/**
 * Jorge's Tasks API - Real task management from database
 * Returns actual priority tasks, deadlines, and work items
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current date for deadline filtering
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 7);

    // Query service requests assigned to Jorge that need attention today
    const { data: serviceRequests, error: serviceError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('assigned_to', 'Jorge')
      .in('status', ['pending_consultation', 'research_in_progress', 'proposal_due'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (serviceError) {
      console.error('Service requests query error:', serviceError);
    }

    // Query active projects with upcoming deadlines
    const { data: activeProjects, error: projectError } = await supabase
      .from('active_projects')
      .select('*')
      .eq('assigned_to', 'Jorge')
      .lte('deadline', thisWeek.toISOString())
      .neq('status', 'completed')
      .order('deadline', { ascending: true });

    if (projectError) {
      console.error('Active projects query error:', projectError);
    }

    // Query intelligence briefings due
    const { data: briefings, error: briefingError } = await supabase
      .from('intelligence_briefings')
      .select('*')
      .eq('assigned_to', 'Jorge')
      .lte('due_date', thisWeek.toISOString())
      .neq('status', 'sent')
      .order('due_date', { ascending: true });

    if (briefingError) {
      console.error('Intelligence briefings query error:', briefingError);
    }

    // Combine and prioritize tasks
    const priorityTasks = [];

    // Add urgent service requests
    if (serviceRequests) {
      serviceRequests.forEach(request => {
        let deadline = 'Today';
        let priority = 'medium';

        if (request.status === 'pending_consultation') {
          deadline = 'Schedule ASAP';
          priority = 'high';
        } else if (request.status === 'proposal_due') {
          deadline = 'Due today';
          priority = 'critical';
        }

        priorityTasks.push({
          id: `sr-${request.id}`,
          title: `${request.service_type} - ${request.company_name}`,
          description: `${request.status.replace('_', ' ')} • ${request.requirements || 'No details provided'}`,
          deadline: deadline,
          priority: priority,
          type: 'service_request',
          client: request.company_name,
          value: getServiceValue(request.service_type)
        });
      });
    }

    // Add project deadlines
    if (activeProjects) {
      activeProjects.forEach(project => {
        const deadlineDate = new Date(project.deadline);
        const isUrgent = deadlineDate <= tomorrow;

        priorityTasks.push({
          id: `proj-${project.id}`,
          title: `${project.project_type} - ${project.client_name}`,
          description: `Project milestone due • ${project.description || 'No details'}`,
          deadline: isUrgent ? 'Due tomorrow' : deadlineDate.toLocaleDateString(),
          priority: isUrgent ? 'critical' : 'high',
          type: 'project_milestone',
          client: project.client_name,
          value: project.project_value || 0
        });
      });
    }

    // Add intelligence briefings
    if (briefings) {
      briefings.forEach(briefing => {
        const dueDate = new Date(briefing.due_date);
        const isOverdue = dueDate < today;

        priorityTasks.push({
          id: `brief-${briefing.id}`,
          title: `Intelligence Briefing - ${briefing.client_name}`,
          description: `Monthly briefing ${briefing.topic || 'General trade intelligence'}`,
          deadline: isOverdue ? 'OVERDUE' : dueDate.toLocaleDateString(),
          priority: isOverdue ? 'critical' : 'medium',
          type: 'intelligence_briefing',
          client: briefing.client_name,
          value: 300
        });
      });
    }

    // Sort by priority and deadline
    const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    priorityTasks.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });

    // Return top priority tasks (limit to 8 for dashboard)
    return res.status(200).json({
      success: true,
      priority_tasks: priorityTasks.slice(0, 8),
      total_tasks: priorityTasks.length,
      critical_count: priorityTasks.filter(t => t.priority === 'critical').length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Jorge tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: 'Could not load task data'
    });
  }
}

// Helper function to get service values
function getServiceValue(serviceType) {
  const serviceValues = {
    'supplier-vetting': 750,
    'market-entry': 3200, // 8 hours average
    'partnership-intelligence': 300
  };

  return serviceValues[serviceType] || 400;
}