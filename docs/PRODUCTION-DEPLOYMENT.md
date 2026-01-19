# Production Deployment Guide

## Overview

This guide covers the complete process for deploying Civic Notices to production, including pre-deployment checks, deployment steps, and post-deployment validation.

## Pre-Deployment Checklist

### 1. Code Quality ✅
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] No critical linting errors (`npm run lint`)
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] Bundle size optimized (`npm run build`)

### 2. Database Readiness ✅
- [ ] All migrations reviewed and tested
- [ ] Ralph database fixes applied (`./ralph-fix-database.sh`)
- [ ] Backup strategy in place
- [ ] Connection pooling configured
- [ ] RLS policies validated (no recursion)

### 3. Environment Configuration ✅
- [ ] Production environment variables set
- [ ] API keys rotated and secured
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] SSL certificates valid

### 4. Infrastructure ✅
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] CDN configured for static assets
- [ ] Database replicas ready
- [ ] Redis cache configured

### 5. Monitoring ✅
- [ ] Health check endpoints verified
- [ ] Alert thresholds configured
- [ ] Log aggregation enabled
- [ ] Performance metrics baseline established
- [ ] Error tracking configured

## Production Environment Variables

```bash
# Required for production
NODE_ENV=production
PORT=5174

# Database (use connection pooling)
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require&pgbouncer=true
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
API_URL=https://api.civicnotices.co.uk

# Email Service
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@civicnotices.co.uk

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# Feature Flags
NEW_PUBLISH_FLOW=true
ENABLE_BLUE_NOTICES=true

# Third-party Services
ADDRESS_PROVIDER=getaddress
GETADDRESS_API_KEY=your-getaddress-key
POSTCODES_IO_URL=https://api.postcodes.io
```

## Deployment Process

### Step 1: Build Production Bundle

```bash
# Install dependencies
npm ci --production

# Build frontend
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Database Migration

```bash
# Run Ralph fixes first
./ralph-fix-database.sh --verbose

# Apply any pending migrations
npm run migrate:prod

# Verify database state
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY created_at DESC LIMIT 5;"
```

### Step 3: Deploy Application

#### Option A: Docker Deployment

```bash
# Build Docker image
docker build -t civicnotices:latest .

# Tag for registry
docker tag civicnotices:latest registry.civicnotices.co.uk/civicnotices:v1.0.0

# Push to registry
docker push registry.civicnotices.co.uk/civicnotices:v1.0.0

# Deploy to Kubernetes
kubectl apply -f k8s/production/
```

#### Option B: Direct Server Deployment

```bash
# SSH to production server
ssh deploy@prod.civicnotices.co.uk

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Restart services
pm2 restart civic-notices-api
pm2 restart civic-notices-web
```

### Step 4: Verify Deployment

```bash
# Check health endpoints
curl https://api.civicnotices.co.uk/api/health
curl https://civicnotices.co.uk/

# Run smoke tests
npm run test:smoke

# Check monitoring dashboard
open https://monitoring.civicnotices.co.uk
```

## Post-Deployment Validation

### Critical Path Testing

1. **Public User Journey**
   - [ ] Homepage loads
   - [ ] Search by postcode works
   - [ ] Notice details display
   - [ ] Representation form submits

2. **Council User Journey**
   - [ ] Login successful
   - [ ] Dashboard loads with correct data
   - [ ] Notice creation works
   - [ ] Representations visible

3. **Firm User Journey**
   - [ ] Login successful
   - [ ] Client management works
   - [ ] Notice submission for clients works
   - [ ] Billing page accessible

### Performance Validation

```bash
# Load test critical endpoints
npm run test:load

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.civicnotices.co.uk/api/notices

# Verify database query performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements WHERE mean_exec_time > 1000;"
```

### Security Validation

```bash
# Run security scan
npm audit --production

# Check SSL configuration
nmap --script ssl-cert -p 443 civicnotices.co.uk

# Verify headers
curl -I https://civicnotices.co.uk
```

## Rollback Procedure

### Automatic Rollback Triggers
- Health check failures (3 consecutive)
- Error rate > 10%
- Response time > 5s (p95)
- Database connection failures

### Manual Rollback Steps

```bash
# Step 1: Switch traffic to previous version
kubectl set image deployment/civic-notices app=civicnotices:previous

# Step 2: Verify old version is running
kubectl get pods -l app=civic-notices

# Step 3: Restore database if needed
psql $DATABASE_URL < backup/prod-backup-$(date -d yesterday +%Y%m%d).sql

# Step 4: Clear caches
redis-cli FLUSHALL

# Step 5: Notify team
./scripts/notify-rollback.sh
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Application Metrics**
   - Request rate
   - Response time (p50, p95, p99)
   - Error rate
   - Active users

2. **Database Metrics**
   - Connection pool usage
   - Query execution time
   - Slow query count
   - Deadlocks

