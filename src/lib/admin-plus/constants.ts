/**
 * @fileoverview Constantes e registry de entidades do Admin Plus.
 * Centraliza configurações de paginação, rotas e metadados de todas as 76 entidades.
 */

import type { EntityConfig, EntityGroup } from './types';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const MAX_CLIENT_ROWS = 500;
export const SEARCH_DEBOUNCE_MS = 300;

export const ADMIN_PLUS_BASE_PATH = '/admin-plus';

export const ENTITY_GROUP_LABELS: Record<EntityGroup, string> = {
  auctions_and_lots: 'Leilões & Lotes',
  judicial: 'Judicial',
  participants_and_registries: 'Participantes & Cadastros',
  bids_and_financial: 'Lances & Financeiro',
  post_sale: 'Pós-Venda',
  communication_and_support: 'Comunicação & Suporte',
  reports_and_audit: 'Relatórios & Auditoria',
  auxiliary_tables: 'Tabelas Auxiliares',
  configurations: 'Configurações Globais',
};

export const ENTITY_GROUP_ORDER: EntityGroup[] = [
  'auctions_and_lots',
  'judicial',
  'participants_and_registries',
  'bids_and_financial',
  'post_sale',
  'communication_and_support',
  'reports_and_audit',
  'auxiliary_tables',
  'configurations',
];

/**
 * Registry de todas as entidades do sistema, em ordem de dependência (tier).
 * Cada entidade define slug, labels, ícone, grupo, se é multi-tenant e modo de paginação.
 */
