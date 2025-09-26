/**
 * Simple Certificate Page - WORKING VERSION
 * Just the certificate workflow, no complex systems
 */

import SimpleCertificateWorkflow from '../components/SimpleCertificateWorkflow';

export default function SimpleCertificatePage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <SimpleCertificateWorkflow />
    </div>
  );
}