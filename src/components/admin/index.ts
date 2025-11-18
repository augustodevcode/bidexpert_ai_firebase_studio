// src/components/admin/index.ts
/**
 * Admin Components Index
 * Todos os componentes de admin com classNames contextualizados para testes Playwright
 */

export { AdminSettingsPanel } from './admin-settings-panel';
export type { AdminSettingsPanelProps } from './admin-settings-panel';

export { AuditLogsViewer } from './audit-logs-viewer';
export type { AuditLogsViewerProps, AuditLog } from './audit-logs-viewer';

export { SoftCloseManager } from './softclose-manager';
export type { SoftCloseManagerProps } from './softclose-manager';

export { IntegrationsTester } from './integrations-tester';
export type { IntegrationsTesterProps } from './integrations-tester';
