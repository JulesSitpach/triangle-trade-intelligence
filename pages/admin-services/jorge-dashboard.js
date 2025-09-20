/**
 * Jorge's Practical Work Dashboard - Mexico/Latin America Specialist
 * Real dashboard for getting work done - tasks, capacity, templates, revenue
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function JorgeDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString());

  // Real work data states
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [capacityData, setCapacityData] = useState({
    supplier_vetting: { current: 0, limit: 10, price: 750 },
    strategy_hours: { current: 0, limit: 15, price: 400 },
    intelligence_clients: { current: 0, limit: 20, price: 300 }
  });
  const [revenueData, setRevenueData] = useState({
    monthly_target: 15000,
    current_revenue: 0,
    average_project: 0,
    repeat_clients: 0
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isAdmin) {
      router.push('/login');
      return;
    }

    loadJorgeWorkData();
  }, [user, isAdmin, authLoading, router]);

  const loadJorgeWorkData = async () => {
    try {
      setLoading(true);

      // Load real data from service APIs
      const [tasksResponse, capacityResponse, revenueResponse] = await Promise.all([
        fetch('/api/admin-services/jorge-tasks'),
        fetch('/api/admin-services/jorge-capacity'),
        fetch('/api/admin-services/jorge-revenue')
      ]);

      // Process today's priority tasks
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        setTodaysTasks(tasks.priority_tasks || []);
      }

      // Process capacity data
      if (capacityResponse.ok) {
        const capacity = await capacityResponse.json();
        setCapacityData(capacity.capacity || capacityData);
      }

      // Process revenue data
      if (revenueResponse.ok) {
        const revenue = await revenueResponse.json();
        setRevenueData(revenue.revenue || revenueData);
      }

    } catch (error) {
      console.error('Error loading Jorge work data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCapacityStatus = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'capacity-critical';
    if (percentage >= 75) return 'capacity-warning';
    return 'capacity-good';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="hero-badge">Loading Jorge's dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Work Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Jorge's Mexico trade services work dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="admin-dashboard">
        {/* Professional Header */}
        <div className="admin-header">
          <h1 className="admin-title">Jorge Rodriguez - Work Dashboard</h1>
          <p className="admin-subtitle">Mexico/Latin America Trade Specialist • {currentDate}</p>
          <div className="credentials-badge">
            <span>Licensed Trade Consultant</span>
            <span className="license-number">#MX-2024-1847</span>
          </div>
        </div>

        {/* Today's Priority Tasks */}
        <div className="revenue-cards">
          {todaysTasks.length > 0 ? (
            todaysTasks.map((task, index) => (
              <div key={index} className="revenue-card jorge">
                <div className="revenue-amount">{task.title}</div>
                <div className="revenue-label">{task.description}</div>
                <div className="revenue-label">Due: {task.deadline}</div>
              </div>
            ))
          ) : (
            <div className="revenue-card">
              <div className="revenue-amount">No Tasks</div>
              <div className="revenue-label">No priority tasks for today</div>
            </div>
          )}
        </div>

        {/* Capacity Tracking */}
        <div className="revenue-cards">
          <div className="revenue-card jorge">
            <div className="revenue-amount">{capacityData.supplier_vetting.current}/{capacityData.supplier_vetting.limit}</div>
            <div className="revenue-label">Supplier Vetting - ${capacityData.supplier_vetting.price} each</div>
          </div>

          <div className="revenue-card jorge">
            <div className="revenue-amount">{capacityData.strategy_hours.current}/{capacityData.strategy_hours.limit}</div>
            <div className="revenue-label">Strategy Hours - ${capacityData.strategy_hours.price}/hour</div>
          </div>

          <div className="revenue-card jorge">
            <div className="revenue-amount">{capacityData.intelligence_clients.current}/{capacityData.intelligence_clients.limit}+</div>
            <div className="revenue-label">Intelligence Clients - ${capacityData.intelligence_clients.price}/month</div>
          </div>
        </div>

        {/* Workflow Tools */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Workflow Tools</h2>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">📋</div>
              <h3 className="content-card-title">Supplier Vetting Checklist</h3>
              <p className="content-card-description">Complete vetting template and research sources</p>
              <button className="btn-primary">Open Template</button>
            </div>

            <div className="content-card">
              <div className="content-card-icon">🎯</div>
              <h3 className="content-card-title">Market Entry Strategies</h3>
              <p className="content-card-description">Pre-built strategy frameworks for Mexico market</p>
              <button className="btn-primary">Open Template</button>
            </div>

            <div className="content-card">
              <div className="content-card-icon">📊</div>
              <h3 className="content-card-title">Intelligence Briefing</h3>
              <p className="content-card-description">Research sources and briefing templates</p>
              <button className="btn-primary">Open Template</button>
            </div>

            <div className="content-card">
              <div className="content-card-icon">💬</div>
              <h3 className="content-card-title">Client Scripts</h3>
              <p className="content-card-description">Communication templates and follow-up scripts</p>
              <button className="btn-primary">Open Scripts</button>
            </div>
          </div>
        </div>

        {/* Revenue Dashboard */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Revenue Dashboard</h2>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">🎯</div>
              <h3 className="content-card-title">Monthly Target</h3>
              <div className="status-value">${revenueData.monthly_target.toLocaleString()}</div>
              <p className="content-card-description">January 2025</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">💰</div>
              <h3 className="content-card-title">Current Revenue</h3>
              <div className="status-value">${revenueData.current_revenue.toLocaleString()}</div>
              <p className="content-card-description">
                {((revenueData.current_revenue / revenueData.monthly_target) * 100).toFixed(0)}% of target
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">📊</div>
              <h3 className="content-card-title">Average Project</h3>
              <div className="status-value">${revenueData.average_project.toLocaleString()}</div>
              <p className="content-card-description">Per project value</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">🔄</div>
              <h3 className="content-card-title">Repeat Clients</h3>
              <div className="status-value">{revenueData.repeat_clients}</div>
              <p className="content-card-description">This month</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hero-buttons">
          <Link href="/admin-services/service-requests" className="btn-primary">
            View New Requests
          </Link>
          <Link href="/admin-services/active-projects" className="btn-secondary">
            Manage Projects
          </Link>
          <Link href="/admin-services/revenue" className="btn-secondary">
            Full Revenue Report
          </Link>
        </div>
      </div>
    </>
  );
}