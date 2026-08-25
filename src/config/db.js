/**
 * MySQL Database Connection
 * Menggunakan mysql2/promise untuk async/await
 * Dirancang aman untuk Vercel Serverless (tidak crash saat env vars kosong)
 */

const mysql = require('mysql2/promise');

// Konfigurasi dari environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
  charset: 'utf8mb4'
};

// Validasi config wajib
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVars = requiredVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing DB env vars: ${missingVars.join(', ')}`);
  console.warn('   Database queries will fail until these are set.');
}

// Buat connection pool (pool dibuat saat module pertama kali di-load)
// Pool tidak akan crash saat dibuat — error muncul saat query dieksekusi
const pool = mysql.createPool(dbConfig);

// Fungsi test koneksi
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully!');
    console.log(`   📦 Database: ${dbConfig.database}`);
    console.log(`   🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

// Fungsi jalankan query
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Fungsi ambil satu baris
async function queryOne(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

// Fungsi insert dan dapatkan insertId
async function insert(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// Fungsi update/delete
async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows
  };
}

// Fungsi transaksi
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  query,
  queryOne,
  insert,
  execute,
  transaction
};
