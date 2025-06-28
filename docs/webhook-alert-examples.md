# Webhook Alert Examples

This document provides examples of webhook configurations and handlers for authentication monitoring alerts.

## 🚨 Webhook Alert Handler

### Basic Webhook Receiver (Cloudflare Worker)

```javascript
// webhook-alerts.js - Separate worker for handling alerts
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const alert = await request.json();
      
      // Process different alert types
      const response = await processAlert(alert, env);
      
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }
};

async function processAlert(alert, env) {
  const alertData = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: alert.alert_type || alert.eventType,
    severity: determineSeverity(alert),
    message: formatAlertMessage(alert),
    details: sanitizeAlertDetails(alert)
  };

  const actions = [];

  // Automated response based on alert type
  switch (alertData.type) {
    case 'multiple_failed_logins':
      if (alert.ip_address && alertData.severity === 'critical') {
        await autoBlockIP(alert.ip_address, env);
        actions.push(`Auto-blocked IP: ${alert.ip_address}`);
      }
      break;
      
    case 'unauthorized_admin_access':
      await sendImmediateAlert(alertData, env);
      actions.push('Immediate alert sent to security team');
      break;
      
    case 'jwt_expired':
    case 'jwt_invalid_format':
      // These might indicate attack attempts
      if (getAlertFrequency(alert.ip_address) > 10) {
        await flagSuspiciousIP(alert.ip_address, env);
        actions.push(`Flagged suspicious IP: ${alert.ip_address}`);
      }
      break;
  }

  // Send to notification channels
  await Promise.all([
    sendToSlack(alertData, env),
    sendToEmail(alertData, env),
    logToAnalytics(alertData, env)
  ]);

  return {
    processed: true,
    alert_id: alertData.id,
    actions_taken: actions,
    severity: alertData.severity
  };
}

function determineSeverity(alert) {
  // Critical: Security breaches, multiple failures
  if (alert.eventType === 'unauthorized_admin_access' || 
      (alert.eventType === 'auth_login_attempt' && !alert.details?.success && alert.count > 10)) {
    return 'critical';
  }
  
  // High: Authentication issues, token problems
  if (alert.eventType?.includes('jwt_') && alert.severity === 'warning' ||
      alert.eventType === 'auth_login_attempt' && !alert.details?.success) {
    return 'high';
  }
  
  // Medium: Unusual patterns
  if (alert.country && !['US', 'CA'].includes(alert.country)) {
    return 'medium';
  }
  
  // Low: General monitoring
  return 'low';
}

function formatAlertMessage(alert) {
  const messages = {
    'multiple_failed_logins': `Multiple failed login attempts from IP ${alert.ip_address}`,
    'unauthorized_admin_access': `Unauthorized admin access attempt from ${alert.ip_address}`,
    'jwt_expired': `Expired JWT token used from ${alert.ip_address}`,
    'jwt_invalid_format': `Invalid JWT format from ${alert.ip_address}`,
    'jwt_missing': `Missing JWT header from ${alert.ip_address}`,
    'auth_login_attempt': alert.details?.success ? 
      `Successful admin login by ${alert.userEmail}` : 
      `Failed admin login attempt from ${alert.ip_address}`
  };
  
  return messages[alert.eventType] || `Security event: ${alert.eventType}`;
}
```

### Slack Integration

```javascript
async function sendToSlack(alertData, env) {
  if (!env.SLACK_WEBHOOK_URL) return;

  const color = {
    'critical': '#ff0000',
    'high': '#ff8800',
    'medium': '#ffaa00',
    'low': '#00aa00'
  }[alertData.severity];

  const slackMessage = {
    text: `🚨 Security Alert: ${alertData.message}`,
    attachments: [{
      color: color,
      fields: [
        { title: 'Severity', value: alertData.severity.toUpperCase(), short: true },
        { title: 'Event Type', value: alertData.type, short: true },
        { title: 'User', value: alertData.details.userEmail || 'Unknown', short: true },
        { title: 'IP Address', value: alertData.details.ipAddress || 'Unknown', short: true },
        { title: 'Country', value: alertData.details.country || 'Unknown', short: true },
        { title: 'Time', value: alertData.timestamp, short: true }
      ],
      footer: 'Security Monitor',
      footer_icon: 'https://example.com/firebird-icon.png'
    }]
  };

  await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  });
}
```

### Email Alerting

```javascript
async function sendToEmail(alertData, env) {
  if (!env.EMAIL_SENDER || !env.SECURITY_EMAIL) return;

  const emailContent = `
SECURITY ALERT - Contact Form System
=====================================

Alert ID: ${alertData.id}
Time: ${alertData.timestamp}
Severity: ${alertData.severity.toUpperCase()}

Event: ${alertData.message}

Details:
- Event Type: ${alertData.type}
- User: ${alertData.details.userEmail || 'Unknown'}
- IP Address: ${alertData.details.ipAddress || 'Unknown'}
- Country: ${alertData.details.country || 'Unknown'}
- User Agent: ${alertData.details.userAgent || 'Unknown'}

This is an automated alert from the security monitoring system.
Please investigate this event and take appropriate action if necessary.

Dashboard: https://your-worker-name.your-subdomain.workers.dev/admin
Logs: https://dash.cloudflare.com/workers
  `;

  const msg = createMimeMessage();
  msg.setSender({ name: "Security Monitor", addr: env.FROM_EMAIL });
  msg.setRecipient(env.SECURITY_EMAIL);
  msg.setSubject(`[SECURITY] ${alertData.severity.toUpperCase()} - ${alertData.type}`);
  msg.addMessage({ contentType: 'text/plain', data: emailContent });

  const message = new EmailMessage(env.FROM_EMAIL, env.SECURITY_EMAIL, msg.asRaw());
  await env.EMAIL_SENDER.send(message);
}
```

