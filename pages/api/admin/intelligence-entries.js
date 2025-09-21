/**
 * Jorge's Intelligence Entries API - Database-First
 * Manages intelligence entries for client briefings
 * NO hardcoded data, pulls from RSS feeds and market analysis
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getIntelligenceEntries(req, res);
      case 'POST':
        return await createIntelligenceEntry(req, res);
      case 'PUT':
        return await updateIntelligenceEntry(req, res);
      case 'DELETE':
        return await deleteIntelligenceEntry(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Intelligence entries API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getIntelligenceEntries(req, res) {
  const { industry_filter, priority_filter, status_filter } = req.query;

  // Build query filters
  let query = supabase
    .from('intelligence_entries')
    .select(`
      *,
      assigned_clients:intelligence_client_assignments(
        intelligence_subscriptions(
          user_profiles(company_name, business_type)
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters if provided
  if (industry_filter && industry_filter !== 'all') {
    query = query.eq('target_industry', industry_filter);
  }

  if (priority_filter && priority_filter !== 'all') {
    query = query.eq('priority_level', priority_filter);
  }

  if (status_filter && status_filter !== 'all') {
    query = query.eq('status', status_filter);
  }

  const { data: entries, error } = await query;

  if (error && error.code !== 'PGRST116') {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  // Transform entries for frontend
  const transformedEntries = (entries || []).map(entry => ({
    id: entry.id,
    date: entry.created_at,
    type: entry.intelligence_type,
    industry: entry.target_industry,
    description: entry.description,
    priority: entry.priority_level,
    status: entry.status,
    source: entry.source_type,
    clients: entry.assigned_clients?.map(ac =>
      ac.intelligence_subscriptions?.user_profiles?.company_name
    ).filter(Boolean) || [],
    metadata: entry.metadata || {}
  }));

  return res.status(200).json({
    entries: transformedEntries,
    total: transformedEntries.length,
    data_source: entries?.length > 0 ? 'database' : 'empty'
  });
}

async function createIntelligenceEntry(req, res) {
  const {
    intelligence_type,
    target_industry,
    description,
    priority_level,
    source_type,
    source_url,
    client_assignments,
    metadata
  } = req.body;

  // Insert intelligence entry
  const { data: entry, error: entryError } = await supabase
    .from('intelligence_entries')
    .insert([{
      intelligence_type,
      target_industry,
      description,
      priority_level: priority_level || 'medium',
      source_type: source_type || 'manual',
      source_url,
      status: 'pending',
      metadata: metadata || {},
      created_by: 'jorge'
    }])
    .select()
    .single();

  if (entryError) {
    console.error('Error creating intelligence entry:', entryError);
    return res.status(500).json({ error: 'Failed to create intelligence entry' });
  }

  // Assign to clients if specified
  if (client_assignments && client_assignments.length > 0) {
    const assignments = client_assignments.map(clientId => ({
      intelligence_entry_id: entry.id,
      subscription_id: clientId,
      assigned_at: new Date().toISOString()
    }));

    const { error: assignmentError } = await supabase
      .from('intelligence_client_assignments')
      .insert(assignments);

    if (assignmentError) {
      console.error('Error assigning to clients:', assignmentError);
    }
  }

  return res.status(201).json({
    success: true,
    entry: entry,
    message: 'Intelligence entry created successfully'
  });
}

async function updateIntelligenceEntry(req, res) {
  const { id, ...updateData } = req.body;

  const { data: entry, error } = await supabase
    .from('intelligence_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating intelligence entry:', error);
    return res.status(500).json({ error: 'Failed to update intelligence entry' });
  }

  return res.status(200).json({
    success: true,
    entry: entry,
    message: 'Intelligence entry updated successfully'
  });
}

async function deleteIntelligenceEntry(req, res) {
  const { id } = req.body;

  // Delete client assignments first
  await supabase
    .from('intelligence_client_assignments')
    .delete()
    .eq('intelligence_entry_id', id);

  // Delete the intelligence entry
  const { error } = await supabase
    .from('intelligence_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting intelligence entry:', error);
    return res.status(500).json({ error: 'Failed to delete intelligence entry' });
  }

  return res.status(200).json({
    success: true,
    message: 'Intelligence entry deleted successfully'
  });
}