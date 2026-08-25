/**
 * Seed MySQL Database - Sample Data
 * Jalankan dengan: npm run seed:mysql
 */

const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('🚀 Starting MySQL seed...\n');

  // 1. Baca dan jalankan schema
  console.log('📋 Creating tables...');
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, 'db', 'mysql-schema.sql'),
    'utf-8'
  );

  // Split multiple statements
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await pool.execute(stmt);
    } catch (error) {
      // Abaikan error "already exists"
      if (!error.message.includes('already exists')) {
        console.error('   ⚠️ Error:', error.message);
      }
    }
  }
  console.log('   ✓ Tables ready\n');

  // 2. Seed Kandidat (2 Paslon)
  console.log('🗳️  Seeding candidates...');
  const candidates = [
    {
      candidate_number: 1,
      chairman_name: 'Ahmad Rizky Pratama',
      vice_chairman_name: 'Siti Nurhaliza',
      vision: 'Mewujudkan OSIS yang inklusif, inovatif, dan berprestasi.',
      mission: '1. Festival Bakat Siswa\n2. Perpustakaan Digital\n3. Program Kebersihan Sekolah'
    },
    {
      candidate_number: 2,
      chairman_name: 'Budi Santoso',
      vice_chairman_name: 'Dewi Lestari',
      vision: 'Membangun semangat gotong royong dan kreativitas siswa.',
      mission: '1. UKM Fair (Pameran Ekstrakurikuler)\n2. Study Group Online\n3. Program Mentoring Siswa'
    }
  ];

  for (const c of candidates) {
    await pool.execute(
      `INSERT IGNORE INTO candidates (candidate_number, chairman_name, vice_chairman_name, vision, mission)
       VALUES (?, ?, ?, ?, ?)`,
      [c.candidate_number, c.chairman_name, c.vice_chairman_name, c.vision, c.mission]
    );
    console.log(`   ✓ Paslon ${c.candidate_number}: ${c.chairman_name} & ${c.vice_chairman_name}`);
  }

  // 3. Seed Tokens (5 token uji coba)
  console.log('\n🔑 Seeding tokens...');
  const tokens = [
    'VOTE-ABCD-1234',
    'VOTE-EFGH-5678',
    'VOTE-IJKL-9012',
    'VOTE-MNOP-3456',
    'VOTE-QRST-7890'
  ];

  for (const token of tokens) {
    await pool.execute(
      'INSERT IGNORE INTO tokens (token_code, is_used) VALUES (?, 0)',
      [token]
    );
    console.log(`   ✓ Token: ${token}`);
  }

  // 4. Seed Settings (status voting default)
  console.log('\n⚙️  Seeding settings...');
  await pool.execute(
    "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('voting_status', 'Belum Dimulai')"
  );
  console.log('   ✓ voting_status: Belum Dimulai');

  // 5. Seed Admin (1 admin default)
  console.log('\n👤 Seeding admin...');
  await pool.execute(
    'INSERT IGNORE INTO admins (username, password) VALUES (?, ?)',
    ['admin', 'admin123']
  );
  console.log('   ✓ Admin: admin / admin123');

  // Tutup koneksi
  await pool.end();

  console.log('\n✅ MySQL seed completed successfully!');
  console.log('   Database: db_e_election');
}

// Jalankan seed
seed().catch(error => {
  console.error('\n❌ Seed failed:', error.message);
  process.exit(1);
});
