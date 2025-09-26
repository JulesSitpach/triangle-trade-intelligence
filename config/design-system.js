/**
 * Triangle Intelligence Design System Configuration
 * Provides centralized design tokens, component patterns, and UI consistency rules
 */

const DESIGN_TOKENS = {
  // Color System - Based on Descartes Professional Theme
  colors: {
    primary: {
      50: '#BAE8FF',
      100: '#87CEEB',
      200: '#5DADE2',
      300: '#3498DB',
      400: '#2980B9',
      500: '#009CEB',    // Primary interactive
      600: '#0055AA',
      700: '#134169',    // Primary brand
      800: '#0E2A4A',
      900: '#012A49'     // Darkest brand
    },

    semantic: {
      success: '#16a34a',
      warning: '#f59e0b',
      error: '#dc2626',
      info: '#3b82f6'
    },

    neutral: {
      50: '#f4f5f6',
      100: '#e8e9ea',
      200: '#cccdce',
      300: '#a8a9aa',
      400: '#848586',
      500: '#6a6b6c',
      600: '#565656',    // Primary text
      700: '#404041',
      800: '#2c2d2e',
      900: '#1a1a1a'
    }
  },

  // Typography Scale
  typography: {
    fontFamily: {
      primary: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Consolas', monospace"
    },

    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'  // 36px
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing Scale (8px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem'      // 96px
  },

  // Border Radius Scale
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },

  // Shadow System
  boxShadow: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
  },

  // Breakpoints for Responsive Design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Component Pattern Library
const COMPONENT_PATTERNS = {
  // Dashboard Layout Pattern
  dashboard: {
    header: {
      className: 'dashboard-header',
      minHeight: '80px',
      background: 'var(--gradient-header)',
      padding: 'var(--space-6)',
      color: 'white'
    },

    sidebar: {
      className: 'dashboard-sidebar',
      width: '280px',
      background: 'var(--gray-50)',
      borderRight: '1px solid var(--gray-200)'
    },

    main: {
      className: 'dashboard-main',
      padding: 'var(--space-6)',
      background: 'white',
      minHeight: '100vh'
    }
  },

  // Card Pattern
  card: {
    base: {
      className: 'card',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-6)',
      border: '1px solid var(--gray-200)'
    },

    header: {
      className: 'card-header',
      paddingBottom: 'var(--space-4)',
      borderBottom: '1px solid var(--gray-200)',
      marginBottom: 'var(--space-4)'
    }
  },

  // Button Pattern
  button: {
    base: {
      className: 'btn',
      padding: 'var(--space-3) var(--space-6)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none'
    },

    primary: {
      className: 'btn-primary',
      background: 'var(--blue-500)',
      color: 'white'
    },

    secondary: {
      className: 'btn-secondary',
      background: 'var(--gray-200)',
      color: 'var(--gray-800)'
    }
  },

  // Form Pattern
  form: {
    group: {
      className: 'form-group',
      marginBottom: 'var(--space-5)'
    },

    label: {
      className: 'form-label',
      display: 'block',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      color: 'var(--gray-700)',
      marginBottom: 'var(--space-2)'
    },

    control: {
      className: 'form-control',
      width: '100%',
      padding: 'var(--space-3)',
      border: '1px solid var(--gray-300)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-base)'
    }
  },

  // Table Pattern
  table: {
    wrapper: {
      className: 'table-wrapper',
      overflowX: 'auto',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)'
    },

    base: {
      className: 'admin-table',
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 'var(--text-sm)'
    },

    header: {
      className: 'table-header',
      background: 'var(--gray-50)',
      fontWeight: 'var(--font-semibold)',
      color: 'var(--gray-900)'
    }
  },

  // Modal Pattern
  modal: {
    overlay: {
      className: 'modal-overlay',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    },

    content: {
      className: 'modal-content',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      padding: 'var(--space-8)',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    }
  },

  // Status Badge Pattern
  badge: {
    base: {
      className: 'status-badge',
      display: 'inline-block',
      padding: 'var(--space-1) var(--space-3)',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
      textTransform: 'uppercase',
      letterSpacing: '0.025em'
    },

    variants: {
      pending: {
        className: 'status-pending',
        background: 'var(--amber-100)',
        color: 'var(--amber-800)'
      },
      active: {
        className: 'status-active',
        background: 'var(--blue-100)',
        color: 'var(--blue-800)'
      },
      completed: {
        className: 'status-completed',
        background: 'var(--green-100)',
        color: 'var(--green-800)'
      }
    }
  }
};

