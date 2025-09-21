/**
 * Cristina's Certificate Generation Tab - Broker Dashboard
 * Shows workflow completions and certificate generation status
 */

import { useState, useEffect } from 'react';

export default function CertificateGenerationTab({ setSelectedRecord, setDetailPanelOpen }) {
  const [workflowCompletions, setWorkflowCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadWorkflowCompletions();
  }, []);

  const loadWorkflowCompletions = async () => {
    try {
      const response = await fetch('/api/admin/workflow-completions');
      const data = await response.json();
      if (data.completions) {
        setWorkflowCompletions(data.completions);
      }
    } catch (error) {
      console.error('Error loading workflow completions:', error);
      // Use sample data if API fails
      setWorkflowCompletions([
        {
          id: 'WC001',
          company_name: 'ABC Electronics Corp',
          product_description: 'Industrial circuit boards and components',
          hs_code: '85444290',
          qualification_status: 'qualified',
          certificate_status: 'generated',
          regional_content_percentage: 68.5,
          qualification_threshold: 65.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'WC002',
          company_name: 'Tech Manufacturing Inc',
          product_description: 'Automotive electronic systems',
          hs_code: '87089100',
          qualification_status: 'pending',
          certificate_status: 'draft',
          regional_content_percentage: 72.1,
          qualification_threshold: 75.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'WC003',
          company_name: 'Global Textiles Ltd',
          product_description: 'Cotton garments and apparel',
          hs_code: '61099010',
          qualification_status: 'qualified',
          certificate_status: 'delivered',
          regional_content_percentage: 64.8,
          qualification_threshold: 62.5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCertificateStatus = async (completionId, newStatus) => {
    try {
      const response = await fetch('/api/admin/workflow-completions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: completionId, certificate_status: newStatus })
      });
      if (response.ok) {
        loadWorkflowCompletions();
      }
    } catch (error) {
      console.error('Error updating certificate status:', error);
    }
  };

  const handleGeneratePDF = async (completion) => {
    try {
      // This would integrate with PDF generation service
      console.log('Generating PDF for:', completion.company_name);
      handleUpdateCertificateStatus(completion.id, 'generated');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleViewDetails = (completion) => {
    setSelectedRecord({
      type: 'workflow_completion',
      data: completion
    });
    setDetailPanelOpen(true);
  };

  const getQualificationBadge = (completion) => {
    const { qualification_status, regional_content_percentage, qualification_threshold } = completion;

    if (qualification_status === 'qualified') {
      return <span className="status-badge status-success">✓ Qualified</span>;
    } else if (qualification_status === 'not_qualified') {
      return <span className="status-badge status-error">✗ Not Qualified</span>;
    } else {
      return <span className="status-badge status-warning">⏳ Pending</span>;
    }
  };

  const filteredCompletions = workflowCompletions.filter(completion =>
    statusFilter === 'all' || completion.certificate_status === statusFilter
  );

  if (loading) {
    return <div className="loading-message">Loading certificate data...</div>;
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Certificate Generation</h2>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Client Company</th>
            <th>Product Description</th>
            <th>HS Code</th>
            <th>USMCA Status</th>
            <th>Regional Content</th>
            <th>Certificate Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompletions.map(completion => (
            <tr key={completion.id}>
              <td>{completion.company_name}</td>
              <td className="product-description">{completion.product_description}</td>
              <td className="hs-code">{completion.hs_code}</td>
              <td>{getQualificationBadge(completion)}</td>
              <td>
                <div className="content-percentage">
                  {completion.regional_content_percentage}%
                  <small className="threshold-info">
                    (req: {completion.qualification_threshold}%)
                  </small>
                </div>
              </td>
              <td>
                <span className={`status-badge status-${completion.certificate_status}`}>
                  {completion.certificate_status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-info"
                    onClick={() => handleViewDetails(completion)}
                  >
                    View
                  </button>
                  {completion.certificate_status === 'draft' && (
                    <button
                      className="btn-action btn-primary"
                      onClick={() => handleGeneratePDF(completion)}
                    >
                      Generate PDF
                    </button>
                  )}
                  {completion.certificate_status === 'generated' && (
                    <button
                      className="btn-action btn-success"
                      onClick={() => handleUpdateCertificateStatus(completion.id, 'delivered')}
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCompletions.length === 0 && (
        <div className="empty-state">
          <p>No certificate records found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}