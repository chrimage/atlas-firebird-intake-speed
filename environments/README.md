# Environment Configuration

This directory contains configuration templates for different deployment environments.

## Available Environments

### Development (`wrangler.dev.jsonc`)
- Local development with minimal features
- Email notifications disabled
- Relaxed security for testing
- Local D1 database

### Staging (`wrangler.staging.jsonc`) 
- Production-like environment for testing
- All features enabled
- Separate database from production
- Same security as production

### Production (`wrangler.prod.jsonc`)
- Full feature set enabled
- Maximum security settings
- Production database
- Monitoring and analytics enabled

## Usage

### Copy and Configure
```bash
# For development
cp environments/wrangler.dev.jsonc wrangler.jsonc

# For staging  
cp environments/wrangler.staging.jsonc wrangler.jsonc

# For production
cp environments/wrangler.prod.jsonc wrangler.jsonc
```

### Deploy to Specific Environment
```bash
# Deploy to staging
wrangler deploy --config environments/wrangler.staging.jsonc

# Deploy to production
wrangler deploy --config environments/wrangler.prod.jsonc
```

## Environment-Specific Configuration

Each environment can have different:
- Worker names
- Database instances
- Email settings
- Feature flags
- Security levels
- Custom domains

See the individual configuration files for examples.