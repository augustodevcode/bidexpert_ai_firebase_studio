# 🚨 Error Monitoring Quick Start Guide

This guide will help you set up error monitoring for BidExpert AI using Sentry and/or Vercel Log Drains.

## 🎯 Choose Your Solution

### Option 1: Sentry (Recommended)
✅ Best for: Complete error tracking with context, session replay, and performance monitoring  
✅ Effort: 10 minutes setup  
✅ Cost: Free tier (5k errors/month)

### Option 2: Vercel Log Drains
✅ Best for: Simple error logging from Vercel infrastructure  
✅ Effort: 5 minutes setup  
✅ Cost: Free

### Option 3: Both (Recommended for Production)
✅ Best for: Comprehensive coverage - Sentry for app errors, Log Drains for infrastructure errors  
✅ Effort: 15 minutes setup

---

## 🚀 Option 1: Sentry Setup (Recommended)

### Step 1: Create Sentry Account & Project

1. Go to https://sentry.io/signup/
2. Create a new organization (or use existing)
3. Click "Create Project"
4. Select "Next.js" as platform
5. Name it: `bidexpert-ai-firebase-studio`
6. Copy the DSN (you'll need this)

### Step 2: Configure Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/yyyyy
SENTRY_DSN=https://xxxxx@sentry.io/yyyyy
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=bidexpert-ai-firebase-studio
SENTRY_AUTH_TOKEN=your-auth-token  # Get from sentry.io/settings/account/api/auth-tokens/
```

**How to get the auth token:**
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Name: "Vercel Deploy"
4. Scopes: `project:read`, `project:releases`, `org:read`
5. Copy the token

### Step 3: Connect Sentry to GitHub

Run this script locally:

```bash
npm run setup:sentry
```

Or do it manually:

1. Go to https://sentry.io/settings/[your-org]/integrations/github/
2. Click "Install" or "Configure"
3. Authorize Sentry to access your repository
4. Select: `augustodevcode/bidexpert_ai_firebase_studio`

### Step 4: Configure Alert Rules

1. Go to https://sentry.io/organizations/[your-org]/alerts/rules/
2. Click "Create Alert Rule"
3. Configure:
   - **When**: "An event is seen"
   - **Filter**: Add filter → `level:error OR level:fatal`
   - **Then**: "Create a new issue in GitHub"
   - **Repository**: augustodevcode/bidexpert_ai_firebase_studio
   - **Labels**: `bug`, `sentry`, `production-error`
   - **Action interval**: 24 hours (prevents duplicate issues)
4. Click "Save Rule"

### Step 5: Deploy

```bash
git push origin main
```

Sentry will automatically start monitoring your application after the next deployment!

### Step 6: Test

To test if Sentry is working, you can trigger a test error:

```typescript
// Add this to any page temporarily
throw new Error('Test Sentry Integration');
```

Check:
- Sentry Dashboard: https://sentry.io/organizations/[your-org]/issues/
- GitHub Issues: Should create a new issue automatically

---

## 🚀 Option 2: Vercel Log Drains Setup

### Step 1: Generate Secret

```bash
openssl rand -base64 32
```

Copy the output (this is your `LOG_DRAIN_SECRET`)

### Step 2: Configure Environment Variables

Add these to Vercel (Settings → Environment Variables):

```bash
LOG_DRAIN_SECRET=<paste the secret from step 1>
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # Create at github.com/settings/tokens
```

**How to create GitHub token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Vercel Log Drain"
4. Scopes: ✅ `repo` (Full control)
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)

### Step 3: Deploy First

Deploy your changes so the `/api/log-drain` endpoint is live:

```bash
git push origin main
```

Wait for deployment to complete and note your deployment URL (e.g., `https://bidexpert-xxx.vercel.app`)

### Step 4: Configure Log Drain in Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Log Drains
4. Click "Add Log Drain"
5. Configure:
   - **Name**: GitHub Issues Error Logger
   - **Drain URL**: `https://your-domain.vercel.app/api/log-drain`
   - **Secret**: Paste your `LOG_DRAIN_SECRET`
   - **Sources**: Check `lambda`, `edge`, `build`, `static`
   - **Sampling Rate**: 1.0 (100%)
6. Click "Add Log Drain"

#### Option B: Using Script (Advanced)

Update `scripts/setup-vercel-log-drain.sh` with your values, then run:

```bash
npm run setup:log-drain
```

### Step 5: Test

Trigger an error in your application and check:
- Vercel Logs: Should show the error
- GitHub Issues: Should create a new issue within ~30 seconds

---

## 🎯 Option 3: Both (Production Setup)

Follow both Option 1 and Option 2 above. This gives you:

- **Sentry**: Captures client-side errors, server errors, performance issues
- **Log Drains**: Captures infrastructure errors from Vercel (build failures, edge errors)

Both will create GitHub issues, but with different labels:
- Sentry issues: `bug`, `sentry`, `production-error`
- Log Drain issues: `bug`, `vercel`, `production-error`, `automated`

---

## ✅ Verification

After setup, verify everything is working:

### 1. Check Sentry Dashboard
- Go to https://sentry.io/organizations/[your-org]/issues/
- You should see the project dashboard

### 2. Check GitHub Integration
- Look for the Sentry bot in your repository
- Check that webhook is configured

### 3. Trigger Test Error

Create a test page or add to an existing one:

```typescript
// pages/test-error.tsx
export default function TestError() {
  if (typeof window !== 'undefined') {
    throw new Error('Test Error - Sentry Integration');
  }
  return <div>Testing...</div>;
}
```

Visit the page and check:
- ✅ Sentry Dashboard shows the error
- ✅ GitHub issue is created automatically
- ✅ Issue has correct labels and description

### 4. Check Vercel Logs (if using Log Drains)
- Go to Vercel Dashboard → Deployments → Logs
- Verify that errors appear in logs
- Check that they're being sent to your endpoint

---

## 📊 Monitoring

### Daily Checks
- **GitHub Issues**: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/issues?q=label:production-error
- **Sentry Dashboard**: https://sentry.io/organizations/[your-org]/issues/

### Weekly Metrics
- Error rate trends
- Most common errors
- Affected users/deployments
- Response time

### Monthly Review
- Error resolution rate
- New vs recurring errors
- Performance impact
- Cost analysis (if using paid tiers)

---

## 🔧 Troubleshooting

### Sentry Not Capturing Errors

**Problem**: No errors showing in Sentry dashboard

**Solutions**:
1. Check environment variables are set in Vercel
2. Verify DSN is correct
3. Check build logs for Sentry initialization
4. Test locally with `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
5. Verify `next.config.mjs` includes Sentry wrapper

**Debug commands**:
```bash
# Check if Sentry files exist in build
ls -la .next/server/sentry*

# Check Vercel environment variables
vercel env ls

# Test locally
NEXT_PUBLIC_SENTRY_DSN=your-dsn npm run build && npm start
```

### Log Drains Not Working

**Problem**: No issues being created from Vercel logs

**Solutions**:
1. Verify `LOG_DRAIN_SECRET` is set in Vercel
2. Check `GITHUB_TOKEN` has `repo` permissions
3. Test endpoint manually:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/log-drain \
     -H "Authorization: Bearer YOUR_SECRET" \
     -H "Content-Type: application/json" \
     -d '[{"id":"test","message":"Test error","timestamp":1234567890,"source":"lambda","type":"lambda-error"}]'
   ```
4. Check Vercel Function logs: `vercel logs api/log-drain`
5. Verify Log Drain is configured in Vercel Dashboard

### Duplicate Issues

**Problem**: Same error creating multiple issues

**Solutions**:
1. **Sentry**: Increase "Action interval" in Alert Rule (Settings → Alerts)
2. **Log Drains**: Increase `CACHE_DURATION` in `src/app/api/log-drain/route.ts`
3. Check issue grouping settings in Sentry
4. Verify deduplication is working (check cache in logs)

### Too Many Issues

**Problem**: Getting spammed with false positive errors

**Solutions**:
1. **Sentry**: 
   - Add filters in Alert Rule
   - Update `beforeSend` in `sentry.client.config.ts` to ignore specific errors
2. **Log Drains**: 
   - Update error filter in `src/app/api/log-drain/route.ts`
   - Make filtering more strict

Example filter update:
```typescript
// sentry.client.config.ts
beforeSend(event, hint) {
  const ignoredErrors = [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Failed to fetch',
    'ChunkLoadError',  // Add more as needed
  ];
  
  const errorMessage = hint.originalException?.toString() || '';
  if (ignoredErrors.some(err => errorMessage.includes(err))) {
    return null;
  }
  
  return event;
}
```

---

## 📚 Additional Resources

### Documentation
- [Complete Error Monitoring Guide](./docs/ERROR_MONITORING.md)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Log Drains Documentation](https://vercel.com/docs/observability/log-drains)

### Useful Links
- Sentry Dashboard: https://sentry.io/organizations/[your-org]/issues/
- GitHub Issues: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/issues
- Vercel Dashboard: https://vercel.com/dashboard

### Support
- Sentry Support: https://sentry.io/support/
- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/issues

---

## 🎉 Next Steps

After basic setup, consider:

1. **Enable Session Replay** in Sentry (see user sessions before errors)
2. **Configure Performance Monitoring** (track slow endpoints)
3. **Set Up Slack/Discord Notifications** (real-time alerts)
4. **Add Custom Context** (user info, tenant info, custom tags)
5. **Configure Source Maps Upload** (better stack traces)

See [docs/ERROR_MONITORING.md](./docs/ERROR_MONITORING.md) for advanced configuration.

---

**Last Updated**: 2024-02-19  
**Maintainer**: BidExpert Team  
**Version**: 1.0.0
