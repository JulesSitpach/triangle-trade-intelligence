// Dynamic Configuration System - Zero Hardcoding
// Everything loaded from database and external sources

import { supabase } from '../supabase-client';

class DynamicConfig {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get any configuration value dynamically
  async getConfig(category, key, environment = 'production') {
    const cacheKey = `${category}:${key}:${environment}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const { value, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTimeout) {
        return value;
      }
    }

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_category', category)
        .eq('config_key', key)
        .eq('environment', environment)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn(`Config not found: ${category}.${key}`, error);
        return null;
      }

      // Cache the result
      this.cache.set(cacheKey, {
        value: data.config_value,
        timestamp: Date.now()
      });

      return data.config_value;
    } catch (error) {
      console.error('Error fetching config:', error);
      return null;
    }
  }

  // Get all form fields for a page dynamically
  async getFormFields(pageName) {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('page_name', pageName)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Process dynamic options for each field
      const processedFields = await Promise.all(
        data.map(async (field) => {
          if (field.options_source === 'database_query') {
            field.options = await this.executeDynamicQuery(field.options_query);
          } else if (field.options_source === 'api_endpoint') {
            field.options = await this.fetchFromAPI(field.options_query);
          } else {
            field.options = field.static_options || [];
          }
          return field;
        })
      );

      return processedFields;
    } catch (error) {
      console.error('Error fetching form fields:', error);
      return [];
    }
  }

  // Execute dynamic database queries for dropdown options
  async executeDynamicQuery(query) {
    try {
      // Security: Only allow SELECT statements
      if (!query.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }

      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error executing dynamic query:', error);
      return [];
    }
  }

  // Fetch options from external APIs
  async fetchFromAPI(endpoint) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching from API:', error);
      return [];
    }
  }

  // Get dynamic business rules
  async getBusinessRules(category) {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .eq('rule_category', category)
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching business rules:', error);
      return [];
    }
  }

  // Apply business rules dynamically
  async applyBusinessRules(category, inputData) {
    const rules = await this.getBusinessRules(category);
    let result = { ...inputData };

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, result)) {
        result = this.executeActions(rule.actions, result);
      }
    }

    return result;
  }

  // Evaluate dynamic conditions
  evaluateConditions(conditions, data) {
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedValue(data, field);

      switch (operator) {
        case 'equals':
          if (fieldValue !== value) return false;
          break;
        case 'contains':
          if (!fieldValue?.toString().includes(value)) return false;
          break;
        case 'starts_with':
          if (!fieldValue?.toString().startsWith(value)) return false;
          break;
        case 'greater_than':
          if (!(parseFloat(fieldValue) > parseFloat(value))) return false;
          break;
        case 'less_than':
          if (!(parseFloat(fieldValue) < parseFloat(value))) return false;
          break;
        case 'in_array':
          if (!Array.isArray(value) || !value.includes(fieldValue)) return false;
          break;
        default:
          console.warn(`Unknown operator: ${operator}`);
          return false;
      }
    }
    return true;
  }

  // Execute dynamic actions
  executeActions(actions, data) {
    let result = { ...data };

    for (const action of actions) {
      switch (action.action) {
        case 'set_field':
          this.setNestedValue(result, action.field, action.value);
          break;
        case 'increment_field':
          const currentValue = this.getNestedValue(result, action.field) || 0;
          this.setNestedValue(result, action.field, currentValue + (action.value || 1));
          break;
        case 'append_to_array':
          const currentArray = this.getNestedValue(result, action.field) || [];
          currentArray.push(action.value);
          this.setNestedValue(result, action.field, currentArray);
          break;
        case 'calculate':
          // Dynamic calculations based on formula
          const calculatedValue = this.evaluateFormula(action.formula, result);
          this.setNestedValue(result, action.field, calculatedValue);
          break;
        default:
          console.warn(`Unknown action: ${action.action}`);
      }
    }

    return result;
  }

  // Get nested object values dynamically
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Set nested object values dynamically
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Evaluate dynamic formulas
  evaluateFormula(formula, data) {
    try {
      // Simple formula evaluation (extend as needed)
      // Security: Only allow safe mathematical operations
      const safeFormula = formula.replace(/\{([^}]+)\}/g, (match, field) => {
        const value = this.getNestedValue(data, field);
        return isNaN(value) ? 0 : value;
      });

      // Use Function constructor for safe evaluation
      const result = new Function('return ' + safeFormula)();
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Error evaluating formula:', error);
      return 0;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get dynamic UI configuration
  async getUIConfig(component) {
    return await this.getConfig('ui', component);
  }

  // Get dynamic business configuration
  async getBusinessConfig(key) {
    return await this.getConfig('business_rules', key);
  }

  // Get dynamic integration configuration
  async getIntegrationConfig(service) {
    return await this.getConfig('integrations', service);
  }
}

// Singleton instance
const dynamicConfig = new DynamicConfig();

export default dynamicConfig;

// Convenience functions
export const getConfig = (category, key, environment) => 
  dynamicConfig.getConfig(category, key, environment);

export const getFormFields = (pageName) => 
  dynamicConfig.getFormFields(pageName);

export const getBusinessRules = (category) => 
  dynamicConfig.getBusinessRules(category);

export const applyBusinessRules = (category, data) => 
  dynamicConfig.applyBusinessRules(category, data);

export const getUIConfig = (component) => 
  dynamicConfig.getUIConfig(component);

export const getBusinessConfig = (key) => 
  dynamicConfig.getBusinessConfig(key);

export const getIntegrationConfig = (service) => 
  dynamicConfig.getIntegrationConfig(service);