/**
 * TableWorkspace - Inline editing workspace for admin tables
 * Provides expandable edit/view/save functionality under each table
 * Replaces popup alerts with integrated workspace interface
 */

import { useState } from 'react';

const TableWorkspace = ({
  title = "Table Workspace",
  recordId,
  recordData = {},
  sections = [],
  onSave,
  onCancel,
  isOpen = false,
  onToggle
}) => {
  const [formData, setFormData] = useState(recordData);
  const [activeSection, setActiveSection] = useState(sections[0]?.id || null);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setSaving(false);
    } catch (error) {
      console.error('Save error:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(recordData);
    if (onCancel) onCancel();
  };

  const openGmail = (email) => {
    const subject = encodeURIComponent(`Mexico Trade Bridge - ${title} Update`);
    const body = encodeURIComponent(`Hi there,\n\nRegarding ${title} record: ${recordId}\n\nBest regards,\nMexico Trade Bridge Team`);
    window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`, '_blank');
  };

  if (!isOpen) {
    return (
      <tr>
        <td colSpan="100%" style={{padding: '0', borderTop: '1px solid #e5e7eb'}}>
          <button
            onClick={onToggle}
            className="workspace-toggle-button"
            style={{
              width: '100%',
              padding: '12px',
              background: '#f9fafb',
              border: 'none',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📝</span>
            <span>Open {title} Workspace</span>
            <span>▼</span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan="100%" style={{padding: '0', background: '#f8fafc', borderTop: '1px solid #e5e7eb'}}>
        <div className="table-workspace">
          {/* Workspace Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '18px'}}>📝</span>
              <h3 style={{margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>
                {title} - Record: {recordId}
              </h3>
            </div>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>

          {/* Workspace Content */}
          <div style={{padding: '20px'}}>
            {/* Section Tabs */}
            {sections.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: activeSection === section.id ? '#2563eb' : 'transparent',
                      color: activeSection === section.id ? 'white' : '#6b7280',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {section.icon} {section.title}
                  </button>
                ))}
              </div>
            )}

            {/* Active Section Content */}
            {sections.map(section => {
              if (section.id !== activeSection) return null;

              return (
                <div key={section.id} className="workspace-section">
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {section.icon} {section.title}
                  </h4>

                  {/* Form Fields */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    {section.fields?.map(field => (
                      <div key={field.name} className="form-group">
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  {section.actions && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '16px'
                    }}>
                      {section.actions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => {
                            if (action.type === 'gmail') {
                              openGmail(formData.email || action.email);
                            } else if (action.onClick) {
                              action.onClick(formData);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: action.type === 'gmail' ? '#dc2626' : '#f3f4f6',
                            color: action.type === 'gmail' ? 'white' : '#374151',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{action.icon}</span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: saving ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{saving ? '⏳' : '💾'}</span>
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>❌</span>
                <span>Cancel</span>
              </button>

              {formData.email && (
                <button
                  onClick={() => openGmail(formData.email)}
                  style={{
                    padding: '10px 20px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📧</span>
                  <span>Open Gmail</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default TableWorkspace;