# Style Guide - Triangle Intelligence (Descartes-Inspired Design)

## Design System Overview
This style guide documents the existing Descartes-inspired professional design system implemented in `styles/globals.css`. All styling follows a custom CSS architecture with NO Tailwind CSS and NO inline styles.

## Typography System

### Font Stack
```css
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes (Descartes Professional Scale)
- **Base**: 1.25rem (20px) - Enhanced readability
- **H1**: 2.25rem (36px)
- **H2**: 1.875rem (30px)
- **H3**: 1.5rem (24px)
- **H4**: 1.25rem (20px)
- **Small**: 0.875rem (14px)
- **XS**: 0.75rem (12px)

### Font Weights
- **Light**: 300 (body text)
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600 (headers)
- **Bold**: 700

## Color Palette (Descartes Professional)

### Navy Scale (Primary Brand)
```css
--navy-50: #BAE8FF;      /* Light blue */
--navy-100: #87CEEB;     /* Lighter variant */
--navy-200: #5DADE2;     
--navy-300: #3498DB;     
--navy-400: #2980B9;     
--navy-500: #0055AA;     /* Medium blue */
--navy-600: #007cba;     /* Blue text */
--navy-700: #134169;     /* Primary brand */
--navy-800: #0E2A4A;     
--navy-900: #012A49;     /* High contrast */
```

### Blue Scale (Interactive)
```css
--blue-500: #009CEB;     /* Primary interactive */
--blue-600: #0055AA;     /* Medium blue */
--blue-700: #134169;     /* Hover state */
```

### Semantic Colors
```css
--green-600: #16a34a;    /* Success */
--amber-600: #d97706;    /* Warning */
--gray-700: #565656;     /* Primary text */
```

### Professional Gradients
```css
--gradient-primary: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-700) 100%);
--gradient-header: linear-gradient(90deg, #134169 0%, #009CEB 100%);
--gradient-hero: linear-gradient(135deg, #012A49 0%, #134169 40%, #009CEB 100%);
```

## Spacing System (8px Grid)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

## Component Classes

### Buttons
- `.btn-primary` - Gradient background, white text
- `.btn-secondary` - White background, navy text
- `.btn-success` - Green background
- `.btn-danger` - Amber background
- `.btn-large` - Larger padding variant

### Cards
- `.card` - White background with shadow
- `.card-header` - Bordered header section
- `.card-title` - Card heading style
- `.content-card` - Enhanced card with gradient

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Field labels
- `.form-input` - Text inputs
- `.form-select` - Dropdown selects

### Status Indicators
- `.status-success` - Green badge
- `.status-warning` - Amber badge
- `.status-info` - Blue badge

### Grid Layouts
- `.grid-2-cols` - Two column grid
- `.grid-3-cols` - Three column grid
- `.grid-4-cols` - Four column grid

## Layout Structure

### Container System
```css
.container-app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Main Sections
- `.app-layout` - Root layout wrapper
- `.app-header` - Fixed navigation header
- `.main-content` - Page content area
- `.hero-section` - Hero sections with video

## Shadow System
```css
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

## Border Radius
```css
--radius-sm: 0.25rem;    /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
```

## Responsive Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px)  /* Small */
@media (min-width: 768px)  /* Medium */
@media (min-width: 1024px) /* Large */
@media (min-width: 1280px) /* XL */
```

## Special Components

### Hero Sections
- `.hero-video-section` - Full viewport video background
- `.hero-gradient-overlay` - Gradient overlay for text visibility
- `.hero-content-container` - Centered content wrapper
- `.hero-main-title` - 4rem hero title
- `.hero-gradient-text` - Blue gradient text effect

### Navigation
- `.nav-fixed` - Fixed top navigation
- `.nav-menu-link` - Navigation links
- `.nav-cta-button` - Call-to-action button

### Trust Indicators
- `.trust-indicator` - Glassmorphism trust badges
- `.trust-icon` - Circular icon containers
- `.trust-indicator-value` - Large metric displays

## Animation Classes
```css
/* Transitions */
transition: all 0.15s ease;  /* Fast interactions */
transition: all 0.3s ease;   /* Smooth animations */

/* Hover Effects */
transform: translateY(-2px); /* Lift on hover */
transform: scale(1.1);       /* Scale on hover */
```

## Utility Classes

### Display
- `.hidden` - Hide element
- `.block` - Block display
- `.flex` - Flex display

### Text Alignment
- `.text-left`
- `.text-center`
- `.text-right`

### Colors
- `.text-muted` - Gray text
- `.text-body` - Default body color

## CSS Architecture Rules

### 1. Class Naming Convention
- Semantic names: `.hero-title`, `.card-header`
- Component-based: `.content-card-title`
- State modifiers: `.status-success`

### 2. Cascade Management
- Component styles in logical groups
- Media queries at component level
- Avoid deep nesting

### 3. Performance
- Use CSS custom properties for theming
- Minimize specificity
- Group related properties

## Testing Checklist

### Visual Validation
- [ ] All viewports tested (mobile, tablet, desktop)
- [ ] Dark/light contrast ratios meet WCAG AA
- [ ] Hover states work correctly
- [ ] Focus states are visible
- [ ] Animations are smooth

### Cross-Browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Responsive Design
- [ ] Content readable at all sizes
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll
- [ ] Images scale properly

## Usage Examples

### Creating a New Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title Here</h3>
  </div>
  <div class="card-body">
    <p class="text-body">Content here</p>
  </div>
</div>
```

### Button with Icon
```html
<button class="btn-primary">
  <span class="icon-sm">✓</span>
  Save Changes
</button>
```

### Form Field
```html
<div class="form-group">
  <label class="form-label">Field Name</label>
  <input type="text" class="form-input" />
</div>
```

## DO's and DON'Ts

### DO's ✅
- Use existing CSS classes from globals.css
- Follow 8px spacing grid
- Use CSS custom properties for colors
- Test on all breakpoints
- Maintain Descartes professional aesthetic

### DON'Ts ❌
- NO Tailwind CSS classes
- NO inline styles (style="...")
- NO arbitrary spacing values
- NO hardcoded colors
- NO !important unless absolutely necessary

## Maintenance Notes

### Adding New Components
1. Define in globals.css following existing patterns
2. Use existing color and spacing variables
3. Add responsive variants if needed
4. Document in this guide

### Modifying Existing Styles
1. Check impact across all components
2. Test on all viewports
3. Maintain backward compatibility
4. Update this documentation

---

*Based on existing styles/globals.css implementation*
*Descartes-inspired professional design system*
*Last Updated: September 2025*