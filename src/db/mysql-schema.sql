-- ============================================
-- E-Election OSIS - MySQL Schema
-- Database: db_e_election
-- ============================================

-- Pastikan database ada
CREATE DATABASE IF NOT EXISTS db_e_election
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE db_e_election;

-- ============================================
-- Tabel Kandidat (Paslon)
-- ============================================
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_number INT NOT NULL UNIQUE,
    chairman_name VARCHAR(255) NOT NULL,
    vice_chairman_name VARCHAR(255) NOT NULL,
    vision TEXT,
    mission TEXT,
    vote_count INT DEFAULT 0 COMMENT 'Jumlah suara yang diperoleh kandidat'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel Pemilih (Voters)
-- ============================================
CREATE TABLE IF NOT EXISTS voters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(50) NOT NULL UNIQUE COMMENT 'NISN siswa atau ID Guru',
    full_name VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'guru') NOT NULL DEFAULT 'siswa',
    token_code VARCHAR(50) NOT NULL UNIQUE,
    is_voted TINYINT(1) DEFAULT 0,
    voted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel Token Voting (legacy, bisa dihapus)
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_code VARCHAR(50) NOT NULL UNIQUE,
    is_used TINYINT(1) DEFAULT 0,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel Pengaturan (Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nama pengaturan',
    setting_value VARCHAR(255) NOT NULL COMMENT 'Nilai pengaturan',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel Voting (Catatan Suara)
-- ============================================
CREATE TABLE IF NOT EXISTS voting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL COMMENT 'ID pemilih dari tabel voters',
    candidate_id INT NOT NULL COMMENT 'ID kandidat dari tabel candidates',
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel Admin
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
