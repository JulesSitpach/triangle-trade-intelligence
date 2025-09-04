# Design Principles - Triangle Intelligence

## Core Philosophy
Our design system prioritizes clarity, efficiency, and trust in B2B trade compliance.

## Fundamental Principles

### 1. Clarity First
- Information hierarchy must be immediately apparent
- Complex data presented in digestible formats
- Clear visual indicators for compliance status
- No ambiguity in critical business decisions

### 2. Professional Trust
- Enterprise-grade visual language
- Consistent, reliable interface patterns
- Data accuracy prominently displayed
- Source attribution for all compliance data

### 3. Efficiency & Speed
- Minimal clicks to critical information
- Smart defaults based on user context
- Batch operations for power users
- Keyboard shortcuts for frequent actions

### 4. Mobile-First Responsive
- Full functionality on all devices
- Touch-optimized interactions
- Progressive enhancement approach
- Offline-capable where possible

### 5. Accessibility Always
- WCAG 2.1 AA compliance minimum
- Screen reader optimized
- Keyboard navigation complete
- High contrast mode available

## Visual Language

### Color Psychology
- **Blue (#2563eb)**: Trust, stability, professional
- **Green (#16a34a)**: Success, qualification, savings
- **Red (#dc2626)**: Alert, non-compliance, critical
- **Amber (#eab308)**: Warning, attention needed
- **Gray (#6b7280)**: Neutral, secondary information

### Typography Hierarchy
```
H1: 48px - Page titles
H2: 36px - Section headers  
H3: 24px - Subsections
Body: 16px - Content
Small: 14px - Meta info
Micro: 12px - Legal text
```

### Spacing System
- Base unit: 8px
- Use multiples: 4, 8, 16, 24, 32, 48, 64
- Consistent padding across components
- Breathing room for data-heavy interfaces

## Component Patterns

### Forms
- Clear labels above inputs
- Inline validation with helpful messages
- Progress indicators for multi-step forms
- Auto-save for long forms

### Data Tables
- Sortable columns
- Sticky headers
- Row hover states
- Bulk selection
- Export functionality

### Navigation
- Clear current location indicator
- Breadcrumbs for deep navigation
- Search prominently placed
- Mobile-optimized menu

### Feedback
- Loading states for all async operations
- Success confirmations
- Error recovery guidance
- Progress indicators

## Interaction Principles

### Predictability
- Consistent behavior across the platform
- Standard patterns for common actions
- Clear cause and effect
- Undo capabilities where appropriate

### Forgiveness
- Confirmation for destructive actions
- Clear error messages with solutions
- Auto-save to prevent data loss
- Version history for critical data

### Performance
- Instant feedback (< 100ms)
- Progress for long operations
- Optimistic UI updates
- Background processing indication

## Decision Framework

When designing new features, ask:
1. Does it make compliance easier?
2. Is it immediately understandable?
3. Does it work on mobile?
4. Can it be accessed by everyone?
5. Does it maintain trust?
6. Is it faster than the current solution?

## Red Lines (Never Do)
- ❌ Sacrifice clarity for aesthetics
- ❌ Hide critical compliance information
- ❌ Use color alone to convey meaning
- ❌ Create mobile-only or desktop-only features
- ❌ Implement without loading states
- ❌ Launch without accessibility testing