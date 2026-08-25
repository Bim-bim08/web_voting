/**
 * E-Election OSIS - REST API Server
 * Express.js + MySQL (mysql2/promise)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database module
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// Routes
// ============================================

/**
 * GET /
 * Serve frontend / API Info
 */
app.get('/', (req, res) => {
  // Serve index.html untuk frontend
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/**
 * GET /api
 * API Info (JSON)
 */
app.get('/api', (req, res) => {
  res.json({
    name: 'E-Election OSIS API',
    version: '1.0.0',
    endpoints: {
      validateToken: 'POST /api/tokens/validate',
      candidates: 'GET /api/candidates',
      vote: 'POST /api/vote'
    }
  });
});

/**
 * POST /api/tokens/validate
 * Validasi pemilih berdasarkan NISN atau ID Guru
 * Body: { identifier: "string" }
 */
app.post('/api/tokens/validate', async (req, res) => {
  const { identifier } = req.body;

  // Validasi input
  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: 'Identifier harus diisi'
    });
  }

  try {
    // Cek pemilih di database
    const voter = await db.queryOne(
      'SELECT * FROM voters WHERE identifier = ?',
      [identifier]
    );

    // Pemilih tidak ditemukan
    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'NISN / ID Pemilih tidak terdaftar'
      });
    }

    // Sudah menggunakan hak pilih
    if (voter.is_voted === 1) {
      return res.status(400).json({
        success: false,
        error: 'Anda sudah menggunakan hak pilih Anda'
      });
    }

    // Pemilih valid
    return res.status(200).json({
      success: true,
      message: 'Pemilih terverifikasi',
      data: {
        full_name: voter.full_name,
        role: voter.role,
        identifier: voter.identifier
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/candidates
 * Ambil semua data kandidat (field aman saja)
 */
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await db.query(
      `SELECT
        id,
        candidate_number,
        chairman_name,
        vice_chairman_name,
        vision_mission,
        photo_url,
        vote_count
      FROM candidates
      ORDER BY candidate_number ASC`
    );

    return res.status(200).json({
      success: true,
      data: candidates
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vote
 * Eksekusi voting
 * Body: { identifier: "string", candidate_id: number }
 */
app.post('/api/vote', async (req, res) => {
  const { identifier, candidate_id } = req.body;

  // Validasi input awal
  if (!identifier || !candidate_id) {
    return res.status(400).json({
      success: false,
      error: 'identifier dan candidate_id harus diisi'
    });
  }

  let connection;

  try {
    // Ambil koneksi dari pool untuk transaksi
    connection = await db.pool.getConnection();

    // Mulai transaksi
    await connection.beginTransaction();

    // 1. Cek pemilih: ada dan belum memilih
    const [voters] = await connection.execute(
      'SELECT id, identifier, is_voted FROM voters WHERE identifier = ?',
      [identifier]
    );
    const voter = voters[0];

    if (!voter) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'NISN / ID Pemilih tidak terdaftar'
      });
    }

    if (voter.is_voted === 1) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Anda sudah menggunakan hak pilih Anda'
      });
    }

    // 2. Cek kandidat: ada di database
    const [candidates] = await connection.execute(
      'SELECT id, candidate_number FROM candidates WHERE id = ?',
      [candidate_id]
    );
    const candidate = candidates[0];

    if (!candidate) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Kandidat tidak ditemukan'
      });
    }

    // 3. Update vote_count kandidat +1
    await connection.execute(
      'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
      [candidate_id]
    );

    // 4. Tandai pemilih sudah memilih
    await connection.execute(
      'UPDATE voters SET is_voted = 1, voted_at = NOW() WHERE identifier = ?',
      [identifier]
    );

    // 5. Commit transaksi
    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Voting berhasil disimpan',
      data: {
        candidate_id: candidate.id,
        candidate_number: candidate.candidate_number
      }
    });

  } catch (error) {
    // Rollback jika ada error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError.message);
      }
      connection.release();
    }

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan'
  });
});

// ============================================
// Start Server
// ============================================
async function startServer() {
  // Test koneksi database
  const connected = await db.testConnection();
  if (!connected) {
    console.error('\n❌ Tidak bisa menjalankan server tanpa koneksi database');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🗳️  E-Election OSIS API Server`);
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   📦 POST /api/tokens/validate`);
    console.log(`   📋 GET  /api/candidates`);
    console.log(`   🗳️  POST /api/vote\n`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.pool.end();
  process.exit(0);
});
