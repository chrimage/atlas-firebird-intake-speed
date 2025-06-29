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

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd atlas-divisions-rebuild
   npm install
   ```

2. **Configure Cloudflare Workers account:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Set up environment configuration:**
   ```bash
   # Copy template configuration files
   cp wrangler.example.jsonc wrangler.jsonc
   cp .env.example .env
   
   # Update with your actual values
   # NEVER commit these files to the repository
   ```

4. **Create D1 database and apply schema:**
   ```bash
   wrangler d1 create atlas-divisions-contact-db
   wrangler d1 execute atlas-divisions-contact-db --file=schema.sql
   ```

5. **Deploy:**
   ```bash
   npm run deploy
   ```

See [SETUP.md](SETUP.md) for detailed instructions and [SECURITY.md](SECURITY.md) for comprehensive security guidelines.

## 🔐 Security Notes

**IMPORTANT:** This repository follows security best practices:

- ✅ Production credentials are **never committed** to the repository
- ✅ Template files (`wrangler.example.jsonc`, `.env.example`) show the required format
- ✅ Actual configuration files (`wrangler.jsonc`, `.env`) are gitignored
- ✅ Admin access is secured via Cloudflare Access or email verification

**Files that contain secrets and should NOT be committed:**
- `wrangler.jsonc` (contains account IDs, database IDs)
- `.env` (contains API keys and credentials)
- Any `wrangler.*.jsonc` files with actual values

## License

MIT License