/**
 * E-Election OSIS - REST API Server
 * Express.js + MySQL (mysql2/promise)
 * Compatible dengan Vercel Serverless & local development
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
      paslon: 'GET /api/paslon',
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

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: 'Identifier harus diisi'
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM voters WHERE identifier = ?',
      [identifier]
    );
    const voter = rows[0];

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'NISN / ID Pemilih tidak terdaftar'
      });
    }

    if (voter.is_voted === 1) {
      return res.status(400).json({
        success: false,
        error: 'Anda sudah menggunakan hak pilih Anda'
      });
    }

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
 * GET /api/paslon
 * Ambil daftar paslon dari Web Admin
 */
app.get('/api/paslon', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, candidate_number, chairman_name, vice_chairman_name,
              vision, mission
      FROM candidates
      ORDER BY candidate_number ASC`
    );

    // Fallback: tambahkan photo_url & vote_count default agar frontend tidak error
    const candidates = rows.map((r) => ({
      ...r,
      photo_url: r.photo_url || '/logo-osis.png',
      vote_count: r.vote_count || 0
    }));

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
 * GET /api/candidates
 * Ambil semua data kandidat (field aman saja)
 */
app.get('/api/candidates', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, candidate_number, chairman_name, vice_chairman_name,
              vision, mission
      FROM candidates
      ORDER BY candidate_number ASC`
    );

    // Fallback: tambahkan photo_url & vote_count default agar frontend tidak error
    const candidates = rows.map((r) => ({
      ...r,
      photo_url: r.photo_url || '/logo-osis.png',
      vote_count: r.vote_count || 0
    }));

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
 * Eksekusi voting dengan validasi:
 * 1. Status voting harus 'Berlangsung' (dengan fallback jika tabel settings tidak ada)
 * 2. Pemilih belum pernah memilih (is_voted = 0)
 * 3. Simpan suara ke tabel voting & update status pemilih dalam transaksi
 * Body: { identifier: "string", candidate_id: number }
 */
app.post('/api/vote', async (req, res) => {
  const { identifier, candidate_id } = req.body;

  if (!identifier || !candidate_id) {
    return res.status(400).json({
      success: false,
      error: 'identifier dan candidate_id harus diisi'
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Cek status voting dari tabel settings (dengan fallback)
    let isVotingOpen = true; // default: voting dianggap OPEN
    try {
      const [settingsRows] = await connection.execute(
        "SELECT setting_value FROM settings WHERE setting_key = 'voting_status'"
      );
      const votingStatus = settingsRows[0]?.setting_value;
      // Jika settings ada tapi bukan 'Berlangsung', tutup voting
      if (votingStatus && votingStatus !== 'Berlangsung') {
        await connection.rollback();
        connection.release();
        return res.status(403).json({
          success: false,
          error: `Voting ${votingStatus}. Voting hanya dapat dilakukan saat status 'Berlangsung'.`
        });
      }
    } catch (settingsError) {
      // Tabel settings tidak ditemukan atau query error —
      // jangan batalkan transaksi, anggap voting OPEN
      console.warn('Settings query fallback (table may not exist):', settingsError.message);
      isVotingOpen = true;
    }

    // 2. Cek pemilih: ada dan belum memilih
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
        error: 'Anda sudah menggunakan hak pilih Anda (double voting tidak diperbolehkan)'
      });
    }

    // 3. Cek kandidat
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

    // 4. Tambah suara kandidat (+1)
    await connection.execute(
      'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
      [candidate_id]
    );

    // 5. Tandai pemilih sudah memilih
    await connection.execute(
      'UPDATE voters SET is_voted = 1, voted_at = NOW() WHERE identifier = ?',
      [identifier]
    );

    // 6. Commit transaksi
    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Voting berhasil disimpan!',
      data: {
        candidate_id: candidate.id,
        candidate_number: candidate.candidate_number
      }
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
// Export app untuk Vercel Serverless
// ============================================
module.exports = app;

// ============================================
// Start Server (hanya untuk local development)
// ============================================
if (process.env.VERCEL !== '1') {
  async function startServer() {
    try {
      const conn = await pool.getConnection();
      console.log('✅ MySQL connected successfully!');
      console.log(`   📦 Database: ${process.env.DB_NAME}`);
      console.log(`   🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
      conn.release();
    } catch (error) {
      console.error('❌ MySQL connection failed:', error.message);
      console.error('\n❌ Tidak bisa menjalankan server tanpa koneksi database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🗳️  E-Election OSIS API Server`);
      console.log(`   🌐 http://localhost:${PORT}`);
      console.log(`   📦 POST /api/tokens/validate`);
      console.log(`   📋 GET  /api/paslon`);
      console.log(`   🗳️  POST /api/vote\n`);
    });
  }

  startServer();

  process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
  });
}
