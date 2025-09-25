// src/lib/permissions.ts
import type { UserProfileWithPermissions } from '@/types';

/**
 * Checks if a user has a specific permission.
 *
 * @param userProfileWithPermissions The user's profile object which includes their permissions array,
 *                                   or null if the user is not logged in or profile is not loaded.
 * @param requiredPermission The permission string to check for (e.g., "auctions:create").
 * @returns True if the user has the permission or the 'manage_all' permission, false otherwise.
 */
export function hasPermission(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermission: string
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }

  // Admins with 'manage_all' have all permissions
  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return userProfileWithPermissions.permissions.includes(requiredPermission);
}

/**
 * Checks if a user has ANY of the specified permissions.
 *
 * @param userProfileWithPermissions The user's profile object with permissions.
 * @param requiredPermissions An array of permission strings.
 * @returns True if the user has at least one of the specified permissions or 'manage_all', false otherwise.
 */
export function hasAnyPermission(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermissions: string[]
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }

  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return requiredPermissions.some(permission =>
    userProfileWithPermissions.permissions.includes(permission)
  );
}

/**
 * Checks if a user has ALL of the specified permissions.
 *
 * @param userProfileWithPermissions The user's profile object with permissions.
 * @param requiredPermissions An array of permission strings.
 * @returns True if the user has all of the specified permissions (or 'manage_all'), false otherwise.
 */
export function hasAllPermissions(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermissions: string[]
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }
  
  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return requiredPermissions.every(permission =>
    userProfileWithPermissions.permissions.includes(permission)
  );
}


export const predefinedPermissions = [
  // Categories
  { id: 'categories:create', label: 'Categorias: Criar', group: 'Categorias' },
  { id: 'categories:read', label: 'Categorias: Ver', group: 'Categorias' },
  { id: 'categories:update', label: 'Categorias: Editar', group: 'Categorias' },
  { id: 'categories:delete', label: 'Categorias: Excluir', group: 'Categorias' },
  // Localidades
  { id: 'locations:create', label: 'Localidades: Criar', group: 'Localidades' },
  { id: 'locations:read', label: 'Localidades: Ver', group: 'Localidades' },
  { id: 'locations:update', label: 'Localidades: Editar', group: 'Localidades' },
  { id: 'locations:delete', label: 'Localidades: Excluir', group: 'Localidades' },
  // Leiloeiros
  { id: 'auctioneers:create', label: 'Leiloeiros: Criar', group: 'Leiloeiros' },
  { id: 'auctioneers:read', label: 'Leiloeiros: Ver', group: 'Leiloeiros' },
  { id: 'auctioneers:update', label: 'Leiloeiros: Editar', group: 'Leiloeiros' },
  { id: 'auctioneers:delete', label: 'Leiloeiros: Excluir', group: 'Leiloeiros' },
  // Comitentes
  { id: 'sellers:create', label: 'Comitentes: Criar', group: 'Comitentes' },
  { id: 'sellers:read', label: 'Comitentes: Ver', group: 'Comitentes' },
  { id: 'sellers:update', label: 'Comitentes: Editar', group: 'Comitentes' },
  { id: 'sellers:delete', label: 'Comitentes: Excluir', group: 'Comitentes' },
  // Leilões
  { id: 'auctions:create', label: 'Leilões: Criar', group: 'Leilões' },
  { id: 'auctions:read', label: 'Leilões: Ver Todos', group: 'Leilões' },
  { id: 'auctions:update', label: 'Leilões: Editar Todos', group: 'Leilões' },
  { id: 'auctions:delete', label: 'Leilões: Excluir Todos', group: 'Leilões' },
  { id: 'auctions:publish', label: 'Leilões: Publicar', group: 'Leilões' },
  { id: 'auctions:manage_own', label: 'Leilões: Gerenciar Próprios (Comitente)', group: 'Leilões' },
  // Lotes
  { id: 'lots:create', label: 'Lotes: Criar', group: 'Lotes' },
  { id: 'lots:read', label: 'Lotes: Ver Todos', group: 'Lotes' },
  { id: 'lots:update', label: 'Lotes: Editar Todos', group: 'Lotes' },
  { id: 'lots:delete', label: 'Lotes: Excluir Todos', group: 'Lotes' },
  { id: 'lots:manage_own', label: 'Lotes: Gerenciar Próprios (Comitente)', group: 'Lotes' },
  { id: 'lots:finalize', label: 'Lotes: Finalizar e Declarar Vencedor', group: 'Lotes' },
  // Mídia
  { id: 'media:upload', label: 'Mídia: Fazer Upload', group: 'Biblioteca de Mídia'},
  { id: 'media:read', label: 'Mídia: Ver Biblioteca', group: 'Biblioteca de Mídia'},
  { id: 'media:update', label: 'Mídia: Editar Metadados', group: 'Biblioteca de Mídia'},
  { id: 'media:delete', label: 'Mídia: Excluir', group: 'Biblioteca de Mídia'},
  // Usuários e Perfis
  { id: 'users:create', label: 'Usuários: Criar', group: 'Usuários e Perfis' },
  { id: 'users:read', label: 'Usuários: Ver', group: 'Usuários e Perfis' },
  { id: 'users:update', label: 'Usuários: Editar', group: 'Usuários e Perfis' },
  { id: 'users:delete', label: 'Usuários: Excluir', group: 'Usuários e Perfis' },
  { id: 'users:assign_roles', label: 'Usuários: Atribuir Perfis', group: 'Usuários e Perfis' },
  { id: 'users:manage_habilitation', label: 'Usuários: Gerenciar Habilitação', group: 'Usuários e Perfis' },
  { id: 'roles:create', label: 'Perfis: Criar', group: 'Usuários e Perfis' },
  { id: 'roles:read', label: 'Perfis: Ver', group: 'Usuários e Perfis' },
  { id: 'roles:update', label: 'Perfis: Editar', group: 'Usuários e Perfis' },
  { id: 'roles:delete', label: 'Perfis: Excluir', group: 'Usuários e Perfis' },
  // Financeiro
  { id: 'financial:view', label: 'Financeiro: Ver Painel', group: 'Financeiro' },
  { id: 'financial:manage', label: 'Financeiro: Gerenciar Pagamentos', group: 'Financeiro' },
  // Geral
  { id: 'view_dashboard', label: 'Dashboard: Acessar Painel do Usuário', group: 'Geral' },
  { id: 'place_bids', label: 'Lances: Realizar Lances', group: 'Geral' },
  { id: 'manage_all', label: 'Acesso Total (Administrador)', group: 'Geral'},
];
