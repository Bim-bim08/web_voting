-- ============================================
-- E-Election OSIS - Database Schema
-- ============================================

-- Tabel Kandidat (Paslon)
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_number INTEGER NOT NULL UNIQUE,
    chairman_name TEXT NOT NULL,
    vice_chairman_name TEXT NOT NULL,
    vision_mission TEXT,
    photo_url TEXT,
    votes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabel Token Voting
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_code TEXT NOT NULL UNIQUE,
    is_used INTEGER DEFAULT 0,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabel Admin
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
