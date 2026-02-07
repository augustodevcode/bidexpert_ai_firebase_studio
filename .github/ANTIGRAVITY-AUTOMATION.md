# Automation Protocol for Auction Sniper & QA Agent Integration with Google Antigravity
# This file defines automation rules for automatic agent invocation in CI/CD and workflow contexts

---
## Overview

This document describes how the Auction Sniper & QA Agent integrates with Google Cloud Antigravity automations and CI/CD pipelines.

---

## 1. Antigravity Automation Triggers

### 1.1 On Code Changes (Auction/Bidding Files)

**Trigger**: File pattern change detected  
**Condition**: `src/**/*auction*.ts(x)` OR `src/**/*bid*.ts(x)` OR `src/**/*lot*.ts(x)`  
**Action**: Automatically run Auction Sniper audit

```yaml
# Pattern in Antigravity rules
rule:
  name: "auto-audit-auction-changes"
  trigger: "on-file-change"
  filePattern: "src/**/*(auction|bid|lot|search)*.ts?(x)"
  action: "invoke-audit-sniper-qa"
  priority: "high"
  notifyOn: ["critical_issue_found"]
```

### 1.2 On Performance Degradation

**Trigger**: Performance metric threshold exceeded  
**Condition**: `response_time > 2000ms` OR `api_latency > 1000ms`  
**Action**: Run Auction Sniper performance audit

```yaml
rule:
  name: "auto-audit-performance-issues"
  trigger: "on-metric-anomaly"
  metric: "api-latency"
  threshold: 1000  # milliseconds
  action: "invoke-audit-sniper-performance"
  priority: "critical"
  escalateTo: "team-lead"
```

### 1.3 On Security Alerts

**Trigger**: SAST/DAST security scanner detects issue  
**Condition**: `severity >= HIGH` AND `category IN [XSS, CSRF, Auth]`  
**Action**: Run Auction Sniper security audit

```yaml
rule:
  name: "auto-audit-security-alerts"
  trigger: "on-security-finding"
  severity: "HIGH"
  categories:
    - "XSS"
    - "CSRF"
    - "Authentication"
    - "Authorization"
    - "Race Condition"
  action: "invoke-audit-sniper-security"
  priority: "critical"
  requiresApproval: true
```

### 1.4 On Bid/Auction Anomalies

**Trigger**: Business logic anomaly detected (duplicate bids, sync issues)  
**Condition**: `bid_count_mismatch > 0` OR `timestamp_sync_error > 0`  
**Action**: Run Auction Sniper with critical priority

```yaml
rule:
  name: "auto-audit-business-anomalies"
  trigger: "on-data-anomaly"
  detectionSource: "database-audit-logs"
  anomalyPatterns:
    - "duplicate_bid"
    - "concurrent_bid_write"
    - "sync_timestamp_drift > 100ms"
    - "lot_status_mismatch"
  action: "invoke-audit-sniper-qa-critical"
  priority: "critical"
  requiresApproval: false  # Auto-execute for data integrity
  escalate: true
```

---

## 2. GitHub Actions Integration

### 2.1 Automatic Workflow Trigger for Auction Sniper

**File**: `.github/workflows/auction-sniper-qa-auto.yml`  
**Trigger**: On pull request to `main` or `demo-stable` affecting auction/bidding code

```yaml
name: "Auction Sniper & QA Auto-Audit"

on:
  pull_request:
    branches: [main, demo-stable]
    paths:
      - "src/**/auction/**"
      - "src/**/bid/**"
      - "src/**/lot/**"
      - "src/**/search/**"
      - "src/**/security/**"

jobs:
  auction-sniper-audit:
    runs-on: ubuntu-latest
    steps:
      - name: "Invoke Auction Sniper & QA Agent"
        env:
          AGENT_NAME: "auction-sniper-qa"
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          node .github/scripts/invoke-agent.js \
            --agent auction-sniper-qa \
            --context "PR-${{ github.event.pull_request.number }}" \
            --priority "high"
```

---

## 3. Cloud Build Integration

### 3.1 Automated Auction Sniper Step

**File**: Updated `cloudbuild.yaml`  
**When**: Before deployment to staging/production, for auction-related changes

```yaml
- name: "gcr.io/cloud-builders/gcloud"
  id: "auction-sniper-audit"
  entrypoint: "bash"
  args:
    - "-c"
    - |
      gcloud beta run jobs execute auction-sniper-qa-job \
        --region=us-central1 \
        --wait \
        --args="--context=cloudbuild" \
        --args="--files=$CHANGED_FILES" \
        --args="--priority=high"
  condition: ["changed_files_match_auction_pattern"]
  waitFor: ["code-scan"]
```

---

## 3. Admin Architect & System Auditor Integration

### 3.1 Automated Admin Architect Step

**File**: `.gemini/admin-architect-qa.config.yaml` (NEW)  
**When**: Before deployment for admin/backoffice/compliance changes

**Cloud Build integration:**
```yaml
- name: "gcr.io/cloud-builders/gcloud"
  id: "admin-architect-audit"
  entrypoint: "bash"
  args:
    - "-c"
    - |
      gcloud beta run jobs execute admin-architect-qa-job \
        --region=us-central1 \
        --wait \
        --args="--context=cloudbuild" \
        --args="--files=$CHANGED_FILES" \
        --args="--priority=high"
  condition: ["changed_files_match_backoffice_pattern"]
  waitFor: ["code-scan"]
```

### 3.2 Automation Rules (Admin Architect)

