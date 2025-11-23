const mysql = require('mysql2/promise');

async function checkCities() {
  const connection = await mysql.createConnection({
    host: 'bidxprtmsqfire.mysql.dbaas.com.br',
    user: 'bidxprtmsqfire',
    password: 'xL6cqPhigY5cx!',
    database: 'bidxprtmsqfire'
  });

  try {
    const [cities] = await connection.execute(
      `SELECT c.id, c.name as cityName, s.name as stateName, s.uf 
       FROM City c 
       JOIN State s ON c.stateId = s.id`
    );
    
    console.log('Cities in DB:');
    console.table(cities);
    
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkCities();