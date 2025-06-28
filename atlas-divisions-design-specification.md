# Atlas Divisions - Frameworkless Design Specification

## Executive Summary

This document provides a comprehensive design specification for rebuilding the Atlas Divisions landing page without the Astro framework. The current site is a professional, dark-themed landing page featuring an interactive Three.js globe animation, service showcase, and contact functionality.

## Brand Identity

### Company Information
- **Company Name:** Atlas Divisions
- **Founder:** Captain Harley Miller
- **Primary Email:** harley@atlasdivisions.com
- **Tagline:** "Solutions That Outlast the Storm"
- **Core Message:** "Mapping Chaos. Building Resilience."
- **Approach:** No-nonsense, transparent, adaptive solutions
- **Domain:** atlasdivisions.com

### Brand Personality
- Professional but approachable
- Transparent and ethical
- Crisis-ready and adaptive
- No fluff, practical solutions
- Military-influenced precision

## Visual Design System

### Color Palette
```css
/* Primary Colors */
--color-bg: #0a0a0a;              /* Primary background */
--color-bg-secondary: #1a1a1a;    /* Secondary background */
--color-text: #ffffff;            /* Primary text */
--color-text-secondary: #b8b8b8;  /* Secondary text */

/* Brand Accent Colors */
--color-accent-gold: #d4af37;     /* Primary brand color */
--color-accent-bronze: #cd7f32;   /* Secondary brand color */
--color-accent-teal: #008080;     /* Tertiary accent */

/* Functional Colors */
--emergency-red: #dc143c;         /* Emergency service highlighting */
--ocean-blue: #001122;           /* Globe ocean color */
```

### Typography
```css
/* Google Fonts Integration */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap');

/* Font Variables */
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Inter', sans-serif;

/* Font Sizes (Responsive) */
.logo: clamp(2.5rem, 5vw, 4rem);
.tagline: clamp(1.2rem, 2.5vw, 1.5rem);
.section-heading: clamp(2rem, 4vw, 3rem);
.identity-text: clamp(1.1rem, 2vw, 1.3rem);
```

### Layout System
```css
/* Container Constraints */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Responsive Breakpoints */
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 480px) { /* Mobile */ }
```

## Component Architecture

### 1. Navigation Component
**Position:** Fixed top navigation with backdrop blur
**Elements:**
- Brand logo (Atlas Divisions)
- Navigation links: Home, About, Services, Contact
- Mobile hamburger menu
- Contact button highlight (teal accent)

**Styling Patterns:**
```css
background: rgba(10, 10, 10, 0.95);
backdrop-filter: blur(10px);
border-bottom: 1px solid rgba(212, 175, 55, 0.2);
height: 70px;
```

### 2. Hero Section (Header)
**Layout:** Two-column layout (globe + content)
**Elements:**
- Interactive Three.js Globe (left column)
- Company branding and identity statement (right column)
- Call-to-action buttons
- Email copy functionality

**Key Features:**
- Fade-in animation on load
- Responsive stacking on mobile
- Gradient background overlays
- Glass-morphism identity card

### 3. Services Section
**Layout:** Responsive grid of service cards
**Cards:** 4 service offerings with special emergency card styling
**Services:**
1. Auto & Home Systems Repair
2. Logistics & Adaptive Operations  
3. AI Tools & Digital Infrastructure
4. Emergency & Crisis Response (special styling)

### 4. Contact Section
**Layout:** Two-column (contact info + form)
**Elements:**
- Direct email links with copy functionality
- Contact form with validation
- Success/error state handling
- Response time promise

## Interactive Three.js Globe Specification

### Technical Requirements
- **Library:** Three.js (v0.177.0)
- **Geometry:** SphereGeometry(1.5, 64, 64)
- **Texture:** Canvas-generated world map
- **Lighting:** Ambient + Directional lighting with gold tint

### Globe Features
```javascript
// Core Animation Properties
autoRotation: 0.005 rad/frame
mouseInteraction: subtle rotation response
floatingAnimation: 6s ease-in-out infinite vertical movement
hoverScale: 1.05 transform on container hover

// Visual Properties
glowEffect: drop-shadow(0 0 30px rgba(212, 175, 55, 0.3))
atmosphereGlow: gold (#d4af37) with 0.1 opacity
worldMapColors: {
  land: '#d4af37', // Atlas gold
  ocean: '#001122', // Dark blue
  borders: '#cd7f32' // Atlas bronze
}
```

### Map Data Implementation
```javascript
// Primary: External GeoJSON data
dataSource: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

// Fallback: Simplified continent rectangles
fallbackContinents: [
  { name: 'North America', x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
  { name: 'South America', x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
  { name: 'Europe', x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
  { name: 'Africa', x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
  { name: 'Asia', x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
  { name: 'Australia', x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
]
```

### Responsive Sizing
```javascript
// Desktop: 400x400px
// Tablet: 300x300px  
// Mobile: 250x250px
// All with max constraints and viewport-relative sizing
```

## Animation & Interaction Patterns

