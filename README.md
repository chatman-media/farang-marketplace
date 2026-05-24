<div align="center">

**[🇬🇧 English](README.md) · [🇷🇺 Русский](README.ru.md) · [🇹🇭 ภาษาไทย](README.th.md)**

# 🇹🇭 Farang Marketplace

[![CI](https://github.com/chatman-media/farang-marketplace/workflows/CI/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![Tests](https://github.com/chatman-media/farang-marketplace/workflows/Tests/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![Coverage](https://github.com/chatman-media/farang-marketplace/workflows/%F0%9F%A7%AA%20Coverage%20Report/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/chatman-media/farang-marketplace)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)

**Premium multilingual marketplace platform for Thailand — real estate, vehicles, services and more.**

</div>

---

## Overview

Farang Marketplace is a microservices monorepo connecting Thai locals, expats, and tourists on a single bilingual platform. It ships with an integrated CRM, Telegram Mini App, TON blockchain payments, and PromptPay support out of the box.

- **Universal listings** — real estate, vehicles, equipment, services, jobs, events
- **Bilingual-first** — English + Thai (ไทย) as primary languages; Russian, Chinese, Arabic also supported
- **Integrated CRM** — multi-channel inbox: Email · Telegram · WhatsApp with automated follow-ups
- **Telegram Mini App** — browse and transact without leaving Telegram
- **Thai payments** — PromptPay, local bank transfers, TON blockchain, Stripe
- **Premium positioning** — international design standards trusted by both locals and expats

---

## Architecture

```
farang-marketplace/
├── apps/
│   ├── web/              # React + Vite — main storefront
│   ├── admin/            # React + Vite — admin panel
│   └── ton-app/          # TON wallet mini app
├── services/
│   ├── api-gateway/      # Main entry point — routing & auth
│   ├── user-service/     # Registration, profiles, JWT auth      :3001
│   ├── listing-service/  # Listings CRUD, search, categories     :3003
│   ├── booking-service/  # Reservations & availability           :3004
│   ├── payment-service/  # TON · Stripe · PromptPay + BullMQ    :3009
│   ├── crm-service/      # Leads, inbox, automated follow-ups   :3007
│   ├── storage-service/  # MinIO S3 file uploads                 :3008
│   └── agency-service/   # Agency accounts & listings            :3005
└── packages/
    ├── shared-types/     # Shared TypeScript interfaces
    ├── database-schema/  # Drizzle ORM schemas
    ├── logger/           # Pino structured logging
    └── i18n/             # i18next translations
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh/) 1.3+ |
| Frontend | [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 8 |
| Backend | [Fastify](https://fastify.dev/) microservices |
| Language | [TypeScript](https://www.typescriptlang.org/) 6 |
| Database | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| Cache / Queues | [Redis](https://redis.io/) + [BullMQ](https://bullmq.io/) |
| File storage | [MinIO](https://min.io/) (S3-compatible) |
| Payments | TON blockchain · [Stripe](https://stripe.com/) · PromptPay |
| Messaging | Telegram Bot API · WhatsApp Business API · Nodemailer |
| Monorepo | [Turborepo](https://turbo.build/) |
| Linting | [Biome](https://biomejs.dev/) |
| Testing | [Vitest](https://vitest.dev/) |
| i18n | [i18next](https://www.i18next.com/) (EN · TH · RU · ZH · AR) |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.3+
- [Docker](https://www.docker.com/) & Docker Compose

### Installation

```bash
git clone git@github.com:chatman-media/farang-marketplace.git
cd farang-marketplace
bun install
```

### Start infrastructure

```bash
# Stop any local PostgreSQL to avoid port conflicts
brew services stop postgresql@14   # macOS

# Launch PostgreSQL + Redis + MinIO
docker-compose up -d
```

### Run all services

```bash
bun run dev:ui
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| Admin panel | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Listing Service | http://localhost:3003 |
| Booking Service | http://localhost:3004 |
| CRM Service | http://localhost:3007 |
| Storage Service | http://localhost:3008 |
| Payment Service | http://localhost:3009 |

### Environment variables

Copy `.env.example` to `.env` in each service directory and fill in your credentials. All `.env.test` files are pre-configured for Docker Compose.

---

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start all services in development mode |
| `bun run dev:ui` | Start all services with Turborepo TUI panel |
| `bun run build` | Build all apps and services for production |
| `bun run test` | Run tests across all packages |
| `bun run test:coverage` | Run tests with coverage report |
| `bun run lint` | Lint all code with Biome |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run type-check` | TypeScript type checking |
| `bun run docker:up` | Start Docker infrastructure |
| `bun run docker:down` | Stop Docker infrastructure |

---

## Roadmap

### Phase 1 — Foundation

- [x] Monorepo with Turborepo
- [x] Microservices: user, listing, booking, payment, CRM, storage, agency
- [x] API Gateway with JWT auth
- [x] PostgreSQL + Drizzle ORM
- [x] MinIO file storage
- [x] Redis + BullMQ job queues
- [x] Multi-language i18n (EN · TH · RU · ZH · AR)
- [x] CI/CD with GitHub Actions
- [x] Test coverage with Codecov

### Phase 2 — Product

- [ ] Web storefront (React + Vite)
- [ ] Admin panel
- [ ] Telegram Bot notifications
- [ ] Telegram Mini App
- [ ] TON blockchain payments
- [ ] PromptPay & Thai bank transfers
- [ ] Stripe integration
- [ ] CRM multi-channel inbox (Email · Telegram · WhatsApp)
- [ ] Automated lead follow-ups

### Phase 3 — Growth

- [ ] Mobile app (PWA / React Native)
- [ ] AI-powered search & recommendations
- [ ] Agency portal
- [ ] Analytics dashboard
- [ ] Multi-region deployment
- [ ] Public API + marketplace SDK

---

## License

[MIT](LICENSE) © 2025 [Chatman Media](https://github.com/chatman-media)
