# Triangle Intelligence Style Guide

## Overview
Professional Bloomberg Terminal-inspired CSS architecture with modular, maintainable components and zero inline styles.

## Architecture

```
styles/
├── foundations/
│   └── variables.css        # Design tokens & CSS variables
├── components/
│   ├── dashboard.css        # Dashboard components
│   ├── errors.css          # Error boundary & error states
│   ├── forms.css           # Form components
│   ├── layout.css          # Layout containers
│   ├── navigation.css      # Navigation components
│   ├── dynamic-forms.css   # Dynamic form components
│   └── usmca-workflow.css  # USMCA specific styles
├── utilities/
│   ├── breakpoints.css     # Responsive breakpoints
│   ├── spacing.css         # Spacing utilities
│   └── helpers.css         # Utility classes
└── globals.css             # Main entry point

```

## Core Principles

### 1. NO INLINE STYLES
```jsx
// ❌ NEVER DO THIS
<div style={{marginTop: '20px', color: 'red'}}>

// ✅ ALWAYS USE CSS CLASSES
<div className="error-message mt-lg">
```

### 2. Component-Based Classes
```css
/* Use semantic, component-based naming */
.error-boundary-container { }
.error-boundary-header { }
.error-boundary-message { }

/* Use BEM-like modifiers */
.error-button--retry { }
.error-button--home { }
.error-button--status { }
```

### 3. Design Tokens
All values should reference CSS variables:
```css
/* ✅ Good */
.component {
  color: var(--text-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
}

/* ❌ Bad - hardcoded values */
.component {
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
}
```

## Color System

### Brand Colors
- **Primary**: `var(--bloomberg-blue)` - #0ea5e9
- **Dark Background**: `var(--bg-primary)` - #10172a
- **Text Primary**: `var(--text-primary)` - #f1f5f9

### Status Colors
- **Success**: `var(--status-success)` - #22c55e
- **Warning**: `var(--status-warning)` - #eab308
- **Error**: `var(--status-error)` - #ef4444
- **Info**: `var(--status-info)` - #0ea5e9

### USMCA Market Colors
- **USA**: `var(--color-usa)` - Blue
- **Mexico**: `var(--color-mexico)` - Green
- **Canada**: `var(--color-canada)` - Red

## Typography

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px - small labels */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - emphasis */
--text-xl: 1.25rem;    /* 20px - h4 */
--text-2xl: 1.5rem;    /* 24px - h3 */
--text-3xl: 1.875rem;  /* 30px - h2 */
--text-4xl: 2.25rem;   /* 36px - h1 */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

Based on 4px (0.25rem) unit:
```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
```

## Component Examples

### Error Boundary (No Inline Styles)
```jsx
// Component uses only CSS classes
<div className="error-boundary-container">
  <h2 className="error-boundary-header">
    <span className="error-boundary-icon">⚠️</span>
    Something went wrong
  </h2>
  <p className="error-boundary-message">
    Error description here
  </p>
  <div className="error-actions">
    <button className="error-button error-button--retry">
      Try Again
    </button>
  </div>
</div>
```

### Forms
```jsx
<div className="form-container">
  <div className="form-group">
    <label className="form-label required">
      Company Name
    </label>
    <input className="form-input" />
    <span className="form-help-text">
      Enter your company name
    </span>
  </div>
</div>
```

### Alerts
```jsx
<div className="alert alert-success">
  Successfully saved!
</div>

<div className="alert alert-error">
  An error occurred
</div>
```

## Utility Classes

### Display
- `d-none`, `d-block`, `d-flex`, `d-inline-block`
- `d-md-none`, `d-lg-flex` (responsive)

### Flexbox
- `flex-row`, `flex-column`
- `justify-center`, `justify-between`
- `align-center`, `align-start`
- `gap-sm`, `gap-md`, `gap-lg`

### Spacing
- Margin: `mt-lg`, `mb-md`, `mx-auto`
- Padding: `p-lg`, `pt-xl`, `pb-sm`

### Typography
- `text-center`, `text-left`, `text-right`
- `text-lg`, `text-xl`, `text-2xl`
- `font-bold`, `font-semibold`
- `uppercase`, `capitalize`

### Colors
- Text: `text-primary`, `text-error`, `text-success`
- Background: `bg-primary`, `bg-secondary`

### Borders
- `border`, `border-2`
- `rounded`, `rounded-lg`, `rounded-full`
- `border-error`, `border-success`

### Shadows
- `shadow-sm`, `shadow`, `shadow-lg`
- `shadow-bloomberg`

## Responsive Design

### Breakpoints
```css
--bp-xs: 480px;   /* Mobile landscape */
--bp-sm: 640px;   /* Tablet portrait */
--bp-md: 768px;   /* Tablet landscape */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1200px;  /* Large desktop */
--bp-2xl: 1440px; /* Extra large desktop */
```

### Media Queries
```css
/* Mobile First */
@media (min-width: 768px) { }  /* Tablet+ */
@media (min-width: 1024px) { } /* Desktop+ */

/* Utility Classes */
.hide-on-mobile   /* Hidden < 640px */
.hide-on-tablet   /* Hidden 641px-1024px */
.hide-on-desktop  /* Hidden > 1025px */
```

## Animation System

### Transitions
```css
--transition-fast: 150ms ease-out;
--transition-normal: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

### Common Animations
- `fadeIn` - Opacity fade
- `slideUp` - Slide from bottom
- `pulse` - Pulsing effect
- `shake` - Error shake

## Best Practices

### 1. Component Isolation
Each component should have its own CSS module with clear boundaries:
```css
/* components/errors.css */
.error-boundary-container { }
.error-boundary-header { }
.error-boundary-message { }
```

### 2. Use Design Tokens
Always use CSS variables for consistency:
```css
/* Good */
padding: var(--space-md);
color: var(--text-primary);

/* Bad */
padding: 16px;
color: #f1f5f9;
```

### 3. Mobile-First Responsive
Build for mobile, then enhance:
```css
.component {
  /* Mobile styles (default) */
  padding: var(--space-sm);
}

@media (min-width: 768px) {
  .component {
    /* Tablet+ enhancement */
    padding: var(--space-md);
  }
}
```

### 4. Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure proper color contrast
- Support keyboard navigation
- Include focus states

### 5. Performance
- Minimize specificity wars
- Use CSS variables for theming
- Avoid deep nesting
- Keep selectors simple
- Leverage CSS Grid and Flexbox

## Migration Guide

### Converting Inline Styles
```jsx
// Before (Inline Styles)
<div style={{
  padding: '16px',
  marginTop: '24px',
  backgroundColor: '#10172a',
  borderRadius: '8px'
}}>

// After (CSS Classes)
<div className="p-md mt-lg bg-primary rounded-lg">

// Or create a component class
<div className="custom-container">

// In CSS:
.custom-container {
  padding: var(--space-md);
  margin-top: var(--space-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
}
```

## Testing Checklist

- [ ] No inline styles (`style={{}}`)
- [ ] All values use CSS variables
- [ ] Components have semantic class names
- [ ] Responsive design works on all breakpoints
- [ ] Dark theme (Bloomberg style) consistent
- [ ] Accessibility features included
- [ ] Performance optimized (no deep nesting)
- [ ] Animations respect prefers-reduced-motion

## Resources

- [CSS Variables Reference](./foundations/variables.css)
- [Component Library](./components/)
- [Utility Classes](./utilities/helpers.css)
- [Bloomberg Terminal Design Inspiration](https://www.bloomberg.com/professional/solution/bloomberg-terminal/)

---

*Last Updated: Following inline styles cleanup and modular architecture implementation*