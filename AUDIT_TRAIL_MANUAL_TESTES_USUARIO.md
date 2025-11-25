# Audit Trail Module - Manual User Tests (BDD/TDD)

## 1. Automatic Logging
**Scenario:** Create a new Auction
- **Given** I am logged in as an Admin
- **When** I create a new Auction with title "Audit Test Auction"
- **Then** An audit log entry should be created for entity "Auction" with action "CREATE"

**Scenario:** Update an Auction
- **Given** I have an existing Auction "Audit Test Auction"
- **When** I update the title to "Audit Test Auction Updated"
- **Then** An audit log entry should be created for entity "Auction" with action "UPDATE"
- **And** The changes field should show the old and new title

## 2. Change History Tab
**Scenario:** View History in UI
- **Given** I am on the Edit Auction page for "Audit Test Auction Updated"
- **When** I click on the "Change History" tab
- **Then** I should see a list of changes
- **And** I should see the "CREATE" action
- **And** I should see the "UPDATE" action with details

## 3. API Verification
**Scenario:** Fetch Audit Logs
- **Given** I have performed actions
- **When** I request `GET /api/audit?entityType=Auction`
- **Then** I should receive a JSON response with the audit logs

## 4. Admin Configuration
**Scenario:** Check Audit Stats
- **Given** I am an Admin
- **When** I request `GET /api/audit/stats`
- **Then** I should receive statistics about the audit logs
