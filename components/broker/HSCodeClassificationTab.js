/**
 * Cristina's HS Code Classification Tab - Broker Dashboard
 * Shows HS code lookup and classification results
 */

import { useState, useEffect } from 'react';

export default function HSCodeClassificationTab({ setSelectedRecord, setDetailPanelOpen }) {
  const [hsCodeData, setHsCodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHSCodeData();
  }, []);

  const loadHSCodeData = async () => {
    try {
      const response = await fetch('/api/admin/hs-classification-history');
      const data = await response.json();
      if (data.classifications) {
        setHsCodeData(data.classifications);
      }
    } catch (error) {
      console.error('Error loading HS code data:', error);
      // Use sample data if API fails
      setHsCodeData([
        {
          id: 'HS001',
          product_description: 'Industrial circuit boards for electronic devices',
          suggested_hs_code: '85444290',
          alternative_codes: ['85444210', '85444299'],
          tariff_rate_mfn: 6.8,
          tariff_rate_usmca: 0.0,
          classification_confidence: 92,
          status: 'verified',
          client_company: 'ABC Electronics Corp',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString()
        },
        {
          id: 'HS002',
          product_description: 'Automotive electronic control units and sensors',
          suggested_hs_code: '87089100',
          alternative_codes: ['87089200', '87089900'],
          tariff_rate_mfn: 2.5,
          tariff_rate_usmca: 0.0,
          classification_confidence: 88,
          status: 'research',
          client_company: 'Tech Manufacturing Inc',
          created_at: new Date().toISOString(),
          verified_at: null
        },
        {
          id: 'HS003',
          product_description: 'Cotton garments and textile apparel',
          suggested_hs_code: '61099010',
          alternative_codes: ['61099020', '61099090'],
          tariff_rate_mfn: 16.5,
          tariff_rate_usmca: 0.0,
          classification_confidence: 95,
          status: 'client_approved',
          client_company: 'Global Textiles Ltd',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString()
        },
        {
          id: 'HS004',
          product_description: 'Steel construction materials and beams',
          suggested_hs_code: '72161000',
          alternative_codes: ['72162100', '72162200'],
          tariff_rate_mfn: 0.0,
          tariff_rate_usmca: 0.0,
          classification_confidence: 85,
          status: 'research',
          client_company: 'Industrial Steel Co',
          created_at: new Date().toISOString(),
          verified_at: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (classificationId, newStatus) => {
    try {
      const response = await fetch('/api/admin/hs-classification-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classificationId, status: newStatus })
      });
      if (response.ok) {
        loadHSCodeData();
      }
    } catch (error) {
      console.error('Error updating classification status:', error);
    }
  };

  const handleSearchDatabase = async (productDescription) => {
    try {
      const response = await fetch('/api/simple-classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_description: productDescription })
      });
      const data = await response.json();
      console.log('HS Code search results:', data);
    } catch (error) {
      console.error('Error searching HS codes:', error);
    }
  };

  const handleViewDetails = (classification) => {
    setSelectedRecord({
      type: 'hs_classification',
      data: classification
    });
    setDetailPanelOpen(true);
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) {
      return <span className="confidence-badge confidence-high">{confidence}% High</span>;
    } else if (confidence >= 75) {
      return <span className="confidence-badge confidence-medium">{confidence}% Medium</span>;
    } else {
      return <span className="confidence-badge confidence-low">{confidence}% Low</span>;
    }
  };

  const getTariffSavings = (mfnRate, usmcaRate) => {
    const savings = mfnRate - usmcaRate;
    return savings > 0 ? (
      <span className="tariff-savings">-{savings.toFixed(1)}%</span>
    ) : (
      <span className="no-savings">No savings</span>
    );
  };

  const filteredData = hsCodeData.filter(item =>
    !searchTerm ||
    item.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.suggested_hs_code.includes(searchTerm) ||
    item.client_company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-message">Loading HS code data...</div>;
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">HS Code Classification</h2>
        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search by product, HS code, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Product Description</th>
            <th>Suggested HS Code</th>
            <th>Alternative Codes</th>
            <th>Tariff Impact</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(classification => (
            <tr key={classification.id}>
              <td className="product-description">
                {classification.product_description}
                <small className="client-info">Client: {classification.client_company}</small>
              </td>
              <td className="hs-code-primary">{classification.suggested_hs_code}</td>
              <td className="alternative-codes">
                {classification.alternative_codes?.join(', ') || 'None'}
              </td>
              <td className="tariff-comparison">
                <div className="tariff-rates">
                  <span className="mfn-rate">MFN: {classification.tariff_rate_mfn}%</span>
                  <span className="usmca-rate">USMCA: {classification.tariff_rate_usmca}%</span>
                  {getTariffSavings(classification.tariff_rate_mfn, classification.tariff_rate_usmca)}
                </div>
              </td>
              <td>{getConfidenceBadge(classification.classification_confidence)}</td>
              <td>
                <span className={`status-badge status-${classification.status}`}>
                  {classification.status?.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-info"
                    onClick={() => handleViewDetails(classification)}
                  >
                    View
                  </button>
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => handleSearchDatabase(classification.product_description)}
                  >
                    Search DB
                  </button>
                  {classification.status === 'research' && (
                    <button
                      className="btn-action btn-primary"
                      onClick={() => handleUpdateStatus(classification.id, 'verified')}
                    >
                      Verify
                    </button>
                  )}
                  {classification.status === 'verified' && (
                    <button
                      className="btn-action btn-success"
                      onClick={() => handleUpdateStatus(classification.id, 'client_approved')}
                    >
                      Client Approve
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredData.length === 0 && (
        <div className="empty-state">
          <p>No HS code classifications found for the search term.</p>
        </div>
      )}
    </div>
  );
}