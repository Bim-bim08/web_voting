/**
 * Fix Candidates Schema — MySQL Clever Cloud
 * DROP → CREATE → INSERT untuk tabel `candidates`
 * Jalankan: npm run fix:db
 */

require('dotenv').config({ override: true });

const pool = require('../src/config/db');

const CANDIDATES_DATA = [
  {
    candidate_number: 1,
    chairman_name: 'Ahmad Fauzan',
    vice_chairman_name: 'Siti Nurhaliza',
    vision: 'Mewujudkan OSIS yang inklusif, inovatif, dan berprestasi.',
    mission:
      '1. Festival Bakat Siswa\n2. Perpustakaan Digital\n3. Program Kebersihan Sekolah',
  },
  {
    candidate_number: 2,
    chairman_name: 'Dimas Arya Saputra',
    vice_chairman_name: 'Rizky Pratama',
    vision: 'Membangun semangat gotong royong dan kreativitas siswa.',
    mission:
      '1. UKM Fair (Pameran Ekstrakurikuler)\n2. Study Group Online\n3. Program Mentoring Siswa',
  },
];

async function fixSchema() {
  console.log('🔧 Fix Candidates Schema — MySQL Clever Cloud\n');

  // 1. DROP tabel candidates jika ada
  console.log('🗑️  DROP TABLE IF EXISTS candidates ...');
  await pool.execute('DROP TABLE IF EXISTS candidates');
  console.log('   ✓ Tabel candidates dihapus\n');

  // 2. CREATE ulang tabel candidates dengan kolom chairman_name / vice_chairman_name
  console.log('📋 Membuat ulang tabel candidates ...');
  await pool.execute(`
    CREATE TABLE candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_number INT NOT NULL,
      chairman_name VARCHAR(255) NOT NULL,
      vice_chairman_name VARCHAR(255) NOT NULL,
      vision TEXT,
      mission TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('   ✓ Tabel candidates berhasil dibuat\n');

  // 3. INSERT data awal paslon
  console.log('🗳️  Menyisipkan data paslon ...');
  for (const c of CANDIDATES_DATA) {
    await pool.execute(
      `INSERT INTO candidates (candidate_number, chairman_name, vice_chairman_name, vision, mission)
       VALUES (?, ?, ?, ?, ?)`,
      [c.candidate_number, c.chairman_name, c.vice_chairman_name, c.vision, c.mission]
    );
    console.log(`   ✓ Paslon ${c.candidate_number}: ${c.chairman_name} & ${c.vice_chairman_name}`);
  }

  // Tutup koneksi
  await pool.end();

  console.log('\n✅ Fix schema selesai! Tabel candidates siap digunakan.');
}

fixSchema().catch((error) => {
  console.error('\n❌ Gagal fix schema:', error.message);
  process.exit(1);
});