3. **Business Metrics**
   - Registration success rate
   - Notice submission rate
   - Representation submission rate
   - Search queries per minute

### Alert Thresholds

```yaml
critical:
  - api_down: health_check_failed > 2
  - database_down: connection_failed > 1
  - high_error_rate: error_rate > 5%
  - infinite_recursion: count > 0

warning:
  - slow_response: p95_response_time > 2s
  - high_memory: usage > 85%
  - low_disk: available < 10GB
  - registration_failures: success_rate < 95%
```

## Disaster Recovery

### Backup Strategy

```bash
# Daily full backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/daily/civic-$(date +\%Y\%m\%d).sql.gz

# Hourly incremental backup
0 * * * * pg_dump $DATABASE_URL --data-only | gzip > /backups/hourly/civic-$(date +\%Y\%m\%d-\%H).sql.gz

# Weekly archive to S3
0 3 * * 0 aws s3 sync /backups/ s3://civic-backups/
```

### Recovery Time Objectives
- **RTO (Recovery Time Objective):** 1 hour
- **RPO (Recovery Point Objective):** 1 hour

### Recovery Procedures

1. **Database Corruption**
```bash
# Stop application
pm2 stop all

# Restore from backup
gunzip < /backups/daily/civic-latest.sql.gz | psql $DATABASE_URL

# Run Ralph fixes
./ralph-fix-database.sh

# Restart application
pm2 start all
```

2. **Complete System Failure**
```bash
# Provision new infrastructure
terraform apply -auto-approve

# Restore database
psql $NEW_DATABASE_URL < backup.sql

# Deploy application
kubectl apply -f k8s/production/

# Update DNS
./scripts/update-dns.sh
```

## Production Support

### Support Contacts

- **On-Call Engineer:** Use PagerDuty rotation
- **Database Admin:** dba@civicnotices.co.uk
- **Security Team:** security@civicnotices.co.uk
- **Business Owner:** product@civicnotices.co.uk

### Runbooks

1. [High Error Rate](./runbooks/high-error-rate.md)
2. [Database Connection Issues](./runbooks/database-connection.md)
3. [Infinite Recursion Fix](./runbooks/infinite-recursion.md)
4. [Registration Failures](./runbooks/registration-failures.md)
5. [Performance Degradation](./runbooks/performance.md)

### Common Issues & Solutions

#### Issue: Registration failing with "email exists"
```bash
# Run Ralph fix
./ralph-fix-database.sh

# Check for duplicate entries
psql $DATABASE_URL -c "SELECT email, COUNT(*) FROM organizations GROUP BY email HAVING COUNT(*) > 1;"
```

#### Issue: Department switching causes infinite recursion
```bash
# Emergency fix
psql $DATABASE_URL -c "ALTER TABLE department_memberships DISABLE ROW LEVEL SECURITY;"

# Run Ralph fix
./ralph-fix-database.sh

# Re-enable RLS
psql $DATABASE_URL -c "ALTER TABLE department_memberships ENABLE ROW LEVEL SECURITY;"
```

#### Issue: Slow notice searches
```bash
# Check missing indexes
psql $DATABASE_URL -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"

# Add geospatial index if missing
psql $DATABASE_URL -c "CREATE INDEX IF NOT EXISTS idx_notices_location ON notices USING GIST(location);"
```

## Production Readiness Checklist

### Final Verification

- [ ] All environment variables configured
- [ ] SSL certificates installed and valid
- [ ] Database migrations applied
- [ ] Ralph fixes executed successfully
- [ ] Health checks passing
- [ ] Monitoring dashboards configured
- [ ] Alert recipients configured
- [ ] Backup jobs scheduled
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Rollback procedure tested
- [ ] Support team briefed
- [ ] Documentation updated
- [ ] Change log prepared
- [ ] Customer communication sent

### Sign-offs Required

- [ ] Engineering Lead
- [ ] QA Lead
- [ ] Security Team
- [ ] Product Owner
- [ ] Operations Team

## Deployment Schedule

### Standard Deployment Windows
- **Tuesday:** 10:00 - 12:00 UTC (low traffic)
- **Thursday:** 10:00 - 12:00 UTC (low traffic)

### Blackout Periods
- Monday mornings (high council activity)
- Friday afternoons (weekend submissions)
- Month-end (reporting period)
- UK public holidays

## Success Criteria

Deployment is considered successful when:

1. All health checks pass for 30 minutes
2. Error rate remains below 0.5%
3. P95 response time < 500ms
4. No critical alerts triggered
5. All user journeys validated
6. Zero data loss confirmed

---

**Document Version:** 1.0.0
**Last Updated:** January 19, 2026
**Next Review:** February 19, 2026

For urgent production issues, consult the [Emergency Response Guide](./EMERGENCY-RESPONSE.md).