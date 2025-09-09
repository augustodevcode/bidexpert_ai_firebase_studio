export const hasPermission = (permission: string, userPermissions: string[]): boolean => {
  return userPermissions.includes(permission);
};

export const canViewConsignorDashboard = (userPermissions: string[]): boolean => {
  return hasPermission('consignor:dashboard:view', userPermissions);
};
