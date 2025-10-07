/**
 * SALES DASHBOARD
 * Customer management and partner solution sales interface
 * For sales team to track leads, conversions, and partner referrals
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';
import { Users, DollarSign, TrendingUp, Phone, Mail, Calendar, Package } from '../../components/Icons';

export default function SalesDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCustomers: 0,
    monthlyRevenue: 0,
    partnerIntroductions: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [introductionRequests, setIntroductionRequests] = useState([]);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      // Mock data for now - replace with real API calls
      setStats({
        totalLeads: 24,
        activeCustomers: 12,
        monthlyRevenue: 8970,
        partnerIntroductions: 7
      });

      setRecentLeads([
        {
          id: 1,
          companyName: 'TechFlow Electronics',
          contactPerson: 'Sarah Johnson',
          email: 'sarah@techflow.com',
          phone: '(555) 123-4567',
          source: 'Crisis Alert',
          status: 'qualified',
          annualVolume: 2500000,
          hsCode: '8517.62.00.00',
          lastContact: '2025-09-01'
        },
        {
          id: 2,
          companyName: 'AutoParts Direct',
          contactPerson: 'Mike Rodriguez',
          email: 'mike@autopartsdirect.com',
          phone: '(555) 987-6543',
          source: 'Website Form',
          status: 'demo_scheduled',
          annualVolume: 1800000,
          hsCode: '8708.30.50.00',
          lastContact: '2025-08-31'
        }
      ]);

      // Load introduction requests for commission tracking
      const response = await fetch('/api/crisis-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_introduction_requests',
          status: 'pending'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setIntroductionRequests(result.requests || []);
      }

    } catch (error) {
      console.error('Failed to load sales data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'qualified': return 'status-success';
      case 'demo_scheduled': return 'status-info';
      case 'proposal_sent': return 'status-warning';
      case 'negotiating': return 'status-warning';
      default: return 'status-info';
    }
  };

  return (
    <TriangleLayout>
      <div className="container-app main-content">
        {/* Header */}
        <div className="section-spacing">
          <h1 className="hero-title">
            Sales Dashboard
          </h1>
          <p className="text-body">
            Customer pipeline, partner solutions, and revenue tracking
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid-4-cols section-spacing">
          <div className="card">
            <div className="card-header">
              <Users className="icon-sm" />
              <div className="content-card">
                <p className="calculator-metric-value">{stats.totalLeads}</p>
                <p className="text-muted">Total Leads</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <TrendingUp className="icon-sm" />
              <div className="content-card">
                <p className="calculator-metric-value">{stats.activeCustomers}</p>
                <p className="text-muted">Active Customers</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <DollarSign className="icon-sm" />
              <div className="content-card">
                <p className="calculator-metric-value success">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-muted">Monthly Revenue</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <Users className="icon-sm" />
              <div className="content-card">
                <p className="calculator-metric-value">{stats.partnerIntroductions}</p>
                <p className="text-muted">Partner Intros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2-cols">
          {/* Recent Leads */}
          <div className="card">
            <h2 className="card-title">Recent Leads</h2>
            
            <div className="element-spacing">
              {recentLeads.map(lead => (
                <div key={lead.id} className="content-card">
                  <div className="card-header">
                    <div className="content-card">
                      <h3 className="content-card-title">{lead.companyName}</h3>
                      <p className="text-muted">{lead.contactPerson}</p>
                    </div>
                    <span className={getStatusClass(lead.status)}>
                      <div className="status-dot"></div>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid-2-cols">
                    <div className="text-body">
                      <Mail className="icon-sm" />
                      <span>{lead.email}</span>
                    </div>
                    <div className="text-body">
                      <Phone className="icon-sm" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="text-body">
                      <DollarSign className="icon-sm" />
                      <span>{formatCurrency(lead.annualVolume)} volume</span>
                    </div>
                    <div className="text-body">
                      <Package className="icon-sm" />
                      <span>HS {lead.hsCode}</span>
                    </div>
                  </div>
                  
                  <div className="hero-button-group">
                    <button className="btn-primary">
                      <Phone className="icon-sm" />
                      Call Now
                    </button>
                    <button className="btn-success">
                      <Mail className="icon-sm" />
                      Send Email
                    </button>
                    <button className="btn-secondary">
                      <Calendar className="icon-sm" />
                      Schedule Demo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Introduction Requests */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Partner Introduction Commissions
              </h2>
            </div>
            
            <div className="element-spacing">
              {introductionRequests.length === 0 ? (
                <div className="content-card">
                  <div className="section-header">
                    <Users className="icon-lg" />
                    <p className="content-card-title">No partner introduction requests yet</p>
                    <p className="text-muted">Requests will appear here for commission tracking</p>
                  </div>
                </div>
              ) : (
                introductionRequests.map(request => (
                  <div key={request.id} className="content-card">
                    <div className="card-header">
                      <div className="content-card">
                        <h3 className="content-card-title">{request.company_name}</h3>
                        <p className="text-muted">{request.user_email}</p>
                      </div>
                      <span className="status-warning">
                        <div className="status-dot"></div>
                        Pending
                      </span>
                    </div>
                    
                    <div className="text-body element-spacing">
                      <p>HS Code: <span className="calculator-metric-value info">{request.hs_code}</span></p>
                      <p>Volume: <span className="text-body">{request.annual_volume}</span></p>
                      <p>Urgency: <span className="status-warning">{request.timeline_urgency}</span></p>
                    </div>
                    
                    <div className="calculator-success-card">
                      <p className="calculator-success-title text-body">
                        <DollarSign className="icon-sm" />
                        <span>Estimated Commission: $495 - $2,500 (2-5% of contract value)</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Executive Actions Dashboard */}
        <div className="content-card analysis">
          <div className="card-header">
            <h3 className="card-title">Quick Sales Actions</h3>
            <p className="text-muted">Streamlined workflow management</p>
          </div>
          <div className="grid-4-cols">
            <button className="btn-primary">
              <Calendar className="icon-sm" />
              <span>Schedule Demo</span>
            </button>
            <button className="btn-success">
              <Mail className="icon-sm" />
              <span>Send Proposal</span>
            </button>
            <button className="btn-secondary">
              <Phone className="icon-sm" />
              <span>Follow Up</span>
            </button>
            <button className="btn-primary">
              <TrendingUp className="icon-sm" />
              <span>Update Pipeline</span>
            </button>
          </div>
        </div>
      </div>
    </TriangleLayout>
  );
}