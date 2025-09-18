/**
 * SimpleDetailPanel - Clean detail window for table rows
 * Opens when clicking on table rows, provides essential actions
 * Replaces complex workspace with focused, practical interface
 */

import { useState } from 'react';

const SimpleDetailPanel = ({
  isOpen,
  onClose,
  record,
  type = 'client',
  onSave
}) => {
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [activityLog, setActivityLog] = useState([]);

  if (!isOpen || !record) return null;

  const handleCall = () => {
    const newActivity = {
      type: 'call',
      timestamp: new Date().toLocaleString(),
      note: 'Called company'
    };
    setActivityLog(prev => [newActivity, ...prev]);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Follow-up: ${record.companyName || record.client}`);
    const body = encodeURIComponent(`Hi there,\n\nFollowing up on our discussion about USMCA compliance opportunities.\n\nBest regards,\nTriangle Intelligence Team`);
    window.open(`https://mail.google.com/mail/?view=cm&to=${record.email}&su=${subject}&body=${body}`, '_blank');

    const newActivity = {
      type: 'email',
      timestamp: new Date().toLocaleString(),
      note: 'Sent follow-up email'
    };
    setActivityLog(prev => [newActivity, ...prev]);
  };

  const handleAddNote = () => {
    if (notes.trim()) {
      const newActivity = {
        type: 'note',
        timestamp: new Date().toLocaleString(),
        note: notes
      };
      setActivityLog(prev => [newActivity, ...prev]);
      setNotes('');
    }
  };

  const handleScheduleFollowUp = () => {
    if (followUpDate) {
      const newActivity = {
        type: 'scheduled',
        timestamp: new Date().toLocaleString(),
        note: `Follow-up scheduled for ${followUpDate}`
      };
      setActivityLog(prev => [newActivity, ...prev]);
      setFollowUpDate('');
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="detail-panel-overlay">
      <div className="detail-panel">
        {/* Header */}
        <div className="detail-panel-header">
          <div className="company-info">
            <h2 className="company-name">{record.companyName || record.client}</h2>
            <div className="company-details">
              <span className="industry">{record.industry || 'Unknown Industry'}</span>
              {record.dealSize && <span className="deal-value">Deal Value: {formatCurrency(record.dealSize)}</span>}
              {record.stage && <span className="stage">Stage: {record.stage}</span>}
            </div>
          </div>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* Quick Info */}
        <div className="quick-info-section">
          <div className="info-grid">
            <div className="info-item">
              <label>Primary Contact:</label>
              <span>{record.email || 'No email on file'}</span>
            </div>
            <div className="info-item">
              <label>Source:</label>
              <span>{record.source || 'Platform'}</span>
            </div>
            {record.probability && (
              <div className="info-item">
                <label>Probability:</label>
                <span>{record.probability}%</span>
              </div>
            )}
            {record.dueDate && (
              <div className="info-item">
                <label>Expected Close:</label>
                <span>{record.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Essential Actions */}
        <div className="action-section">
          <h3>Essential Actions</h3>
          <div className="action-buttons">
            <button onClick={handleCall} className="action-btn call">
              📞 Call Company
            </button>
            <button onClick={handleEmail} className="action-btn email">
              📧 Send Email
            </button>
            <button className="action-btn demo">
              📅 Schedule Demo
            </button>
            <button className="action-btn assessment">
              📊 Send USMCA Assessment
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3>Quick Actions</h3>

          {/* Add Note */}
          <div className="add-note">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this interaction..."
              rows={3}
            />
            <button onClick={handleAddNote} className="btn-small">Add Note</button>
          </div>

          {/* Schedule Follow-up */}
          <div className="schedule-followup">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              placeholder="Schedule follow-up"
            />
            <button onClick={handleScheduleFollowUp} className="btn-small">Schedule</button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-log">
            {activityLog.length === 0 ? (
              <p className="no-activity">No recent activity</p>
            ) : (
              activityLog.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-type">{activity.type}</span>
                  <span className="activity-time">{activity.timestamp}</span>
                  <p className="activity-note">{activity.note}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps-section">
          <h3>Next Steps Checklist</h3>
          <div className="checklist">
            <label>
              <input type="checkbox" /> Discovery call completed
            </label>
            <label>
              <input type="checkbox" /> Needs assessment sent
            </label>
            <label>
              <input type="checkbox" /> Decision maker identified
            </label>
            <label>
              <input type="checkbox" /> Budget confirmed
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="panel-footer">
          <button className="btn-secondary">Mark as Lost</button>
          <button className="btn-primary">Move to Next Stage</button>
        </div>
      </div>

      <style jsx>{`
        .detail-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .detail-panel {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .detail-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .company-name {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .company-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .company-details span {
          font-size: 14px;
          color: #6b7280;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .quick-info-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
        }

        .info-item span {
          font-size: 14px;
          color: #1f2937;
        }

        .action-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .action-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .action-btn {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .action-btn.call:hover {
          background: #dcfce7;
          border-color: #16a34a;
        }

        .action-btn.email:hover {
          background: #dbeafe;
          border-color: #2563eb;
        }

        .quick-actions-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .quick-actions-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .add-note {
          margin-bottom: 16px;
        }

        .add-note textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 8px;
        }

        .schedule-followup {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .schedule-followup input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .btn-small {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-small:hover {
          background: #e5e7eb;
        }

        .activity-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .activity-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .activity-log {
          max-height: 200px;
          overflow-y: auto;
        }

        .no-activity {
          color: #6b7280;
          font-style: italic;
          margin: 0;
        }

        .activity-item {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-type {
          display: inline-block;
          background: #f3f4f6;
          color: #374151;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-right: 8px;
          text-transform: capitalize;
        }

        .activity-time {
          font-size: 12px;
          color: #6b7280;
        }

        .activity-note {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #1f2937;
        }

        .next-steps-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .next-steps-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .checklist {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checklist label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .panel-footer {
          padding: 20px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #2563eb;
          border: 1px solid #2563eb;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default SimpleDetailPanel;