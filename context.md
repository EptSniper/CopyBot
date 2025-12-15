# CopyBot Platform Context

## Overview
Multi-tenant SaaS platform for traders to sell their trade signals to subscribers.

### Components
1. **Discord Bot** (`index.js`) — `/trade` command sends signals to backend
2. **Backend API** (`backend/pg/`) — Express + Postgres, handles auth, billing, signal distribution
3. **Dashboard** (`dashboard/`) — React + Vite + Tailwind, host management portal

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CopyBot Platform                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐  │
│  │  Dashboard  │   │  API Server │   │ Discord Bot  │  │
│  │   (React)   │──▶│  (Express)  │◀──│              │  │
│  └─────────────┘   └─────────────┘   └──────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## User Roles

### Host (Trader selling signals)
- Registers via dashboard
- Gets API key for Discord bot
- Manages subscribers
- Views signal history and stats
- Upgrades plan for more subscribers

### Subscriber (Trader copying signals)
- Created by host
- Gets API key to poll signals
- Can receive webhooks for real-time delivery
- Acknowledges and reports execution status

### Admin (Platform operator)
- Manages all hosts
- Views platform metrics
- Handles billing events

## API Endpoints

### Public
- `POST /auth/register` — Host registration
- `POST /auth/login` — Login, returns JWT
- `POST /auth/refresh` — Refresh access token
- `GET /billing/plans` — List available plans

### Host (JWT auth)
- `GET /host/me` — Profile + stats
- `PATCH /host/me` — Update profile
- `POST /host/me/regenerate-key` — New API key
- `GET /host/subscribers` — List subscribers
- `POST /host/subscribers` — Create subscriber
- `PATCH /host/subscribers/:id` — Update subscriber
- `DELETE /host/subscribers/:id` — Remove subscriber
- `GET /host/signals` — Signal history
- `GET /host/stats` — Dashboard stats

### Billing (JWT auth)
- `GET /billing/me` — Current billing info
- `POST /billing/checkout` — Start Stripe checkout
- `POST /billing/cancel` — Cancel subscription
- `POST /billing/webhook` — Stripe webhook (no auth)

### Signal Ingestion (API key auth)
- `POST /signals` — Submit signal (from Discord bot)

### Subscriber (API key auth)
- `GET /signals/next` — Poll pending signals
- `POST /deliveries/:id/ack` — Acknowledge receipt
- `POST /deliveries/:id/exec` — Report execution

### Admin (ADMIN_TOKEN auth)
- `GET /admin/dashboard` — Platform stats
- `GET /admin/hosts` — List all hosts
- `GET /admin/hosts/:id` — Host details
- `PATCH /admin/hosts/:id` — Update host
- `POST /admin/hosts` — Create host manually
- `POST /admin/hosts/:id/subscribers` — Create subscriber for host

## Environment Variables

### Backend
```
DATABASE_URL=postgres://user:pass@host:5432/db
ADMIN_TOKEN=your-admin-token
JWT_SECRET=your-jwt-secret
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Discord Bot
```
DISCORD_TOKEN=your-bot-token
BACKEND_URL=http://localhost:4000/signals
BACKEND_API_KEY=host_xxx...
COMMAND_GUILD_ID=optional-guild-id
```

## Commands

### Development
```bash
# Start Postgres
docker-compose up pgdb -d

# Run migrations
npm run backend:pg:migrate

# Seed demo data
npm run backend:pg:seed

# Start backend
npm run backend:pg:start

# Start dashboard (separate terminal)
cd dashboard && npm install && npm run dev

# Start Discord bot (separate terminal)
npm run bot:start
```

### Production (Docker)
```bash
# Full stack
docker-compose up -d

# With Discord bot
docker-compose --profile with-bot up -d
```

### Deployment
- **Railway**: Push to GitHub, connect repo, set env vars
- **Render**: Use render.yaml blueprint
- **Manual**: Build dashboard, deploy backend + static files

## Database Schema

### Core Tables
- `users` — Authentication (email, password_hash, role)
- `hosts` — Trader profiles (linked to user, API key, plan)
- `subscribers` — Host's clients (API key, webhook config)
- `signals` — Trade signals (payload JSON)
- `deliveries` — Signal → Subscriber delivery tracking
- `plans` — Subscription tiers (free, pro, enterprise)

### Supporting Tables
- `sessions` — JWT refresh tokens
- `billing_events` — Stripe event log
- `password_resets` — Reset tokens
- `email_verifications` — Verification tokens
- `logs` — Application logs

## Onboarding Flow

### New Host
1. Register at dashboard → gets user + host + API key
2. Configure Discord bot with API key
3. Add subscribers manually or via self-service (future)
4. Send signals via `/trade` command
5. Subscribers poll or receive webhooks

### New Subscriber
1. Host creates subscriber in dashboard
2. Subscriber gets API key
3. Subscriber integrates: poll `/signals/next` or receive webhooks
4. Execute trades, report back via `/deliveries/:id/exec`
