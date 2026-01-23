Dokumentasi Alur Database Finote
(PostgreSQL + Drizzle ORM)

Konsep Dasar (Wajib Dipahami)
Peran masing-masing komponen
shared/schema.ts        : Sumber kebenaran schema (table, kolom, relasi)
Drizzle Kit             : Membuat & menjalankan migration
PostgreSQL              : Menyimpan data
Backend                 : Stateless, tidak menyimpan schema

Backend tidak pernah membuat table otomatis.
Schema dibuat lewat migration, bukan runtime.

Environment Variable Minimal
DATABASE_URL=postgresql://user:password@host:5432/finote

npm install
npm install typescript
npm install cors
npm install -D @types/cors
npm install bcrypt
npm install -D @types/bcrypt
npm install -D drizzle-kit

====================================================================
ENVIRONMENT VARIABLE

NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/finote
SESSION_SECRET=super-secret-value
SESSION_NAME=finote.sid
CORS_ORIGIN=https://frontend.domain
DB_POOL_MAX=5

====================================================================
Endpoint Wajib (Monitoring & Stability)
Endpoint	Fungsi	Dipakai oleh
/healthz	App hidup	Docker / K8s Liveness
/readyz	DB siap	K8s Readiness
/metrics	Metrics Prometheus	Monitoring & Alert

=============================================
1.Lokal – Fresh Start (Belum Ada Data)
Digunakan saat: Baru clone repo dan Development pertama kali

langkah
setup postgresql
# 1. Jalankan PostgreSQL
docker run -d \
  --name finote-postgres \
  -e POSTGRES_DB=finote \
  -e POSTGRES_USER=finote_user \
  -e POSTGRES_PASSWORD=finote_password \
  -p 5432:5432 \
  postgres:16

# 2. Set env
linux
jalankan :export DATABASE_URL=postgresql://finote_user:finote_password@localhost:5432/finote

windows
jalankan : $env:DATABASE_URL="postgresql://finote_user:finote_password@localhost:5432/finote"

# 3. Buat table dari schema
npx drizzle-kit push

# 4. Jalankan backend
npm run dev

Database kosong, Table otomatis dibuat, Siap development
================================================
2.Lokal – Sudah Ada Data Sebelumnya
Digunakan saat: Restart laptop , Container mati tapi volume masih ada

# 1. Jalankan PostgreSQL (pakai volume lama)
docker start finote-postgres

# 2. Jalankan backend
npm run dev

TIDAK perlu drizzle-kit push ulang dan Data tetap aman
================================================
3.VPS – Fresh Start (Tanpa Data)
Digunakan saat: Deploy pertama kali ke VPS dan Production baru

# 1. Jalankan PostgreSQL di VPS
docker run -d \
  --name finote-postgres \
  --network finote-net \
  -e POSTGRES_DB=finote \
  -e POSTGRES_USER=finote_user \
  -e POSTGRES_PASSWORD=finote_password \
  -v finote_pgdata:/var/lib/postgresql/data \
  postgres:16

# 2. Set env VPS
export DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote

# 3. Buat table
npx drizzle-kit migrate

# 4. Jalankan backend container
docker run -d \
  --network finote-net \
  -e DATABASE_URL=... \
  finote-backend

Production clean, Schema konsisten, Aman

================================================

4.VPS Fresh Start + Ambil Data dari Lokal
Digunakan saat: Migrasi dari lokal ke production dan Data mau ikut

backup dari lokal
pg_dump finote > finote_backup.sql

restore ke vps
psql finote < finote_backup.sql

jalankan migration bila perlu
npx drizzle-kit migrate
===============================================

5.VPS – Pernah Ada, Mau Fresh Start Total
Reset production dan Data lama ingin dibuang


OPSI A : drop DB
dropdb finote
createdb finote
npx drizzle-kit migrate

OPSI B : Reset Via Docker
docker stop finote-postgres
docker rm finote-postgres
docker volume rm finote_pgdata
docker run postgres...
npx drizzle-kit migrate

SEMUA DATA HILANG
==========================================

6.VPS – Data Lama Dipakai Terus
Digunakan saat: Update backend dan Tambah fitur

# 1. Update schema.ts

# 2. Generate migration
npx drizzle-kit generate

# 3. Jalankan migration
npx drizzle-kit migrate

# 4. Redeploy backend
docker restart finote-backend

Data lama aman , Schema ter-update ,Zero downtime (bisa)

jika ada perubahan shared/schema.ts
npx drizzle-kit generate
npx drizzle-kit migrate
===========================================

jika sudah coba cek 


/dt
/d users
/d notes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';


===========================================

Best Practice (Disarankan)

❌ Jangan push di production
✅ Gunakan generate + migrate
✅ Gunakan Docker volume untuk PostgreSQL
✅ Backup sebelum migrate besar
❌ Jangan auto-create table di runtime
-------------------------------------------
| Skenario      | Tindakan            |
| ------------- | ------------------- |
| Lokal baru    | `push`              |
| Lokal lama    | langsung run        |
| VPS baru      | `migrate`           |
| Pindah data   | `pg_dump` + restore |
| Reset total   | drop DB             |
| Update schema | migrate             |
==========================================================
CICD

CI – Build & Test (GitHub Actions / GitLab CI)
Pull Request / Push main
↓
npm ci
↓
npm run lint
↓
npm run build
↓
docker build
↓
docker push (registry)


CD – Deploy ke Server (VPS)
docker pull finote-backend:latest

Jalankan migration (SEBELUM deploy backend)
docker run --rm \
  --network finote-net \
  -e DATABASE_URL=$DATABASE_URL \
  finote-backend \
  npx drizzle-kit migrate

Restart backend
docker stop finote-backend
docker rm finote-backend

docker run -d \
  --name finote-backend \
  --network finote-net \
  -e DATABASE_URL=$DATABASE_URL \
  -e PORT=3000 \
  finote-backend


CI Frontend

npm ci
npm run build

FROM nginx:alpine
COPY dist /usr/share/nginx/html

docker run -d \
  --name finote-frontend \
  -p 80:80 \
  finote-frontend
=========================================================

linux
export DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote

npx drizzle-kit migrate


==============================================
test cepat DB + BACKEND

postman
regist post

http://localhost:3000/api/auth/register
Header : content type aplication json
body : raw json
{
  "username": "fi",
  "password": "secret123"
}
-----------------
login post

http://localhost:3000/api/auth/login
{
  "username": "fi",
  "password": "secret123"
}
