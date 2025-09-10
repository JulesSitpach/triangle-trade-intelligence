# Triangle Intelligence Enterprise Design System

## Overview
Triangle Intelligence uses a professional dark theme design system optimized for enterprise SaaS applications. This guide shows how to properly implement consistent styling across all components.

## Color Palette & Variables

### Primary Colors
```css
--primary: 59 130 246;         /* Blue-500 */
--primary-dark: 29 78 216;     /* Blue-700 */  
--primary-light: 96 165 250;   /* Blue-400 */
```

### State Colors
```css
--danger: 239 68 68;           /* Red-500 */
--success: 34 197 94;          /* Green-500 */
--warning: 251 146 60;         /* Orange-400 */
--info: 14 165 233;            /* Sky-500 */
```

### Background Layers
```css
--bg-primary: 15 23 42;        /* Slate-900 - Main background */
--bg-secondary: 30 41 59;      /* Slate-800 - Secondary areas */
--bg-elevated: 51 65 85;       /* Slate-700 - Cards, elevated content */
--bg-card: 30 41 59;           /* Slate-800 - Card backgrounds */
```

### Text Colors
```css
--text-primary: 248 250 252;   /* Slate-50 - Primary text */
--text-secondary: 203 213 225; /* Slate-300 - Secondary text */
--text-muted: 148 163 184;     /* Slate-400 - Muted text */
```

## Component Classes

### Cards & Containers
```css
.card                 /* Professional card with glass effect */
.card-header          /* Card header section */
.card-body            /* Main card content */
.card-footer          /* Card footer section */
```

### Forms
```css
.form-section         /* Form section wrapper */
.form-group           /* Individual field group */
.form-label           /* Field labels */
.form-label-required  /* Required field labels (adds *) */
.form-input           /* Text inputs */
.form-select          /* Dropdown selects */
.form-textarea        /* Textarea inputs */
.form-error           /* Error messages */
.form-help-text       /* Help text */
```

### Buttons
```css
.btn                  /* Base button */
.btn-primary          /* Primary actions */
.btn-secondary        /* Secondary actions */
.btn-danger           /* Destructive actions */
.btn-success          /* Success actions */
.btn-large            /* Large button variant */
.btn-small            /* Small button variant */
```

### Status & Alerts
```css
.badge               /* Status badges */
.badge-success       /* Success state */
.badge-warning       /* Warning state */
.badge-danger        /* Error state */
.badge-info          /* Info state */

.alert               /* Alert containers */
.alert-success       /* Success alerts */
.alert-warning       /* Warning alerts */  
.alert-error         /* Error alerts */
.alert-info          /* Info alerts */
```

### Crisis Components
```css
.crisis-alert-critical    /* High-impact crisis alerts */
.crisis-amount           /* Financial impact amounts */
.crisis-action-button    /* Crisis action buttons */
.impact-metric          /* Financial metrics */
```

## Usage Examples

### ✅ Correct Implementation (CompanyInformationStep.js style)
```jsx
// Professional card layout
<div className="card">
  <div className="card-body">
    <h2 className="form-section-title">Step Title</h2>
    
    <div className="form-section">
      <div className="form-group">
        <label className="form-label form-label-required">
          Field Label
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter value"
        />
        <span className="form-help-text">
          Helpful guidance text
        </span>
      </div>

      <div className="form-group">
        <label className="form-label">Dropdown Field</label>
        <select className="form-select">
          <option value="">Select option...</option>
          <option value="value1">Option 1</option>
        </select>
      </div>
    </div>
  </div>
</div>
```

### ❌ Incorrect Implementation (causes theme inconsistency)
```jsx
// Don't do this - creates light/dark theme conflicts
<div className="bg-white rounded-xl p-8">
  <input className="border-gray-300 focus:ring-blue-500" />
  <select className="border-gray-300">
    <option>Light theme dropdown</option>
  </select>
</div>
```

## Form Field Standards

### Input States
- **Default**: Professional dark styling with subtle borders
- **Focus**: Blue accent border with soft glow effect
- **Error**: Red accent with error message below
- **Disabled**: Reduced opacity with cursor-not-allowed

### Dropdown Enhancements
- Maximum height with scroll for long option lists
- Hover states for better UX
- Loading states for dynamic options
- Professional styling consistent with text inputs

## Button Hierarchy

### Primary Actions
```jsx
<button className="btn btn-primary">Process Workflow</button>
```

### Secondary Actions  
```jsx
<button className="btn btn-secondary">Previous</button>
```

### Destructive Actions
```jsx
<button className="btn btn-danger">Delete Component</button>
```

## Crisis Alert System

### Financial Impact Alerts
```jsx
<div className="crisis-alert-critical">
  <div className="crisis-amount">
    <span className="crisis-amount-value">$2.8M</span>
    <span className="crisis-label">Additional Costs</span>
  </div>
  <p className="crisis-description">
    New tariff increases will cost your company significantly
  </p>
  <button className="crisis-action-button">
    Get Protection Now
  </button>
</div>
```

## Responsive Design

### Breakpoint System
- **Mobile**: < 640px (sm:)
- **Tablet**: 640px - 1024px (md:, lg:)  
- **Desktop**: > 1024px (xl:, 2xl:)

### Grid Patterns
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- Responsive 2-column layout -->
</div>
```

## Accessibility Standards

### Color Contrast
- All text meets WCAG 2.1 AA contrast requirements
- Focus states clearly visible with 3px blue outline
- Error states use both color and text indicators

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus trap patterns for modals and dropdowns
- Logical tab order throughout forms

## Development Rules

### Must Do ✅
1. **Always use design system classes** (`.form-input`, `.card`, `.btn-primary`)
2. **Never use ad-hoc light theme colors** (`bg-white`, `text-gray-900`)
3. **Use CSS custom properties** (`rgb(var(--primary))`)
4. **Follow responsive patterns** (mobile-first design)
5. **Include proper focus states** (accessibility requirement)

### Never Do ❌
1. **Mix light and dark themes** (breaks visual consistency)  
2. **Use hardcoded colors** (use CSS variables instead)
3. **Skip accessibility attributes** (ARIA labels, focus states)
4. **Create inconsistent button styles** (use `.btn` classes)
5. **Ignore loading states** (show feedback during API calls)

## Quick Reference

### Common Patterns
```jsx
// Standard form field
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" />
</div>

// Button group
<div className="flex gap-4">
  <button className="btn btn-secondary">Cancel</button>
  <button className="btn btn-primary">Save</button>
</div>

// Status badge
<span className="badge badge-success">Qualified</span>

// Alert message
<div className="alert alert-info">
  Information message here
</div>
```

This design system ensures professional, consistent styling across Triangle Intelligence's enterprise USMCA compliance platform.