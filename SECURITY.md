# Security Guide

This document outlines the security practices implemented in this project to protect sensitive information and ensure secure deployment.

## 🔐 Security Overview

This project follows security best practices by:
- ✅ **Never committing production credentials** to the repository
- ✅ **Using template files** to show required configuration format
- ✅ **Protecting sensitive files** with `.gitignore`
- ✅ **Implementing secure authentication** for admin access
- ✅ **Following least-privilege principles** for access control

## 📁 File Security Structure

### ✅ Safe to Commit (Template Files)
These files are safe to commit and should be in the repository:

```
├── wrangler.example.jsonc    # Template with placeholder values
├── .env.example              # Environment variables template
├── .gitignore               # Protects sensitive files
└── docs/                    # Documentation files
```

### ❌ Never Commit (Production Files)
These files contain sensitive data and are gitignored:

```
├── wrangler.jsonc           # Contains account IDs, database IDs
├── .env                     # Contains API keys, credentials
├── wrangler.prod.jsonc      # Production-specific config
├── wrangler.staging.jsonc   # Staging-specific config
└── .dev.vars               # Development secrets
```

## 🛡️ What We Protect

### Sensitive Information Types
1. **Cloudflare Account IDs** - Used for billing and resource access
2. **Database IDs** - Direct access to your data
3. **API Keys** - Third-party service credentials
4. **Admin Email Lists** - Could be used for social engineering
5. **Domain-specific Configuration** - Reveals infrastructure details

### Protection Methods
1. **Template Files**: Show structure without revealing actual values
2. **Gitignore Protection**: Prevents accidental commits of sensitive files
3. **Environment Variables**: Store sensitive data outside of code
4. **Wrangler Secrets**: Encrypted storage of production credentials

## 🔧 Setup Security Workflow

### 1. Initial Clone (Safe)
```bash
git clone <repository>
cd atlas-divisions-rebuild
npm install
```

### 2. Configure Locally (Contains Secrets)
```bash
# Copy templates (these commands create files with your real data)
cp wrangler.example.jsonc wrangler.jsonc
cp .env.example .env

# Edit these files with your actual values
# NEVER commit these files
```

### 3. Verify Protection
```bash
# These commands should show that sensitive files are ignored
git status
git status --ignored
```

Expected output:
```
# Your staged/modified files here
# Should NOT include wrangler.jsonc or .env

# Ignored files (when using --ignored flag)
wrangler.jsonc
.env
```

## 🚨 Security Violations to Avoid

### ❌ NEVER Do This
```bash
# DON'T: Add sensitive files to git
git add wrangler.jsonc
git add .env
git commit -m "Added config"

# DON'T: Override gitignore
git add -f wrangler.jsonc

# DON'T: Put secrets in committed files
# In src/config.ts:
allowedAdminEmails: ["real.email@company.com"] // DON'T hard-code real emails
```

### ✅ DO This Instead
```bash
# DO: Only commit template files
git add wrangler.example.jsonc
git add .env.example

# DO: Use environment variables for sensitive data
# In your local wrangler.jsonc only
```

## 🔍 Security Verification Commands

### Check for Accidentally Committed Secrets
```bash
# Search git history for potential secrets
git log --oneline --grep="secret\|password\|key\|token" --all
git log --oneline -S "account_id" --all
git log --oneline -S "database_id" --all

# Check current repository state
git status --ignored | grep -E "(wrangler\.jsonc|\.env$)"
```

### Verify File Protection
```bash
# These should return "true" (files are ignored)
git check-ignore wrangler.jsonc && echo "✅ wrangler.jsonc is protected"
git check-ignore .env && echo "✅ .env is protected"

# This should show no sensitive files
git ls-files | grep -E "(wrangler\.jsonc|\.env$)" || echo "✅ No sensitive files in repository"
```

## 🔐 Authentication Security

### Admin Panel Protection
The admin panel is protected using one of these methods:

#### Option 1: Cloudflare Access (Recommended)
- **Zero Trust Authentication**: Every request is verified
- **Multi-factor Support**: Supports TOTP, SMS, Hardware keys
- **Audit Logging**: All access attempts are logged
- **No Additional Code**: Built into Cloudflare's edge

#### Option 2: Email Verification
- **Email-based Access Control**: Only listed emails can access
- **Configurable List**: Easily add/remove admin users
- **No External Dependencies**: Built into the application

### Authentication Flow Security
1. **Request Interception**: All `/admin*` requests are checked
2. **Identity Verification**: User identity is validated
3. **Access Decision**: Allow/deny based on policy
4. **Audit Trail**: All access attempts are logged

## 📊 Security Monitoring

### What to Monitor
1. **Failed Authentication Attempts**: Indicates potential attacks
2. **Unusual Access Patterns**: May indicate compromised accounts
3. **Database Query Errors**: Could indicate injection attempts
4. **Email Sending Failures**: May indicate configuration issues

### Monitoring Tools
```bash
# Real-time monitoring
wrangler tail --format=pretty

# Access logs (if using Cloudflare Access)
# Check Cloudflare Dashboard → Zero Trust → Logs

# Analytics
# Check Cloudflare Dashboard → Workers → Analytics
```

## 🆘 Security Incident Response

### If Credentials Are Compromised

#### 1. Immediate Actions
```bash
# Rotate database if compromised
wrangler d1 create new-database-name
# Migrate data from old to new database
# Update wrangler.jsonc with new database_id

# Rotate API keys
# Generate new keys in respective service dashboards
# Update local configuration files
```

#### 2. Investigation
```bash
# Check git history for when secrets were exposed
git log --oneline -S "compromised_credential" --all

# Check access logs for unusual activity
wrangler tail --search="admin"
```

#### 3. Prevention
- Review and update `.gitignore`
- Audit team access to repository
- Update security documentation
- Implement additional monitoring

### If Accidentally Committed Secrets

#### 1. Remove from Git History
```bash
# WARNING: This rewrites git history - coordinate with team
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch wrangler.jsonc' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to update remote (dangerous!)
git push origin --force --all
```

#### 2. Rotate All Compromised Credentials
- Generate new Cloudflare Account ID (if possible)
- Create new D1 database
- Generate new API keys
- Update all configuration files

## 📚 Security References

### Cloudflare Security Documentation
- [Workers Security](https://developers.cloudflare.com/workers/learning/security-practices/)
- [Zero Trust Access](https://developers.cloudflare.com/cloudflare-one/applications/)
- [D1 Security](https://developers.cloudflare.com/d1/learning/security/)

### General Security Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Git Secrets Prevention](https://github.com/awslabs/git-secrets)
- [Environment Variable Security](https://12factor.net/config)

---

## 🎯 Security Checklist Summary

- [ ] ✅ Production credentials never committed to repository
- [ ] ✅ Template files provide clear configuration examples
- [ ] ✅ `.gitignore` protects all sensitive files
- [ ] ✅ Admin authentication properly configured
- [ ] ✅ Monitoring and alerting set up
- [ ] ✅ Incident response procedures documented
- [ ] ✅ Team trained on security practices

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update these practices as your project evolves.