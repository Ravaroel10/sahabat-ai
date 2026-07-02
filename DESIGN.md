# Design System - BantuArah

## Overview

BantuArah's visual language balances institutional trust with approachable warmth. The design draws from Claude's warm, safety-oriented palette while maintaining the clarity needed for a civic service platform. Soft corners, generous spacing, and a warm color foundation create an environment that feels supportive without infantilizing.

## Color Palette

### Strategy
**Restrained warmth with purposeful accent.** The palette centers on warm oranges that evoke safety and approachability (inspired by Claude's brand), tinted neutrals for hierarchy, and strategic color for status and wayfinding.

### Core Tokens (OKLCH)

**Surface & Background:**
- `--background`: `oklch(0.985 0.005 60)` — near-white with subtle warm tint
- `--card`: `oklch(1 0 0)` — pure white for content elevation
- `--muted`: `oklch(0.96 0.01 60)` — light warm gray for subtle backgrounds

**Primary (Brand):**
- `--primary`: `oklch(0.62 0.16 40)` — warm orange, Claude-inspired, conveys trust + warmth
- `--primary-foreground`: `oklch(0.99 0 0)` — near-white text on primary

**Accent:**
- `--accent`: `oklch(0.68 0.14 50)` — lighter warm orange for hover states and secondary CTAs
- `--accent-foreground`: `oklch(0.99 0 0)`

**Text:**
- `--foreground`: `oklch(0.25 0.015 30)` — dark warm gray, 4.5:1+ contrast
- `--muted-foreground`: `oklch(0.52 0.02 40)` — mid-tone for secondary text, still WCAG AA compliant

**Borders & Inputs:**
- `--border`: `oklch(0.90 0.01 60)` — subtle warm gray
- `--input`: `oklch(0.90 0.01 60)` — matching input borders

**Status Colors:**
- `--destructive`: `oklch(0.58 0.20 25)` — warm red for errors and urgent actions
- `--success`: `oklch(0.65 0.15 145)` — green for confirmations
- `--warning`: `oklch(0.75 0.15 75)` — amber for cautions
- `--info`: `oklch(0.65 0.12 250)` — blue for informational states

### Dark Mode
Not implemented yet. Light theme prioritized for accessibility and government service context.

## Typography

### Font Stack
**Primary**: Inter (via Google Fonts)
- Variable font for optimal loading
- Excellent Indonesian language support
- Clear at small sizes (critical for low-literacy users)
- Fallback: `ui-sans-serif, system-ui, sans-serif`

### Scale & Hierarchy
Following a clear typographic scale for scannable hierarchy:

**Display (Hero):**
- Size: `clamp(2rem, 4vw + 1rem, 3rem)` (32-48px)
- Weight: 700 (Bold)
- Line height: 1.1
- Letter spacing: -0.02em

**Headings:**
- H1: 2.25rem (36px), weight 700
- H2: 1.875rem (30px), weight 700
- H3: 1.5rem (24px), weight 600
- H4: 1.25rem (20px), weight 600

**Body:**
- Base: 1rem (16px), weight 400
- Line height: 1.6 (generous for readability)
- Max width: 65ch for long-form content

**Small/Meta:**
- 0.875rem (14px), weight 400
- Used for helper text, captions, metadata

### Text Wrapping
- Headings (H1-H3): `text-wrap: balance` for even line lengths
- Body paragraphs: `text-wrap: pretty` to reduce orphans
- Buttons/Labels: `text-wrap: nowrap` to prevent awkward breaks

## Layout

### Spacing Scale
Tailwind's default spacing with preference for these increments:
- Tight: 0.5rem (8px), 0.75rem (12px)
- Base: 1rem (16px), 1.5rem (24px)
- Comfortable: 2rem (32px), 3rem (48px)
- Generous: 4rem (64px), 6rem (96px)

### Grid & Breakpoints
- Mobile-first responsive design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar navigation: fixed at `lg` breakpoint (1024px+)
- Content container: max-width 1280px with 1rem padding on mobile

### Component Patterns
- **Cards**: Elevated surfaces for grouped content, soft shadows
- **Forms**: Single column on mobile, 2-column grid on desktop
- **Navigation**: Collapsible sidebar on mobile, persistent on desktop
- **Modals/Dialogs**: Centered overlay with backdrop

## Border Radius
Soft, approachable corners throughout:
- `--radius`: 0.75rem (12px) base
- Buttons, inputs, cards: 12px
- Larger containers: 16-20px (xl, 2xl)
- Avatar/icons: can go higher (full rounded when appropriate)

## Components

### shadcn/ui Foundation
Built on Radix UI primitives with Tailwind styling:
- Avatar, Badge, Button, Card, Checkbox
- Dialog, Dropdown Menu, Input, Label, Progress
- Scroll Area, Select, Sheet, Tabs, Textarea

**Customization approach**: Extend shadcn components rather than replacing them. Override color tokens and spacing in globals.css rather than modifying component files directly.

### Button Variants
- **Primary**: Solid primary color fill, white text, for main CTAs
- **Secondary**: Muted background, foreground text, for secondary actions
- **Outline**: Border only, transparent background, for tertiary actions
- **Destructive**: Solid destructive color, for delete/cancel actions
- **Ghost**: No background or border until hover, for navigation

### Form Elements
All form inputs include:
- Clear labels (not just placeholders)
- Helper text when needed (examples, format guidance)
- Error states with icon + message
- Sufficient touch target (min 44x44px)

## Icons
**lucide-react**: Consistent icon set, 20-24px default size

Icon usage rules:
- Always pair with text labels for primary actions
- Icon-only allowed for universally recognized actions (close, menu) with proper ARIA labels
- Use consistent size within context (24px for primary actions, 20px for secondary, 16px for inline)

## Motion & Animation

### Philosophy
Motion should clarify state changes and guide attention, never decorate for its own sake.

### Easing
- **Ease out**: For elements entering the viewport (cubic-bezier(0.16, 1, 0.3, 1))
- **Ease in-out**: For state transitions (cubic-bezier(0.4, 0, 0.2, 1))
- No bounce, no elastic (too playful for the context)

### Duration
- Micro-interactions (hover, focus): 150ms
- State changes (open/close): 200-300ms
- Page transitions: 400ms max

### Reduced Motion
`@media (prefers-reduced-motion: reduce)` respected throughout:
- Animations become instant transitions or crossfades
- Scrolling effects disabled
- Focus indicators still visible

### Common Animations
- **Button hover**: Scale 1.02, 150ms ease-out
- **Card hover**: Shadow elevation, 200ms ease-out
- **Dialog enter**: Fade + scale from 95%, 200ms
- **Loading states**: Spinner or skeleton, never block content

## Accessibility

### Contrast
All text meets WCAG 2.1 AA:
- Body text (16px): minimum 4.5:1 against background
- Large text (18px+ or 14px+ bold): minimum 3:1
- UI components: 3:1 for borders and interactive elements

### Focus States
- Visible focus ring on all interactive elements
- Ring color: `--ring` (primary color at 50% opacity)
- Ring offset: 2px for clarity
- Never remove outline without providing alternative

### Form Labels
- Every input has a visible `<label>` element
- Placeholder text is not a substitute for labels
- Error messages linked via `aria-describedby`

### Semantic HTML
- Proper heading hierarchy (no skipped levels)
- Landmark regions (nav, main, aside) for screen reader navigation
- Button vs. link distinction (buttons for actions, links for navigation)

### Language
- `lang="id"` on `<html>` element
- All content in Bahasa Indonesia
- Clear, plain language (8th grade reading level target)

## Responsive Behavior

### Mobile-First Approach
Design for 375px viewport first, enhance for larger screens:

**Mobile (< 768px):**
- Single column layouts
- Stacked navigation (hamburger menu)
- Full-width buttons
- Reduced spacing (1rem instead of 2rem)

**Tablet (768px - 1023px):**
- 2-column grids where appropriate
- Sidebar remains collapsible
- Balanced spacing

**Desktop (1024px+):**
- Persistent sidebar navigation (256px width)
- 3-column grids for feature cards
- Generous spacing and padding
- Main content offset by sidebar width

### Touch Targets
- Minimum 44x44px for all interactive elements (WCAG 2.5.5)
- Generous spacing between adjacent clickable items
- Form inputs have comfortable padding

## Design Tokens Summary

```css
/* Core Colors (OKLCH) */
--primary: oklch(0.62 0.16 40)         /* Warm orange - trust & warmth */
--accent: oklch(0.68 0.14 50)          /* Light warm orange */
--background: oklch(0.985 0.005 60)    /* Near-white warm tint */
--foreground: oklch(0.25 0.015 30)     /* Dark warm gray */
--muted: oklch(0.96 0.01 60)           /* Light warm gray */

/* Spacing */
--spacing-xs: 0.5rem   /* 8px */
--spacing-sm: 0.75rem  /* 12px */
--spacing-md: 1rem     /* 16px */
--spacing-lg: 1.5rem   /* 24px */
--spacing-xl: 2rem     /* 32px */
--spacing-2xl: 3rem    /* 48px */

/* Border Radius */
--radius: 0.75rem      /* 12px base */

/* Typography */
font-family: Inter, ui-sans-serif, system-ui, sans-serif
line-height: 1.6 (body), 1.1 (headings)
```

## Implementation Notes

1. **OKLCH color space** for perceptually uniform colors and better accessibility
2. **CSS custom properties** in globals.css for easy theming
3. **Tailwind v4** configuration with @theme inline directive
4. **Next.js font optimization** via next/font with Inter variable
5. **Component composition** over deep customization (prefer extending shadcn defaults)

## Anti-Patterns (Don't Do)

- ❌ Icon-only buttons without labels (except universally recognized: ✕, ☰)
- ❌ Placeholder text as the only label for form fields
- ❌ Body text below 16px on mobile
- ❌ Contrast ratios below WCAG AA
- ❌ Decorative animations that can't be disabled
- ❌ Nested cards (confusing hierarchy)
- ❌ Generic SaaS blue-gray palette (wrong emotional register)
- ❌ Overcomplicated navigation (max 2-3 levels)
