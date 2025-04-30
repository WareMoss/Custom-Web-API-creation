// Export database connection information.
// Use the environment settings or given defaults.
// need to do sudo mysql -u root -p and password is codio
require('dotenv').config();
const mysql = require('promise-mysql');

const poolPromise = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  connection_limit: 100
});
module.exports = poolPromise;
