# 🗳️ E-Election OSIS

Platform Voting E-Election OSIS Sekolah berbasis web.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Seed Database (Sample Data)

```bash
npm run seed
```

Ini akan membuat database SQLite dengan:
- 2 Kandidat (Paslon)
- 5 Token voting
- 1 Admin default (username: `admin`, password: `admin123`)

### 3. Jalankan Server

```bash
npm start
```

Atau untuk development (auto-reload):

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API Info |
| GET | `/api/candidates` | Ambil semua kandidat |
| GET | `/api/candidates/:id` | Detail kandidat |
| POST | `/api/vote` | Voting (butuh token) |
| GET | `/api/results` | Hasil voting |

### Contoh Voting (cURL)

```bash
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"token": "VOTE-ABCD-1234", "candidate_id": 1}'
```

## 📁 Struktur Proyek

```
e-election-osis/
├── src/
│   ├── index.js          # Main server
│   ├── seed.js           # Database seeder
│   └── db/
│       ├── index.js      # DB connection
│       ├── schema.sql    # Tabel definitions
│       └── e-election.db # SQLite database (auto-generated)
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🗃️ Database Schema

### candidates
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| candidate_number | INTEGER | Nomor urut paslon |
| chairman_name | TEXT | Nama ketua |
| vice_chairman_name | TEXT | Nama wakil ketua |
| vision_mission | TEXT | Visi & misi |
| photo_url | TEXT | Path foto |
| vote_count | INTEGER | Jumlah suara |

### tokens
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| token_code | TEXT | Kode token (unique) |
| is_used | INTEGER | 0=belum, 1=sudah |
| used_at | TEXT | Waktu token dipakai |

### admins
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Username admin |
| password | TEXT | Password admin |

## 🔐 Default Credentials

- **Admin**: `admin` / `admin123`

> ⚠️ Ganti password admin di produksi!

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (via better-sqlite3)

## 📝 License

ISC
