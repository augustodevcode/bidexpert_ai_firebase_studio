const mysql = require('mysql2/promise');

async function checkVehicleData() {
  const connection = await mysql.createConnection({
    host: 'bidxprtmsqfire.mysql.dbaas.com.br',
    user: 'bidxprtmsqfire',
    password: 'xL6cqPhigY5cx!',
    database: 'bidxprtmsqfire'
  });

  try {
    const [makes] = await connection.execute('SELECT * FROM VehicleMake LIMIT 5');
    console.log('VehicleMakes:', makes);
    
    const [models] = await connection.execute('SELECT * FROM VehicleModel LIMIT 5');
    console.log('VehicleModels:', models);
  } catch (error) {
    console.error('Error checking vehicle data:', error);
  } finally {
    await connection.end();
  }
}

checkVehicleData();
