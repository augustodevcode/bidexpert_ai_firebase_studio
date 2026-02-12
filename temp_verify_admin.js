const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // Check user
    const u = await p.user.findFirst({
      where: { email: 'admin@bidexpert.com.br' },
      include: {
        UsersOnTenants: true,
        UsersOnRoles: { include: { Role: true } }
      }
    });

    if (!u) {
      console.log('USER NOT FOUND');
      return;
    }

    console.log('User:', JSON.stringify({
      id: Number(u.id),
      email: u.email,
      name: u.name
    }, null, 2));

    console.log('Tenants:', JSON.stringify(
      u.UsersOnTenants.map(t => ({ tenantId: Number(t.tenantId) })), null, 2
    ));

    console.log('Roles:', JSON.stringify(
      u.UsersOnRoles.map(r => ({ roleId: Number(r.roleId), roleName: r.Role?.name })), null, 2
    ));

    // Check MediaItem count
    const mc = await p.mediaItem.count();
    console.log('MediaItem count:', Number(mc));

    // Check if there's a MediaItem table at all
    const sample = await p.mediaItem.findFirst();
    console.log('Sample MediaItem:', sample ? JSON.stringify({ id: Number(sample.id), fileName: sample.fileName }, null, 2) : 'NONE');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
