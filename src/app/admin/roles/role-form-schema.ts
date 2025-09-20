// src/app/admin/roles/role-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário de
 * criação e edição de Perfis de Usuário (Roles). Também exporta uma lista
 * `predefinedPermissions` que serve como a fonte da verdade para todas as
 * permissões disponíveis no sistema, facilitando a consistência e manutenção.
 */
import * as z from 'zod';

export const predefinedPermissions = [
  // Categories
  { id: 'categories:create', label: 'Categorias: Criar', group: 'Categorias' },
  { id: 'categories:read', label: 'Categorias: Ver', group: 'Categorias' },
  { id: 'categories:update', label: 'Categorias: Editar', group: 'Categorias' },
  { id: 'categories:delete', label: 'Categorias: Excluir', group: 'Categorias' },
  // States
  { id: 'states:create', label: 'Estados: Criar', group: 'Localidades' },
  { id: 'states:read', label: 'Estados: Ver', group: 'Localidades' },
  { id: 'states:update', label: 'Estados: Editar', group: 'Localidades' },
  { id: 'states:delete', label: 'Estados: Excluir', group: 'Localidades' },
  // Cities
  { id: 'cities:create', label: 'Cidades: Criar', group: 'Localidades' },
  { id: 'cities:read', label: 'Cidades: Ver', group: 'Localidades' },
  { id: 'cities:update', label: 'Cidades: Editar', group: 'Localidades' },
  { id: 'cities:delete', label: 'Cidades: Excluir', group: 'Localidades' },
  // Auctioneers
  { id: 'auctioneers:create', label: 'Leiloeiros: Criar', group: 'Leiloeiros' },
  { id: 'auctioneers:read', label: 'Leiloeiros: Ver', group: 'Leiloeiros' },
  { id: 'auctioneers:update', label: 'Leiloeiros: Editar', group: 'Leiloeiros' },
  { id: 'auctioneers:delete', label: 'Leiloeiros: Excluir', group: 'Leiloeiros' },
  // Sellers
  { id: 'sellers:create', label: 'Comitentes: Criar', group: 'Comitentes' },
  { id: 'sellers:read', label: 'Comitentes: Ver', group: 'Comitentes' },
  { id: 'sellers:update', label: 'Comitentes: Editar', group: 'Comitentes' },
  { id: 'sellers:delete', label: 'Comitentes: Excluir', group: 'Comitentes' },
  // Auctions
  { id: 'auctions:create', label: 'Leilões: Criar', group: 'Leilões' },
  { id: 'auctions:read', label: 'Leilões: Ver Todos', group: 'Leilões' },
  { id: 'auctions:update', label: 'Leilões: Editar Todos', group: 'Leilões' },
  { id: 'auctions:delete', label: 'Leilões: Excluir Todos', group: 'Leilões' },
  { id: 'auctions:publish', label: 'Leilões: Publicar', group: 'Leilões' },
  { id: 'auctions:manage_own', label: 'Leilões: Gerenciar Próprios (Comitente)', group: 'Leilões' },
  { id: 'auctions:manage_assigned', label: 'Leilões: Gerenciar Atribuídos (Leiloeiro)', group: 'Leilões' },
  // Lots
  { id: 'lots:create', label: 'Lotes: Criar', group: 'Lotes' },
  { id: 'lots:read', label: 'Lotes: Ver Todos', group: 'Lotes' },
  { id: 'lots:update', label: 'Lotes: Editar Todos', group: 'Lotes' },
  { id: 'lots:delete', label: 'Lotes: Excluir Todos', group: 'Lotes' },
  { id: 'lots:manage_own', label: 'Lotes: Gerenciar Próprios (Comitente)', group: 'Lotes' },
  { id: 'lots:finalize', label: 'Lotes: Finalizar e Declarar Vencedor', group: 'Lotes' },
  // Media Library
  { id: 'media:upload', label: 'Mídia: Fazer Upload', group: 'Biblioteca de Mídia'},
  { id: 'media:read', label: 'Mídia: Ver Biblioteca', group: 'Biblioteca de Mídia'},
  { id: 'media:update', label: 'Mídia: Editar Metadados', group: 'Biblioteca de Mídia'},
  { id: 'media:delete', label: 'Mídia: Excluir', group: 'Biblioteca de Mídia'},
  // Users
  { id: 'users:create', label: 'Usuários: Criar', group: 'Usuários e Perfis' },
  { id: 'users:read', label: 'Usuários: Ver', group: 'Usuários e Perfis' },
  { id: 'users:update', label: 'Usuários: Editar', group: 'Usuários e Perfis' },
  { id: 'users:delete', label: 'Usuários: Excluir', group: 'Usuários e Perfis' },
  { id: 'users:assign_roles', label: 'Usuários: Atribuir Perfis', group: 'Usuários e Perfis' },
  { id: 'users:manage_habilitation', label: 'Usuários: Gerenciar Habilitação', group: 'Usuários e Perfis' },
  // Roles
  { id: 'roles:create', label: 'Perfis: Criar', group: 'Usuários e Perfis' },
  { id: 'roles:read', label: 'Perfis: Ver', group: 'Usuários e Perfis' },
  { id: 'roles:update', label: 'Perfis: Editar', group: 'Usuários e Perfis' },
  { id: 'roles:delete', label: 'Perfis: Excluir', group: 'Usuários e Perfis' },
  // Settings
  { id: 'settings:read', label: 'Configurações: Ver', group: 'Configurações' },
  { id: 'settings:update', label: 'Configurações: Editar', group: 'Configurações' },
  // Document Generation
  { id: 'documents:generate_report', label: 'Documentos: Gerar Laudo de Avaliação', group: 'Documentos Pós-Leilão' },
  { id: 'documents:generate_certificate', label: 'Documentos: Gerar Certificado de Leilão', group: 'Documentos Pós-Leilão' },
  { id: 'documents:generate_term', label: 'Documentos: Gerar Auto de Arrematação', group: 'Documentos Pós-Leilão' },
  // User-facing Permissions
  { id: 'view_auctions', label: 'Público: Ver Leilões', group: 'Usuário Final' },
  { id: 'view_lots', label: 'Público: Ver Lotes', group: 'Usuário Final' },
  { id: 'place_bids', label: 'Público: Fazer Lances', group: 'Usuário Final' },
  // Direct Sales
  { id: 'direct_sales:manage_own', label: 'Venda Direta: Gerenciar Próprias', group: 'Venda Direta' },
  { id: 'direct_sales:place_proposal', label: 'Venda Direta: Fazer Propostas', group: 'Venda Direta' },
  { id: 'direct_sales:buy_now', label: 'Venda Direta: Comprar Agora', group: 'Venda Direta' },
  // Winner-specific Permissions
  { id: 'view_wins', label: 'Arrematante: Ver Arremates', group: 'Arrematante' },
  { id: 'manage_payments', label: 'Arrematante: Gerenciar Pagamentos', group: 'Arrematante' },
  { id: 'schedule_retrieval', label: 'Arrematante: Agendar Retirada', group: 'Arrematante' },
  // Role-specific groups
  { id: 'consignor_dashboard:view', label: 'Comitente: Ver Painel', group: 'Comitente'},
  { id: 'view_reports', label: 'Comitente: Ver Relatórios', group: 'Comitente'},
  { id: 'conduct_auctions', label: 'Leiloeiro: Conduzir Leilões (Auditório)', group: 'Leiloeiro'},
  // Generic Admin / All Access
  { id: 'manage_all', label: 'Acesso Total (Administrador)', group: 'Geral'},
  // Tenant-specific Admin
  { id: 'manage_tenant_users', label: 'Admin Tenant: Gerenciar Usuários do Tenant', group: 'Tenant Admin' },
  { id: 'manage_tenant_auctions', label: 'Admin Tenant: Gerenciar Leilões do Tenant', group: 'Tenant Admin' },
] as const;


export const roleFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do perfil deve ter pelo menos 3 caracteres.",
  }).max(100, {
    message: "O nome do perfil não pode exceder 100 caracteres.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode exceder 500 caracteres.",
  }).optional(),
  permissions: z.array(z.string()).optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
