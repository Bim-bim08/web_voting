/**
 * E-Election OSIS - Main Server
 * Platform Voting Sekolah
 * Menggunakan MySQL (mysql2/promise)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database pool langsung
const pool = require('./config/db');

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
    const [rows] = await pool.execute(
      `SELECT id, candidate_number, chairman_name, vice_chairman_name,
              vision, mission
       FROM candidates ORDER BY candidate_number`
    );

    // Fallback: tambahkan photo_url default agar frontend tidak error
    const data = rows.map((r) => ({
      ...r,
      photo_url: r.photo_url || '/logo-osis.png',
      votes: r.votes || 0
    }));

    res.json({
      success: true,
      data: data
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
    const [rows] = await pool.execute(
      `SELECT id, candidate_number, chairman_name, vice_chairman_name,
              vision, mission
       FROM candidates WHERE id = ?`,
      [req.params.id]
    );
    const candidate = rows[0];

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Kandidat tidak ditemukan'
      });
    }

    // Fallback: tambahkan photo_url default
    candidate.photo_url = candidate.photo_url || '/logo-osis.png';
    candidate.votes = candidate.votes || 0;

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

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Cek token
    const [tokenRows] = await connection.execute(
      'SELECT * FROM tokens WHERE token_code = ?',
      [token]
    );
    const tokenData = tokenRows[0];

    if (!tokenData) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Token tidak valid'
      });
    }

    if (tokenData.is_used) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Token sudah digunakan'
      });
    }

    // Cek kandidat
    const [candidateRows] = await connection.execute(
      'SELECT * FROM candidates WHERE id = ?',
      [candidate_id]
    );
    const candidate = candidateRows[0];

    if (!candidate) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Kandidat tidak ditemukan'
      });
    }

    // Transaksi: update vote + tandai token
    await connection.execute(
      'UPDATE candidates SET votes = COALESCE(votes, 0) + 1 WHERE id = ?',
      [candidate_id]
    );

    await connection.execute(
      'UPDATE tokens SET is_used = 1, used_at = NOW() WHERE id = ?',
      [tokenData.id]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: `Suara berhasil ditambahkan untuk Paslon ${candidate.candidate_number}`
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError.message);
      }
      connection.release();
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/results - Hasil voting
app.get('/api/results', async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT
        candidate_number,
        chairman_name,
        vice_chairman_name,
        COALESCE(votes, 0) AS votes
      FROM candidates
      ORDER BY votes DESC, candidate_number ASC
    `);

    const [totalRows] = await pool.execute(        'SELECT COALESCE(SUM(votes), 0) AS total FROM candidates'
    );
    const totalResult = totalRows[0];

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
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully!');
    console.log(`   📦 Database: ${process.env.DB_NAME}`);
    console.log(`   🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    conn.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
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
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});
