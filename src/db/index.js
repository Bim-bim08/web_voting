/**
 * Database Connection
 * Menggunakan better-sqlite3 untuk SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'e-election.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Buat database baru jika belum ada
const db = new Database(DB_PATH);

// Aktifkan WAL mode
db.pragma('journal_mode = WAL');

// Aktifkan foreign keys
db.pragma('foreign_keys = ON');

// Jalankan schema jika tabel belum ada
const schemaSQL = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schemaSQL);

console.log('📦 Database connected:', DB_PATH);

module.exports = db;