// UI Consistency Rules
const CONSISTENCY_RULES = {
  // Layout Rules
  layout: {
    containerMaxWidth: '1200px',
    containerPadding: 'var(--space-4)',
    headerHeight: '80px',
    sidebarWidth: '280px',
    contentPadding: 'var(--space-6)'
  },

  // Typography Rules
  typography: {
    headingScale: ['2.25rem', '1.875rem', '1.5rem', '1.25rem', '1.125rem', '1rem'],
    bodyText: 'var(--text-base)',
    smallText: 'var(--text-sm)',
    captionText: 'var(--text-xs)'
  },

  // Spacing Rules
  spacing: {
    sectionGap: 'var(--space-12)',
    componentGap: 'var(--space-6)',
    elementGap: 'var(--space-4)',
    tightGap: 'var(--space-2)'
  },

  // Interactive Rules
  interactive: {
    hoverScale: '1.02',
    activeScale: '0.98',
    transitionDuration: '0.2s',
    focusOutline: '2px solid var(--blue-500)',
    focusOffset: '2px'
  }
};

// Accessibility Guidelines
const ACCESSIBILITY_GUIDELINES = {
  colorContrast: {
    minimum: 4.5,
    enhanced: 7,
    largeText: 3
  },

  focusManagement: {
    visibleFocus: true,
    keyboardNavigation: true,
    skipLinks: true
  },

  semantics: {
    headingHierarchy: true,
    landmarkRoles: true,
    descriptiveLabels: true,
    altText: true
  },

  responsive: {
    minTouchTarget: '44px',
    textScaling: '200%',
    viewportMeta: true
  }
};

// CSS Class Generator Utilities
const generateCSSClass = (pattern, variant = 'base') => {
  const basePattern = COMPONENT_PATTERNS[pattern];
  if (!basePattern) return '';

  const variantPattern = basePattern[variant];
  if (!variantPattern) return '';

  return variantPattern.className || '';
};

const getCSSProperties = (pattern, variant = 'base') => {
  const basePattern = COMPONENT_PATTERNS[pattern];
  if (!basePattern) return {};

  const variantPattern = basePattern[variant];
  if (!variantPattern) return {};

  const { className, ...properties } = variantPattern;
  return properties;
};

// Validation Functions
const validateDesignTokenUsage = (cssString) => {
  const issues = [];

  // Check for hardcoded colors
  const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/g;
  const hardcodedColors = cssString.match(colorRegex);
  if (hardcodedColors) {
    issues.push({
      type: 'hardcoded-colors',
      count: hardcodedColors.length,
      examples: hardcodedColors.slice(0, 3)
    });
  }

  // Check for hardcoded spacing
  const spacingRegex = /\d+px(?![;,}])/g;
  const hardcodedSpacing = cssString.match(spacingRegex);
  if (hardcodedSpacing) {
    issues.push({
      type: 'hardcoded-spacing',
      count: hardcodedSpacing.length,
      examples: hardcodedSpacing.slice(0, 3)
    });
  }

  return issues;
};

module.exports = {
  DESIGN_TOKENS,
  COMPONENT_PATTERNS,
  CONSISTENCY_RULES,
  ACCESSIBILITY_GUIDELINES,
  generateCSSClass,
  getCSSProperties,
  validateDesignTokenUsage
};