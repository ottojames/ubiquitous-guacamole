#!/bin/bash

# Monitoring Setup Script for Civic Notices
# This script sets up monitoring and alerting for the application

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Civic Notices Monitoring Setup"
echo "========================================="
echo ""

# Function to log messages
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check prerequisites
log_info "Checking prerequisites..."

# Check if psql is installed
if command -v psql &> /dev/null; then
  log_success "PostgreSQL client installed"
else
  log_warning "PostgreSQL client not found. Some monitoring features will be limited."
fi

# Check if curl is installed
if command -v curl &> /dev/null; then
  log_success "curl installed"
else
  log_error "curl not found. Please install curl."
  exit 1
fi

# Step 2: Create monitoring directory structure
log_info "Setting up monitoring directory structure..."

mkdir -p monitoring/logs
mkdir -p monitoring/metrics
mkdir -p monitoring/reports

log_success "Directory structure created"

# Step 3: Create health check script
log_info "Creating health check script..."

cat > monitoring/health-check.sh << 'EOF'
#!/bin/bash

# Health Check Script
API_URL="${API_URL:-http://localhost:5174}"
DATABASE_URL="${DATABASE_URL}"

# Check API health
api_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")
echo "API Status: $api_status"

# Check database connection
if [ ! -z "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database: Connected"
  else
    echo "Database: Failed"
  fi
else
  echo "Database: Not configured"
fi

# Check for common errors
if [ -f "monitoring/logs/errors.log" ]; then
  recent_errors=$(tail -100 monitoring/logs/errors.log | grep -c "ERROR" || true)
  echo "Recent errors (last 100 lines): $recent_errors"
fi

# Output timestamp
echo "Checked at: $(date)"
EOF

chmod +x monitoring/health-check.sh
log_success "Health check script created"

# Step 4: Create error tracking script
log_info "Creating error tracking script..."

cat > monitoring/track-errors.sh << 'EOF'
#!/bin/bash

# Error Tracking Script
LOG_FILE="monitoring/logs/errors.log"
METRICS_FILE="monitoring/metrics/error-metrics.json"

# Common error patterns to track
declare -A error_patterns=(
  ["infinite_recursion"]="infinite recursion detected"
  ["column_not_found"]="column .* does not exist"
  ["auth_failed"]="authentication failed"
  ["registration_failed"]="registration failed"
  ["foreign_key_violation"]="violates foreign key constraint"
  ["rls_denied"]="permission denied for"
)

# Initialize metrics
echo "{" > "$METRICS_FILE"
echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$METRICS_FILE"
echo "  \"errors\": {" >> "$METRICS_FILE"

first=true
for error_type in "${!error_patterns[@]}"; do
  pattern="${error_patterns[$error_type]}"
  count=$(grep -c "$pattern" "$LOG_FILE" 2>/dev/null || echo 0)

  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$METRICS_FILE"
  fi

  echo -n "    \"$error_type\": $count" >> "$METRICS_FILE"
done

echo "" >> "$METRICS_FILE"
echo "  }" >> "$METRICS_FILE"
echo "}" >> "$METRICS_FILE"

echo "Error metrics updated: $METRICS_FILE"
EOF

chmod +x monitoring/track-errors.sh
log_success "Error tracking script created"

# Step 5: Create database monitoring queries
log_info "Creating database monitoring queries..."

cat > monitoring/db-monitoring.sql << 'EOF'
-- Database Monitoring Queries for Civic Notices

-- Check for recursive RLS policies
SELECT
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'department_memberships'
AND (
  policyname LIKE '%recursive%'
  OR policyname IN ('Members can view dept memberships', 'Users can view department colleagues')
);

-- Check for slow queries (requires pg_stat_statements extension)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- queries slower than 1 second
AND calls > 10  -- called more than 10 times
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
AND n_distinct > 100
AND correlation < 0.1
ORDER BY n_distinct DESC
LIMIT 20;

-- Registration success rate (last hour)
SELECT
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as successful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as success_rate
FROM organizations
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Active sessions count
SELECT COUNT(DISTINCT user_id) as active_users
FROM department_memberships
WHERE last_accessed_at > NOW() - INTERVAL '15 minutes';
EOF

log_success "Database monitoring queries created"

# Step 6: Create monitoring cron job
log_info "Setting up monitoring schedule..."

cat > monitoring/cron-setup.sh << 'EOF'
#!/bin/bash

# Add monitoring cron jobs
# Run this script with: ./monitoring/cron-setup.sh

# Health check every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && ./monitoring/health-check.sh >> monitoring/logs/health.log 2>&1") | crontab -

# Error tracking every 15 minutes
(crontab -l 2>/dev/null; echo "*/15 * * * * cd $(pwd) && ./monitoring/track-errors.sh >> monitoring/logs/tracking.log 2>&1") | crontab -

# Daily report at 9 AM
(crontab -l 2>/dev/null; echo "0 9 * * * cd $(pwd) && ./monitoring/generate-report.sh >> monitoring/logs/reports.log 2>&1") | crontab -

echo "Cron jobs added. View with: crontab -l"
EOF

chmod +x monitoring/cron-setup.sh
log_success "Cron setup script created"

# Step 7: Create report generator
log_info "Creating report generator..."

cat > monitoring/generate-report.sh << 'EOF'
#!/bin/bash

# Daily Monitoring Report Generator
REPORT_FILE="monitoring/reports/daily-$(date +%Y%m%d).md"

echo "# Daily Monitoring Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## System Health" >> "$REPORT_FILE"
./monitoring/health-check.sh >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## Error Summary" >> "$REPORT_FILE"
if [ -f "monitoring/metrics/error-metrics.json" ]; then
  cat monitoring/metrics/error-metrics.json >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "## Performance Metrics" >> "$REPORT_FILE"
echo "See monitoring/metrics/ for detailed metrics" >> "$REPORT_FILE"

echo "Report saved to: $REPORT_FILE"
EOF

chmod +x monitoring/generate-report.sh
log_success "Report generator created"

# Step 8: Create README
log_info "Creating monitoring documentation..."

cat > monitoring/README.md << 'EOF'
# Monitoring & Alerting Setup

## Quick Start

1. **Set environment variables:**
```bash
export API_URL=http://localhost:5174
export DATABASE_URL=postgres://user:pass@host:port/db
```

2. **Run health check:**
```bash
./monitoring/health-check.sh
```

3. **Track errors:**
```bash
./monitoring/track-errors.sh
```

4. **Generate report:**
```bash
./monitoring/generate-report.sh
```

## GitHub Actions Integration

The `.github/workflows/monitoring.yml` workflow runs automatically:
- Every 5 minutes for health checks
- Creates GitHub issues for critical alerts
- Generates summary reports

## Alert Configuration

Edit `monitoring/alerts.config.json` to customize:
- Alert thresholds
- Notification channels
- Metric collection intervals

## Metrics Collected

- API health status
- Database connection status
- Error rates by type
- Registration success rate
- Query performance (p95)
- Slow query count

## Troubleshooting

### No metrics appearing
- Check API_URL and DATABASE_URL are set correctly
- Verify services are running
- Check monitoring/logs/ for errors

### Too many alerts
- Adjust thresholds in alerts.config.json
- Increase cooldown periods
- Review alert conditions

### Missing data
- Ensure PostgreSQL client is installed
- Check database permissions
- Verify network connectivity

## Support

For issues with monitoring setup:
1. Check monitoring/logs/
2. Review error patterns
3. Run health-check.sh manually
EOF

log_success "Documentation created"

# Final summary
echo ""
echo "========================================="
echo "Monitoring Setup Complete!"
echo "========================================="
echo ""
echo "✅ Health check script created"
echo "✅ Error tracking configured"
echo "✅ Database queries prepared"
echo "✅ Report generator ready"
echo "✅ Documentation available"
echo ""
echo "Next steps:"
echo "1. Set environment variables:"
echo "   export API_URL=http://localhost:5174"
echo "   export DATABASE_URL=<your-database-url>"
echo ""
echo "2. Test health check:"
echo "   ./monitoring/health-check.sh"
echo ""
echo "3. (Optional) Setup cron jobs:"
echo "   ./monitoring/cron-setup.sh"
echo ""
echo "4. View monitoring config:"
echo "   cat monitoring/alerts.config.json"
echo ""
echo "For GitHub Actions monitoring, ensure DATABASE_URL"
echo "is added to repository secrets."