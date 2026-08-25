/**
 * Seed Paslon (Kandidat Calon Ketua & Wakil) ke MySQL Clever Cloud
 * Jalankan: npm run seed:paslon
 */

require('dotenv').config();

const pool = require('../src/config/db');

const PASLON_DATA = [
  {
    paslon_number: 1,
    candidate_name: 'Ahmad Fauzan',
    vice_candidate_name: 'Siti Nurhaliza',
    vision: 'Mewujudkan OSIS yang inklusif, inovatif, dan berprestasi.',
    mission:
      '1. Festival Bakat Siswa\n2. Perpustakaan Digital\n3. Program Kebersihan Sekolah'
  },
  {
    paslon_number: 2,
    candidate_name: 'Dimas Arya Saputra',
    vice_candidate_name: 'Rizky Pratama',
    vision: 'Membangun semangat gotong royong dan kreativitas siswa.',
    mission:
      '1. UKM Fair (Pameran Ekstrakurikuler)\n2. Study Group Online\n3. Program Mentoring Siswa'
  }
];

async function seed() {
  console.log('🚀 Memulai seed paslon ke MySQL Clever Cloud...\n');

  // 1. Buat tabel paslon jika belum ada
  console.log('📋 Memeriksa / membuat tabel paslon...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS paslon (
      id INT AUTO_INCREMENT PRIMARY KEY,
      paslon_number INT NOT NULL,
      candidate_name VARCHAR(255) NOT NULL,
      vice_candidate_name VARCHAR(255) NOT NULL,
      vision TEXT,
      mission TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('   ✓ Tabel paslon siap\n');

  // 2. Cek apakah tabel masih kosong
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM paslon');
  const total = rows[0].total;

  if (total > 0) {
    console.log(`⚠️  Tabel paslon sudah berisi ${total} data. Melewati seeding.\n`);
    await pool.end();
    return;
  }

  // 3. Masukkan data paslon
  console.log('🗳️  Menyisipkan data paslon...');
  for (const p of PASLON_DATA) {
    await pool.execute(
      `INSERT INTO paslon (paslon_number, candidate_name, vice_candidate_name, vision, mission)
       VALUES (?, ?, ?, ?, ?)`,
      [p.paslon_number, p.candidate_name, p.vice_candidate_name, p.vision, p.mission]
    );
    console.log(`   ✓ Paslon ${p.paslon_number}: ${p.candidate_name} & ${p.vice_candidate_name}`);
  }

  // Tutup koneksi
  await pool.end();

  console.log('\n✅ Seed paslon berhasil!');
  console.log(`   Total data: ${PASLON_DATA.length} paslon`);
}

seed().catch((error) => {
  console.error('\n❌ Seed gagal:', error.message);
  process.exit(1);
});
