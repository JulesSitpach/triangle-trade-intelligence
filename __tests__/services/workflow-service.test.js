/**
 * Workflow Service Tests - Testing service layer integration
 * Tests trust microservices integration and fallback patterns
 */

import { workflowService } from '../../lib/services/workflow-service';

// Mock fetch for testing
global.fetch = jest.fn();

describe('WorkflowService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('loadDropdownOptions', () => {
    it('should load dropdown options from database-driven API first', async () => {
      const mockResponse = {
        data: {
          business_types: [
            { value: 'electronics', label: 'Electronics' }
          ],
          countries: [
            { value: 'CN', label: 'China' }
          ],
          trade_volumes: [
            { value: 'Under $500K', label: 'Under $500K annually' }
          ]
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await workflowService.loadDropdownOptions();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/database-driven-dropdown-options'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(result.businessTypes).toEqual(mockResponse.data.business_types);
      expect(result.countries).toEqual(mockResponse.data.countries);
      expect(result.importVolumes).toEqual(mockResponse.data.trade_volumes);
    });

    it('should fallback to simple API when database-driven fails', async () => {
      const mockSimpleResponse = {
        businessTypes: [
          { value: 'electronics', label: 'Electronics' }
        ],
        countries: ['China', 'Mexico'],
        importVolumes: [
          { value: 'Under $500K', label: 'Under $500K annually' }
        ]
      };

      // First call fails, second succeeds
      fetch
        .mockRejectedValueOnce(new Error('Database API failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSimpleResponse)
        });

      const result = await workflowService.loadDropdownOptions();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.businessTypes).toEqual(mockSimpleResponse.businessTypes);
    });

    it('should return default options when all APIs fail', async () => {
      fetch.mockRejectedValue(new Error('All APIs failed'));

      const result = await workflowService.loadDropdownOptions();

      expect(result.businessTypes).toBeDefined();
      expect(result.countries).toBeDefined();
      expect(result.importVolumes).toBeDefined();
      expect(Array.isArray(result.businessTypes)).toBe(true);
    });
  });

  describe('processCompleteWorkflow', () => {
    const mockFormData = {
      company_name: 'Test Company',
      business_type: 'electronics',
      product_description: 'Test product description here',
      trade_volume: '$1M - $5M',
      component_origins: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'MX', value_percentage: 40 }
      ]
    };

    it('should use trust microservices endpoint first', async () => {
      const mockResponse = {
        success: true,
        results: {
          product: { hs_code: '8517.62.00' },
          usmca: { qualified: true }
        },
        trust_indicators: {
          data_provenance: 'verified'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        url: '/api/trust/complete-workflow'
      });

      const result = await workflowService.processCompleteWorkflow(mockFormData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trust/complete-workflow'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Trust-Context': 'workflow_processing'
          })
        })
      );

      expect(result.processing_metadata.endpoint_used).toBe('trust_microservices');
      expect(result.processing_metadata.trust_features_enabled).toBe(true);
    });

    it('should fallback to database-driven API when trust services unavailable', async () => {
      const mockResponse = {
        success: true,
        results: {
          product: { hs_code: '8517.62.00' },
          usmca: { qualified: true }
        }
      };

      // Trust API fails with 500, database API succeeds
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          url: '/api/database-driven-usmca-compliance'
        });

      const result = await workflowService.processCompleteWorkflow(mockFormData);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.processing_metadata.endpoint_used).toBe('fallback');
    });
  });

  describe('validateFormData', () => {
    it('should validate required fields', () => {
      const invalidData = {
        company_name: 'A', // Too short
        business_type: '',
        product_description: 'Short', // Too short
        trade_volume: '',
        component_origins: []
      };

      const result = workflowService.validateFormData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company name must be at least 2 characters');
      expect(result.errors).toContain('Business type is required');
      expect(result.errors).toContain('Product description must be at least 10 characters');
      expect(result.errors).toContain('Trade volume is required');
      expect(result.errors).toContain('At least one component origin is required');
    });

    it('should validate component origins total 100%', () => {
      const invalidData = {
        company_name: 'Test Company',
        business_type: 'electronics',
        product_description: 'Valid product description',
        trade_volume: '$1M - $5M',
        component_origins: [
          { origin_country: 'CN', value_percentage: 30 },
          { origin_country: 'MX', value_percentage: 40 }
        ]
      };

      const result = workflowService.validateFormData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('must total 100%'))).toBe(true);
    });

    it('should pass validation for valid data', () => {
      const validData = {
        company_name: 'Test Company',
        business_type: 'electronics',
        product_description: 'Valid product description',
        trade_volume: '$1M - $5M',
        component_origins: [
          { origin_country: 'CN', value_percentage: 60 },
          { origin_country: 'MX', value_percentage: 40 }
        ]
      };

      const result = workflowService.validateFormData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});