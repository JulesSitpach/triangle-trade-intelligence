/**
 * Team Collaboration API
 * Database-driven team project and performance tracking
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
    // Query team collaboration data from database
    const { data: projects, error: projectsError } = await supabase
      .from('team_projects')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: teamMembers, error: teamError } = await supabase
      .from('team_performance')
      .select('*');

    const { data: resources, error: resourcesError } = await supabase
      .from('shared_resources')
      .select('*');

    // If tables are empty, return empty structure
    if (!projects || projects.length === 0) {
      console.log('Team collaboration tables empty, returning empty data');

      return res.status(200).json({
        success: true,
        data: {
          active_projects: [],
          team_performance: {},
          shared_resources: resources || []
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_team_projects',
          last_updated: new Date().toISOString(),
          record_count: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Process real database data
    const teamPerformanceMap = {};
    if (teamMembers && teamMembers.length > 0) {
      teamMembers.forEach(member => {
        teamPerformanceMap[member.name.toLowerCase()] = member;
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        active_projects: projects,
        team_performance: teamPerformanceMap,
        shared_resources: resources || []
      },
      data_status: {
        source: 'database',
        last_updated: new Date().toISOString(),
        record_count: projects.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Team collaboration API error:', error);

    // Return empty data on database error
    return res.status(200).json({
      success: true,
      data: {
        active_projects: [],
        team_performance: {},
        shared_resources: []
      },
      data_status: {
        source: 'database_error',
        reason: 'connection_failed',
        error: error.message,
        last_updated: new Date().toISOString(),
        record_count: 0
      },
      timestamp: new Date().toISOString()
    });
  }
}