-- =============================================================================
-- MIGRATION: Feature Flags persistência no banco de dados
-- Data: 2026-03-04
-- Descrição: Adiciona campos de feature flags à tabela RealtimeSettings
--            para substituir persistência em memória/localStorage por banco de dados.
-- =============================================================================

-- Adicionar campos de feature flags adicionais ao RealtimeSettings (MySQL)
ALTER TABLE `RealtimeSettings`
  ADD COLUMN IF NOT EXISTS `fipeIntegrationEnabled`     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `cartorioIntegrationEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `tribunalIntegrationEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `pwaEnabled`                 BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS `offlineFirstEnabled`        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `maintenanceMode`            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `debugLogsEnabled`           BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
