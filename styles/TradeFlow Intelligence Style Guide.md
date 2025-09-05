# TradeFlow Intelligence Style Guide
*Based on Shopify Admin Design Patterns*

## Design Principles

### 1. Information Hierarchy
- **Page Titles**: Clear, concise, never oversized
- **Sections**: Well-defined with proper spacing
- **Content Density**: Efficient use of space without crowding
- **White Space**: Strategic, not excessive

### 2. Professional Color Usage
- **Neutral Foundations**: Grays for structure and text
- **Accent Colors**: Sparingly used for actions and status
- **Semantic Colors**: Green for success, amber for warnings
- **No Bright Primary Colors**: Avoid basic blue/red/green

## Typography Scale

### Headers (Shopify-Inspired Sizing)
```css
/* Page Headers - Never Massive */
.page-title {
  @apply text-xl font-semibold;  /* NOT text-3xl */
  color: var(--navy-900);
  margin-bottom: 8px;
}

.page-subtitle {
  @apply text-sm;  /* NOT text-xl */
  color: var(--navy-600);
  margin-bottom: 24px;
}

/* Section Headers - Compact */
.section-title {
  @apply text-lg font-medium;
  color: var(--navy-900);
  margin-bottom: 16px;
}

/* Card Headers - Small and Clean */
.card-title {
  @apply text-base font-medium;  /* NOT text-lg */
  color: var(--navy-900);
  margin-bottom: 8px;
}
```

## Layout Patterns

### 1. Page Structure (Shopify Pattern)
```jsx
// Correct Layout Structure
<div className="app-layout">
  <div className="page-container">
    <div className="page-header">
      <h1 className="page-title">USMCA Compliance Analysis</h1>
      <p className="page-subtitle">Professional trade classification and assessment</p>
    </div>
    
    <div className="page-content">
      {/* Main content here */}
    </div>
  </div>
</div>
```

### 2. Card Design (Shopify Style)
```css
.card {
  background: white;
  border: 1px solid var(--warm-gray-200);
  border-radius: 8px;  /* NOT 12px or larger */
  padding: 20px;       /* NOT 24px or 32px */
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);  /* Subtle */
}

.card-compact {
  padding: 12px 16px;  /* For smaller cards */
}
```

## Component Standards

### Buttons (Shopify Sizing)
```css
/* Primary Actions - Not Oversized */
.btn-primary {
  @apply inline-flex items-center;
  padding: 8px 16px;      /* NOT 12px 24px */
  font-size: 14px;        /* NOT 16px */
  font-weight: 500;
  border-radius: 6px;
  background: var(--sage-500);
  color: white;
  border: none;
}

.btn-secondary {
  padding: 7px 15px;      /* 1px less for border */
  font-size: 14px;
  border: 1px solid var(--warm-gray-300);
  background: white;
  color: var(--navy-700);
}
```

### Forms (Shopify Pattern)
```css
.form-section {
  margin-bottom: 24px;    /* NOT 32px or 48px */
}

.form-label {
  @apply block text-sm font-medium;
  color: var(--navy-700);
  margin-bottom: 4px;     /* Tight spacing */
}

.form-input {
  @apply w-full;
  padding: 8px 12px;      /* NOT 12px 16px */
  font-size: 14px;        /* NOT 16px */
  border: 1px solid var(--warm-gray-300);
  border-radius: 6px;
  background: white;
}
```

## Spacing System (Shopify-Inspired)

### Consistent Spacing Scale
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;      /* Rarely used */
}

/* Apply Consistently */
.section-spacing { margin-bottom: var(--space-xl); }
.element-spacing { margin-bottom: var(--space-lg); }
.tight-spacing { margin-bottom: var(--space-sm); }
```

## Status Indicators (Shopify Style)

```css
.status-badge {
  @apply inline-flex items-center;
  padding: 2px 8px;       /* Very compact */
  font-size: 12px;        /* Small text */
  font-weight: 500;
  border-radius: 4px;
}

.status-success {
  background: var(--sage-100);
  color: var(--sage-800);
}

.status-info {
  background: var(--teal-100);
  color: var(--teal-800);
}
```

## Data Display (Shopify Pattern)

### Metrics Cards
```css
.metric-card {
  @apply text-center;
  padding: 16px;          /* NOT 24px */
  border: 1px solid var(--warm-gray-200);
  border-radius: 6px;
}

.metric-value {
  @apply text-2xl font-semibold;  /* NOT text-3xl */
  color: var(--navy-900);
  margin-bottom: 4px;
}

.metric-label {
  @apply text-sm;         /* NOT text-base */
  color: var(--navy-600);
}
```

## Common Anti-Patterns to Avoid

### ❌ Don't Do This
```jsx
// Oversized headers
<h1 className="text-4xl font-bold mb-8">

// Excessive spacing  
<div className="mb-12 py-8">

// Bright primary colors
<button className="bg-blue-600 text-white">

// Oversized buttons
<button className="px-8 py-4 text-lg">
```

### ✅ Do This Instead
```jsx
// Appropriate sizing
<h1 className="page-title">

// Efficient spacing
<div className="section-spacing">

// Professional colors
<button className="btn-primary">

// Right-sized buttons
<button className="btn-primary">
```

## Implementation Rules

1. **Never use text-3xl or larger** for interface elements
2. **Maximum button padding**: 8px vertical, 16px horizontal
3. **Card spacing**: 16-20px padding, not more
4. **Section margins**: 24px maximum between sections
5. **Use semantic CSS classes**, not inline Tailwind
6. **Status indicators should be small** (12px font, minimal padding)

## Quick Reference

| Element | Shopify Size | Your Class |
|---------|--------------|------------|
| Page Title | text-xl | `.page-title` |
| Section Title | text-lg | `.section-title` |
| Card Title | text-base | `.card-title` |
| Body Text | text-sm | `.text-body` |
| Button | 8px/16px padding | `.btn-primary` |
| Form Input | 8px/12px padding | `.form-input` |

This creates a professional, enterprise-grade appearance that matches Shopify's sophisticated but accessible design standards.