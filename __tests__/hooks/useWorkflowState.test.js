/**
 * useWorkflowState Hook Tests - Testing state management
 * Tests custom hook functionality and state transitions
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { workflowService } from '../../lib/services/workflow-service';

// Mock the workflow service
jest.mock('../../lib/services/workflow-service', () => ({
  workflowService: {
    loadDropdownOptions: jest.fn(),
    processCompleteWorkflow: jest.fn(),
    validateFormData: jest.fn()
  }
}));

describe('useWorkflowState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWorkflowState());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.formData.company_name).toBe('');
  });

  it('should load dropdown options on mount', async () => {
    const mockOptions = {
      businessTypes: [{ value: 'electronics', label: 'Electronics' }],
      countries: [{ value: 'CN', label: 'China' }],
      importVolumes: [{ value: 'Under $500K', label: 'Under $500K annually' }]
    };

    workflowService.loadDropdownOptions.mockResolvedValue(mockOptions);

    const { result } = renderHook(() => useWorkflowState());

    await waitFor(() => {
      expect(result.current.isLoadingOptions).toBe(false);
    });

    expect(workflowService.loadDropdownOptions).toHaveBeenCalled();
    expect(result.current.dropdownOptions).toEqual(mockOptions);
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useWorkflowState());

    act(() => {
      result.current.updateFormData('company_name', 'Test Company');
    });

    expect(result.current.formData.company_name).toBe('Test Company');
  });

  it('should manage component origins', () => {
    const { result } = renderHook(() => useWorkflowState());

    // Add component origin
    act(() => {
      result.current.addComponentOrigin();
    });

    expect(result.current.formData.component_origins).toHaveLength(3); // 2 default + 1 added

    // Update component origin
    act(() => {
      result.current.updateComponentOrigin(0, 'value_percentage', 50);
    });

    expect(result.current.formData.component_origins[0].value_percentage).toBe(50);

    // Remove component origin (only if more than 1)
    act(() => {
      result.current.removeComponentOrigin(2);
    });

    expect(result.current.formData.component_origins).toHaveLength(2);
  });

  it('should calculate total component percentage', () => {
    const { result } = renderHook(() => useWorkflowState());

    const total = result.current.getTotalComponentPercentage();
    
    // Default is 60% + 40% = 100%
    expect(total).toBe(100);
  });

  it('should navigate between steps', () => {
    const { result } = renderHook(() => useWorkflowState());

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.previousStep();
    });

    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.goToStep(3);
    });

    expect(result.current.currentStep).toBe(3);
  });

  it('should process workflow successfully', async () => {
    const mockResults = {
      success: true,
      data: {
        product: { hs_code: '8517.62.00' },
        usmca: { qualified: true }
      }
    };

    workflowService.validateFormData.mockReturnValue({ isValid: true, errors: [] });
    workflowService.processCompleteWorkflow.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useWorkflowState());

    await act(async () => {
      await result.current.processWorkflow();
    });

    expect(result.current.results).toEqual(mockResults);
    expect(result.current.currentStep).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle workflow processing errors', async () => {
    const mockError = new Error('Processing failed');

    workflowService.validateFormData.mockReturnValue({ isValid: true, errors: [] });
    workflowService.processCompleteWorkflow.mockRejectedValue(mockError);

    const { result } = renderHook(() => useWorkflowState());

    await act(async () => {
      await result.current.processWorkflow();
    });

    expect(result.current.error).toBe('Processing failed: Processing failed');
    expect(result.current.results).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle form validation errors', async () => {
    workflowService.validateFormData.mockReturnValue({
      isValid: false,
      errors: ['Company name is required']
    });

    const { result } = renderHook(() => useWorkflowState());

    await act(async () => {
      await result.current.processWorkflow();
    });

    expect(result.current.error).toBe('Form validation failed: Company name is required');
    expect(workflowService.processCompleteWorkflow).not.toHaveBeenCalled();
  });

  it('should reset workflow correctly', () => {
    const { result } = renderHook(() => useWorkflowState());

    // Set some state
    act(() => {
      result.current.goToStep(3);
      result.current.updateFormData('company_name', 'Test Company');
    });

    // Reset
    act(() => {
      result.current.resetWorkflow();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.formData.company_name).toBe('');
    expect(result.current.results).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should validate steps correctly', () => {
    const { result } = renderHook(() => useWorkflowState());

    // Step 1 should be invalid initially
    expect(result.current.isStepValid(1)).toBe(false);

    // Fill required fields for step 1
    act(() => {
      result.current.updateFormData('company_name', 'Test Company');
      result.current.updateFormData('business_type', 'electronics');
      result.current.updateFormData('trade_volume', '$1M - $5M');
    });

    expect(result.current.isStepValid(1)).toBe(true);

    // Step 2 should be invalid without product description
    expect(result.current.isStepValid(2)).toBe(false);

    act(() => {
      result.current.updateFormData('product_description', 'Valid product description');
    });

    expect(result.current.isStepValid(2)).toBe(true);
  });
});