```yaml
triggers:
  - type: "on-code-change"
    pattern: "src/**/*(backoffice|admin|lotes)*.ts(x)?"
    action: "invoke-admin-architect-audit"
    priority: "high"
  
  - type: "on-code-change"
    pattern: "src/**/*(payment|financial|commission)*.ts(x)?"
    action: "invoke-admin-architect-financial-audit"
    priority: "critical"
  
  - type: "on-infrastructure-alert"
    pattern: "latency > 2000ms OR error_rate > 5%"
    action: "invoke-admin-architect-infra-audit"
    priority: "critical"
  
  - type: "on-security-alert"
    action: "invoke-admin-architect-security-audit"
    priority: "critical"
  
  - type: "on-compliance-check"
    pattern: "LGPD OR data-retention OR GDPR"
    action: "invoke-admin-architect-compliance-audit"
    priority: "high"
```

---

## 4. Firestore Rules and Admin Architect Integration (UPDATED)

### 4.1 Audit Trail for Bid Synchronization

**File**: `firestore.rules` (with custom claims)  
**Purpose**: Log all bid write operations for Auction Sniper audit

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /auctions/{auctionId}/bids/{bidId} {
      allow write: if request.auth != null
        && validate_bid_write(request.auth.uid, request.resource.data)
        && log_for_audit_sniper(auctionId, bidId, request);
      
      // Custom function that triggers Auction Sniper check
      function validate_bid_write(uid, data) {
        return (
          data.amount is number &&
          data.bidderId == uid &&
          data.timestamp == request.time &&
          !exists(/databases/$(database)/documents/auctions/$(auctionId)/bids/$(bidId))
        );
      }
    }
  }
}
```

---

## 5. Webhook and Event System

### 5.1 Auction Sniper Webhook

**Endpoint**: `/api/webhooks/auction-sniper-qa`  
**Purpose**: Receive events from Antigravity and trigger automated audits

```typescript
// src/app/api/webhooks/auction-sniper-qa/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  if (event.trigger === "code-change" && event.filePattern?.includes("auction")) {
    return await invokeTriggerAuctionSniperAudit({
      context: event.context,
      priority: "high",
      agent: "auction-sniper-qa"
    });
  }
  
  if (event.trigger === "security-alert" && event.severity === "HIGH") {
    return await invokeTriggerAuctionSniperAudit({
      context: event.context,
      priority: "critical",
      auditBlock: "security"
    });
  }
  
  return Response.json({ status: "processed" });
}
```

---

## 6. Environment Variables for Antigravity Integration

**Add to `.env` or Cloud Secret Manager:**

```env
# Gemini/Antigravity Configuration
GEMINI_PROJECT_ID=bidexpert-630df
GEMINI_WEBHOOK_URL=https://gemini.googleapis.com/v1/webhooks/auction-sniper
GEMINI_API_KEY=<secret-value>

# Auction Sniper Agent Configuration
AUCTION_SNIPER_AUTO_ACTIVATE=true
AUCTION_SNIPER_AUTO_ACTIVATE_KEYWORDS=bid,leilão,deságio,ROI,security,race-condition
AUCTION_SNIPER_CRITICAL_PRIORITY_LEVEL=critical
AUCTION_SNIPER_AUDIT_BLOCKS=search,ui-ux,lot-page,dashboard,security,bdd,tone

# Notification Channels
SLACK_WEBHOOK_AUCTION_SNIPER=<webhook-url>
TEAM_LEAD_EMAIL=team-lead@bidexpert.com

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=bidexpert-630df
GOOGLE_CLOUD_REGION=us-central1
```

---

## 7. Testing and Validation

### 7.1 Verify Antigravity Integration

```bash
# Test 1: Verify webhook is accessible
curl -X POST https://your-app.run.app/api/webhooks/auction-sniper-qa \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "code-change",
    "filePattern": "src/app/auction/page.tsx",
    "context": "test"
  }'

# Test 2: Verify Cloud Build integration
gcloud builds submit --config=cloudbuild.yaml --substitutions=_AGENT=auction-sniper-qa

# Test 3: Verify Gemini API connectivity
gcloud beta ai api-keys list --filter="displayName:auction-sniper"
```

---

## 8. Documentation References

- **Agent Definition**: `.agent/agents/auction-sniper-qa.agent.md`
- **Gemini Config**: `.gemini/auction-sniper-qa.config.yaml` (NEW)
- **Claude Instructions**: `.claude/CLAUDE.md` (UPDATED)
- **VSCode Settings**: `.vscode/settings.json` (UPDATED)
- **Auto-Activation**: `.agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md`
- **Setup Guide**: `.agent/agents/auction-sniper-qa.SETUP-GUIDE.md`

---

## 9. Monitoring and Logging

### 9.1 Cloud Logging Configuration

```yaml
# Logs to monitor Auction Sniper invocations
logQueries:
  - resource: "cloud_run_job"
    labels: { job_name: "auction-sniper-qa" }
    fields: { agent_invocation_count, duration_ms, critical_issues_found }
  
  - resource: "api"
    labels: { endpoint: "/api/webhooks/auction-sniper-qa" }
    fields: { request_count, response_time, error_rate }
  
  - resource: "firestore"
    labels: { collection: "auctions/bids", audit_event: "true" }
    fields: { write_count, validation_errors, timestamp_drift_ms }
```

---

## Summary

The Auction Sniper & QA Agent is now integrated into:
1. ✅ **VSCode Custom Instructions** (`.vscode/settings.json`)
2. ✅ **Gemini/Antigravity Configuration** (`.gemini/auction-sniper-qa.config.yaml`)
3. ✅ **Claude Project Memory** (`.claude/CLAUDE.md`)
4. ✅ **GitHub Workflows** (`.github/workflows/`)
5. ✅ **Cloud Build Pipeline** (`cloudbuild.yaml`)
6. ✅ **Firestore Security Rules** (`firestore.rules`)
7. ✅ **Webhook Handlers** (`src/app/api/webhooks/`)

**All automations are now configured for auto-activation!** 🚀
