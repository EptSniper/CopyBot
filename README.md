# CopyBot - Trade Signal Platform

Multi-tenant SaaS platform for traders to sell their trade signals to subscribers.

## Quick Start

### 1. Start Database
```bash
docker-compose up pgdb -d
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run Migrations & Seed
```bash
npm install
npm run backend:pg:migrate
npm run backend:pg:seed
```

### 4. Start Backend
```bash
npm run backend:pg:start
```

### 5. Start Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### 6. Start Discord Bot (optional)
```bash
npm run bot:start
```

## Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgres://copier:copierpass@localhost:5432/copier

# Backend
ADMIN_TOKEN=your-secure-admin-token
JWT_SECRET=your-secure-jwt-secret
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Discord Bot
DISCORD_TOKEN=your-discord-bot-token
BACKEND_URL=http://localhost:4000/signals
BACKEND_API_KEY=host_xxx  # Get from dashboard after registration
COMMAND_GUILD_ID=your-guild-id  # Optional, for faster command registration
```

## Production Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Railway
1. Push to GitHub
2. Connect repo to Railway
3. Add Postgres plugin
4. Set environment variables
5. Deploy

### Render
1. Push to GitHub
2. Create new Blueprint
3. Connect repo (uses render.yaml)
4. Set environment variables
5. Deploy

## API Documentation

See [context.md](./context.md) for full API documentation.

## License

ISC
