/**
 * @fileoverview Rodape padrao do dashboard com informacoes de ambiente para debug.
 */
'use client';

export default function DevInfoIndicator() {
  return (
    // Regular footer in the page flow (not fixed). Admin layout will add padding-bottom when Query Monitor is present
    <footer className="mt-4 w-full" data-ai-id="dashboard-footer" data-testid="dev-info-indicator">
      <div
        className="mt-4 p-4 bg-muted/50 rounded-lg border w-full max-w-4xl mx-auto"
        data-ai-id="dev-info-indicator-inner"
      >
        <p
          className="font-semibold text-center text-foreground mb-3 text-sm"
          data-ai-id="dev-info-title"
        >
          Dev Info
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2"
          data-ai-id="dev-info-grid"
        >
          <div className="text-center sm:text-left" data-ai-id="dev-info-tenant">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-tenant-label">
              Tenant ID
            </span>
            <p
              className="font-semibold text-primary truncate"
              title="1"
              data-ai-id="dev-info-tenant-value"
            >
              1
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-user">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-user-label">
              User
            </span>
            <p
              className="font-semibold text-primary truncate"
              title="admin@bidexpert.ai"
              data-ai-id="dev-info-user-value"
            >
              admin@bidexpert.ai
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-db">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-db-label">
              DB System
            </span>
            <p
              className="font-semibold text-primary truncate"
              title="MYSQL"
              data-ai-id="dev-info-db-value"
            >
              MYSQL
            </p>
          </div>
          <div className="text-center sm:text-left" data-ai-id="dev-info-project">
            <span className="text-xs text-muted-foreground" data-ai-id="dev-info-project-label">
              Project
            </span>
            <p
              className="font-semibold text-primary truncate"
              title="bidexpert"
              data-ai-id="dev-info-project-value"
            >
              bidexpert
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