### Hover Effects
```css
/* Card Hover */
transform: translateY(-8px);
border-color: rgba(212, 175, 55, 0.4);
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

/* Button Hover */
transform: translateY(-2px);
box-shadow: 0 8px 25px rgba(color, 0.3);
```

### Loading States
- Form submission: "Sending..." with disabled state
- Copy email: "✓ Copied!" feedback with timeout
- Form success: Hide form, show success message

### Animations
```css
@keyframes fadeInUp {
  from: { opacity: 0; transform: translateY(30px); }
  to: { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100%: { transform: translateY(0px); }
  50%: { transform: translateY(-20px); }
}
```

## Content Strategy & Information Architecture

### Page Structure
1. **Navigation** (Fixed)
2. **Hero Section** (Full viewport)
   - Globe animation
   - Company identity
   - Primary CTAs
3. **Services Section** (4-card grid)
4. **Contact Section** (2-column layout)

### Messaging Hierarchy
1. **Primary:** Atlas Divisions + "Solutions That Outlast the Storm"
2. **Secondary:** "Mapping Chaos. Building Resilience."
3. **Supporting:** Identity statement emphasizing adaptive response and transparency
4. **Services:** Clear, benefit-focused descriptions
5. **Contact:** Direct email emphasis with 24-hour response promise

### Service Offerings
```javascript
services: [
  {
    title: "Auto & Home Systems Repair",
    focus: "Practical, reliable repairs",
    features: ["Transparent pricing", "Emergency availability", "Maintenance planning", "No-nonsense diagnostics"]
  },
  {
    title: "Logistics & Adaptive Operations", 
    focus: "Streamlined operations for businesses",
    features: ["Tailored solutions", "Crisis response", "Efficiency audits", "Scalable design"]
  },
  {
    title: "AI Tools & Digital Infrastructure",
    focus: "Transparent AI integration", 
    features: ["Ethical implementation", "Custom automation", "Infrastructure setup", "Training & docs"]
  },
  {
    title: "Emergency & Crisis Response",
    focus: "24/7 urgent situation response",
    features: ["Emergency availability", "Rapid assessment", "Multi-domain management", "Clear communication"],
    specialStyling: true // Red accent colors
  }
]
```

## Technical Implementation Notes

### Contact Form Functionality
```javascript
// Form Processing
endpoint: '/api/contact' (POST)
fields: { name, email, problemDescription }
validation: Required fields + email format
emailService: 'Resend API'

// Email Configuration
fromEmail: 'contact@atlasdivisions.com'
toEmail: 'harley@atlasdivisions.com'
subject: 'Atlas Divisions Contact: [Name]'
```

### Email Integration Requirements
- **Service:** Resend API
- **Environment Variables:** RESEND_API_KEY, FROM_EMAIL, TO_EMAIL
- **Fallback:** Always provide direct email link on failures
- **Security:** HTML escaping for all user inputs

### Copy-to-Clipboard Pattern
```javascript
// Implementation
navigator.clipboard.writeText('harley@atlasdivisions.com')
  .then(() => showFeedback())
  .catch(() => fallbackCopyMethod());

// Fallback for older browsers
const textArea = document.createElement('textarea');
textArea.value = email;
document.body.appendChild(textArea);
textArea.select();
document.execCommand('copy');
document.body.removeChild(textArea);
```

## Responsive Design Specifications

### Mobile Adaptations
- Hero: Stack globe above content
- Navigation: Hamburger menu with slide-down
- Services: Single column grid
- Contact: Stack form below contact info
- Globe: Reduce size and hover effects

### Accessibility Requirements
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus visible indicators
- Color contrast compliance
- Screen reader friendly

## Performance Considerations

### Three.js Optimization
- Geometry instancing for efficiency
- Texture size optimization (2048x1024)
- Canvas rendering instead of image loading
- Responsive sizing to reduce render load
- Fallback for failed external data loading

### Loading Strategy
- Defer non-critical JavaScript
- Optimize Google Fonts loading
- Lazy load globe animation after DOM ready
- Progressive enhancement approach

## Deployment Specifications

### Hosting Requirements
- Static file hosting capability
- HTTPS support
- Environment variable configuration
- Email API proxy capability (if needed)

### Browser Support
- Modern browsers (ES6+ support)
- Three.js WebGL compatibility
- CSS Grid and Flexbox support
- Backdrop-filter support (with fallbacks)

---

## Implementation Priority

### Phase 1: Core Structure
1. HTML semantic structure
2. CSS design system implementation
3. Responsive layout
4. Navigation functionality

### Phase 2: Interactive Elements
1. Three.js globe implementation
2. Form functionality
3. Copy-to-clipboard features
4. Animation implementations

### Phase 3: Polish & Optimization
1. Performance optimization
2. Accessibility improvements
3. Error handling
4. Cross-browser testing

This specification provides everything needed to recreate the Atlas Divisions experience in a frameworkless environment while maintaining the professional, engaging, and functional design that supports the company's brand and business objectives.