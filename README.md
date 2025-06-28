# Atlas Firebird Intake System 🔥

**A blazing-fast contact form and admin management system built with Cloudflare Workers.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://intake-speed.bytecrash.workers.dev)
[![Admin Panel](https://img.shields.io/badge/Admin-Panel-green)](https://intake-speed.bytecrash.workers.dev/admin)

## Overview

This is a minimal, production-ready contact form system that demonstrates the power of simplicity. Built in ~90 minutes using the YOLO development methodology, it proves that sometimes the best architecture is the one that gets out of your way.

### What It Does

- **Contact Form**: Beautiful, responsive form for customer inquiries
- **Database Storage**: Secure submission storage in Cloudflare D1
- **Admin Dashboard**: Real-time submission management with status tracking
- **Zero Maintenance**: Serverless architecture with global edge deployment

### What It Doesn't Do (By Design)

- Complex user authentication (admin panel is accessible but obscured)
- Email notifications (Phase 2 feature)
- File uploads (Phase 2 feature)
- AI/chatbot integration (Phase 2 feature)
- Over-engineered enterprise patterns

## Architecture

```
Single Cloudflare Worker
├── GET / → Contact form (embedded HTML + CSS)
├── POST /submit → Form processing & validation
├── GET /admin → Submissions dashboard
├── POST /admin/update → Status management
└── D1 Database (single table: submissions)
```

**Technology Stack:**
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Database**: Cloudflare D1 (SQLite-based)
- **Frontend**: Vanilla HTML/CSS/JS (embedded in Worker)
- **Deployment**: Wrangler CLI

## Features

### Contact Form
- ✅ Responsive design with professional styling
- ✅ Form validation (client & server-side)
- ✅ Service type categorization
- ✅ Success/error handling with user feedback
- ✅ Mobile-optimized interface

### Admin Dashboard
- ✅ Real-time submission viewing
- ✅ Status management (New → In Progress → Resolved → Cancelled)
- ✅ Submission statistics dashboard
- ✅ Hover tooltips for long messages
- ✅ Automatic status updates via dropdown

### Technical
- ✅ Global edge deployment (sub-100ms response times)
- ✅ CORS headers for API flexibility
- ✅ SQL injection prevention
- ✅ Error handling and graceful degradation
- ✅ TypeScript for type safety

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd intake-speed
   npm install
   ```

2. **Configure Cloudflare account**:
   ```bash
   wrangler login
   # Update account_id in wrangler.jsonc
   ```

3. **Set up database**:
   ```bash
   wrangler d1 create intake-db
   # Copy database_id to wrangler.jsonc
   wrangler d1 execute intake-db --file=schema.sql
   ```

4. **Start development server**:
   ```bash
   npm run start
   # Visit http://localhost:8787
   ```

### Deployment

```bash
npm run deploy
# Deploy database schema to production
wrangler d1 execute intake-db --file=schema.sql --remote
```

## Database Schema

```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  service_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Public Endpoints

**GET /** - Contact Form
- Returns HTML contact form
- Mobile-responsive design
- Embedded CSS for zero dependencies

**POST /submit** - Form Submission
- Accepts: `application/x-www-form-urlencoded`
- Required: `name`, `service_type`, `message`
- Optional: `email`, `phone`
- Returns: Success/error HTML pages

### Admin Endpoints

**GET /admin** - Admin Dashboard
- Returns HTML admin interface
- Shows all submissions with statistics
- Real-time data (no caching)

**POST /admin/update** - Update Status
- Accepts: `application/x-www-form-urlencoded`
- Required: `id`, `status`
- Redirects back to admin panel

## Configuration

### Environment Variables
All configuration is handled through `wrangler.jsonc`:

```jsonc
{
  "name": "intake-speed",
  "account_id": "your-account-id",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "intake-db", 
      "database_id": "your-database-id"
    }
  ]
}
```

### Service Types
Current service categories (easily customizable):
- Repair - Plumbing
- Repair - Electrical  
- Repair - HVAC
- Auto Repair
- Logistics & Operations
- AI Tools & Infrastructure
- Emergency Response
- Other

## Performance

- **Response Time**: <100ms globally (Cloudflare edge)
- **Database Queries**: <50ms (D1 optimized)
- **Form Submission**: <2 seconds end-to-end
- **Admin Panel Load**: <3 seconds with data
- **Uptime**: 99.9%+ (Cloudflare SLA)

## Security

### Current Security Measures
- SQL injection prevention (parameterized queries)
- Input sanitization and validation
- CORS headers properly configured
- HTTPS-only (Cloudflare enforced)

### Security Limitations (By Design)
- Admin panel has no authentication (obscured URL)
- No rate limiting (Cloudflare provides basic DDoS protection)
- No PII encryption (suitable for business contact forms)

### Recommended Security Enhancements (Phase 2)
- Cloudflare Access for admin authentication
- Rate limiting for form submissions
- Email verification for submissions
- Audit logging for admin actions

## Monitoring

### Built-in Observability
- Cloudflare Analytics (enabled in wrangler.jsonc)
- Worker execution logs via `wrangler tail`
- D1 query performance metrics
- Error tracking through Worker exceptions

### Recommended Monitoring
```bash
# View real-time logs
wrangler tail

# Check D1 database status
wrangler d1 info intake-db

# View deployment status
wrangler deployments list
```

## Troubleshooting

### Common Issues

**1. "Not Found" Error on Homepage**
- Issue: Static assets conflicting with Worker routes
- Solution: Remove `assets` configuration from `wrangler.jsonc`

**2. Database Connection Errors**
- Issue: D1 database not properly bound
- Solution: Verify `database_id` in `wrangler.jsonc` matches D1 instance

**3. Form Submissions Not Saving**
- Issue: Database schema not deployed to production
- Solution: Run `wrangler d1 execute intake-db --file=schema.sql --remote`

**4. Admin Panel Empty**
- Issue: No submissions yet, or viewing local vs remote database
- Solution: Test form submission first, check environment (local vs remote)

### Debug Commands
```bash
# Check database contents locally
wrangler d1 execute intake-db --command="SELECT * FROM submissions;"

# Check database contents remotely  
wrangler d1 execute intake-db --command="SELECT * FROM submissions;" --remote

# View Worker logs
wrangler tail --format=pretty

# Test Worker locally
curl http://localhost:8787/
```

## Roadmap

### Phase 1: Core Functionality ✅
- Contact form with validation
- D1 database storage
- Admin dashboard with status management
- Production deployment

### Phase 2: Essential Features (Next)
- [ ] Email notifications for new submissions
- [ ] Basic authentication for admin panel
- [ ] Form field customization
- [ ] Export submissions (CSV/JSON)
- [ ] Basic analytics dashboard

### Phase 3: Advanced Features (Future)
- [ ] File upload support (Cloudflare R2)
- [ ] AI-powered response suggestions
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] API endpoints for integrations
- [ ] Webhook notifications

## Contributing

This project follows the YOLO development methodology:

1. **Keep it simple** - Resist the urge to over-engineer
2. **Ship fast** - Favor working solutions over perfect code
3. **Iterate based on evidence** - Add complexity only when users request it
4. **Document decisions** - Capture why, not just what

### Development Principles
- No frameworks unless absolutely necessary
- Embedded assets to minimize dependencies
- Single Worker handles everything
- Database design prioritizes simplicity over normalization
- Manual testing over automated testing (for now)

## License

MIT License - feel free to use this as a template for your own projects.

## Links

- **Live Demo**: https://intake-speed.bytecrash.workers.dev
- **Admin Panel**: https://intake-speed.bytecrash.workers.dev/admin
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/

---

**Built with ❤️ using the YOLO methodology - proving that sometimes the simplest solution is the best solution.**