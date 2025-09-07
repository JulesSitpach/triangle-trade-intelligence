/**
 * BROKER SUPPLIER MANAGEMENT ADMIN INTERFACE
 * Allows licensed broker to manage supplier network
 * CRUD operations for partner suppliers and introduction requests
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';

// Simple icon components
const Plus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Edit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const Trash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default function SupplierManagement() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [introductionRequests, setIntroductionRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [newSupplier, setNewSupplier] = useState({
    company_name: '',
    location: '',
    contact_person: '',
    contact_title: '',
    phone: '',
    email: '',
    hs_specialties: '',
    pricing_premium_percent: '',
    usmca_certification_time_days: '',
    production_capacity: '',
    quality_certifications: '',
    verification_status: 'pending',
    broker_notes: ''
  });

  useEffect(() => {
    loadSuppliers();
    loadIntroductionRequests();
  }, []);

  const loadSuppliers = async () => {
    try {
      // Try to load from real supplier API
      try {
        const response = await fetch('/api/admin/suppliers');
        if (response.ok) {
          const result = await response.json();
          setSuppliers(result.suppliers || []);
        } else {
          console.log('No /api/admin/suppliers API - showing empty state');
          setSuppliers([]);
        }
      } catch (error) {
        console.log('Supplier API not available:', error.message);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadIntroductionRequests = async () => {
    try {
      const response = await fetch('/api/crisis-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_introduction_requests',
          status: 'pending',
          limit: 20
        })
      });
      
      const result = await response.json();
      setIntroductionRequests(result.requests || []);
    } catch (error) {
      console.error('Failed to load introduction requests:', error);
      setIntroductionRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    
    try {
      const supplierData = {
        ...newSupplier,
        hs_specialties: newSupplier.hs_specialties.split(',').map(s => s.trim()),
        quality_certifications: newSupplier.quality_certifications 
          ? newSupplier.quality_certifications.split(',').map(s => s.trim()) 
          : [],
        pricing_premium_percent: parseFloat(newSupplier.pricing_premium_percent) || 0,
        usmca_certification_time_days: parseInt(newSupplier.usmca_certification_time_days) || 21
      };

      // Try to add supplier via API
      try {
        const response = await fetch('/api/admin/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplierData)
        });
        
        if (response.ok) {
          const result = await response.json();
          setSuppliers(prev => [...prev, result.supplier]);
        } else {
          throw new Error('Failed to add supplier via API');
        }
      } catch (apiError) {
        console.log('Add supplier API not available:', apiError.message);
        alert('Supplier management API not implemented yet. Cannot add supplier.');
        return;
      }
      setShowAddForm(false);
      setNewSupplier({
        company_name: '',
        location: '',
        contact_person: '',
        contact_title: '',
        phone: '',
        email: '',
        hs_specialties: '',
        pricing_premium_percent: '',
        usmca_certification_time_days: '',
        production_capacity: '',
        quality_certifications: '',
        verification_status: 'pending',
        broker_notes: ''
      });
      
    } catch (error) {
      console.error('Failed to add supplier:', error);
      alert('Failed to add supplier: ' + error.message);
    }
  };

  const handleVerifySupplier = async (supplierId) => {
    try {
      // Try to verify supplier via API
      try {
        const response = await fetch(`/api/admin/suppliers/${supplierId}/verify`, {
          method: 'PUT'
        });
        
        if (response.ok) {
          const result = await response.json();
          setSuppliers(prev => prev.map(supplier => 
            supplier.id === supplierId 
              ? { ...supplier, verification_status: 'verified', verified_at: result.supplier?.verified_at }
              : supplier
          ));
        } else {
          throw new Error('Failed to verify supplier via API');
        }
      } catch (apiError) {
        console.log('Verify supplier API not available:', apiError.message);
        alert('Supplier verification API not implemented yet.');
      }
      
    } catch (error) {
      console.error('Failed to verify supplier:', error);
    }
  };

  const updateNewSupplier = (field, value) => {
    setNewSupplier(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-muted">Loading supplier management system...</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="flex-1">
            <h1 className="page-title">
              Supplier Network Management
            </h1>
            <p className="page-subtitle">
              Manage your verified supplier network for crisis response solutions
            </p>
          </div>
          
          <div className="hero-button-group">
            <div className="content-card analysis">
              <div className="content-card-icon">
                <Users className="icon-md" />
              </div>
              <div className="calculator-metric-value info">{suppliers.length}</div>
              <div className="calculator-metric-title">Total Suppliers</div>
              <p className="text-muted">
                {suppliers.filter(s => s.verification_status === 'verified').length} Verified
              </p>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <Plus className="icon-sm" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Professional Tab Navigation */}
        <div className="section-spacing">
          <nav className="nav-menu">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={activeTab === 'suppliers' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Supplier Network ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={activeTab === 'requests' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Introduction Requests ({introductionRequests.length})
            </button>
          </nav>
        </div>

        {/* Add Supplier Form */}
        {showAddForm && (
          <div className="card element-spacing">
            <div className="card-header">
              <h2 className="card-title">Add New Supplier</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSupplier}>
              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="form-label">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.company_name}
                    onChange={(e) => updateNewSupplier('company_name', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newSupplier.location}
                    onChange={(e) => updateNewSupplier('location', e.target.value)}
                    className="form-input"
                    placeholder="e.g. Querétaro, México"
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="form-label">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact_person}
                    onChange={(e) => updateNewSupplier('contact_person', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contact Title
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact_title}
                    onChange={(e) => updateNewSupplier('contact_title', e.target.value)}
                    className="form-input"
                    placeholder="e.g. Export Manager"
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="form-label">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => updateNewSupplier('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => updateNewSupplier('email', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label className="form-label">
                    HS Specialties (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSupplier.hs_specialties}
                    onChange={(e) => updateNewSupplier('hs_specialties', e.target.value)}
                    className="form-input"
                    placeholder="e.g. 8544, 8708, 6109"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Pricing Premium %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSupplier.pricing_premium_percent}
                    onChange={(e) => updateNewSupplier('pricing_premium_percent', e.target.value)}
                    className="form-input"
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    USMCA Cert Days
                  </label>
                  <input
                    type="number"
                    value={newSupplier.usmca_certification_time_days}
                    onChange={(e) => updateNewSupplier('usmca_certification_time_days', e.target.value)}
                    className="form-input"
                    placeholder="e.g. 21"
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="form-label">
                    Production Capacity
                  </label>
                  <input
                    type="text"
                    value={newSupplier.production_capacity}
                    onChange={(e) => updateNewSupplier('production_capacity', e.target.value)}
                    className="form-input"
                    placeholder="e.g. 2M units/month"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Quality Certifications (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSupplier.quality_certifications}
                    onChange={(e) => updateNewSupplier('quality_certifications', e.target.value)}
                    className="form-input"
                    placeholder="e.g. ISO 9001, UL Listed"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Broker Notes
                </label>
                <textarea
                  value={newSupplier.broker_notes}
                  onChange={(e) => updateNewSupplier('broker_notes', e.target.value)}
                  className="form-input"
                  rows="3"
                  placeholder="Personal notes, facility visit details, etc."
                />
              </div>

              <div className="form-group">
                <div className="content-card classification">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={newSupplier.verification_status === 'verified'}
                      onChange={(e) => updateNewSupplier('verification_status', e.target.checked ? 'verified' : 'pending')}
                    />
                    <span>Mark as Verified</span>
                  </label>
                  <p className="text-muted">I have personally visited or thoroughly vetted this facility</p>
                </div>
              </div>

              <div className="hero-button-group">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Plus className="icon-sm" />
                  <span>Add Supplier</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'suppliers' && (
          <SuppliersList 
            suppliers={suppliers} 
            onVerifySupplier={handleVerifySupplier}
          />
        )}

        {activeTab === 'requests' && (
          <IntroductionRequestsList requests={introductionRequests} />
        )}
      </div>
    </TriangleLayout>
  );
}

