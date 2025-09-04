/**
 * Accessibility Utilities
 * Provides helper functions and components for proper accessibility implementation
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export const generateId = (prefix = 'id') => {
  return `${prefix}-${++idCounter}-${Date.now()}`;
};

/**
 * ARIA role mappings for different component types
 */
export const ARIA_ROLES = {
  ALERT: 'alert',
  BUTTON: 'button',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
  REGION: 'region',
  GROUP: 'group',
  FORM: 'form',
  HEADING: 'heading',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  SEARCH: 'search'
};

/**
 * Keyboard event constants
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
};

/**
 * Screen reader text component (visually hidden but accessible)
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => {
  return (
    <Component
      {...props}
      className="sr-only"
    >
      {children}
    </Component>
  );
};

/**
 * Focus management hook
 */
export const useFocusManagement = () => {
  const focusableElementsSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const getFocusableElements = useCallback((container = document) => {
    return Array.from(container.querySelectorAll(focusableElementsSelector));
  }, [focusableElementsSelector]);

  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event) => {
      if (event.key !== KEYS.TAB) return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [getFocusableElements]);

  const focusFirst = useCallback((containerRef) => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    focusableElements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback((containerRef) => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    focusableElements[focusableElements.length - 1]?.focus();
  }, [getFocusableElements]);

  return {
    getFocusableElements,
    trapFocus,
    focusFirst,
    focusLast
  };
};

/**
 * Announcement hook for screen readers
 */
export const useAnnouncements = () => {
  const announcementRef = useRef();

  useEffect(() => {
    // Create announcement region if it doesn't exist
    if (!announcementRef.current) {
      const announcementElement = document.createElement('div');
      announcementElement.setAttribute('aria-live', 'polite');
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.className = 'sr-only';
      
      document.body.appendChild(announcementElement);
      announcementRef.current = announcementElement;
    }

    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message, priority = 'polite') => {
    if (!announcementRef.current) return;

    // Set the priority
    announcementRef.current.setAttribute('aria-live', priority);
    
    // Clear and set the message
    announcementRef.current.textContent = '';
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const announceError = useCallback((message) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess
  };
};

/**
 * Keyboard navigation hook
 */
export const useKeyboardNavigation = (items = [], options = {}) => {
  const {
    onSelect,
    loop = true,
    orientation = 'vertical',
    autoFocus = true
  } = options;

  const containerRef = useRef();
  const currentIndexRef = useRef(-1);

  const getNavigationKeys = () => {
    if (orientation === 'horizontal') {
      return {
        previous: KEYS.ARROW_LEFT,
        next: KEYS.ARROW_RIGHT
      };
    }
    return {
      previous: KEYS.ARROW_UP,
      next: KEYS.ARROW_DOWN
    };
  };

  const focusItem = useCallback((index) => {
    if (!containerRef.current || index < 0 || index >= items.length) return;

    const itemElements = containerRef.current.querySelectorAll('[role="option"], button, [tabindex]');
    const targetElement = itemElements[index];
    
    if (targetElement) {
      targetElement.focus();
      currentIndexRef.current = index;
    }
  }, [items.length]);

  const handleKeyDown = useCallback((event) => {
    const { previous, next } = getNavigationKeys();
    const currentIndex = currentIndexRef.current;

    switch (event.key) {
      case next:
        event.preventDefault();
        const nextIndex = loop 
          ? (currentIndex + 1) % items.length 
          : Math.min(currentIndex + 1, items.length - 1);
        focusItem(nextIndex);
        break;

      case previous:
        event.preventDefault();
        const prevIndex = loop 
          ? (currentIndex - 1 + items.length) % items.length 
          : Math.max(currentIndex - 1, 0);
        focusItem(prevIndex);
        break;

      case KEYS.HOME:
        event.preventDefault();
        focusItem(0);
        break;

      case KEYS.END:
        event.preventDefault();
        focusItem(items.length - 1);
        break;

      case KEYS.ENTER:
      case KEYS.SPACE:
        if (onSelect && currentIndex >= 0 && currentIndex < items.length) {
          event.preventDefault();
          onSelect(items[currentIndex], currentIndex);
        }
        break;

      case KEYS.ESCAPE:
        if (containerRef.current) {
          containerRef.current.blur();
          currentIndexRef.current = -1;
        }
        break;

      default:
        break;
    }
  }, [items, loop, onSelect, focusItem]);

  // Set up keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    // Auto-focus first item if requested
    if (autoFocus && items.length > 0) {
      focusItem(0);
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, autoFocus, items.length, focusItem]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    focusItem,
    handleKeyDown
  };
};

/**
 * Form validation accessibility helper
 */
export const useFormAccessibility = () => {
  const generateFieldProps = useCallback((fieldName, options = {}) => {
    const {
      required = false,
      error = null,
      description = null,
      invalid = Boolean(error)
    } = options;

    const fieldId = generateId(fieldName);
    const errorId = error ? generateId(`${fieldName}-error`) : undefined;
    const descriptionId = description ? generateId(`${fieldName}-description`) : undefined;

    const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

    return {
      id: fieldId,
      'aria-invalid': invalid ? 'true' : 'false',
      'aria-required': required ? 'true' : 'false',
      'aria-describedby': describedBy || undefined,
      errorProps: error ? {
        id: errorId,
        role: 'alert',
        'aria-live': 'polite'
      } : {},
      descriptionProps: description ? {
        id: descriptionId
      } : {}
    };
  }, []);

  return {
    generateFieldProps
  };
};

/**
 * Loading state accessibility
 */
export const useLoadingAnnouncements = () => {
  const { announce } = useAnnouncements();

  const announceLoading = useCallback((message = 'Loading...') => {
    announce(message, 'polite');
  }, [announce]);

  const announceLoadingComplete = useCallback((message = 'Loading complete') => {
    announce(message, 'polite');
  }, [announce]);

  const announceLoadingError = useCallback((message = 'Loading failed') => {
    announce(message, 'assertive');
  }, [announce]);

  return {
    announceLoading,
    announceLoadingComplete,
    announceLoadingError
  };
};

/**
 * Utility to create accessible button props
 */
export const createButtonProps = (options = {}) => {
  const {
    disabled = false,
    loading = false,
    loadingText = 'Loading...',
    ariaLabel,
    ariaDescribedBy,
    onClick
  } = options;

  return {
    type: 'button',
    disabled: disabled || loading,
    'aria-label': loading ? loadingText : ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-busy': loading ? 'true' : 'false',
    onClick: disabled || loading ? undefined : onClick
  };
};

/**
 * Utility to create accessible list props
 */
export const createListProps = (options = {}) => {
  const {
    role = 'list',
    ariaLabel,
    ariaDescribedBy,
    multiselectable = false
  } = options;

  return {
    role,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-multiselectable': multiselectable ? 'true' : 'false'
  };
};

/**
 * Utility to create accessible input props
 */
export const createInputProps = (options = {}) => {
  const {
    required = false,
    invalid = false,
    ariaLabel,
    ariaDescribedBy,
    placeholder,
    type = 'text'
  } = options;

  return {
    type,
    required,
    placeholder,
    'aria-label': ariaLabel,
    'aria-required': required ? 'true' : 'false',
    'aria-invalid': invalid ? 'true' : 'false',
    'aria-describedby': ariaDescribedBy
  };
};

export default {
  generateId,
  ARIA_ROLES,
  KEYS,
  ScreenReaderOnly,
  useFocusManagement,
  useAnnouncements,
  useKeyboardNavigation,
  useFormAccessibility,
  useLoadingAnnouncements,
  createButtonProps,
  createListProps,
  createInputProps
};