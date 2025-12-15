# Postgres Backend (Production-leaning Scaffold)

## Prereqs
- Node 18+ (backend uses built-in fetch)
- Postgres (or use the provided docker-compose)
- Env: `DATABASE_URL`, `ADMIN_TOKEN`, optional `BACKEND_PORT` (default 4000)

## Run locally (with your own Postgres)
```bash
# set DATABASE_URL=postgres://user:pass@host:5432/dbname
npm run backend:pg:migrate
npm run backend:pg:seed
npm run backend:pg:start
```

## Run with Docker Compose
```bash
docker compose up --build
```
Services:
- `pgdb`: Postgres on 5432, credentials set in `docker-compose.yml`
- `backend`: Express API on 4000 (or `${BACKEND_PORT}`)

## API Keys
- Hosts ingest signals with `Authorization: Bearer <host_api_key>`
- Subscribers pull with `Authorization: Bearer <subscriber_api_key>`
- Admin endpoints require `ADMIN_TOKEN`

## Key Endpoints
- POST `/hosts` (admin) → create host, returns api_key
- POST `/hosts/:id/subscribers` (admin) → create subscriber, returns api_key
- PATCH `/subscribers/:id` (admin) → update status/expiry
- POST `/signals` (host key) → ingest trade; fan-out deliveries to subscribers
- GET `/signals/next` (subscriber key) → pending trades for that subscriber
- POST `/deliveries/:id/ack` (subscriber key) → acknowledge
- POST `/deliveries/:id/exec` (subscriber key) → execution status
- GET `/hosts/:id/overview` (admin) → host/subscriber/errors snapshot
- GET `/dashboard` (admin) → simple stats
- GET `/health` → liveness

## Discord Bot Wiring
Set in `.env` for the bot:
```
BACKEND_URL=http://localhost:4000/signals
BACKEND_API_KEY=<host_api_key>
```
Then use `/trade` and the bot will POST normalized trades to the backend.