function SuppliersList({ suppliers, onVerifySupplier }) {
  return (
    <div className="element-spacing">
      {suppliers.map(supplier => (
        <div key={supplier.id} className="content-card">
          <div className="card-header">
            <div className="flex-1">
              <div className="hero-button-group">
                <h3 className="content-card-title">
                  {supplier.company_name}
                </h3>
                {supplier.verification_status === 'verified' && (
                  <span className="status-success">
                    <CheckCircle className="icon-sm" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-muted element-spacing">
                <span>📍</span>
                <span>{supplier.location}</span>
              </p>
              <div className="grid-3-cols">
                <div className="text-body">
                  <span>Contact: {supplier.contact_person}</span>
                </div>
                <div className="text-body">
                  <span>HS Codes: {supplier.hs_specialties?.join(', ')}</span>
                </div>
                <div className="status-warning">
                  <span>+{supplier.pricing_premium_percent}% pricing</span>
                </div>
              </div>
            </div>
            
            <div className="grid-2-cols">
              <div className="content-card analysis">
                <div className="calculator-metric-value info">{supplier.introduction_count}</div>
                <div className="calculator-metric-title">Introductions</div>
              </div>
              <div className="content-card classification">
                <div className="calculator-metric-value success">{supplier.successful_partnerships}</div>
                <div className="calculator-metric-title">Partnerships</div>
              </div>
            </div>
          </div>
          
          <div className="hero-button-group">
            {supplier.verification_status !== 'verified' && (
              <button
                onClick={() => onVerifySupplier(supplier.id)}
                className="btn-success"
              >
                <CheckCircle className="icon-sm" />
                <span>Mark as Verified</span>
              </button>
            )}
            <button className="btn-primary">
              <Edit className="icon-sm" />
              <span>Edit Details</span>
            </button>
            <button className="btn-secondary">
              <span>View Performance</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IntroductionRequestsList({ requests }) {
  return (
    <div className="element-spacing">
      {requests.length === 0 ? (
        <div className="content-card">
          <div className="section-header">
            <AlertCircle className="icon-lg" />
            <h3 className="content-card-title">No Pending Requests</h3>
            <p className="text-muted">Customer introduction requests will appear here for broker follow-up.</p>
          </div>
        </div>
      ) : (
        requests.map(request => (
          <div key={request.id} className="content-card">
            <div className="card-header">
              <div className="flex-1">
                <h3 className="content-card-title">
                  {request.company_name}
                </h3>
                <p className="text-muted element-spacing">
                  <span>📧</span>
                  <span>{request.user_email}</span>
                </p>
                <div className="grid-3-cols">
                  <div className="text-body">HS Code: <span className="status-info">{request.hs_code}</span></div>
                  <div className="text-body">Volume: <span className="calculator-metric-value primary">{request.annual_volume}</span></div>
                  <div className="text-body">Urgency: <span className="status-warning">{request.timeline_urgency}</span></div>
                </div>
                {request.specific_requirements && (
                  <div className="content-card compliance">
                    <p className="text-body">
                      {request.specific_requirements}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="content-card analysis">
                <div className="status-warning">
                  {request.status}
                </div>
                <p className="text-muted">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="hero-button-group">
              <button className="btn-primary">
                <span>Contact Customer</span>
              </button>
              <button className="btn-success">
                <span>Make Introduction</span>
              </button>
              <button className="btn-secondary">
                <span>Mark as Contacted</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}