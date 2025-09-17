/**
 * TEAM COLLABORATION API
 * Handles team collaboration data for collaboration workspace dashboard
 * Database-driven team coordination and project management
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
    // For now, return sample data structure that matches what the dashboard expects
    // This can be replaced with real database queries later

    const collaborationData = {
      active_projects: [
        {
          id: 1,
          name: "USMCA Certificate Automation",
          status: "in_progress",
          team_members: ["Jorge", "Cristina", "Development Team"],
          progress: 75,
          deadline: "2025-01-30",
          priority: "high",
          mexico_focus: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Mexico Trade Route Optimization",
          status: "planning",
          team_members: ["Cristina", "Mexico Partners"],
          progress: 25,
          deadline: "2025-02-15",
          priority: "medium",
          mexico_focus: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: "Client Onboarding Streamline",
          status: "review",
          team_members: ["Jorge", "Sales Team"],
          progress: 90,
          deadline: "2025-01-25",
          priority: "high",
          mexico_focus: false,
          created_at: new Date().toISOString()
        }
      ],
      team_performance: {
        jorge: {
          name: "Jorge",
          role: "Sales Manager",
          active_deals: 12,
          conversion_rate: 68,
          mexico_deals: 8,
          last_activity: new Date().toISOString()
        },
        cristina: {
          name: "Cristina",
          role: "Broker Operations",
          active_shipments: 23,
          compliance_rate: 94,
          mexico_routes: 18,
          last_activity: new Date().toISOString()
        }
      },
      shared_resources: [
        {
          id: 1,
          name: "Mexico Trade Contacts Database",
          type: "database",
          last_updated: new Date().toISOString(),
          shared_with: ["Jorge", "Cristina"],
          access_level: "read_write"
        },
        {
          id: 2,
          name: "USMCA Compliance Templates",
          type: "documents",
          last_updated: new Date().toISOString(),
          shared_with: ["All Team"],
          access_level: "read_only"
        }
      ],
      communication_logs: [
        {
          id: 1,
          type: "meeting",
          subject: "Weekly Mexico Trade Review",
          participants: ["Jorge", "Cristina"],
          timestamp: new Date().toISOString(),
          status: "completed"
        },
        {
          id: 2,
          type: "message",
          subject: "New Mexico Partner Opportunity",
          participants: ["Jorge"],
          timestamp: new Date().toISOString(),
          status: "unread"
        }
      ]
    };

    console.log('Returning sample team collaboration data for demo');

    res.status(200).json({
      success: true,
      data: collaborationData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Team collaboration API error:', error);
    res.status(500).json({
      error: 'Failed to load team collaboration data',
      details: error.message
    });
  }
}