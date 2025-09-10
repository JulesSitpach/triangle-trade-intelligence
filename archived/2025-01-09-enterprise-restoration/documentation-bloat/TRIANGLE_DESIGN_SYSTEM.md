# Triangle Intelligence Professional Design System

## Overview
Professional enterprise SaaS design system that creates a cohesive, trustworthy, and modern user experience suitable for a $50M+ trade compliance platform.

## Color Palette

### Primary Colors
```css
/* Blue (Primary Brand) */
blue-50: #eff6ff    /* Light backgrounds */
blue-600: #2563eb   /* Primary actions */
blue-700: #1d4ed8   /* Hover states */

/* Success States */
green-50: #f0fdf4   /* Success backgrounds */
green-600: #16a34a  /* Success actions */

/* Warning/Alert States */
red-50: #fef2f2     /* Alert backgrounds */
red-600: #dc2626    /* Alert actions */
yellow-50: #fffbeb  /* Warning backgrounds */
yellow-600: #d97706 /* Warning actions */
```

### Typography Colors
```css
gray-900: #111827   /* Primary text */
gray-600: #4b5563   /* Secondary text */
gray-500: #6b7280   /* Muted text */
```

## Component Classes

### Navigation
```tsx
// Professional Header
<nav className="bg-white shadow-lg border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">◢</span>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">Triangle Intelligence</div>
          <div className="text-sm text-gray-500 font-medium">USMCA Compliance Platform</div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        <a className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Link</a>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg">
          Primary Action
        </button>
      </div>
    </div>
  </div>
</nav>
```

### Professional Cards
```tsx
// Standard Card
<div className="bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition-all">
  <h3 className="text-2xl font-bold text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-600 mb-6 leading-relaxed">Card description text</p>
  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all w-full">
    Action Button
  </button>
</div>

// Feature Card with Border Accent
<div className="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-blue-500 hover:shadow-2xl transition-all">
  <!-- Content -->
</div>
```

### Form Components
```tsx
// Form Input
<div className="form-group">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Label Text
  </label>
  <input 
    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
    placeholder="Placeholder text"
  />
</div>

// Professional Select Dropdown
<select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none bg-white">
  <option>Select an option</option>
</select>

// Form Button Primary
<button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all">
  Submit
</button>

// Form Button Secondary
<button className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all">
  Cancel
</button>
```

### Alert/Status Components
```tsx
// Success Alert
<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
      <span className="text-green-600 text-xs">✓</span>
    </div>
    Success message text
  </div>
</div>

// Warning Alert
<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
      <span className="text-yellow-600 text-xs">!</span>
    </div>
    Warning message text
  </div>
</div>

// Error Alert
<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
      <span className="text-red-600 text-xs">×</span>
    </div>
    Error message text
  </div>
</div>
```

### Status Badges
```tsx
// High Confidence
<span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
  High Confidence
</span>

// Warning Status  
<span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
  Warning
</span>

// Critical Status
<span className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
  Critical
</span>
```

### Loading States
```tsx
// Loading Spinner
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
</div>

// Skeleton Loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

### Data Display
```tsx
// Metric Card
<div className="text-center p-6 bg-blue-50 rounded-xl">
  <div className="text-3xl font-bold text-blue-600 mb-2">96.8%</div>
  <div className="text-gray-600 font-medium">Success Rate</div>
</div>

// Progress Steps
<div className="flex items-center justify-between mb-8">
  <div className="flex items-center">
    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
      1
    </div>
    <span className="ml-3 font-medium text-gray-900">Step Name</span>
  </div>
  <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
    <div className="h-1 bg-blue-600 rounded w-1/3"></div>
  </div>
</div>
```

## Layout Patterns

### Hero Section
```tsx
<div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24 px-4">
  <div className="max-w-7xl mx-auto text-center">
    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
      Hero Title
    </h1>
    <p className="text-2xl text-gray-700 mb-6 max-w-4xl mx-auto font-medium">
      Hero subtitle
    </p>
    <div className="flex flex-col sm:flex-row gap-6 justify-center">
      <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 text-lg font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-xl">
        Primary CTA
      </button>
    </div>
  </div>
</div>
```

### Section Layout
```tsx
<section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-6">Section Title</h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">Section description</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Content cards -->
    </div>
  </div>
</section>
```

## Responsive Guidelines

### Breakpoints
- `sm:` 640px+ (mobile landscape)
- `md:` 768px+ (tablet)  
- `lg:` 1024px+ (desktop)
- `xl:` 1280px+ (large desktop)

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
<div className="text-base sm:text-lg md:text-xl lg:text-2xl">
  Responsive text sizing
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
  Responsive grid layout
</div>
```

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```css
focus:ring-4 focus:ring-blue-200 focus:border-blue-500
```

### Color Contrast
- Ensure minimum 4.5:1 contrast ratio for normal text
- Use 7:1 for small text
- Test with tools like WebAIM Color Contrast Checker

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Include alt text for images
- Use semantic elements (main, section, nav, etc.)

## Animation Guidelines

### Transitions
Use consistent timing and easing:
```css
transition-all duration-200 ease-in-out  /* Quick interactions */
transition-all duration-300 ease-in-out  /* Standard animations */
transition-all duration-500 ease-in-out  /* Slow/important animations */
```

### Hover Effects
```css
hover:scale-105      /* Subtle button lift */
hover:shadow-xl      /* Enhanced shadow */
hover:-translate-y-1 /* Card lift effect */
```

### Loading Animations
```css
animate-pulse        /* Gentle pulsing */
animate-spin         /* Loading spinners */
animate-bounce       /* Attention-grabbing */
```

This design system ensures Triangle Intelligence maintains a professional, enterprise-grade appearance that builds trust with Fortune 500 clients while providing excellent user experience across all devices and use cases.