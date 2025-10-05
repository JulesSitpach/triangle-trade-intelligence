/**
 * Admin Certificate Review Interface
 *
 * Allows admin to:
 * 1. View submitted client data
 * 2. Review generated draft certificates
 * 3. Edit/fix certificate details
 * 4. Generate final certificates
 * 5. Email certificates to clients
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CertificateReview() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCertificate, setEditedCertificate] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('usmca_intakes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSendIntakeForm = async () => {
    const clientEmail = prompt('Enter client email:');
    const clientName = prompt('Enter client name:');

    if (!clientEmail) return;

    setLoading(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_intake_form',
          clientEmail,
          clientName
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Intake form sent to ${clientEmail}\nProject ID: ${result.projectId}`);
        loadProjects();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error sending form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async (projectId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_draft',
          projectId
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Draft certificate generated successfully');
        loadProjects();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error generating draft: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCertificate = (certificate) => {
    setEditedCertificate({ ...certificate });
    setEditMode(true);
  };

  const handleSaveEdits = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_and_edit',
          projectId: selectedProject.project_id,
          edits: editedCertificate
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Certificate updated successfully');
        setEditMode(false);
        loadProjects();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error saving edits: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFinal = async (projectId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_final',
          projectId
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Final certificate generated successfully');
        loadProjects();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error generating final: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailToClient = async (projectId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email_to_client',
          projectId
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Certificate emailed to client successfully');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error emailing certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'form_sent': return '#f59e0b';
      case 'data_received': return '#3b82f6';
      case 'draft_generated': return '#8b5cf6';
      case 'reviewed': return '#10b981';
      case 'completed': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-container">
      <div className="header">
        <h1>USMCA Certificate Review System</h1>
        <button
          className="btn-primary"
          onClick={handleSendIntakeForm}
          disabled={loading}
        >
          📧 Send New Intake Form
        </button>
      </div>

      <div className="content">
        <div className="projects-list">
          <h2>Active Projects</h2>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Send an intake form to get started.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-header">
                    <h3>{project.client_name || 'Unnamed Client'}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    >
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="project-details">
                    <p><strong>Email:</strong> {project.client_email}</p>
                    <p><strong>Project ID:</strong> {project.project_id}</p>
                    <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="project-actions">
                    {project.status === 'data_received' && (
                      <button
                        className="btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateDraft(project.project_id);
                        }}
                      >
                        Generate Draft
                      </button>
                    )}

                    {project.status === 'draft_generated' && (
                      <button
                        className="btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCertificate(project.draft_certificate);
                        }}
                      >
                        Review & Edit
                      </button>
                    )}

                    {project.status === 'reviewed' && (
                      <button
                        className="btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateFinal(project.project_id);
                        }}
                      >
                        Generate Final
                      </button>
                    )}

                    {project.status === 'completed' && (
                      <button
                        className="btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmailToClient(project.project_id);
                        }}
                      >
                        📧 Email to Client
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProject && (
          <div className="project-details-panel">
            <h2>Project Details: {selectedProject.client_name}</h2>

            {/* Client Data */}
            {selectedProject.client_data && (
              <section className="section">
                <h3>Client Information</h3>
                <div className="info-grid">
                  <div><strong>Company:</strong> {selectedProject.client_data.company_name}</div>
                  <div><strong>Address:</strong> {selectedProject.client_data.company_address}</div>
                  <div><strong>Tax ID:</strong> {selectedProject.client_data.tax_id}</div>
                  <div><strong>Product:</strong> {selectedProject.client_data.product_description}</div>
                  <div><strong>HS Code:</strong> {selectedProject.client_data.hs_code}</div>
                  <div><strong>Manufacturing:</strong> {selectedProject.client_data.manufacturing_location}</div>
                </div>
              </section>
            )}

            {/* Certificate Editing */}
            {(selectedProject.draft_certificate || selectedProject.final_certificate) && (
              <section className="section">
                <h3>Certificate {editMode ? '(Editing)' : ''}</h3>

                {editMode ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Exporter Name:</label>
                      <input
                        type="text"
                        value={editedCertificate.exporter_name || ''}
                        onChange={(e) => setEditedCertificate(prev => ({
                          ...prev,
                          exporter_name: e.target.value
                        }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Product Description:</label>
                      <textarea
                        value={editedCertificate.product_description || ''}
                        onChange={(e) => setEditedCertificate(prev => ({
                          ...prev,
                          product_description: e.target.value
                        }))}
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label>HS Code:</label>
                      <input
                        type="text"
                        value={editedCertificate.hs_code || ''}
                        onChange={(e) => setEditedCertificate(prev => ({
                          ...prev,
                          hs_code: e.target.value
                        }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>USMCA Qualified:</label>
                      <select
                        value={editedCertificate.usmca_qualified ? 'true' : 'false'}
                        onChange={(e) => setEditedCertificate(prev => ({
                          ...prev,
                          usmca_qualified: e.target.value === 'true'
                        }))}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div className="form-actions">
                      <button className="btn-primary" onClick={handleSaveEdits}>
                        Save Changes
                      </button>
                      <button className="btn-secondary" onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="certificate-preview">
                    {(selectedProject.draft_certificate || selectedProject.final_certificate) && (
                      <div className="certificate-fields">
                        <p><strong>Certificate Number:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).certificate_number}</p>
                        <p><strong>Exporter:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).exporter_name}</p>
                        <p><strong>Product:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).product_description}</p>
                        <p><strong>HS Code:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).hs_code}</p>
                        <p><strong>USMCA Qualified:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).usmca_qualified ? 'Yes' : 'No'}</p>
                        <p><strong>Issue Date:</strong> {(selectedProject.final_certificate || selectedProject.draft_certificate).issue_date}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #134169;
          margin: 0;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .projects-list {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .empty-state {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }

        .projects-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .project-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .project-card:hover {
          border-color: #2563eb;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }

        .project-card.selected {
          border-color: #2563eb;
          background: #f8fafc;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .project-header h3 {
          margin: 0;
          color: #134169;
        }

        .status-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .project-details p {
          margin: 5px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .project-actions {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-action {
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-action:hover {
          background: #1d4ed8;
        }

        .project-details-panel {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-height: 80vh;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .section:last-child {
          border-bottom: none;
        }

        .section h3 {
          color: #134169;
          margin-bottom: 15px;
        }

        .info-grid {
          display: grid;
          gap: 10px;
        }

        .info-grid div {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .edit-form {
          display: grid;
          gap: 15px;
        }

        .form-group {
          display: grid;
          gap: 5px;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .certificate-fields {
          display: grid;
          gap: 10px;
        }

        .certificate-fields p {
          margin: 0;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}