# Contact Form & Admin Panel Setup Guide

This guide will walk you through setting up your own deployment of this contact form and admin panel system on Cloudflare Workers.

## 🚀 Quick Start Overview

This system provides:
- **Contact Form**: Responsive form for customer inquiries
- **Admin Panel**: Secure dashboard to manage submissions
- **Email Notifications**: Automatic admin notifications via Cloudflare Email
- **Database Storage**: Submissions stored in Cloudflare D1

## 📋 Prerequisites

- **Cloudflare Account** (free tier works)
- **Domain on Cloudflare** (for email routing)
- **Node.js 18+** installed locally
- **Git** for cloning the repository

## 🛠️ Step 1: Initial Setup

### Clone and Install
```bash
git clone <your-repo-url>
cd intake-contact-form
npm install
```

### Install Wrangler CLI
```bash
npm install -g wrangler
```

### Login to Cloudflare
```bash
wrangler login
```

## 🏗️ Step 2: Cloudflare Configuration

### Get Your Account ID
```bash
wrangler whoami
```
Copy your Account ID for later use.

### Create D1 Database
```bash
wrangler d1 create your-contact-db
```

**Important**: Copy the `database_id` from the output - you'll need it in Step 3.

### Apply Database Schema
```bash
wrangler d1 execute your-contact-db --file=schema.sql
```

## 📧 Step 3: Email Routing Setup

### Enable Email Routing in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** → **Email** → **Email Routing**
2. Click **"Get started"** for your domain
3. Cloudflare will automatically configure MX and SPF records
4. **Add destination addresses** for admin notifications:
   - Go to **Destination addresses**
   - Click **"Add address"**
   - Enter your admin email (e.g., `admin@yourcompany.com`)
   - **Verify the email** by clicking the link sent to your inbox

### Verify DNS Configuration
Cloudflare should automatically add these DNS records:
```
Type: MX
Name: @
Content: route.mx.cloudflare.net
Priority: 10

Type: TXT  
Name: @
Content: v=spf1 include:_spf.mx.cloudflare.net ~all
```

## ⚙️ Step 4: Configure Your Deployment

### Update wrangler.jsonc

Copy `wrangler.example.jsonc` to `wrangler.jsonc` and update these values:

```jsonc
{
  "name": "your-contact-form",                    // Your worker name
  "account_id": "YOUR_ACCOUNT_ID_HERE",           // From Step 2
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "your-contact-db",         // Your D1 database name
      "database_id": "YOUR_DATABASE_ID_HERE"     // From Step 2
    }
  ],
  "vars": {
    "FROM_EMAIL": "contact@yourdomain.com",       // Your sending email
    "ADMIN_EMAIL": "admin@yourdomain.com",        // Where notifications go
    "ENVIRONMENT": "production"
  },
  "send_email": [
    {
      "name": "EMAIL_SENDER",
      "allowed_destination_addresses": [
        "admin@yourdomain.com",                   // Must match verified addresses
        "support@yourdomain.com"                  // Add more as needed
      ]
    }
  ]
}
```

### Update Configuration Variables

Edit `src/config.ts` to customize your deployment:

```typescript
export const CONFIG = {
  // Company/Organization Info
  company: {
    name: "Your Company Name",
    tagline: "Professional Services - Get in touch with us"
  },
  
  // Service Types for Contact Form
  serviceTypes: [
    "General Inquiry",
    "Technical Support", 
    "Sales",
    "Partnership",
    "Other"
  ],
  
  // Admin Panel Settings
  admin: {
    allowedEmails: [
      "admin@yourdomain.com",
      "manager@yourdomain.com"
    ]
  }
};
```

## 🔐 Step 5: Secure Admin Panel with Cloudflare Access

### Set Up Cloudflare Access (Recommended)

1. **Go to Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**

2. **Add an application:**
   - **Application name**: `Contact Form Admin`
   - **Session duration**: `24 hours` 
   - **Application domain**: `your-worker-name.your-subdomain.workers.dev`
   - **Path**: `/admin*`

3. **Create Access Policy:**
   - **Policy name**: `Admin Team`
   - **Action**: `Allow`
   - **Include**: Email addresses
   - **Email addresses**: Add your admin emails

4. **Authentication methods:**
   - ✅ **One-time PIN** (sends code to email)
   - ✅ **Google Workspace** (if applicable)
   - ✅ **Microsoft Azure AD** (if applicable)

### Alternative: Basic Email Protection

If you don't want to use Cloudflare Access, the system includes basic email-based protection. Update the `allowedEmails` array in your config.

## 🚀 Step 6: Deploy

