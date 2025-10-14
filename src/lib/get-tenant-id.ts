export async function getTenantId(tenantId?: string): Promise<string> {
  if (tenantId) {
    return tenantId;
  }
  // For seed script or other contexts where tenantId is not explicitly passed,
  // default to the landlord tenant.
  return '1';
}
