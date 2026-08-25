/**
 * Migration: Tambah / rename kolom perolehan suara ke `votes` di tabel `candidates`
 * Jalankan: node scripts/add-votes.js
 *
 * Menangani 3 skenario:
 * 1. Kolom belum ada → ADD COLUMN votes
 * 2. Kolom `vote_count` ada → RENAME ke `votes`
 * 3. Kolom `votes` sudah ada → skip
 */

require('dotenv').config({ override: true });

const pool = require('../src/config/db');

async function addVotes() {
  console.log('🔧 Migration: Menambah kolom `votes` ke tabel candidates\n');

  try {
    // 1. Cek kolom yang ada
    const [columns] = await pool.execute('SHOW COLUMNS FROM candidates');
    const colNames = columns.map(c => c.Field);

    if (colNames.includes('votes')) {
      console.log('✅ Kolom `votes` sudah ada, skip migration.\n');
      await pool.end();
      return;
    }

    if (colNames.includes('vote_count')) {
      // 2a. Rename vote_count → votes
      console.log('📦 Rename kolom `vote_count` → `votes` ...');
      await pool.execute('ALTER TABLE candidates CHANGE COLUMN vote_count votes INT DEFAULT 0');
      console.log('   ✓ Kolom berhasil di-rename\n');
    } else {
      // 2b. Tambah kolom votes baru
      console.log('📦 ALTER TABLE candidates ADD COLUMN votes INT DEFAULT 0 ...');
      await pool.execute('ALTER TABLE candidates ADD COLUMN votes INT DEFAULT 0');
      console.log('   ✓ Kolom `votes` berhasil ditambahkan\n');
    }

    // 3. Sync votes dari tabel voting (jika ada)
    console.log('🗳️  Sync votes dari tabel voting ...');
    try {
      const [result] = await pool.execute(`
        UPDATE candidates c
        SET c.votes = (
          SELECT COUNT(*)
          FROM voting v
          WHERE v.candidate_id = c.id
        )
      `);
      console.log(`   ✓ ${result.affectedRows} kandidat diupdate\n`);
    } catch (syncError) {
      console.warn('   ⚠️ Sync voting skipped:', syncError.message, '\n');
    }

    // 4. Verifikasi
    console.log('🔍 Verifikasi schema:');
    const [final] = await pool.execute('DESCRIBE candidates');
    console.table(final.map(r => ({ Field: r.Field, Type: r.Type, Default: r.Default })));

    await pool.end();
    console.log('✅ Migration selesai! Kolom `votes` sudah tersedia di tabel candidates.');

  } catch (error) {
    console.error('\n❌ Migration gagal:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addVotes();