### Test Locally First
```bash
npm run dev
# Visit http://localhost:8787
# Test the contact form
# Visit http://localhost:8787/admin
```

### Deploy to Production
```bash
npm run deploy
```

### Apply Database Schema to Production
```bash
wrangler d1 execute your-contact-db --file=schema.sql --remote
```

### Verify Email Setup
After deployment, test the email notifications:
1. Submit a test form
2. Check your admin email for notifications
3. Check the admin panel for the submission

## 📊 Step 7: Test Your Deployment

### Test Contact Form
1. Visit `https://your-worker-name.your-subdomain.workers.dev`
2. Fill out and submit the contact form
3. Verify you see the success message

### Test Admin Panel
1. Visit `https://your-worker-name.your-subdomain.workers.dev/admin`
2. If using Cloudflare Access, complete the authentication
3. Verify you can see submissions and update their status

### Test Email Notifications
1. Submit another test form
2. Check your admin email for the notification
3. Verify the email contains all form details

## 🎨 Step 8: Customize Your Deployment

### Update Branding
Edit the HTML templates in `src/index.ts`:
- Update page titles
- Change colors and styling
- Add your company logo
- Modify form fields as needed

### Add Custom Service Types
Update the service types in your config file to match your business needs.

### Customize Email Templates
Modify the email notification templates in the `sendAdminNotification` function.

## 🔧 Advanced Configuration

### Multiple Environments
Create separate `wrangler.jsonc` files for different environments:
- `wrangler.dev.jsonc` (development)
- `wrangler.staging.jsonc` (staging) 
- `wrangler.prod.jsonc` (production)

Deploy with: `wrangler deploy --config wrangler.prod.jsonc`

### Custom Domain
Set up a custom domain in Cloudflare Dashboard → Workers → your-worker → Settings → Triggers → Custom Domains

### Monitoring and Analytics
- Enable **Workers Analytics** in Cloudflare Dashboard
- Use `wrangler tail` to view real-time logs
- Set up **Logpush** for long-term log storage

## 🐛 Troubleshooting

### Common Issues

**"Not Found" on homepage**
- Check that you don't have conflicting routes
- Verify `main` field in `wrangler.jsonc` points to correct file

**Database connection errors**
- Verify `database_id` matches your D1 instance
- Run schema migration: `wrangler d1 execute DB_NAME --file=schema.sql --remote`

**Email not sending**
- Verify destination addresses are verified in Email Routing
- Check `FROM_EMAIL` is on a domain with Cloudflare Email Routing
- Ensure `allowed_destination_addresses` includes your admin email

**Admin panel not accessible**
- If using Cloudflare Access, verify the application and policy are configured
- Check your email is in the allowed list
- Try accessing in an incognito window

### Debug Commands
```bash
# View real-time logs
wrangler tail --format=pretty

# Check database contents
wrangler d1 execute your-contact-db --command="SELECT * FROM submissions;" --remote

# Test local development
curl -X POST http://localhost:8787/submit \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "service_type=General Inquiry" \
  -F "message=Test message"
```

## 🔐 Security Best Practices

1. **Always use HTTPS** (automatically enforced by Cloudflare)
2. **Limit admin access** via Cloudflare Access or email verification
3. **Monitor for abuse** using Cloudflare Analytics
4. **Regular backups** of D1 database (export via dashboard)
5. **Keep dependencies updated** (`npm audit` regularly)

## 💰 Cost Estimation

**Free Tier Limits:**
- **Workers**: 100,000 requests/day
- **D1 Database**: 5GB storage, 5M reads/day
- **Email Routing**: Unlimited (no sending limits on contact forms)

**Typical Monthly Costs:**
- **Under 1,000 submissions/month**: $0 (free tier)
- **1,000-10,000 submissions/month**: $0-5
- **10,000+ submissions/month**: $5-20

## 📞 Support

If you run into issues:

1. **Check the troubleshooting section** above
2. **Review Cloudflare documentation**:
   - [Workers](https://developers.cloudflare.com/workers/)
   - [D1 Database](https://developers.cloudflare.com/d1/)
   - [Email Routing](https://developers.cloudflare.com/email-routing/)
3. **Contact your team** for deployment-specific questions

## 🚀 Next Steps

Once your basic deployment is working:

- **Customize the form fields** for your specific use case
- **Add file upload support** using Cloudflare R2
- **Integrate with your CRM** via webhooks or API
- **Add analytics** and reporting features
- **Set up automated testing** with your CI/CD pipeline

---

**Congratulations!** 🎉 You now have a fully functional contact form and admin panel running on Cloudflare's edge network.