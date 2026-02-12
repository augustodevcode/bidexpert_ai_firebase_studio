const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // Check tenant
    const t = await p.tenant.findFirst({ where: { subdomain: 'demo' } });
    console.log('Tenant:', JSON.stringify({
      id: Number(t?.id), name: t?.name, subdomain: t?.subdomain, status: t?.status
    }, null, 2));

    // Check tenant status
    if (t && t.status !== 'ACTIVE') {
      console.log('>>> Tenant status is:', t.status, '- needs fix');
    } else {
      console.log('>>> Tenant status OK: ACTIVE');
    }

    // Check admin user
    const u = await p.user.findFirst({ where: { email: 'admin@bidexpert.com.br' } });
    console.log('User:', JSON.stringify({
      id: Number(u?.id), email: u?.email, name: u?.name
    }, null, 2));

    if (u) {
      const roles = await p.userRole.findMany({ where: { userId: u.id } });
      console.log('Roles:', JSON.stringify(roles.map(x => ({
        role: x.role, tenantId: Number(x.tenantId)
      })), null, 2));
    } else {
      console.log('>>> admin@bidexpert.com.br NOT FOUND');
      // List all users
      const users = await p.user.findMany({ select: { email: true, name: true }, take: 10 });
      console.log('Available users:', JSON.stringify(users, null, 2));
    }

    // Check media items count
    const mediaCount = await p.mediaItem.count();
    console.log('MediaItem count:', mediaCount);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await p.$disconnect();
  }
})();
