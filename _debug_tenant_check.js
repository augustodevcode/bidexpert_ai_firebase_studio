const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_Chk79uAnKoIg@ep-round-breeze-ac1yypyv-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

(async () => {
  // Check User table columns
  const userCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position`;
  console.log('USER COLUMNS:', JSON.stringify(userCols.map(c => c.column_name)));

  // Check admin user
  const adminUser = await sql`SELECT CAST(id AS TEXT) as id, email, "fullName" FROM "User" WHERE email = 'admin@bidexpert.com.br'`;
  console.log('ADMIN USER:', JSON.stringify(adminUser));

  // Check UsersOnRoles columns
  const uorCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'UsersOnRoles' ORDER BY ordinal_position`;
  console.log('USERSONROLES COLUMNS:', JSON.stringify(uorCols.map(c => c.column_name)));

  // Check Role columns
  const roleCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'Role' ORDER BY ordinal_position`;
  console.log('ROLE COLUMNS:', JSON.stringify(roleCols.map(c => c.column_name)));

  // Check Session table columns
  const sessionCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'Session' ORDER BY ordinal_position`;
  console.log('SESSION COLUMNS:', JSON.stringify(sessionCols.map(c => c.column_name)));

  // Check UsersOnRoles for admin (id=1)
  const adminRoles = await sql`SELECT * FROM "UsersOnRoles" WHERE "userId" = 1`;
  console.log('ADMIN ROLES RAW:', JSON.stringify(adminRoles, (k, v) => typeof v === 'bigint' ? v.toString() : v));

  // Check all roles
  const allRoles = await sql`SELECT CAST(id AS TEXT) as id, * FROM "Role" LIMIT 10`;
  console.log('ALL ROLES:', JSON.stringify(allRoles, (k, v) => typeof v === 'bigint' ? v.toString() : v));

  // Check UserTenant or similar table
  const allTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%enant%' ORDER BY table_name`;
  console.log('TENANT-RELATED TABLES:', JSON.stringify(allTables.map(t => t.table_name)));

  // Check UsersOnTenants
  const uotCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'UsersOnTenants' ORDER BY ordinal_position`;
  console.log('USERSONTENANTS COLUMNS:', JSON.stringify(uotCols.map(c => c.column_name)));

  const uotData = await sql`SELECT CAST("userId" AS TEXT) as uid, CAST("tenantId" AS TEXT) as tid, * FROM "UsersOnTenants" LIMIT 20`;
  console.log('USERSONTENANTS DATA:', JSON.stringify(uotData, (k, v) => typeof v === 'bigint' ? v.toString() : v));

  // Check if admin (id=1) is in UsersOnTenants
  const adminTenants = await sql`SELECT * FROM "UsersOnTenants" WHERE "userId" = 1`;
  console.log('ADMIN USERSONTENANTS:', JSON.stringify(adminTenants, (k, v) => typeof v === 'bigint' ? v.toString() : v));

  // Check all NextAuth-related tables
  const authTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%ession%' OR table_name LIKE '%ccount%' OR table_name LIKE '%oken%' OR table_name LIKE '%auth%') ORDER BY table_name`;
  console.log('AUTH TABLES:', JSON.stringify(authTables.map(t => t.table_name)));

  // List ALL tables 
  const allTables2 = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('ALL TABLES:', JSON.stringify(allTables2.map(t => t.table_name)));

  // Check all users
  const allUsers = await sql`SELECT CAST(id AS TEXT) as id, email, "fullName" FROM "User" ORDER BY id LIMIT 20`;
  console.log('ALL USERS:', JSON.stringify(allUsers));
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
