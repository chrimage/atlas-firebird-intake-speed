# Deployment Checklist ✅

Use this checklist to ensure your contact form deployment is properly configured and ready for production.

## 📋 Pre-Deployment Setup

### ✅ Cloudflare Account & Domain Setup
- [ ] Cloudflare account created
- [ ] Domain added to Cloudflare (nameservers pointing to Cloudflare)
- [ ] Domain is active (not just DNS-only)

### ✅ Email Routing Configuration

#### Mailgun Setup
- [ ] Ensure DNS for `mg.atlasdivisions.com` includes SPF and DKIM records.
- [ ] Add `MG_DOMAIN` in `wrangler.jsonc` under `"vars"`.
- [ ] Store `MG_API_KEY` securely via `npx wrangler secret put MG_API_KEY`.

- [ ] Email Routing enabled for your domain
- [ ] MX records automatically configured by Cloudflare
- [ ] SPF record added: `v=spf1 include:_spf.mx.cloudflare.net ~all`
- [ ] Admin destination email addresses added and **verified**
- [ ] Test email sent to verify delivery

### ✅ Project Setup
- [ ] Repository cloned
- [ ] `npm install` completed successfully
- [ ] Wrangler CLI installed globally: `npm install -g wrangler`
- [ ] Logged into Cloudflare: `wrangler login`

## ⚙️ Configuration

### ✅ Database Setup
- [ ] D1 database created: `wrangler d1 create your-contact-db`
- [ ] Database ID copied from output
- [ ] Schema applied locally: `wrangler d1 execute your-contact-db --file=schema.sql`

### ✅ Wrangler Configuration
- [ ] `wrangler.example.jsonc` copied to `wrangler.jsonc`
- [ ] Worker name updated (no spaces, hyphens/underscores only)
- [ ] Account ID updated (from `wrangler whoami`)
- [ ] Database name and ID updated
- [ ] FROM_EMAIL updated (must be on your Cloudflare domain)
- [ ] ADMIN_EMAIL updated (must be verified in Email Routing)
- [ ] `allowed_destination_addresses` updated with verified emails

### ✅ Application Configuration
- [ ] `src/config.ts` updated with your company information
- [ ] Company name changed from "Your Company Name"
- [ ] Service types customized for your business
- [ ] Admin email addresses updated (if not using Cloudflare Access)
- [ ] Branding/colors customized (optional)

## 🔐 Security Configuration

### ✅ Authentication Method Chosen

**Option A: Cloudflare Access (Recommended)**
- [ ] Cloudflare Access application created
- [ ] Application domain set to: `your-worker-name.your-subdomain.workers.dev`
- [ ] Application path set to: `/admin*`
- [ ] Access policy created with admin email addresses
- [ ] Authentication method chosen (Email OTP, Google, etc.)
- [ ] Config: `enableCloudflareAccess: true`

**Option B: Basic Email Validation**
- [ ] Admin emails added to `allowedAdminEmails` in config
- [ ] Config: `enableCloudflareAccess: false, enableAdminAuth: true`

**Option C: No Authentication (Development Only)**
- [ ] Config: `enableAdminAuth: false`
- [ ] ⚠️ **Warning acknowledged**: Admin panel will be publicly accessible

## 🚀 Deployment Steps

### ✅ Local Testing
- [ ] Local development server started: `npm run dev`
- [ ] Contact form accessible at `http://localhost:8787`
- [ ] Form submission works (check console for database save)
- [ ] Admin panel accessible at `http://localhost:8787/admin`
- [ ] Status updates work in admin panel
- [ ] Tests pass: `npm test`

### ✅ Production Deployment
- [ ] Worker deployed: `npm run deploy`
- [ ] No deployment errors
- [ ] Production database schema applied: `wrangler d1 execute your-contact-db --file=schema.sql --remote`
- [ ] Worker URL accessible: `https://your-worker-name.your-subdomain.workers.dev`

## 🧪 Post-Deployment Testing

### ✅ Contact Form Testing
- [ ] Contact form loads properly
- [ ] All form fields display correctly
- [ ] Form validation works (try submitting empty form)
- [ ] Form submission succeeds with valid data
- [ ] Success page displays after submission
- [ ] Error handling works (try invalid data)

### ✅ Email Notification Testing
- [ ] Submit test form with real data
- [ ] Check admin email for notification within 5 minutes
- [ ] Email contains all form details
- [ ] Email formatting looks correct
- [ ] Reply-to address works

### ✅ Admin Panel Testing
- [ ] Admin panel loads: `https://your-worker.workers.dev/admin`
- [ ] Authentication flow works (if enabled)
- [ ] Submissions display correctly
- [ ] Status updates work (dropdown changes)
- [ ] Statistics display correctly
- [ ] User information shows (if using Cloudflare Access)

### ✅ Security Testing
- [ ] Admin panel properly secured (try accessing without auth)
- [ ] CORS headers work for form submissions
- [ ] No sensitive information exposed in errors
- [ ] Database queries use parameterized statements

## 📊 Monitoring Setup

### ✅ Observability
- [ ] Cloudflare Analytics enabled in dashboard
- [ ] Worker logs accessible: `wrangler tail`
- [ ] Error tracking configured
- [ ] Performance metrics reviewed

### ✅ Alerts (Optional)
- [ ] Email alerts for high error rates
- [ ] Performance monitoring
- [ ] Database quota monitoring
- [ ] Failed email notifications

## 🔧 Performance Optimization

### ✅ Configuration Review
- [ ] Smart Placement enabled (optional): `"placement": { "mode": "smart" }`
- [ ] Email notifications use `ctx.waitUntil()` (non-blocking)
- [ ] Database queries optimized
- [ ] CORS headers minimized to required origins

### ✅ Custom Domain (Optional)
- [ ] Custom domain configured in Cloudflare Dashboard
- [ ] DNS records pointing to worker
- [ ] SSL certificate active
- [ ] Routes updated in wrangler.jsonc

## 📚 Documentation & Handoff

### ✅ Team Documentation
- [ ] Admin access instructions documented
- [ ] Emergency contact procedures established
- [ ] Backup and recovery plans documented
- [ ] Configuration changes process documented

### ✅ Training & Knowledge Transfer
- [ ] Team trained on admin panel usage
- [ ] Troubleshooting procedures shared
- [ ] Monitoring and alert contacts assigned
- [ ] Regular maintenance schedule established

## 🎉 Go-Live Checklist

### ✅ Final Verification
- [ ] All previous checklist items completed
- [ ] Load testing performed (if expecting high volume)
- [ ] Backup procedures tested
- [ ] Emergency contacts notified
- [ ] Go-live announcement prepared

### ✅ Post Go-Live
- [ ] Monitor for first 24 hours
- [ ] Collect user feedback
- [ ] Document any issues and resolutions
- [ ] Schedule first maintenance review

---

## 🆘 Troubleshooting Quick Reference

**Contact form not working:**
```bash
wrangler tail --format=pretty
curl -X POST https://your-worker.workers.dev/submit -F "name=Test" -F "message=Test"
```

**Database issues:**
```bash
wrangler d1 execute your-db --command="SELECT * FROM submissions;" --remote
wrangler d1 info your-db
```

**Email not sending:**
- Verify destination addresses in Cloudflare Email Routing
- Check FROM_EMAIL matches domain with Email Routing
- Check worker logs for email errors

**Admin panel access issues:**
- Verify Cloudflare Access configuration
- Check JWT token in browser developer tools
- Verify admin email in allowedAdminEmails list

---

**🎊 Congratulations!** Once you've completed this checklist, your contact form and admin panel are ready for production use.
