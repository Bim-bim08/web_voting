const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'b7nmlbdm7ebzjcvfydii-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'u9brqzgmswsutj8q',
  password: process.env.DB_PASSWORD || 'NoeD7zRt5Q3kv4MZLj8g',
  database: process.env.DB_NAME || 'b7nmlbdm7ebzjcvfydii',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
