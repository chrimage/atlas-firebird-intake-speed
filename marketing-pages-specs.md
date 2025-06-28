# Marketing Pages Technical Specifications

## Overview
Technical specifications for static marketing pages that integrate with your existing Cloudflare Workers contact form system.

## Design System Integration

### Color Palette (Match Current System)
```css
:root {
  /* Teal-Gold Theme (from your config.ts) */
  --color-primary: #0f766e;        /* Dark teal */
  --color-primary-hover: #0d5452;  /* Darker teal */
  --color-accent: #fbbf24;         /* Gold accent */
  --color-accent-hover: #f59e0b;   /* Darker gold */
  --color-text: #134e4a;          /* Dark teal text */
  --color-background: #f0fdfa;     /* Light teal bg */
  --gradient-primary: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  --gradient-teal-gold: linear-gradient(135deg, #0f766e 0%, #fbbf24 100%);
}
```

### Typography
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Component Patterns
```css
/* Match your existing button styles */
.cta-button {
  background: var(--gradient-teal-gold);
  color: white;
  padding: 18px 30px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease-in-out;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

## Page Structure Specifications

### 1. Homepage (`index.html`)
**Purpose**: Company overview, value proposition, call-to-action to contact form

**Sections**:
- Hero section with company name + tagline
- Services overview (3-4 key services)
- Social proof (testimonials/logos)
- CTA section linking to `/contact`

**Key Elements**:
- Navigation: Home | About | Services | Contact
- Hero CTA: "Get Started Today" → `/contact`
- Service cards with icons
- Footer with contact info

### 2. About Page (`about.html`)
**Purpose**: Company story, team, values, credentials

**Sections**:
- Company story/mission
- Team profiles (if applicable)
- Values/differentiators
- Credentials/certifications
- CTA to contact form

### 3. Services Page (`services.html`)
**Purpose**: Detailed service offerings, pricing, process

**Sections**:
- Service categories (match your contact form service types)
- Process overview (3-5 steps)
- Pricing tiers (if applicable)
- FAQ section
- CTA to contact form with specific service pre-selected

## Navigation Integration

### Shared Header Component
```html
<nav class="main-navigation">
  <div class="nav-brand">
    <span class="company-emoji">🔥</span>
    <span class="company-name">Your Company Name</span>
  </div>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/contact" class="nav-cta">Contact</a></li>
  </ul>
</nav>
```

### Responsive Navigation
- Mobile: Hamburger menu
- Desktop: Horizontal nav bar
- Active state highlighting
- Smooth transitions

## Contact Form Integration

### Service Type Pre-selection
When linking from services page, pre-select service type:
```html
<!-- From services page -->
<a href="/contact?service=Technical%20Support" class="service-cta">
  Get Technical Support
</a>
```

### Breadcrumb Navigation
Add to contact form page:
```html
<nav class="breadcrumb">
  <a href="/">Home</a> > 
  <a href="/services">Services</a> > 
  <span>Contact</span>
</nav>
```

## Performance Specifications

### Core Web Vitals Targets
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### Optimization Strategy
- Inline critical CSS
- Lazy load images
- Preload contact form resources
- Use WebP images with fallbacks
- Minify HTML/CSS/JS

## SEO Specifications

### Meta Tags Template
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{PAGE_TITLE}} - {{COMPANY_NAME}}</title>
  <meta name="description" content="{{PAGE_DESCRIPTION}}">
  <meta name="keywords" content="{{SERVICE_KEYWORDS}}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="{{PAGE_TITLE}}">
  <meta property="og:description" content="{{PAGE_DESCRIPTION}}">
  <meta property="og:image" content="/assets/images/og-image.jpg">
  <meta property="og:url" content="{{CANONICAL_URL}}">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "{{COMPANY_NAME}}",
    "url": "{{WEBSITE_URL}}",
    "contactPoint": {
      "@type": "ContactPoint",
      "url": "{{WEBSITE_URL}}/contact"
    }
  }
  </script>
</head>
```

### URL Structure
```
https://yourdomain.com/           # Homepage
https://yourdomain.com/about      # About page
https://yourdomain.com/services   # Services page
https://yourdomain.com/contact    # Contact form (Worker)
https://yourdomain.com/admin      # Admin panel (Worker)
```

## File Structure

### Marketing Pages Directory
```
marketing-pages/
├── index.html              # Homepage
├── about.html             # About page
├── services.html          # Services page
├── assets/
│   ├── css/
│   │   ├── main.css       # Global styles
│   │   ├── components.css # Reusable components
│   │   └── pages.css      # Page-specific styles
│   ├── js/
│   │   ├── main.js        # Global JavaScript
│   │   └── analytics.js   # Tracking code
│   └── images/
│       ├── hero-bg.jpg    # Hero background
│       ├── logo.svg       # Company logo
│       └── services/      # Service icons
├── _headers               # Cloudflare Pages headers
├── _redirects            # URL redirects
└── robots.txt            # SEO directives
```

## Content Guidelines

### Writing Style
- Professional but approachable tone
- Clear, benefit-focused headlines
- Action-oriented language
- Match the energy of your contact form

### Service Types Integration
Use the same service types from your [`config.ts`](src/config.ts:23-33):
- General Inquiry
- Technical Support  
- Sales Question
- Partnership Opportunity
- Customer Service
- Billing Question
- Feature Request
- Bug Report
- Other

### Call-to-Action Text
- Primary CTA: "Get Started Today"
- Secondary CTA: "Learn More"
- Contact CTAs: "Contact Us Now", "Get Quote"
- Service-specific: "Get [Service Type]"

## Deployment Configuration

### Cloudflare Pages Setup
```yaml
# _headers file
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Redirects Configuration
```
# _redirects file
/contact-us    /contact    301
/get-quote     /contact?service=Sales%20Question    301
/support       /contact?service=Technical%20Support    301
```

## Analytics Integration

### Google Analytics 4
```javascript
// In assets/js/analytics.js
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href,
  custom_map: {
    'dimension1': 'page_type'
  }
});
```

### Contact Form Tracking
```javascript
// Track clicks to contact form
document.querySelectorAll('a[href*="/contact"]').forEach(link => {
  link.addEventListener('click', () => {
    gtag('event', 'contact_form_click', {
      'source_page': window.location.pathname
    });
  });
});
```

## Next Steps

1. **Review specifications** - Ensure alignment with business requirements
2. **Switch to Code mode** - To implement actual HTML/CSS files
3. **Create design mockups** - Optional visual planning
4. **Deploy to Cloudflare Pages** - Following the deployment guide
5. **Connect with existing Worker** - URL routing and styling integration