## 📊 Analytics Integration

### Custom Analytics Events

```javascript
async function logToAnalytics(alertData, env) {
  // Send to Cloudflare Analytics Engine
  if (env.ANALYTICS_ENGINE) {
    await env.ANALYTICS_ENGINE.writeDataPoint({
      blobs: [
        alertData.type,
        alertData.severity,
        alertData.details.userEmail || 'anonymous',
        alertData.details.country || 'unknown'
      ],
      doubles: [1], // Count
      indexes: [alertData.timestamp]
    });
  }

  // Send to external analytics (e.g., DataDog, New Relic)
  if (env.DATADOG_API_KEY) {
    await sendToDataDog(alertData, env);
  }
}

async function sendToDataDog(alertData, env) {
  const metric = {
    series: [{
      metric: 'atlas_firebird.security_event',
      points: [[Math.floor(Date.now() / 1000), 1]],
      tags: [
        `event_type:${alertData.type}`,
        `severity:${alertData.severity}`,
        `country:${alertData.details.country || 'unknown'}`
      ]
    }]
  };

  await fetch('https://api.datadoghq.com/api/v1/series', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': env.DATADOG_API_KEY
    },
    body: JSON.stringify(metric)
  });
}
```

## 🛡️ Automated Response Actions

### IP Blocking Integration

```javascript
async function autoBlockIP(ipAddress, env) {
  // Block via Cloudflare Firewall Rules API
  const firewallRule = {
    mode: 'block',
    configuration: {
      target: 'ip',
      value: ipAddress
    },
    notes: `Auto-blocked due to security alert at ${new Date().toISOString()}`
  };

  await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/firewall/rules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(firewallRule)
  });
}

async function flagSuspiciousIP(ipAddress, env) {
  // Add to watch list or create custom rule
  const watchRule = {
    mode: 'challenge',
    configuration: {
      target: 'ip',
      value: ipAddress
    },
    notes: `Flagged as suspicious at ${new Date().toISOString()}`
  };

  await fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/firewall/rules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(watchRule)
  });
}
```

## 🔧 Configuration Examples

### Environment Variables

```bash
# Required for webhook alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SECURITY_EMAIL=security@bytecrash.net
DATADOG_API_KEY=your_datadog_api_key

# Cloudflare API for automated responses
CLOUDFLARE_API_TOKEN=your_api_token
ZONE_ID=your_zone_id

# Analytics
ANALYTICS_ENGINE=auth_events
```

### Cloudflare Notification Settings

```json
{
  "name": "Failed Authentication Alert",
  "alert_type": "workers_alert",
  "filters": {
    "where": {
      "and": [
        {"key": "script_name", "operator": "equals", "value": "intake-worker"},
        {"key": "event_type", "operator": "equals", "value": "auth_login_attempt"},
        {"key": "success", "operator": "equals", "value": false}
      ]
    }
  },
  "mechanisms": {
    "webhooks": [
      {
        "url": "https://your-webhook-worker.workers.dev/alert",
        "name": "Security Alert Handler"
      }
    ]
  },
  "enabled": true
}
```

## 📈 Monitoring Dashboard Queries

### LogQL Queries (for Grafana/Loki)

```logql
# Failed authentication attempts by IP
{job="cloudflare-workers"} |= "SECURITY_WARNING" |= "auth_login_attempt" | json | success="false" | sum by (ipAddress) (count_over_time({job="cloudflare-workers"}[5m]))

# Geographic distribution of access attempts  
{job="cloudflare-workers"} |= "AUDIT" |= "admin_panel_access" | json | sum by (country) (count_over_time({job="cloudflare-workers"}[1h]))

# JWT token validation issues
{job="cloudflare-workers"} |= "SECURITY_WARNING" |= "jwt_" | json | sum by (eventType) (count_over_time({job="cloudflare-workers"}[15m]))
```

### Prometheus Metrics (if using external monitoring)

```yaml
# prometheus.yml rules
groups:
  - name: atlas_firebird_security
    rules:
      - alert: HighFailedAuthRate
        expr: rate(auth_failures_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate detected"
          
      - alert: UnauthorizedAdminAccess
        expr: increase(unauthorized_admin_access_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Unauthorized admin access attempt detected"
```

## 🧪 Testing Webhook Alerts

### Test Webhook Endpoint

```bash
# Test your webhook with curl
curl -X POST https://your-webhook-worker.workers.dev/alert \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "auth_login_attempt",
    "severity": "warning",
    "userEmail": "test@example.com",
    "ip_address": "192.168.1.1",
    "country": "US",
    "details": {
      "success": false,
      "path": "/admin",
      "userAgent": "Mozilla/5.0..."
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }'
```

### Load Testing for Alert Thresholds

```javascript
// Test script to validate alert thresholds
async function testAlertThresholds() {
  const testIp = '192.168.1.100';
  
  // Simulate multiple failed login attempts
  for (let i = 0; i < 15; i++) {
    await fetch('https://your-worker-name.your-subdomain.workers.dev/admin', {
      headers: {
        'CF-Connecting-IP': testIp,
        // Omit CF-Access-Jwt-Assertion to trigger auth failure
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('Test completed - check for alerts');
}
```

---

*These webhook examples provide a foundation for automated security monitoring and response for your contact form intake system.*
