/**
 * @fileoverview Hook de permissões RBAC do SuperGrid.
 * Resolve permissões da config contra o contexto de autenticação.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { SuperGridConfig } from '../SuperGrid.types';

interface GridPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export function useGridPermissions<TEntity>(
  config: SuperGridConfig<TEntity>
): GridPermissions {
  const { userProfileWithPermissions } = useAuth();

  return useMemo(() => {
    const permissions = config.permissions;
    if (!permissions) {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
    }

    const userPermissions = userProfileWithPermissions?.permissions || [];
    const hasManageAll = userPermissions.includes('manage_all');

    function check(perm: boolean | string[] | undefined): boolean {
      if (perm === undefined || perm === true) return true;
      if (perm === false) return false;
      if (hasManageAll) return true;
      if (Array.isArray(perm)) {
        return perm.some(p => userPermissions.includes(p));
      }
      return false;
    }

    return {
      canView: check(permissions.view),
      canCreate: check(permissions.create),
      canEdit: check(permissions.edit),
      canDelete: check(permissions.delete),
      canExport: check(permissions.export),
    };
  }, [config.permissions, userProfileWithPermissions]);
}
