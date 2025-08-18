# Bloomberg Terminal Style Guide
## Triangle Intelligence Platform

### Overview
This style guide documents the Bloomberg Terminal-inspired design system for the Triangle Intelligence platform. Our interface emulates the sophisticated, professional appearance of Bloomberg Terminal while maintaining usability and accessibility.

---

## Color Palette

### Core Colors
```css
--bloomberg-black: #000000;
--bloomberg-dark: #0a0f1c;
--bloomberg-gray-900: #10172a;
--bloomberg-gray-800: #1a2332;
--bloomberg-gray-700: #243045;
--bloomberg-gray-600: #334155;
--bloomberg-gray-500: #64748b;
--bloomberg-gray-400: #94a3b8;
--bloomberg-gray-300: #cbd5e1;
--bloomberg-gray-200: #e2e8f0;  /* Form backgrounds */
--bloomberg-gray-100: #f1f5f9;
```

### Accent Colors
```css
--bloomberg-blue: #0ea5e9;        /* Primary actions */
--bloomberg-blue-dark: #0284c7;   /* Hover states */
--bloomberg-blue-light: #38bdf8;  /* Borders, accents */
--bloomberg-orange: #f97316;      /* Warnings */
--bloomberg-green: #22c55e;       /* Success states */
--bloomberg-red: #ef4444;         /* Errors */
--bloomberg-yellow: #eab308;      /* Alerts */
```

### Usage Guidelines
- **Primary Text**: `--bloomberg-gray-100` on dark backgrounds
- **Secondary Text**: `--bloomberg-gray-300` for subtitles
- **Form Text**: `--bloomberg-gray-900` on light input backgrounds
- **Borders**: `--bloomberg-blue-light` for professional accent lines
- **Backgrounds**: 20% opacity overlays for cards over background images

---

## Typography

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', monospace;
--font-data: 'Space Mono', 'IBM Plex Mono', monospace;
```

### Hierarchy
- **Hero Titles**: `font-size: 3rem; font-weight: 700; line-height: 1.2;`
- **Section Titles**: `font-size: 1.5rem; font-weight: 600; text-transform: uppercase;`
- **Card Titles**: `font-size: 1.125rem; font-weight: 600;`
- **Body Text**: `font-size: 1rem; line-height: 1.6;`
- **Labels**: `font-size: 0.875rem; font-weight: 500; text-transform: uppercase;`

---

## Layout System

### Grid Classes
```css
.bloomberg-grid-2    /* 2 columns, 300px each, centered */
.bloomberg-grid-3    /* 3 columns, 300px each, centered */
.bloomberg-grid-4    /* 4 columns, 300px each, centered */
```

### Container Classes
```css
.bloomberg-container-padded   /* Full width with padding */
.bloomberg-section           /* Centered sections with padding */
.foundation-workspace        /* 2fr 1fr grid for form + panel */
```

### Background Patterns
```css
/* Full-screen background with overlay */
background-image: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), 
                 url('/image/datos-financieros.jpg');
background-size: cover;
background-position: center;
background-attachment: fixed;
```

---

## Component Library

### Cards
```css
.bloomberg-card {
  background: linear-gradient(145deg, var(--bloomberg-gray-800), var(--bloomberg-gray-900));
  border: 1px solid var(--bloomberg-blue-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.metric-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--bloomberg-blue-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}
```

### Navigation
```css
.bloomberg-nav {
  background: var(--bloomberg-gray-900);
  border-bottom: 1px solid var(--bloomberg-gray-700);
  padding: var(--space-md) 0;
}

.bloomberg-nav-brand {
  font-weight: 700;
  color: var(--bloomberg-gray-100);
}

.bloomberg-nav-link {
  color: var(--bloomberg-gray-300);
  text-transform: uppercase;
  font-weight: 500;
}
```

### Status Indicators
```css
.bloomberg-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.bloomberg-status-success { background: rgba(34, 197, 94, 0.1); color: var(--bloomberg-green); }
.bloomberg-status-info { background: rgba(14, 165, 233, 0.1); color: var(--bloomberg-blue); }
.bloomberg-status-warning { background: rgba(234, 179, 8, 0.1); color: var(--bloomberg-yellow); }
.bloomberg-status-error { background: rgba(239, 68, 68, 0.1); color: var(--bloomberg-red); }
```

### Form Elements
```css
.bloomberg-input, .bloomberg-select {
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--bloomberg-blue-light);
  border-radius: var(--radius-md);
  background: var(--bloomberg-gray-200);
  color: var(--bloomberg-gray-900);
  font-size: 0.875rem;
}

.bloomberg-input:focus {
  border-color: var(--bloomberg-blue);
  box-shadow: 0 0 0 3px rgba(0, 136, 204, 0.1);
}
```

### Buttons
```css
.bloomberg-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  text-transform: uppercase;
  transition: all var(--transition-fast);
}

.bloomberg-btn-primary {
  background: var(--bloomberg-blue);
  color: white;
  border: 1px solid var(--bloomberg-blue);
}

.bloomberg-btn-secondary {
  background: transparent;
  color: var(--bloomberg-gray-300);
  border: 1px solid var(--bloomberg-gray-600);
}
```

---

## Usage Patterns

### Page Structure
1. **Head Section**: Title, meta tags
2. **Navigation**: Post-signin nav with user info, status, notifications
3. **Main Content**: Full-screen background with overlay
4. **Side Navigation**: Step progression (Foundation → Product → etc.)
5. **Content Areas**: Cards with 20% opacity backgrounds

### Post-Signin Navigation Elements
- **User Session Info**: `USER: admin@triangleintel.com` with green dot
- **Live System Status**: `ACTIVE SESSION` with blue dot  
- **System Notifications**: `🔔 3 ALERTS` with warning styling
- **Language Switcher**: Multi-language support
- **Account/Logout**: Account access and logout buttons

### Card Styling Guidelines
- **Metric Cards**: 20% opacity background, turquoise borders
- **Form Cards**: Solid dark background, turquoise borders
- **Intelligence Panels**: Dark background, turquoise borders
- **All Cards**: Consistent turquoise accent borders

### Form Styling Guidelines
- **Inputs**: Light grey background, dark text, turquoise borders
- **Dropdowns**: Same styling as inputs with dark arrow icon
- **Labels**: Uppercase, medium font weight
- **Required Fields**: Asterisk indicators

---

## Responsive Breakpoints

### Desktop (1024px+)
- Full grid layouts (2-4 columns)
- Fixed-width cards (300px)
- Complete navigation elements

### Tablet (768px)
- Reduced grid columns
- Smaller card widths (280px)
- Simplified navigation

### Mobile (480px)
- Single column layouts
- Full-width cards
- Collapsed navigation

---

## Best Practices

### Do's
✅ Use turquoise accent borders on all cards
✅ Maintain 20% opacity on metric cards
✅ Keep consistent spacing with CSS variables
✅ Use uppercase text for labels and navigation
✅ Include status dots for live indicators
✅ Apply background overlays at 65% opacity

### Don'ts
❌ Don't use emojis in professional interfaces
❌ Don't stretch cards full width - use fixed 300px
❌ Don't mix border colors - stick to turquoise theme
❌ Don't use solid backgrounds over background images
❌ Don't forget focus states on interactive elements

---

## Files Reference
- **Main Stylesheet**: `/styles/bloomberg-professional-clean.css`
- **Background Image**: `/image/datos-financieros.jpg`
- **Component Examples**: `/pages/foundation.js`, `/pages/index.js`

---

*This style guide ensures consistent Bloomberg Terminal-quality design across the Triangle Intelligence platform.*