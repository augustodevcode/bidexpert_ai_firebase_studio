const mysql = require('mysql2/promise');

async function checkConnection(host, port, user, password) {
  console.log(`Checking MySQL connection to ${host}:${port} with user ${user}...`);
  try {
    const connection = await mysql.createConnection({ host, port, user, password });
    console.log(`✅ Connected successfully to ${host}:${port}`);
    
    const [rows] = await connection.execute('SHOW DATABASES;');
    console.log('📂 Databases:', rows.map(r => r.Database).join(', '));
    
    // Check tables in specific databases if they exist
    const targetDbs = ['bidexpert_dev', 'bidexpert_demo'];
    
    for (const dbName of targetDbs) {
      if (rows.some(r => r.Database === dbName)) {
        console.log(`\n🔍 Inspecting database: ${dbName}`);
        await connection.changeUser({ database: dbName });
        
        try {
            const [tables] = await connection.execute("SHOW TABLES LIKE 'User'");
            if (tables.length > 0) {
                const [users] = await connection.execute('SELECT COUNT(*) as count FROM User');
                console.log(`   - Users: ${users[0].count}`);
                
                const [auctions] = await connection.execute('SELECT COUNT(*) as count FROM Auction');
                console.log(`   - Auctions: ${auctions[0].count}`);
                
                const [lots] = await connection.execute('SELECT COUNT(*) as count FROM Lot');
                console.log(`   - Lots: ${lots[0].count}`);
            } else {
                console.log('   - User table not found (empty or not migrated?)');
            }

            // Check Tenant (subdomain)
            const [tenants] = await connection.execute("SHOW TABLES LIKE 'Tenant'");
            if (tenants.length > 0) {
                 const [tenantList] = await connection.execute('SELECT id, name, slug, subdomain FROM Tenant');
                 console.log('   - Tenants:', tenantList);
            }

        } catch (err) {
            console.log(`   ⚠️ Error querying tables in ${dbName}: ${err.message}`);
        }
      }
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function main() {
  // Check localhost:3306 (Docker default/Dev)
  await checkConnection('localhost', 3306, 'root', 'M!nh@S3nha2025');
  await checkConnection('localhost', 3306, 'root', 'password'); // backup password from docker-compose

  // Check localhost:3308 (Often used for Demo/Test in this project)
  await checkConnection('localhost', 3308, 'root', 'M!nh@S3nha2025');
}

main();
