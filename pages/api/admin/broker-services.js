/**
 * ADMIN API: Broker Services Management
 * GET /api/admin/broker-services - Returns active broker service engagements
 * Database-driven professional services tracking for Cristina
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query active broker service engagements
    let { data: services, error: servicesError } = await supabase
      .from('broker_services')
      .select(`
        id,
        company_name,
        service_type,
        status,
        fee_amount,
        start_date,
        completion_date,
        client_satisfaction,
        created_at
      `)
      .order('start_date', { ascending: false });

    // If no broker_services table or no data, return empty
    if (servicesError || !services || services.length === 0) {
      console.log('Broker services table empty, returning empty data');

      return res.status(200).json({
        services: [],
        revenue_summary: {
          current_month: 0,
          previous_month: 0,
          total_revenue: 0,
          active_services: 0,
          completed_services: 0,
          pending_payment: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_broker_services',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Process real database data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthServices = services.filter(service => {
      const serviceDate = new Date(service.start_date);
      return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
    });

    const previousMonthServices = services.filter(service => {
      const serviceDate = new Date(service.start_date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return serviceDate.getMonth() === prevMonth && serviceDate.getFullYear() === prevYear;
    });

    const revenue_summary = {
      current_month: currentMonthServices.reduce((sum, s) => sum + (s.fee_amount || 0), 0),
      previous_month: previousMonthServices.reduce((sum, s) => sum + (s.fee_amount || 0), 0),
      total_revenue: services.reduce((sum, s) => sum + (s.fee_amount || 0), 0),
      active_services: services.filter(s => s.status === 'In Progress' || s.status === 'Active').length,
      completed_services: services.filter(s => s.status === 'Completed').length,
      pending_payment: services.filter(s => s.status === 'Pending Payment').reduce((sum, s) => sum + (s.fee_amount || 0), 0)
    };

    return res.status(200).json({
      services: services.map(service => ({
        id: service.id,
        company: service.company_name,
        serviceType: service.service_type,
        status: service.status,
        feeAmount: service.fee_amount,
        startDate: service.start_date,
        completionDate: service.completion_date,
        clientSatisfaction: service.client_satisfaction
      })),
      revenue_summary: revenue_summary,
      data_status: {
        source: 'database',
        last_updated: new Date().toISOString(),
        record_count: services.length
      }
    });

  } catch (error) {
    console.error('Broker services API error:', error);

    return res.status(200).json({
      services: [],
      revenue_summary: {
        current_month: 0,
        previous_month: 0,
        total_revenue: 0,
        active_services: 0,
        completed_services: 0,
        pending_payment: 0
      },
      data_status: {
        source: 'database_error',
        reason: 'connection_failed',
        error: error.message,
        last_updated: new Date().toISOString(),
        record_count: 0
      }
    });
  }
}