//note
===========================================================
Finote Backend – Deployment & Ops Notes
===========================================================
Dependency

perlu install untuk debuging pertama

npm install
npm install typescript
npm install cors
npm install -D @types/cors
npm install bcrypt
npm install -D @types/bcrypt
npm install prom-client
npm install -D drizzle-kit


atau

npm install
npm install cors bcrypt prom-client
npm install -D typescript @types/cors @types/bcrypt
npm install -D drizzle-kit
npm install -D jest ts-jest supertest @types/jest

===========================================================
Environment Variables

Env Wajib (semua environment)
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/finote
SESSION_SECRET=super-secret-value

env prod
SESSION_NAME=finote.sid
CORS_ORIGIN=https://frontend.domain
DB_POOL_MAX=5

SESSION_NAME → penting untuk isolasi cookie
CORS_ORIGIN → WAJIB di prod, jangan pakai *
DB_POOL_MAX → kontrol koneksi DB (hemat resource VPS)

wajib inject
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=supersecret
SESSION_NAME=noteapp.sid
CORS_ORIGIN=https://frontend.domain
DB_POOL_MAX=5
===========================================================

Migrate

Generate di lokal → commit → push → migrate di VPS

import env (windows / linux)
$env:DATABASE_URL="postgresql://finote_user:finote_password@localhost:5432/finote"
export DATABASE_URL=postgresql://finote_user:finote_password@localhost:5432/finote
jalanakan "npx drizzle-kit generate" di lokal , lalu push

dan jalankan di vps/server
export DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote
npx drizzle-kit migrate

Alur Migrate
LOCAL:
drizzle generate
↓
commit + push

VPS:
git pull
↓
docker run backend
↓
docker exec → drizzle migrate

docker build -f Dockerfile.migrate -t finote-migrate .
docker run --rm \
  --network finote-net \
  -e DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote \
  finote-migrate

===========================================================
Docker network

docker network create finote-net

Digunakan agar
Backend ↔ PostgreSQL via hostname container
Siap dipindah ke Kubernetes tanpa perubahan besar

===========================================================

PostgreSQL

docker run -d \
  --name finote-postgres \
  --network finote-net \
  -e POSTGRES_DB=finote \
  -e POSTGRES_USER=finote_user \
  -e POSTGRES_PASSWORD=finote_password \
  -p 5432:5432 \
  postgres:16

docker run -d --name finote-postgres --restart=unless-stopped --network finote-net -e POSTGRES_DB=finote -e POSTGRES_USER=finote_user -e POSTGRES_PASSWORD=finote_password -p 5432:5432 postgres:16

postgresql://finote_user:finote_password@finote-postgres:5432/finote

===========================================================

Build Backend image

sebelum itu bisa build dahulu *jika diperlukan
npm run build

docker build -t finote-backend .
atau
docker build -t finote-backend ./backend

jika dengan arg(dev atau prod)
docker build -t myapp:dev --build-arg APP_ENV=dev .
docker build -t myapp:prod --build-arg APP_ENV=prod .

===========================================================

Run backend (development)

docker run -d \
  --name finote-backend \
  --restart unless-stopped \
  --network finote-net \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e SESSION_SECRET=dev-secret \
  -e DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote \
  finote-backend

docker run -d --name finote-backend --restart unless-stopped --network finote-net -p 3000:3000 -e NODE_ENV=development -e PORT=3000 -e SESSION_SECRET=dev-secret -e DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote finote-backend


Run Backend (PRODUCTION)

docker run -d \
  --name finote-backend \
  --network finote-net \
  --restart=unless-stopped\
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e SESSION_SECRET=super-secret-production \
  -e SESSION_NAME=finote.sid \
  -e CORS_ORIGIN=https://finote.rakafitrap.com \
  -e DATABASE_URL=postgresql://finote_user:finote_password@finote-postgres:5432/finote \
  finote-backend


Catatan
❌ jangan pakai development
❌ jangan expose DB ke publik
✅ HTTPS di frontend
✅ reverse proxy (NGINX / Traefik)

===========================================================

Monitoring & Health Check

untuk cek status container
docker inspect finote-backend --format='{{.State.Health.Status}}'

endpoint health /healthz untuk Liveness (process hidup)
curl -i http://localhost:3000/healthz

endpoint ready /readyz untuk Readiness (DB OK)
curl -i http://localhost:3000/readyz

endpoint metrics /metrics untuk Prometheus scrape data metrics
curl http://localhost:3000/metrics


===========================================================
testing

install dep
npm install -D jest ts-jest supertest @types/jest
lalu inisialisasi jest config (muncul jest.config.js)
npx ts-jest config:init


untuk conf nginx ada di Backendnote.txt