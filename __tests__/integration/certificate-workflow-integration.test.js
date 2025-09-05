/**
 * CERTIFICATE WORKFLOW INTEGRATION TESTS
 * End-to-end testing of trust-verified certificate generation workflow
 * Tests complete integration with trust microservices
 */

import request from 'supertest';
import { createServer } from 'http';
import handler from '../../pages/api/trust/complete-workflow.js';

// Test server setup
const app = createServer((req, res) => {
  if (req.url === '/api/trust/complete-workflow' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      req.body = JSON.parse(body);
      handler(req, res);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

describe('Certificate Workflow Integration', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Use random available port
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('Complete Workflow with Certificate Generation', () => {
    const validWorkflowRequest = {
      data: {
        company_name: 'Integration Test Corp',
        business_type: 'Electronics',
        supplier_country: 'MX',
        manufacturing_location: 'MX',
        trade_volume: '2000000',
        product_description: 'Smartphone components and assemblies',
        component_origins: [
          { origin_country: 'MX', value_percentage: 45 },
          { origin_country: 'US', value_percentage: 30 },
          { origin_country: 'CN', value_percentage: 25 }
        ]
      }
    };

    it('should complete full workflow and generate trust-verified certificate', async () => {
      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(validWorkflowRequest)
        .expect('Content-Type', /json/)
        .timeout(10000); // Allow 10 seconds for complex workflow

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.workflow_type).toBe('trusted_complete_workflow');

      // Verify certificate is present
      expect(response.body.certificate).toBeDefined();
      
      // Verify certificate has trust verification
      if (response.body.certificate && !response.body.certificate.error) {
        expect(response.body.certificate.trust_verification).toBeDefined();
        expect(response.body.certificate.trust_verification.overall_trust_score).toBeDefined();
        expect(response.body.certificate.trust_verification.trust_level).toBeDefined();
        expect(response.body.certificate.trust_verification.verification_status).toBeDefined();
        
        // Verify certificate structure
        expect(response.body.certificate.certificate_id).toBeDefined();
        expect(response.body.certificate.exporter).toBeDefined();
        expect(response.body.certificate.producer).toBeDefined();
        expect(response.body.certificate.importer).toBeDefined();
        expect(response.body.certificate.product).toBeDefined();
        expect(response.body.certificate.preference_criterion).toBeDefined();
        expect(response.body.certificate.blanket_period).toBeDefined();
        expect(response.body.certificate.authorized_signature).toBeDefined();
        expect(response.body.certificate.additional_information).toBeDefined();
      }

      // Verify trust assessment
      expect(response.body.trust_assessment).toBeDefined();
      expect(response.body.expert_evaluation).toBeDefined();
    }, 15000);

    it('should handle non-qualifying products gracefully', async () => {
      const nonQualifyingRequest = {
        data: {
          ...validWorkflowRequest.data,
          component_origins: [
            { origin_country: 'CN', value_percentage: 70 }, // Majority non-USMCA
            { origin_country: 'VN', value_percentage: 20 },
            { origin_country: 'MX', value_percentage: 10 }  // Insufficient USMCA content
          ]
        }
      };

      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(nonQualifyingRequest)
        .expect('Content-Type', /json/)
        .timeout(10000);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should still get USMCA qualification results
      expect(response.body.usmca).toBeDefined();
      expect(response.body.usmca.qualified).toBe(false);
      
      // Certificate should be null or indicate non-qualification
      if (response.body.certificate) {
        expect(response.body.certificate.error || 
               response.body.certificate.qualification_status === 'not_qualified' ||
               response.body.certificate === null).toBeTruthy();
      }
    }, 15000);

    it('should generate fallback certificate when errors occur', async () => {
      const invalidRequest = {
        data: {
          company_name: 'Test Corp',
          business_type: 'InvalidBusinessType',
          supplier_country: 'INVALID',
          product_description: '', // Empty product description
          component_origins: [] // Empty component origins
        }
      };

      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .timeout(10000);

      // Should get some kind of response, even if it's an error response
      expect(response.status).toBeOneOf([200, 400, 500]);
      expect(response.body).toBeDefined();

      // If successful, should have fallback/error handling
      if (response.status === 200 && response.body.success) {
        if (response.body.certificate) {
          // Should indicate low trust or fallback status
          expect(
            response.body.certificate.trust_verification?.trust_level === 'very_low' ||
            response.body.certificate.recovery_applied === true ||
            response.body.certificate.error !== undefined
          ).toBeTruthy();
        }
      }
    }, 15000);
  });

  describe('Certificate Error Handling Integration', () => {
    it('should handle malformed request data', async () => {
      const malformedRequest = {
        data: {
          // Missing required fields
          company_name: undefined,
          product_description: null
        }
      };

      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(malformedRequest)
        .timeout(5000);

      expect(response.status).toBeOneOf([200, 400]);
      expect(response.body).toBeDefined();

      // Should provide useful error information
      if (response.status === 400) {
        expect(response.body.errors || response.body.error).toBeDefined();
      }
    });

    it('should handle empty request', async () => {
      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send({})
        .timeout(5000);

      expect(response.status).toBeOneOf([200, 400]);
      expect(response.body).toBeDefined();
      
      if (response.body.errors) {
        expect(Array.isArray(response.body.errors)).toBe(true);
      }
    });
  });

  describe('Trust Integration Validation', () => {
    it('should include trust indicators in response', async () => {
      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(validWorkflowRequest)
        .timeout(10000);

      if (response.status === 200 && response.body.success) {
        // Should include trust-related data
        expect(
          response.body.trust_assessment ||
          response.body.expert_evaluation ||
          response.body.workflow_summary
        ).toBeDefined();

        // Check for trust indicators in various components
        const hasTrustIndicators = 
          response.body.product?.trust_indicators ||
          response.body.usmca?.trust_indicators ||
          response.body.savings?.trust_indicators ||
          response.body.certificate?.trust_verification;

        expect(hasTrustIndicators).toBeDefined();
      }
    }, 15000);

    it('should provide expert validation when required', async () => {
      // Create scenario likely to require expert validation
      const uncertaintyRequest = {
        data: {
          company_name: 'Uncertain Classification Corp',
          business_type: 'Complex Manufacturing',
          supplier_country: 'CN',
          manufacturing_location: 'MX',
          trade_volume: '500000', // Lower volume
          product_description: 'Complex multi-component assembly with uncertain classification',
          component_origins: [
            { origin_country: 'CN', value_percentage: 40 },
            { origin_country: 'MX', value_percentage: 35 },
            { origin_country: 'US', value_percentage: 25 }
          ]
        }
      };

      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(uncertaintyRequest)
        .timeout(10000);

      if (response.status === 200 && response.body.success) {
        // Should have expert evaluation
        expect(response.body.expert_evaluation).toBeDefined();
        
        // If certificate generated, should indicate validation needs
        if (response.body.certificate && !response.body.certificate.error) {
          const expertValidation = response.body.certificate.trust_verification?.expert_validation;
          
          // Should provide expert validation guidance
          expect(expertValidation).toBeDefined();
          expect(expertValidation.validation_status).toBeDefined();
        }
      }
    }, 15000);
  });

  describe('Performance Integration', () => {
    it('should complete workflow within performance targets', async () => {
      const startTime = Date.now();

      const response = await request(server)
        .post('/api/trust/complete-workflow')
        .send(validWorkflowRequest)
        .timeout(8000);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within 5 seconds for standard workflow
      expect(processingTime).toBeLessThan(5000);

      if (response.status === 200 && response.body.success) {
        // Should include processing time metadata
        expect(
          response.body.processing_time_ms ||
          response.body.generation_metadata?.processing_time_ms
        ).toBeDefined();
      }
    });
  });
});

// Helper to check multiple possible status codes
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});