import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import TriangleLayout from '../../components/TriangleLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrwitpgbcaxgnirqtavt.supabase.co',
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default function SupplierVerificationPage() {
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [verifiedSuppliers, setVerifiedSuppliers] = useState([]);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    supplier: null
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const { data: pending } = await supabase
      .from('partner_suppliers')
      .select('*')
      .eq('status', 'pending_research')
      .order('created_at', { ascending: false });

    const { data: verified } = await supabase
      .from('partner_suppliers')
      .select('*')
      .eq('broker_verified', true)
      .order('updated_at', { ascending: false });

    console.log('Loaded suppliers:', { pending: pending?.length, verified: verified?.length });
    setPendingSuppliers(pending || []);
    setVerifiedSuppliers(verified || []);
  };

  const openEditModal = (supplier) => {
    setEditModal({
      isOpen: true,
      supplier: { ...supplier }
    });
  };

  const saveSupplier = async () => {
    const updates = {
      ...editModal.supplier,
      broker_verified: true,
      status: 'active',
      verification_status: 'verified',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('partner_suppliers')
      .update(updates)
      .eq('id', editModal.supplier.id);

    if (!error) {
      loadSuppliers();
      setEditModal({ isOpen: false, supplier: null });
      alert('✅ Supplier verified and saved!');
    } else {
      alert('Error saving supplier: ' + error.message);
    }
  };

  return (
    <TriangleLayout>
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🔍 Jorge&apos;s Supplier Verification</h1>
          <p className="admin-subtitle">Complete contact info for AI-discovered suppliers</p>
        </div>

        <div className="card">
          <h2 className="card-title">⏳ Pending Verification ({pendingSuppliers.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Location</th>
                <th>AI Discovery Notes</th>
                <th>Next Step</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No suppliers pending verification. AI discoveries will appear here.
                  </td>
                </tr>
              ) : pendingSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td><strong>{supplier.company_name}</strong></td>
                  <td>{supplier.location}</td>
                  <td>{supplier.broker_notes || 'AI discovery'}</td>
                  <td>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(supplier.company_name + ' ' + supplier.location + ' contact')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action btn-secondary"
                    >
                      🔍 Find Contact Info
                    </a>
                  </td>
                  <td>
                    <button
                      className="btn-action btn-primary"
                      onClick={() => openEditModal(supplier)}
                    >
                      ✏️ Add Contact Info & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="card-title">✅ Verified Suppliers ({verifiedSuppliers.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifiedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No verified suppliers yet. Complete verification above to populate this list.
                  </td>
                </tr>
              ) : verifiedSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td><strong>{supplier.company_name}</strong></td>
                  <td>{supplier.location}</td>
                  <td>{supplier.contact_person || '-'}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => openEditModal(supplier)}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>✏️ Verify Supplier: {editModal.supplier?.company_name}</h2>
                <button
                  className="modal-close"
                  onClick={() => setEditModal({ isOpen: false, supplier: null })}
                >
                  ×
                </button>
              </div>

              <div className="verification-form">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editModal.supplier?.company_name || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, company_name: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editModal.supplier?.location || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, location: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., María González"
                    value={editModal.supplier?.contact_person || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, contact_person: e.target.value }
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Sales Director"
                    value={editModal.supplier?.contact_title || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, contact_title: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contact@company.com.mx"
                    value={editModal.supplier?.email || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, email: e.target.value }
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+52 664 123 4567"
                    value={editModal.supplier?.phone || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, phone: e.target.value }
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://company.com.mx"
                    value={editModal.supplier?.website || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, website: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Production Capacity</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 50,000 units/month"
                    value={editModal.supplier?.production_capacity || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, production_capacity: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Order Quantity (MOQ)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 1,000 units"
                    value={editModal.supplier?.minimum_order_quantity || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, minimum_order_quantity: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Lead Time (weeks)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 4"
                    value={editModal.supplier?.lead_time_weeks || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, lead_time_weeks: parseInt(e.target.value) || null }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Jorge&apos;s Verification Notes</label>
                  <textarea
                    className="consultation-textarea"
                    rows={4}
                    placeholder="Add your notes about this supplier: reputation, quality, reliability, etc."
                    value={editModal.supplier?.broker_notes || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, broker_notes: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-action btn-secondary"
                  onClick={() => setEditModal({ isOpen: false, supplier: null })}
                >
                  Cancel
                </button>
                <button
                  className="btn-action btn-success"
                  onClick={saveSupplier}
                  disabled={!editModal.supplier?.contact_person || !editModal.supplier?.email || !editModal.supplier?.phone}
                >
                  ✅ Verify & Save Supplier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TriangleLayout>
  );
}