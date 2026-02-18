# AI-ITSM Queue - Quick Reference Card

## 🚀 Quick Start

### Automatic Mode (Zero Configuration)
```
CI/CD fails → Issue auto-created → AI Agent processes → Max 3 attempts → Escalate if needed
```

### Manual Issue Creation
```bash
# Via GitHub CLI
gh issue create --label "ai-fix" \
  --title "[AI-FIX] Description" \
  --body "Logs and context"

# Via Web
GitHub → Issues → New Issue → 🤖 AI Fix Request
```

### PowerShell Queue Management
```powershell
# List queue
.\process-ai-fix-queue.ps1

# Process specific issue
.\process-ai-fix-queue.ps1 -IssueNumber 123

# Dry run (simulate)
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Custom max attempts
.\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5
```

## 📋 System Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Auto Issue Creator** | `.github/workflows/create-issue-on-failure.yml` | Detects CI/CD failures, creates issues |
| **AI Processor** | `.github/workflows/ai-agent-auto-fix.yml` | Processes issues, manages attempts |
| **Issue Template** | `.github/ISSUE_TEMPLATE/ai-fix.yml` | Manual fix request form |
| **Queue Manager** | `.agent/scripts/process-ai-fix-queue.ps1` | CLI management tool |
| **Documentation** | `.agent/workflows/ai-itsm-queue.md` | Full system guide |

## 🏷️ Labels

| Label | Purpose | Color | Auto-Applied |
|-------|---------|-------|--------------|
| `ai-fix` | Triggers AI processing | Green (0E8A16) | ✅ Yes |
| `ci-cd` | CI/CD related | Orange (D93F0B) | ✅ Auto issues |
| `priority:high` | High priority | Orange (D93F0B) | ✅ Auto issues |
| `automated` | Auto-created issue | Light Blue (C5DEF5) | ✅ Auto issues |
| `in-progress` | AI is working | Blue (1D76DB) | Auto on process |
| `escalated` | Reached limit | Red (B60205) | Auto on escalate |
| `needs-human-review` | Human needed | Orange (D93F0B) | Auto on escalate |

## 🔄 Workflow States

```
┌─────────────┐
│ Issue       │
│ Created     │ ← Auto or Manual
└──────┬──────┘
       ↓
┌─────────────┐
│ ai-fix      │ ← Label applied
│ label       │
└──────┬──────┘
       ↓
┌─────────────────┐
│ Check Attempts  │
└──────┬──────────┘
       ↓
    ┌──┴──┐
    ↓     ↓
  < 3    ≥ 3
    ↓     ↓
 Process Escalate
```

## 📊 Attempt Counting

**Marker**: Comments containing `🤖 **AI Agent ativado`

**Logic**:
```javascript
const attempts = comments.filter(c => 
  c.body.includes('🤖 **AI Agent ativado')
).length;

if (attempts >= 3) {
  escalate();
} else {
  process();
}
```

## 🔍 Troubleshooting Quick Commands

```bash
# Check workflow runs
gh run list --workflow="create-issue-on-failure.yml"
gh run list --workflow="ai-agent-auto-fix.yml"

# View failed logs
gh run view <run-id> --log-failed

# Check issue labels
gh issue view 123 --json labels

# Add ai-fix label manually
gh issue edit 123 --add-label "ai-fix"

# Check comments for attempts
gh issue view 123 --json comments | grep "AI Agent ativado"

# List all ai-fix issues
gh issue list --label "ai-fix"
```

## 🎯 Common Tasks

### Task: Monitor the queue
```powershell
.\process-ai-fix-queue.ps1
```

### Task: Force process an issue
```powershell
.\process-ai-fix-queue.ps1 -IssueNumber 123
```

### Task: Test without changes
```powershell
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun
```

### Task: Manually escalate
```bash
gh issue edit 123 --remove-label "ai-fix"
gh issue edit 123 --add-label "escalated,needs-human-review"
```

### Task: Check metrics
```bash
# Total ai-fix issues
gh issue list --label "ai-fix" --state all --json number | jq 'length'

# Escalated issues
gh issue list --label "escalated" --json number | jq 'length'

# Success rate
echo "scale=2; (resolved / total) * 100" | bc
```

## 📈 Metrics Dashboard

```bash
# Get issue stats
TOTAL=$(gh issue list --label "ai-fix" --state all --json number | jq 'length')
CLOSED=$(gh issue list --label "ai-fix" --state closed --json number | jq 'length')
ESCALATED=$(gh issue list --label "escalated" --json number | jq 'length')
SUCCESS=$(echo "scale=2; ($CLOSED / $TOTAL) * 100" | bc)

echo "Total Issues: $TOTAL"
echo "Closed: $CLOSED"
echo "Escalated: $ESCALATED"
echo "Success Rate: $SUCCESS%"
```

## 🛠️ Installation Checklist

- [ ] Create all required labels (7 total)
- [ ] Verify workflow names in `create-issue-on-failure.yml`
- [ ] Test GitHub CLI authentication: `gh auth status`
- [ ] Merge PR to enable system
- [ ] Test with manual issue creation
- [ ] Monitor first automatic issue

## 📞 Support

- **Bug Reports**: Open issue with label `bug`
- **Questions**: Use GitHub Discussions
- **Improvements**: Open issue with label `enhancement`

## 📖 Full Documentation

See `.agent/workflows/ai-itsm-queue.md` for:
- Complete architecture diagram
- Detailed installation steps
- Usage examples
- Troubleshooting guide
- Metrics and KPIs
- Roadmap

---

**System Version**: 1.0.0  
**Last Updated**: 2026-02-18  
**Status**: ✅ Production Ready