export const ENTITY_REGISTRY: EntityConfig[] = [
  // --- Leilões & Lotes ---
  { slug: 'auctions', label: 'Leilão', labelPlural: 'Leilões', icon: 'Hammer', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'lots', label: 'Lote', labelPlural: 'Lotes', icon: 'Layers', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'lots:read', create: 'lots:create', update: 'lots:update', delete: 'lots:delete' } },
  { slug: 'assets', label: 'Ativo/Bem', labelPlural: 'Ativos/Bens', icon: 'Package', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'assets:read', create: 'assets:create', update: 'assets:update', delete: 'assets:delete' } },
  { slug: 'auction-stages', label: 'Praça', labelPlural: 'Praças', icon: 'Flag', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'assets-on-lots', label: 'Ativo × Lote', labelPlural: 'Ativos × Lotes', icon: 'Link2', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'assets:read', create: 'assets:create', update: 'assets:update', delete: 'assets:delete' } },
  { slug: 'lot-documents', label: 'Doc. do Lote', labelPlural: 'Docs. dos Lotes', icon: 'FileSearch', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'lots:read', create: 'lots:create', update: 'lots:update', delete: 'lots:delete' } },
  { slug: 'lot-questions', label: 'Pergunta do Lote', labelPlural: 'Perguntas dos Lotes', icon: 'HelpCircle', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'lots:read', create: 'lots:create', update: 'lots:update', delete: 'lots:delete' } },
  { slug: 'lot-risks', label: 'Risco do Lote', labelPlural: 'Riscos dos Lotes', icon: 'AlertTriangle', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'lots:read', create: 'lots:create', update: 'lots:update', delete: 'lots:delete' } },
  { slug: 'lot-stage-prices', label: 'Preço por Praça', labelPlural: 'Preços por Praça', icon: 'DollarSign', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'lots:read', create: 'lots:create', update: 'lots:update', delete: 'lots:delete' } },
  { slug: 'auction-habilitations', label: 'Habilitação', labelPlural: 'Habilitações', icon: 'CheckCircle', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'lot-categories', label: 'Categoria', labelPlural: 'Categorias', icon: 'Tag', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'client', permissions: { read: 'categories:read', create: 'categories:create', update: 'categories:update', delete: 'categories:delete' } },
  { slug: 'subcategories', label: 'Subcategoria', labelPlural: 'Subcategorias', icon: 'Tags', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'client', permissions: { read: 'categories:read', create: 'categories:create', update: 'categories:update', delete: 'categories:delete' } },
  { slug: 'media-items', label: 'Mídia', labelPlural: 'Mídias', icon: 'Image', group: 'auctions_and_lots', hasTenantId: true, paginationMode: 'server', permissions: { read: 'assets:read', create: 'assets:create', update: 'assets:update', delete: 'assets:delete' } },
  { slug: 'document-templates', label: 'Template Documento', labelPlural: 'Templates de Documentos', icon: 'FileCode', group: 'auctions_and_lots', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Judicial ---
  { slug: 'judicial-districts', label: 'Comarca', labelPlural: 'Comarcas', icon: 'Scale', group: 'judicial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'judicial_processes:read', create: 'judicial_processes:create', update: 'judicial_processes:update', delete: 'judicial_processes:delete' } },
  { slug: 'judicial-branches', label: 'Vara', labelPlural: 'Varas', icon: 'BookOpen', group: 'judicial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'judicial_processes:read', create: 'judicial_processes:create', update: 'judicial_processes:update', delete: 'judicial_processes:delete' } },
  { slug: 'judicial-processes', label: 'Processo Judicial', labelPlural: 'Processos Judiciais', icon: 'FileText', group: 'judicial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'judicial_processes:read', create: 'judicial_processes:create', update: 'judicial_processes:update', delete: 'judicial_processes:delete' } },
  { slug: 'judicial-parties', label: 'Parte Processual', labelPlural: 'Partes Processuais', icon: 'Users', group: 'judicial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'judicial_processes:read', create: 'judicial_processes:create', update: 'judicial_processes:update', delete: 'judicial_processes:delete' } },

  // --- Participantes & Cadastros ---
  { slug: 'users', label: 'Usuário', labelPlural: 'Usuários', icon: 'Users', group: 'participants_and_registries', hasTenantId: false, paginationMode: 'server', permissions: { read: 'users:read', create: 'users:create', update: 'users:update', delete: 'users:delete' } },
  { slug: 'sellers', label: 'Comitente', labelPlural: 'Comitentes', icon: 'Store', group: 'participants_and_registries', hasTenantId: true, paginationMode: 'server', permissions: { read: 'sellers:read', create: 'sellers:create', update: 'sellers:update', delete: 'sellers:delete' } },
  { slug: 'auctioneers', label: 'Leiloeiro', labelPlural: 'Leiloeiros', icon: 'Mic', group: 'participants_and_registries', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctioneers:read', create: 'auctioneers:create', update: 'auctioneers:update', delete: 'auctioneers:delete' } },
  { slug: 'tenants', label: 'Tenant', labelPlural: 'Tenants', icon: 'Building2', group: 'participants_and_registries', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'roles', label: 'Perfil', labelPlural: 'Perfis', icon: 'Shield', group: 'participants_and_registries', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'user-on-tenants', label: 'Usuário no Tenant', labelPlural: 'Usuários nos Tenants', icon: 'UserCheck', group: 'participants_and_registries', hasTenantId: true, paginationMode: 'server', permissions: { read: 'users:read', create: 'users:create', update: 'users:update', delete: 'users:delete' } },
  { slug: 'bidder-profiles', label: 'Perfil Arrematante', labelPlural: 'Perfis Arrematantes', icon: 'UserCircle', group: 'participants_and_registries', hasTenantId: true, paginationMode: 'server', permissions: { read: 'users:read', create: 'users:create', update: 'users:update', delete: 'users:delete' } },
  { slug: 'users-on-roles', label: 'Usuário × Perfil', labelPlural: 'Usuários × Perfis', icon: 'ShieldCheck', group: 'participants_and_registries', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'password-reset-tokens', label: 'Token Reset Senha', labelPlural: 'Tokens Reset Senha', icon: 'KeyRound', group: 'participants_and_registries', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'user-documents', label: 'Documento Usuário', labelPlural: 'Documentos de Usuários', icon: 'FileText', group: 'participants_and_registries', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Lances & Financeiro ---
  { slug: 'bids', label: 'Lance', labelPlural: 'Lances', icon: 'TrendingUp', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'installment-payments', label: 'Parcela', labelPlural: 'Parcelas', icon: 'Receipt', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'direct-sale-offers', label: 'Proposta Venda Direta', labelPlural: 'Propostas Venda Direta', icon: 'Handshake', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'payment-methods', label: 'Método Pagamento', labelPlural: 'Métodos de Pagamento', icon: 'Wallet', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'user-lot-max-bids', label: 'Lance Máximo', labelPlural: 'Lances Máximos', icon: 'ArrowBigUp', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'tenant-invoices', label: 'Fatura Tenant', labelPlural: 'Faturas de Tenants', icon: 'FileSpreadsheet', group: 'bids_and_financial', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Pós-Venda ---
  { slug: 'user-wins', label: 'Arremate', labelPlural: 'Arremates', icon: 'Trophy', group: 'post_sale', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },
  { slug: 'won-lots', label: 'Lote Arrematado', labelPlural: 'Lotes Arrematados', icon: 'Award', group: 'post_sale', hasTenantId: true, paginationMode: 'server', permissions: { read: 'auctions:read', create: 'auctions:create', update: 'auctions:update', delete: 'auctions:delete' } },

  // --- Comunicação & Suporte ---
  { slug: 'notifications', label: 'Notificação', labelPlural: 'Notificações', icon: 'Bell', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'contact-messages', label: 'Mensagem', labelPlural: 'Mensagens', icon: 'Mail', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'email-logs', label: 'Log de E-mail', labelPlural: 'Logs de E-mail', icon: 'MailCheck', group: 'communication_and_support', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'bidder-notifications', label: 'Notif. Arrematante', labelPlural: 'Notif. Arrematantes', icon: 'BellDot', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'reviews', label: 'Avaliação', labelPlural: 'Avaliações', icon: 'Star', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'subscribers', label: 'Assinante', labelPlural: 'Assinantes', icon: 'UserPlus', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'itsm-tickets', label: 'Ticket ITSM', labelPlural: 'Tickets ITSM', icon: 'Ticket', group: 'communication_and_support', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Relatórios & Auditoria ---
  { slug: 'audit-logs', label: 'Log de Auditoria', labelPlural: 'Logs de Auditoria', icon: 'ScrollText', group: 'reports_and_audit', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'reports', label: 'Relatório', labelPlural: 'Relatórios', icon: 'BarChart3', group: 'reports_and_audit', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'participation-history', label: 'Histórico Participação', labelPlural: 'Históricos de Participação', icon: 'History', group: 'reports_and_audit', hasTenantId: true, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Tabelas Auxiliares ---
  { slug: 'states', label: 'Estado', labelPlural: 'Estados', icon: 'Map', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'courts', label: 'Tribunal', labelPlural: 'Tribunais', icon: 'Landmark', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'document-types', label: 'Tipo de Documento', labelPlural: 'Tipos de Documento', icon: 'FileType', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'data-sources', label: 'Fonte de Dados', labelPlural: 'Fontes de Dados', icon: 'Database', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'vehicle-makes', label: 'Montadora', labelPlural: 'Montadoras', icon: 'Car', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'cities', label: 'Cidade', labelPlural: 'Cidades', icon: 'MapPin', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'vehicle-models', label: 'Modelo de Veículo', labelPlural: 'Modelos de Veículo', icon: 'CarFront', group: 'auxiliary_tables', hasTenantId: false, paginationMode: 'server', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },

  // --- Configurações Globais ---
  { slug: 'platform-settings', label: 'Config. Plataforma', labelPlural: 'Config. Plataforma', icon: 'Settings', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'theme-settings', label: 'Tema', labelPlural: 'Temas', icon: 'Palette', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'bidding-settings', label: 'Config. Lances', labelPlural: 'Config. Lances', icon: 'Gavel', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'map-settings', label: 'Config. Mapa', labelPlural: 'Config. Mapa', icon: 'MapPinned', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'notification-settings', label: 'Config. Notificações', labelPlural: 'Config. Notificações', icon: 'BellRing', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'payment-gateway-settings', label: 'Config. Pagamento', labelPlural: 'Config. Pagamento', icon: 'CreditCard', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'realtime-settings', label: 'Config. Realtime', labelPlural: 'Config. Realtime', icon: 'Radio', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'mental-trigger-settings', label: 'Gatilhos Mentais', labelPlural: 'Gatilhos Mentais', icon: 'Brain', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'section-badge-visibility', label: 'Visib. Badges', labelPlural: 'Visib. Badges', icon: 'Eye', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'id-masks', label: 'Máscaras de ID', labelPlural: 'Máscaras de ID', icon: 'Hash', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'counter-states', label: 'Contadores', labelPlural: 'Contadores', icon: 'ListOrdered', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
  { slug: 'variable-increment-rules', label: 'Regra Incremento', labelPlural: 'Regras de Incremento', icon: 'TrendingUp', group: 'configurations', hasTenantId: true, paginationMode: 'client', permissions: { read: 'manage_all', create: 'manage_all', update: 'manage_all', delete: 'manage_all' } },
];

/**
 * Retorna a configuração de uma entidade pelo slug.
 */
export function getEntityConfig(slug: string): EntityConfig | undefined {
  return ENTITY_REGISTRY.find((e) => e.slug === slug);
}

/**
 * Retorna as entidades agrupadas por grupo, na ordem definida.
 */
export function getEntitiesByGroup(): Map<EntityGroup, EntityConfig[]> {
  const map = new Map<EntityGroup, EntityConfig[]>();
  for (const group of ENTITY_GROUP_ORDER) {
    const entities = ENTITY_REGISTRY.filter((e) => e.group === group);
    if (entities.length > 0) {
      map.set(group, entities);
    }
  }
  return map;
}
