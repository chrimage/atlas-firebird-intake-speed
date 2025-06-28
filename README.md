# Atlas Divisions - Frameworkless Landing Page

A professional landing page built without frameworks, featuring an interactive Three.js globe animation and contact form functionality.

## About

This project is a rebuild of the Atlas Divisions landing page using vanilla HTML, CSS, and JavaScript instead of the Astro framework. It includes:

- Interactive Three.js globe visualization
- Contact form with Cloudflare Workers backend
- Responsive design with dark theme
- Admin dashboard for managing inquiries

## Brand Details

- **Company**: Atlas Divisions
- **Founder**: Captain Harley Miller  
- **Email**: harley@atlasdivisions.com
- **Tagline**: "Solutions That Outlast the Storm"
- **Core Message**: "Mapping Chaos. Building Resilience."

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Email**: Cloudflare Email Routing
- **3D Graphics**: Three.js v0.177.0
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Project Structure

```
├── src/
│   ├── index.ts          # Main Worker code
│   └── config.ts         # Configuration
├── static/
│   └── index.html        # Landing page
├── docs/                 # Documentation
├── test/                 # Tests
├── schema.sql           # Database schema
└── wrangler.jsonc       # Cloudflare config
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

## Features

### Three.js Globe
- Interactive world map visualization
- Auto-rotation with mouse interaction
- Responsive sizing for different screen sizes
- Fallback for failed data loading

### Contact Form
- Form submission with validation
- Email notifications via Cloudflare
- Admin dashboard for managing submissions
- Copy-to-clipboard email functionality

### Services
1. Auto & Home Systems Repair
2. Logistics & Adaptive Operations  
3. AI Tools & Digital Infrastructure
4. Emergency & Crisis Response

## Design System

Based on the design specification, the site uses:
- Dark theme with gold accents (#d4af37)
- Montserrat and Inter fonts
- Responsive grid layouts
- Glass-morphism effects

## Setup

1. Configure Cloudflare Workers account
2. Set up D1 database
3. Configure email routing
4. Deploy with `npm run deploy`

See [SETUP.md](SETUP.md) for detailed instructions.

## License

MIT License