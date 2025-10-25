# Sentry Error Tracking Setup Guide

## What is Sentry?

Sentry automatically captures errors in production and provides a dashboard where you can:
- See all errors with stack traces
- Know which users are affected
- Get real-time alerts
- Track error frequency and trends
- Monitor performance issues

## Setup Instructions (5 minutes)

### Step 1: Create a Sentry Account

1. Go to https://sentry.io and sign up (free tier: 5,000 errors/month)
2. Create a new project
3. Select **React** as the platform
4. Copy the DSN (looks like: `https://abc123@o123.ingest.sentry.io/456`)

### Step 2: Add DSN to Environment Variables

Add to your `.env.local` file:

```bash
# Frontend
VITE_SENTRY_DSN=https://YOUR_DSN_HERE@o123.ingest.sentry.io/456
VITE_SENTRY_ENVIRONMENT=production

# Backend (create separate project in Sentry for backend)
SENTRY_DSN=https://YOUR_BACKEND_DSN_HERE@o123.ingest.sentry.io/789
SENTRY_ENVIRONMENT=production
```

**Note:** Frontend and backend should use **separate Sentry projects** for clearer error tracking.

### Step 3: Deploy

That's it! Sentry is already integrated into the codebase. When you deploy with the DSN configured, errors will automatically be captured.

## Testing Sentry

To test that Sentry is working:

### Frontend Test

Add this temporary button to any page:

```tsx
<button onClick={() => {
  throw new Error('Test error - Sentry is working!');
}}>
  Test Sentry
</button>
```

Click it, then check your Sentry dashboard. You should see the error appear within seconds.

### Backend Test

Make a request to a non-existent API endpoint or add:

```typescript
app.get('/api/test-error', () => {
  throw new Error('Backend test error');
});
```

## Understanding the Sentry Dashboard

### Issues Page
- Lists all unique errors
- Shows frequency (how many times each error occurred)
- Shows affected users

### Error Detail View
When you click an error, you'll see:

1. **Stack Trace**: Exact line of code that failed
2. **Breadcrumbs**: User actions leading up to the error
   - Example: "User clicked Publish → Form validation passed → API call failed"
3. **User Context**: Browser, OS, user ID (if logged in)
4. **Tags**: Environment (production/staging), release version
5. **Timeline**: When the error occurred and how many times

### Alerts
Configure email/Slack alerts for:
- **New Issues**: Get notified when a new type of error appears
- **Regressions**: Errors that were fixed but came back
- **High Volume**: More than X errors per hour

## Integration Features Already Configured

### Frontend (src/lib/sentry.ts)
- ✅ Automatic error capture
- ✅ Performance monitoring (10% sample rate in production)
- ✅ User context tracking
- ✅ Breadcrumbs (user actions)
- ✅ Filters out development errors
- ✅ Ignores common non-critical errors (ResizeObserver, etc.)

### Backend (server/lib/sentry.ts)
- ✅ Automatic error capture
- ✅ Request tracking
- ✅ Performance monitoring (10% sample rate)
- ✅ Filters out development errors
- ✅ Ignores network timeouts

## Setting User Context

When a user logs in, call:

```typescript
import { setUser } from '@/lib/sentry';

// After login
setUser({
  id: user.id,
  email: user.email,
  name: user.name
});

// On logout
import { clearUser } from '@/lib/sentry';
clearUser();
```

This helps you know which users are experiencing errors.

## Manual Error Tracking

### Capture Custom Errors

```typescript
import { captureException } from '@/lib/sentry';

try {
  await publishNotice(data);
} catch (error) {
  captureException(error as Error, {
    noticeId: data.id,
    attemptNumber: 3,
  });
  // Show error to user
}
```

### Log Important Events

```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('Payment processing started', 'info');
captureMessage('Unusual activity detected', 'warning');
```

### Add Debugging Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb('User selected notice type', {
  noticeType: 'premises-licence',
  department: 'licensing',
});
```

## Environment-Specific Behavior

### Development
- Errors logged to console only (not sent to Sentry)
- Allows testing without polluting Sentry dashboard

### Production
- All errors sent to Sentry
- 10% performance monitoring (configurable in src/lib/sentry.ts)
- User context included

## Cost Management

### Free Tier (5,000 errors/month)
Perfect for:
- Startups
- Low-traffic sites
- Early development

### Paid Tier (£26/month for 50,000 errors)
Consider upgrading when:
- You have multiple councils using the platform
- You need longer data retention (90 days vs 30 days)
- You want session replay (video recordings of user sessions)

### Reducing Error Volume

If you hit the limit:
1. Fix the most common errors first
2. Adjust sample rates in `src/lib/sentry.ts`:
   ```typescript
   tracesSampleRate: 0.05, // 5% instead of 10%
   ```
3. Add more errors to the ignore list

## Common Errors You'll See

### "Cannot read property 'X' of undefined"
- Most common JavaScript error
- Usually means data wasn't loaded before component rendered
- Fix: Add loading states and null checks

### "Failed to fetch"
- API endpoint is down or unreachable
- Network issue
- Check server logs

### "Invalid date"
- Date parsing failed
- Fix: Validate date format before parsing

## Support

### Sentry Documentation
- https://docs.sentry.io

### CivicNotices Integration
- Frontend config: `src/lib/sentry.ts`
- Backend config: `server/lib/sentry.ts`
- Frontend init: `src/main.tsx` (line 15)
- Backend init: `server/index.ts` (line 20)

## Next Steps

1. Create Sentry account → Get DSN → Add to .env.local
2. Deploy to production
3. Monitor errors in Sentry dashboard
4. Set up email/Slack alerts
5. Fix critical errors first (highest frequency + impact)

**Questions?** Check https://docs.sentry.io or the Sentry Slack community.
