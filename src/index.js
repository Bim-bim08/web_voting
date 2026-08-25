/**
 * E-Election OSIS - Main Server
 * Platform Voting Sekolah
 * Menggunakan MySQL (mysql2/promise)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database MySQL
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (untuk foto kandidat nanti)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// ============================================
// Routes
// ============================================

// Home - API Info
app.get('/', (req, res) => {
  res.json({
    name: 'E-Election OSIS API',
    version: '1.0.0',
    description: 'Platform Voting E-Election OSIS Sekolah',
    database: 'MySQL',
    endpoints: {
      candidates: {
        list: 'GET /api/candidates',
        detail: 'GET /api/candidates/:id'
      },
      vote: 'POST /api/vote',
      results: 'GET /api/results'
    }
  });
});

// GET /api/candidates - Ambil semua kandidat
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await db.query(
      'SELECT * FROM candidates ORDER BY candidate_number'
    );
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/candidates/:id - Ambil detail kandidat
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const candidate = await db.queryOne(
      'SELECT * FROM candidates WHERE id = ?',
      [req.params.id]
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Kandidat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/vote - Voting (butuh token valid)
app.post('/api/vote', async (req, res) => {
  const { token, candidate_id } = req.body;

  if (!token || !candidate_id) {
    return res.status(400).json({
      success: false,
      error: 'Token dan candidate_id harus diisi'
    });
  }

  try {
    // Cek token
    const tokenData = await db.queryOne(
      'SELECT * FROM tokens WHERE token_code = ?',
      [token]
    );

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        error: 'Token tidak valid'
      });
    }

    if (tokenData.is_used) {
      return res.status(400).json({
        success: false,
        error: 'Token sudah digunakan'
      });
    }

    // Cek kandidat
    const candidate = await db.queryOne(
      'SELECT * FROM candidates WHERE id = ?',
      [candidate_id]
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Kandidat tidak ditemukan'
      });
    }

    // Transaksi: update vote + tandai token
    await db.transaction(async (conn) => {
      // Update vote count
      await conn.execute(
        'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
        [candidate_id]
      );

      // Tandai token terpakai
      await conn.execute(
        'UPDATE tokens SET is_used = 1, used_at = NOW() WHERE id = ?',
        [tokenData.id]
      );
    });

    res.json({
      success: true,
      message: `Suara berhasil ditambahkan untuk Paslon ${candidate.candidate_number}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/results - Hasil voting
app.get('/api/results', async (req, res) => {
  try {
    const results = await db.query(`
      SELECT
        candidate_number,
        chairman_name,
        vice_chairman_name,
        vote_count
      FROM candidates
      ORDER BY vote_count DESC, candidate_number ASC
    `);

    const totalResult = await db.queryOne(
      'SELECT SUM(vote_count) as total FROM candidates'
    );

    res.json({
      success: true,
      data: {
        candidates: results,
        total_votes: totalResult?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Start Server
// ============================================
async function startServer() {
  // Test koneksi database
  const connected = await db.testConnection();
  if (!connected) {
    console.error('\n❌ Cannot start server without database connection');
    console.error('   Pastikan MySQL berjalan dan database db_e_election sudah ada\n');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║     🗳️  E-Election OSIS Server  🗳️      ║
  ╠═══════════════════════════════════════════╣
  ║  🌐 http://localhost:${PORT}               ║
  ║  📦 API: http://localhost:${PORT}/api       ║
  ║  🗄️  DB: MySQL (db_e_election)            ║
  ╚═══════════════════════════════════════════╝
    `);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await db.pool.end();
  process.exit(0);
});
