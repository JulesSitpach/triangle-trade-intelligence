import { useState, useEffect, useCallback, useRef } from 'react';
import { API_CONFIG, ERROR_MESSAGES, CACHE_CONFIG } from '../config/classificationConfig';

/**
 * Custom hook for managing product categories with caching and error handling
 * Replaces category loading logic from the original component
 */
export const useProductCategories = () => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState(null);

  // Cache ref for categories
  const categoriesCacheRef = useRef({
    data: null,
    timestamp: null,
    isValid: false
  });
  
  // Abort controller for cleanup
  const abortControllerRef = useRef(null);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    const cache = categoriesCacheRef.current;
    if (!cache.data || !cache.timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - cache.timestamp;
    return cacheAge < CACHE_CONFIG.categoriesTTL;
  }, []);

  // Load categories from API or cache
  const loadCategories = useCallback(async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      setAvailableCategories(categoriesCacheRef.current.data);
      setIsLoadingCategories(false);
      return categoriesCacheRef.current.data;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoadingCategories(true);
    setError(null);

    try {
      const response = await fetch(API_CONFIG.endpoints.productCategories, {
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          // Update cache
          categoriesCacheRef.current = {
            data: data.data,
            timestamp: Date.now(),
            isValid: true
          };
          
          setAvailableCategories(data.data);
          console.log(`Loaded ${data.data.length} product categories from database`);
          return data.data;
        } else {
          console.error('API returned unsuccessful response:', data);
          setAvailableCategories([]);
          setError(ERROR_MESSAGES.categoriesLoadError);
          return [];
        }
      } else {
        console.error('API request failed with status:', response.status);
        setAvailableCategories([]);
        setError(ERROR_MESSAGES.categoriesLoadError);
        return [];
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading categories:', error);
        setAvailableCategories([]);
        setError(ERROR_MESSAGES.categoriesLoadError);
      }
      return [];
    } finally {
      setIsLoadingCategories(false);
      abortControllerRef.current = null;
    }
  }, [isCacheValid]);

  // Handle category selection with callback support
  const handleCategoryChange = useCallback((categoryKey, source = 'manual', onCategoryChange = null) => {
    setSelectedCategory(categoryKey);
    
    if (onCategoryChange) {
      onCategoryChange(categoryKey);
    }
    
    console.log(`Category selected: ${categoryKey} (${source})`);
    
    return categoryKey;
  }, []);

  // Find category by key
  const findCategoryByKey = useCallback((key) => {
    return availableCategories.find(category => 
      category.value === key || category.label === key
    );
  }, [availableCategories]);

  // Get categories filtered by business type (if needed in the future)
  const getCategoriesByBusinessType = useCallback((businessType) => {
    if (!businessType || businessType === 'general') {
      return availableCategories;
    }
    
    // For now, return all categories as the current system loads all categories
    // This can be extended in the future for business-type specific filtering
    return availableCategories;
  }, [availableCategories]);

  // Refresh categories (for manual refresh)
  const refreshCategories = useCallback(() => {
    return loadCategories(true);
  }, [loadCategories]);

  // Clear cache
  const clearCache = useCallback(() => {
    categoriesCacheRef.current = {
      data: null,
      timestamp: null,
      isValid: false
    };
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    
    // Cleanup on unmount
    return cleanup;
  }, [loadCategories, cleanup]);

  // Auto-refresh cache when it expires (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCacheValid() && availableCategories.length === 0) {
        loadCategories();
      }
    }, CACHE_CONFIG.categoriesTTL);

    return () => clearInterval(interval);
  }, [isCacheValid, loadCategories, availableCategories.length]);

  return {
    // State
    availableCategories,
    isLoadingCategories,
    selectedCategory,
    error,
    
    // Actions
    loadCategories,
    handleCategoryChange,
    refreshCategories,
    setSelectedCategory,
    
    // Utilities
    findCategoryByKey,
    getCategoriesByBusinessType,
    isCacheValid,
    clearCache,
    cleanup
  };
};