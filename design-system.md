# Curator Design System

This document captures the design tokens and patterns found in the Curator UI kit.

## Color Palette

### Primary
- `primary`: `#00288e` (Deep blue)
- `primary-container`: `#1e40af`
- `primary-fixed`: `#dde1ff`
- `primary-fixed-dim`: `#b8c4ff`
- `on-primary`: `#ffffff`
- `on-primary-container`: `#a8b8ff`
- `on-primary-fixed`: `#001453`
- `on-primary-fixed-variant`: `#173bab`

### Secondary
- `secondary`: `#00687a` (Teal)
- `secondary-container`: `#57dffe`
- `secondary-fixed`: `#acedff`
- `secondary-fixed-dim`: `#4cd7f6`
- `on-secondary`: `#ffffff`
- `on-secondary-container`: `#006172`
- `on-secondary-fixed`: `#001f26`
- `on-secondary-fixed-variant`: `#004e5c`

### Tertiary
- `tertiary`: `#611e00` (Burnt orange)
- `tertiary-container`: `#872d00`
- `tertiary-fixed`: `#ffdbce`
- `tertiary-fixed-dim`: `#ffb59a`
- `on-tertiary`: `#ffffff`
- `on-tertiary-container`: `#ffa583`
- `on-tertiary-fixed`: `#380d00`
- `on-tertiary-fixed-variant`: `#802a00`

### Surface & Background
- `background`: `#f8f9fa`
- `surface`: `#f8f9fa`
- `surface-bright`: `#f8f9fa`
- `surface-dim`: `#d9dadb`
- `surface-container`: `#edeeef`
- `surface-container-low`: `#f3f4f5`
- `surface-container-high`: `#e7e8e9`
- `surface-container-highest`: `#e1e3e4`
- `surface-container-lowest`: `#ffffff`
- `surface-variant`: `#e1e3e4`

### Text & UI
- `on-background`: `#191c1d`
- `on-surface`: `#191c1d`
- `on-surface-variant`: `##444653`
- `inverse-surface`: `#2e3132`
- `inverse-on-surface`: `#f0f1f2`
- `inverse-primary`: `#b8c4ff`

### Outlines & Separators
- `outline`: `#757684`
- `outline-variant`: `#c4c5d5`

### Status Colors
- `error`: `#ba1a1a`
- `error-container`: `#ffdad6`
- `on-error`: `#ffffff`
- `on-error-container`: `#93000a`

## Typography

### Font Families
- **Headlines**: Manrope (weights: 400, 500, 600, 700, 800)
- **Body**: Inter (weights: 400, 500, 600)
- **Labels**: Inter

### Scales
- Hero/Display: 5xl–7xl (70–88px approx)
- H1: 4xl (~48px)
- H2: 3xl (~36px)
- H3: 2xl (~24px)
- H4: xl (~20px)
- Body: base (~16px)
- Small/Caption: sm–xs (14–12px)
- Uppercase tracking: wide (tracking-widest)

## Spacing & Shapes

### Border Radius
- Default: `0.25rem` (4px)
- Large: `0.5rem` (8px)
- Extra large: `0.75rem` (12px)
- Full/pill: `9999px`

### Shadows & Effects
- `glass-panel` / `glass-card`: `background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px);`
- `editorial-shadow`: `box-shadow: 0 12px 32px -4px rgba(25, 28, 29, 0.06);`

## Components & Patterns

### Navigation
- Desktop: SideNavBar (fixed 256px width, sticky)
- Mobile: BottomNavBar (fixed bottom, 5 icons + center FAB)
- Active states: blue (`text-blue-700`) with `bg-white` + `shadow-sm`
- Inactive: slate gray (`text-slate-500`)

### Buttons
- Primary: `bg-primary`, `text-on-primary`, `rounded-lg`, `font-bold`, shadow
- Secondary: `bg-secondary`, `text-white`, similar styling
- Variant: white background with border (`border border-primary/10`)
- FAB: `w-14 h-14`, `rounded-full`, `bg-primary`, center shadow

### Cards
- Container: `bg-surface-container-lowest` with `border border-outline-variant/10` and `shadow-sm`
- Bento grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` with spans
- Hover effects: shadow expansion, scale transforms

### Tables
- Header: `bg-slate-50/50` or `bg-surface-container-low/50`
- Row hover: `hover:bg-slate-50/50`
- Striped: `divide-y divide-slate-100`

### Inputs
- Wrapper: `relative` with icon prefix
- Field: `bg-surface-container-lowest`, `ring-1 ring-outline-variant/15`, rounded
- Focus: `ring-2 ring-primary-container`

### Data Viz
- Bar charts: flex items with `rounded-t` and `bg-primary/xx` opacity levels
- Donut: SVG circles with `stroke-dasharray`
- Progress bars: `bg-surface-container` with inner fill bar

### Status Badges
- Active: `bg-secondary-container/20 text-secondary`
- Inactive: `bg-slate-100 text-slate-400`
- Sizes: `px-2.5 py-1`, `rounded-full`, `text-[10px] font-bold uppercase tracking-wider`

## Responsive Breakpoints (Tailwind defaults)

- `md`: 768px
- `lg`: 1024px
- Grid adjustments: 1 col → 2 cols (md) → 4 cols (lg)

## Dark Mode

Dark variants exist using `dark:` prefix. Primary colors invert to lighter containers; backgrounds become `s-slate-950`.
