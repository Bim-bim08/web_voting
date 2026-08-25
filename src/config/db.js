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

/**
 * Auto-migration: pastikan kolom `votes` ada di tabel `candidates`.
 * Dieksekusi sekali saat pool pertama kali digunakan / server startup.
 * Tidak mengganggu jika kolom sudah ada.
 */
async function ensureVotesColumn() {
  let conn;
  try {
    conn = await pool.getConnection();

    // Cek apakah kolom votes sudah ada
    const [cols] = await conn.execute(
      "SHOW COLUMNS FROM candidates LIKE 'votes'"
    );

    if (cols.length === 0) {
      // Cek apakah ada kolom lama 'vote_count' → rename
      const [old] = await conn.execute(
        "SHOW COLUMNS FROM candidates LIKE 'vote_count'"
      );

      if (old.length > 0) {
        await conn.execute(
          'ALTER TABLE candidates CHANGE COLUMN vote_count votes INT DEFAULT 0'
        );
        console.log('✅ Migration: kolom `vote_count` → `votes`');
      } else {
        await conn.execute(
          'ALTER TABLE candidates ADD COLUMN votes INT DEFAULT 0'
        );
        console.log('✅ Migration: kolom `votes` ditambahkan ke tabel candidates');
      }
    } else {
      console.log('✅ Kolom `votes` sudah ada di tabel candidates');
    }
  } catch (error) {
    // Jangan crash server — log warning saja
    console.warn('⚠️  Auto-migration skip:', error.message);
  } finally {
    if (conn) conn.release();
  }
}

// Jalankan auto-migration saat module pertama kali di-load
ensureVotesColumn();

module.exports = pool;
