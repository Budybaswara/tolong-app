---
name: Amanah Civic System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#5f3f3b'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#946e69'
  outline-variant: '#e9bcb6'
  surface-tint: '#c0000d'
  primary: '#b7000c'
  on-primary: '#ffffff'
  primary-container: '#e60012'
  on-primary-container: '#fff7f6'
  inverse-primary: '#ffb4aa'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#004ed0'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d68f0'
  on-tertiary-container: '#f8f7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is engineered for civic engagement, balancing the urgency of political action with the reliability of a high-tier financial institution. It targets the modern Indonesian citizen, evoking a sense of empowerment, transparency, and communal progress.

The visual direction is **Modern Civic-Tech**, blending the accessibility of super-apps with the premium feel of modern banking. The style utilizes **Glassmorphism** for layered information, **Soft Elevation** for tactile feedback, and **Vibrant Accents** to indicate status and category. The interface prioritizes clarity and high-speed navigation to ensure that every citizen, regardless of digital literacy, can access public services and representative data effortlessly.

## Colors

The palette is anchored by the primary red, used purposefully for high-impact actions and brand identity. White serves as the secondary base to maintain a clean, institutional feel.

- **Primary (Red):** Used for brand touchpoints, primary buttons, and critical alerts.
- **Surface:** The background uses a soft Light Slate to reduce eye strain and provide better contrast for white glassmorphic cards.
- **Accents:** Blue is reserved for informative links and progress; Green for completion; Amber for pending states or warnings.
- **Gradients:** Use subtle mesh gradients (Primary Red at 100% to a deep 80% opacity) for hero sections to create depth without sacrificing text legibility.

## Typography

This design system uses **Plus Jakarta Sans** for headlines to provide a welcoming, modern Indonesian aesthetic (replacing Poppins for a more contemporary, high-end feel) and **Inter** for all UI and body text to ensure maximum readability in data-heavy screens.

Headlines should use tighter letter spacing for a compact, professional look. Body text must maintain a generous line height to assist in legibility for all age groups. Label styles should be used for metadata and eyebrow text, occasionally utilizing uppercase with increased tracking for hierarchy.

## Layout & Spacing

The system follows a strict **4px base rhythm**. For mobile devices, a standard 20px outer margin is used to ensure content doesn't feel cramped against the screen edges. 

The layout is **Fluid-Stack**, where components expand to fill the width of the container minus the safe margins. Inside cards, use `md (16px)` padding as the default, increasing to `lg (24px)` for hero elements. Vertical stacking of cards should follow the `sm (12px)` spacing to maintain a cohesive flow of information.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**. 

- **Level 0 (Background):** Light Slate (#F8FAFC), flat.
- **Level 1 (Cards):** Pure White with a `sm` shadow. Used for standard feed items.
- **Level 2 (Glassmorphism):** White surface at 70-85% opacity with a 16px Backdrop Blur and a 1px white inside stroke. Used for floating navigation, sticky headers, and featured category cards.
- **Shadows:** Use a "Soft Diffused" approach. Shadows should have a large blur radius (e.g., 20px) with very low opacity (5-8%) and a slight Y-offset to simulate a natural top-down light source.

## Shapes

The shape language is overtly friendly and modern. The default radius is **16px**, which provides a "squircle" feel that is characteristic of premium modern applications. 

- **Small (8px):** For input fields and nested small components.
- **Medium (16px):** The standard for all primary cards, buttons, and modals.
- **Large (24px):** Used for "Hero" containers or bottom sheets.
- **Pill (999px):** Strictly for category chips, search bars, and status badges.

## Components

### Action Buttons
- **Primary:** Solid PSI Red with white text. 16px rounded corners.
- **Secondary:** White background with a 1px Slate border.
- **Emergency:** High-intensity Red gradient, prominent elevation, and "haptic-ready" sizing.
- **Ghost:** No background, Primary Red text, used for low-emphasis actions.

### Glassmorphism Cards
Standard cards for the dashboard. Background: White (80% opacity), 20px blur, 1px white border (0.5 alpha). This ensures cards remain legible even when scrolling over vibrant background gradients.

### Navigation Bars
- **Top Bar:** Transparent glassmorphic blur with Title-MD typography centered.
- **Bottom Bar:** Floating pill or full-width blur with 4-5 key icons. Active states should use the Primary Red for the icon and a small dot indicator below.

### Inputs & Search
- **Input Fields:** 8px radius, Slate-100 fill, 1px border that turns Primary Red on focus.
- **Search Bar:** Fully rounded (pill), persistent background blur, leading icon.

### Progress & Badges
- **Timelines:** Vertical lines (2px width) using Slate-200, with active steps highlighted in Blue.
- **Statistical Badges:** Compact pills with a light tint of the accent color (e.g., Light Green background for Green text) to denote status without overwhelming the UI.

### Category Chips
Small pill-shaped elements with subtle borders. When selected, they should fill with Primary Red and use white text.