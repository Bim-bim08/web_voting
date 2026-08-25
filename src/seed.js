/**
 * Seed Database - Sample Data
 * Jalankan dengan: npm run seed
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path database
const DB_PATH = path.join(__dirname, 'db', 'e-election.db');

// Baca schema SQL
const schemaSQL = fs.readFileSync(
  path.join(__dirname, 'db', 'schema.sql'),
  'utf-8'
);

// Koneksi database
const db = new Database(DB_PATH);

// Aktifkan WAL mode untuk performa lebih baik
db.pragma('journal_mode = WAL');

// Jalankan schema
db.exec(schemaSQL);

// ============================================
// Sample Data
// ============================================

// 1. Sample Kandidat (2 Paslon)
const insertCandidate = db.prepare(`
  INSERT OR IGNORE INTO candidates (candidate_number, chairman_name, vice_chairman_name, vision_mission, photo_url, vote_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const candidates = [
  {
    candidate_number: 1,
    chairman_name: 'Ahmad Rizky Pratama',
    vice_chairman_name: 'Siti Nurhaliza',
    vision_mission: 'Mewujudkan OSIS yang inklusif, inovatif, dan berprestasi dengan program:\n1. Festival Bakat Siswa\n2. Perpustakaan Digital\n3.环保 School (Program Kebersihan Sekolah)',
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

console.log('🗳️  Seeding candidates...');
for (const c of candidates) {
  insertCandidate.run(c.candidate_number, c.chairman_name, c.vice_chairman_name, c.vision_mission, c.photo_url, c.vote_count);
  console.log(`   ✓ Paslon ${c.candidate_number}: ${c.chairman_name} & ${c.vice_chairman_name}`);
}

// 2. Sample Tokens (5 token uji coba)
const insertToken = db.prepare(`
  INSERT OR IGNORE INTO tokens (token_code, is_used)
  VALUES (?, ?)
`);

const tokens = [
  'VOTE-ABCD-1234',
  'VOTE-EFGH-5678',
  'VOTE-IJKL-9012',
  'VOTE-MNOP-3456',
  'VOTE-QRST-7890'
];

console.log('\n🔑 Seeding tokens...');
for (const token of tokens) {
  insertToken.run(token, 0);
  console.log(`   ✓ Token: ${token}`);
}

// 3. Sample Admin (1 admin default)
const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO admins (username, password)
  VALUES (?, ?)
`);

// Default: admin/admin123 (dalam produksi harus pakai hash!)
console.log('\n👤 Seeding admin...');
insertAdmin.run('admin', 'admin123');
console.log('   ✓ Admin: admin / admin123');

// Tutup koneksi
db.close();

console.log('\n✅ Database seeded successfully!');
console.log(`📁 Database located at: ${DB_PATH}`);
