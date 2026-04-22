# Performance Optimization Rationale: Judicial Process Count for Lawyers

## Issue: N+1 Query Inefficiency
In `src/services/admin-impersonation.service.ts`, the `getImpersonatableLawyers` method fetched up to 100 lawyers and then, for each lawyer with a CPF, executed a separate `prisma.judicialProcess.count` query.

This resulted in:
- 1 query to fetch the lawyers.
- Up to 100 queries to count processes for each lawyer.

Total: **101 queries** for 100 lawyers.

## Benchmarking Limitations
Establishing an automated performance baseline in the current environment was impractical due to:
1. **Missing Dependencies**: The `node_modules` directory is absent.
2. **Network Restrictions**: `npm install` and `npx` commands fail because registry.npmjs.org is unreachable.
3. **Runtime Absence**: Without `node_modules`, standard TypeScript execution tools like `tsx` or `ts-node` are not functional for running benchmark scripts that depend on the project's infrastructure.

## Rationale for Improvement
The optimization replaces the N+1 pattern with a single batch query:
1. Fetch lawyers.
2. Collect all unique CPFs.
3. Execute **one** query to find all process associations for those CPFs.
4. Count and map the results in-memory.

New Total: **2 queries** (regardless of the number of lawyers).

### Expected Impact
- **Database Load**: Significant reduction in the number of round-trips to the database.
- **Latency**: Substantial improvement in response time, especially as the number of lawyers grows.
- **Resource Utilization**: Reduced connection pool usage and database CPU cycles spent on query parsing and execution for multiple small identical-structured queries.
