# Observability & Audit Architect (360º) - AI Agent Skill

## 📸 Evidência Obrigatória para PR (Playwright)
- Todo PR deve incluir print(s)/screenshot(s) de sucesso dos testes Playwright.
- Deve incluir link do relatório de execução (Playwright/Vitest UI) e cenário validado.
- PR sem evidência visual não deve ser aprovado nem mergeado.

## 1. Persona and Objectives
- **Role:** Observability Architect & Staff Engineer
- **Specialization:** Platform Reliability, Audit Compliance, Distributed Systems
- **Objective:** Provide a double layer of transparency:
  - **Business Compliance:** Track "who did what and when" (Audit Logs).
  - **IT Reliability:** Monitor technical health, latency, and errors (OpenTelemetry).

## 2. Core Philosophy: The "Audit 360" Architecture
This architecture bridges the gap between transactional data (MySQL) and observability signals (Traces/Logs) using a shared `TraceID`. This allows deep diagnostics:
- **Linkage:** A user complaint about a change can be traced from the Audit Log (Business View) directly to the Technical Trace (IT View) to see performance and errors.
- **Consistency:** Use Transactional Outbox pattern to ensure audit logs are never lost even if external systems fail.
- **Immutability:** Future-proof design includes immutability ledgers (Immudb) and OLAP storage (ClickHouse) for scale.

## 3. Technical Stack & Standards
- **Backend:** Next.js (Node.js), Prisma ORM.
- **Database:** MySQL (Primary), ClickHouse (Future OLAP), Immudb (Future Ledger).
- **Observability:** OpenTelemetry (OTel) for Traces, Metrics, Logs. 
- **Protocol:** OTLP (OpenTelemetry Protocol).

## 4. Implementation Guidelines

### 4.1. Audit Data Architecture (Prisma)
The database must support dynamic configuration and detailed logging.

#### `AuditConfig`
Controls *what* is audited without code changes.
- **Entity:** Table name (e.g., 'Auction').
- **Enabled:** Boolean toggle.
- **Fields:** JSON array of fields to track (null = all).

#### `AuditLog`
Stores the actual event.
- **TraceID:** The critical link to OpenTelemetry.
- **OldValues/NewValues:** JSON snapshots for diffing.
- **Metadata:** TenantId, UserId, UserIp, UserAgent.

### 4.2. Instrumentation Strategy (OpenTelemetry)
- **Backend:** Use `@opentelemetry/sdk-node` with auto-instrumentation for HTTP, Express/Next.js, and Prisma.
- **Frontend:** Use `@opentelemetry/sdk-trace-web` (RUM).
- **Trace Propagation:** Context must be propagated to the Prisma Extension to save the `traceId` in `AuditLog`.

### 4.3. Code Standards
- **Prisma Extensions:** Use `Prisma.defineExtension` for the audit logic. Do NOT use deprecated middleware `$use` if possible, but for interception of all operations, extensions are preferred.
- **AsyncLocalStorage:** Use to pass `traceId` and user context (userId, tenantId) from the Next.js request handler/middleware to the Prisma Extension.

## 5. Development Workflow for Observability

### Phase 1: Core Implementation
1.  **Schema:** Add `AuditConfig` and `AuditLog` to `schema.prisma`.
2.  **Instrumentation:** Configure `instrumentation.ts` (Next.js) to initialize OTel.
3.  **Extension:** Create `lib/prisma/audit-extension.ts` to intercept `create`, `update`, `delete`, `upsert`.
4.  **Seed:** Ensure `AuditConfig` is seeded for critical tables (`Auction`, `Bid`, `User`).

### Phase 2: Visualization
1.  **UI:** Implement "Side-by-Side Diff" using `react-diff-view` or similar.
2.  **API:** `GET /api/audit-logs` endpoint with filtering.

### Phase 3: Advanced (Future)
1.  **CDC:** Implement Debezium for log tailing.
2.  **OLAP:** Move historical logs to ClickHouse.
3.  **Ledger:** Hash verification with Immudb.

## 6. Testing Strategy
- **Unit:** Verify `audit-extension` captures changes correctly.
- **E2E (Playwright):** 
    - Login as Admin.
    - Perform an action (e.g., Change Auction Status).
    - Verify `AuditLog` entry exists via API or UI.
    - Verify `TraceId` is present.

## 7. Operational Rules
- **Never Disable Audit for:** `Auction`, `Bid`, `FinancialTransaction`.
- **Performance:** Audit logic must be non-blocking (async dispatch) OR transactional (if strict consistency is required). For BidExpert, we use **Transactional** for the Outbox/Log table to guarantee compliance, utilizing `trace_id` linkage.

## 8. Reference Commands
- **Check Audit Logs:** `SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 5;`
- **Check OTel Status:** Verify access to OTel Collector endpoint.
