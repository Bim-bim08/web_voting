/**
 * Seed MySQL Database - Sample Data
 * Jalankan dengan: npm run seed:mysql
 */

const db = require('./config/db');
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
      await db.query(stmt);
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
      vision_mission: 'Mewujudkan OSIS yang inklusif, inovatif, dan berprestasi dengan program:\n1. Festival Bakat Siswa\n2. Perpustakaan Digital\n3. Program Kebersihan Sekolah',
      photo_url: '/images/candidate-1.jpg',
      vote_count: 0
    },
    {
      candidate_number: 2,
      chairman_name: 'Budi Santoso',
      vice_chairman_name: 'Dewi Lestari',
      vision_mission: 'Membangun semangat gotong royong dan kreativitas siswa melalui:\n1. UKM Fair (Pameran Ekstrakurikuler)\n2. Study Group Online\n3. Program Mentoring Siswa',
      photo_url: '/images/candidate-2.jpg',
      vote_count: 0
    }
  ];

  for (const c of candidates) {
    await db.insert(
      `INSERT IGNORE INTO candidates (candidate_number, chairman_name, vice_chairman_name, vision_mission, photo_url, vote_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.candidate_number, c.chairman_name, c.vice_chairman_name, c.vision_mission, c.photo_url, c.vote_count]
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
    await db.insert(
      'INSERT IGNORE INTO tokens (token_code, is_used) VALUES (?, 0)',
      [token]
    );
    console.log(`   ✓ Token: ${token}`);
  }

  // 4. Seed Admin (1 admin default)
  console.log('\n👤 Seeding admin...');
  await db.insert(
    'INSERT IGNORE INTO admins (username, password) VALUES (?, ?)',
    ['admin', 'admin123']
  );
  console.log('   ✓ Admin: admin / admin123');

  // Tutup koneksi
  await db.pool.end();

  console.log('\n✅ MySQL seed completed successfully!');
  console.log('   Database: db_e_election');
}

// Jalankan seed
seed().catch(error => {
  console.error('\n❌ Seed failed:', error.message);
  process.exit(1);
});
