/**
 * Migration: Tambah kolom `vote_count` ke tabel `candidates`
 * Jalankan: node scripts/add-vote-count.js
 *
 * Error sebelumnya: "Unknown column 'vote_count' in 'field list'"
 * Penyebab: MySQL schema tidak memiliki kolom vote_count,
 *            tapi backend mengaksesnya di UPDATE/SELECT queries.
 */

require('dotenv').config({ override: true });

const pool = require('../src/config/db');

async function addVoteCount() {
  console.log('🔧 Migration: Menambah kolom vote_count ke tabel candidates\n');

  try {
    // 1. Cek apakah kolom sudah ada
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM candidates LIKE 'vote_count'"
    );

    if (columns.length > 0) {
      console.log('✅ Kolom vote_count sudah ada, skip migration.\n');
      await pool.end();
      return;
    }

    // 2. Tambah kolom vote_count
    console.log('📦 ALTER TABLE candidates ADD COLUMN vote_count INT DEFAULT 0 ...');
    await pool.execute(
      'ALTER TABLE candidates ADD COLUMN vote_count INT DEFAULT 0'
    );
    console.log('   ✓ Kolom vote_count berhasil ditambahkan\n');

    // 3. Update vote_count berdasarkan data di tabel voting (jika ada)
    console.log('🗳️  Sync vote_count dari tabel voting ...');
    const [result] = await pool.execute(`
      UPDATE candidates c
      SET c.vote_count = (
        SELECT COUNT(*)
        FROM voting v
        WHERE v.candidate_id = c.id
      )
    `);
    console.log(`   ✓ ${result.affectedRows} kandidat diupdate\n`);

    // 4. Verifikasi
    console.log('🔍 Verifikasi schema:');
    const [final] = await pool.execute('DESCRIBE candidates');
    console.table(final.map(r => ({ Field: r.Field, Type: r.Type, Default: r.Default })));

    await pool.end();
    console.log('✅ Migration selesai! vote_count sudah tersedia di tabel candidates.');

  } catch (error) {
    console.error('\n❌ Migration gagal:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addVoteCount();
