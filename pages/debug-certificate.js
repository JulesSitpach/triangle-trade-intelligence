/**
 * Debug Certificate Data Page
 * Navigate to /debug-certificate to see localStorage contents
 */

import React, { useState, useEffect } from 'react';

export default function DebugCertificate() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const authData = localStorage.getItem('usmca_authorization_data');
    const workflowResults = localStorage.getItem('usmca_workflow_results');
    const certificateEdits = localStorage.getItem('usmca_certificate_edits');

    setData({
      authData: authData ? JSON.parse(authData) : null,
      workflowResults: workflowResults ? JSON.parse(workflowResults) : null,
      certificateEdits: certificateEdits ? JSON.parse(certificateEdits) : null
    });
  }, []);

  if (!data) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Certificate Debug Page</h1>

      <h2>📋 Authorization Data</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(data.authData, null, 2)}
      </pre>

      <h3>Tax IDs:</h3>
      <ul>
        <li><strong>Exporter Tax ID:</strong> {data.authData?.exporter_tax_id || '[Missing]'}</li>
        <li><strong>Producer Tax ID:</strong> {data.authData?.producer_tax_id || '[Missing]'}</li>
        <li><strong>Importer Tax ID:</strong> {data.authData?.importer_tax_id || '[Missing]'}</li>
      </ul>

      <h3>Flags:</h3>
      <ul>
        <li><strong>Exporter Same as Company:</strong> {String(data.authData?.exporter_same_as_company)}</li>
        <li><strong>Producer Same as Exporter:</strong> {String(data.authData?.producer_same_as_exporter)}</li>
      </ul>

      <h2>📊 Workflow Results</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(data.workflowResults, null, 2)}
      </pre>

      <h3>Company Tax ID:</h3>
      <ul>
        <li><strong>Company Tax ID:</strong> {data.workflowResults?.company?.tax_id || '[Missing]'}</li>
      </ul>

      <h2>✏️ Certificate Edits</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
        {JSON.stringify(data.certificateEdits, null, 2)}
      </pre>
    </div>
  );
}
