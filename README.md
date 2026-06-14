<div align="center">

**[🇬🇧 English](README.md) · [🇷🇺 Русский](README.ru.md) · [🇹🇭 ภาษาไทย](README.th.md)**

# 🇹🇭 Farang Marketplace

[![CI](https://github.com/chatman-media/farang-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions/workflows/ci.yml)
[![CodeQL](https://github.com/chatman-media/farang-marketplace/actions/workflows/codeql.yml/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions/workflows/codeql.yml)
[![Security](https://github.com/chatman-media/farang-marketplace/actions/workflows/security.yml/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions/workflows/security.yml)
[![Coverage](https://github.com/chatman-media/farang-marketplace/actions/workflows/coverage.yml/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/chatman-media/farang-marketplace)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)

**Premium multilingual marketplace platform for Thailand — real estate, vehicles, services and more.**

</div>

---

## Overview

Farang Marketplace is a **modular-monolith** monorepo connecting Thai locals, expats, and tourists on a single bilingual platform. A single Fastify app (`apps/api`) composes encapsulated domain modules (user, listing, booking, payment, CRM, agency) that share one PostgreSQL connection pool; background jobs run in a separate worker process. It ships with an integrated CRM, Telegram Mini App, TON blockchain payments, and PromptPay support out of the box.

- **Universal listings** — real estate, vehicles, equipment, services, jobs, events
- **Bilingual-first** — English + Thai (ไทย) as primary languages; Russian, Chinese, Arabic also supported
- **Integrated CRM** — multi-channel inbox: Email · Telegram · WhatsApp with automated follow-ups
- **Telegram Mini App** — browse and transact without leaving Telegram
- **Thai payments** — PromptPay, local bank transfers, TON blockchain, Stripe
- **Premium positioning** — international design standards trusted by both locals and expats

---

## Architecture

A single deployable API composes the domain modules; each module still lives in its own workspace package and exposes an encapsulated Fastify route plugin (`registerXRoutes`) that the root app mounts.

```
farang-marketplace/
├── apps/
│   ├── api/              # ← the modular monolith: composes all modules into one Fastify app (:3000)
│   │   └── src/
│   │       ├── app.ts        # cross-cutting plugins (once) + mounts every module
│   │       ├── server.ts     # HTTP entrypoint
│   │       ├── worker.ts     # background jobs (BullMQ + CRM cron) — separate process
│   │       └── plugins/      # shared auth + db decorators (fastify-plugin)
│   ├── web/              # React + Vite — main storefront
│   ├── admin/            # React + Vite — admin panel
│   └── ton-app/          # TON wallet mini app
├── services/            # domain modules (libraries consumed by apps/api, not standalone servers)
│   ├── user-service/     # Registration, profiles, JWT auth        → /api/auth, /api/profile, /api/oauth
│   ├── listing-service/  # Listings, categories, service providers → /api/listings, /api/categories, …
│   ├── booking-service/  # Reservations, availability, pricing     → /api/bookings, /api/availability, …
│   ├── payment-service/  # TON · Stripe · PromptPay + BullMQ jobs   → /api/v1/payments, /api/v1/webhooks
│   ├── crm-service/      # Leads, inbox, automated follow-ups       → /api/crm, /webhook
│   ├── agency-service/   # Agency accounts & listings               → /api/agencies, /api/services, …
│   └── storage-service/  # Vercel Blob file uploads (library)
└── packages/
    ├── shared-types/     # Shared TypeScript interfaces
    ├── database-schema/  # Drizzle ORM schemas + the shared connection pool (sharedDb)
    ├── auth/             # Shared JWT auth middleware (request.user, app.authenticate)
    ├── logger/           # Pino structured logging
    └── i18n/             # i18next translations
```

> **Why a monolith?** Splitting into separate services while sharing one database and one schema gives all the cost of microservices (N deploys, network hops, no cross-module transactions) and none of the benefits. Modules stay isolated via Fastify encapsulation, so any one can be extracted into its own service later — when real, independent scaling actually demands it.

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh/) 1.3+ |
| Frontend | [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 8 |
| Backend | [Fastify](https://fastify.dev/) modular monolith |
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

### Run the app

```bash
bun run dev            # builds the modules, then runs the single API (http://localhost:3000)
bun run worker         # (optional, separate terminal) background jobs: CRM cron + BullMQ
```

| Surface | URL |
|---|---|
| API (all modules) | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| Web app | http://localhost:5173 |
| Admin panel | http://localhost:5174 |

All domain routes (`/api/auth`, `/api/listings`, `/api/bookings`, `/api/v1/payments`, `/api/crm`, `/api/agencies`, …) are served by the single API on port `3000` — there are no per-service ports anymore.

### Environment variables

Copy the root `.env.example` to `.env` and fill in your credentials — the monolith reads one `.env`. All `.env.test` files are pre-configured for Docker Compose.

---

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Build the modules and run the API (modular monolith) |
| `bun run dev:ui` | Same, with the Turborepo TUI panel |
| `bun run worker` | Run the background-worker process (CRM cron + BullMQ jobs) |
| `bun run start` | Build and run the API in production mode |
| `bun run build` | Build all apps and modules for production |
| `bun run test` | Run tests across all packages |
| `bun run test:coverage` | Run tests with coverage report |
| `bun run lint` | Lint all code with Biome |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run type-check` | TypeScript type checking |
| `bun run docker:up` | Start Docker infrastructure |
| `bun run docker:down` | Stop Docker infrastructure |

---

## Security

Every push to `main` and every PR is scanned by free OSS tooling (no tokens or paid licenses required):

| Workflow | Tool | What it catches |
|---|---|---|
| `codeql.yml` | [CodeQL](https://codeql.github.com/) (`security-extended`) | SAST — vulnerable code patterns |
| `security.yml` | [gitleaks](https://github.com/gitleaks/gitleaks) | leaked secrets / tokens |
| `security.yml` | [Semgrep](https://semgrep.dev/) (`p/default`) | additional SAST rules |
| `security.yml` | [Trivy](https://trivy.dev/) (`--ignore-unfixed`) | dependency CVEs + Dockerfile/compose misconfig |

Trivy reports **fixable** HIGH/CRITICAL issues on every PR (advisory while the existing CVE backlog is cleared — flip `continue-on-error` off in `security.yml` to make it a hard gate). Run `bun audit` locally for the full dependency picture.

---

## Roadmap

### Phase 1 — Foundation

- [x] Monorepo with Turborepo
- [x] Domain modules: user, listing, booking, payment, CRM, agency (+ storage library)
- [x] **Modular-monolith composition** (`apps/api`) — one Fastify app, shared JWT auth, single Postgres pool
- [x] Separate worker process (CRM cron; BullMQ payment jobs behind a flag)
- [x] PostgreSQL + Drizzle ORM
- [x] Redis + BullMQ job queues
- [x] Multi-language i18n (EN · TH · RU · ZH · AR)
- [x] CI/CD with GitHub Actions
- [x] Test coverage with Codecov

### Phase 2 — Product

- [x] Backend modules with HTTP routes + tests (auth, listings, bookings, payments, CRM, agencies)
- [~] Web storefront (React + Vite) — auth, listings, profile pages; detail/create/checkout pending
- [ ] Admin panel (currently a placeholder)
- [ ] Telegram Bot notifications
- [ ] Telegram Mini App (TON app is currently a placeholder)
- [~] TON · Stripe · PromptPay payments — services wired; some flows still stubbed
- [ ] Listing create/update flows (vehicle/product controllers still return placeholders)
- [~] CRM multi-channel inbox (Email · Telegram · WhatsApp) — service layer in place
- [~] Automated lead follow-ups — cron + automation engine in place

> Legend: `[x]` done · `[~]` partial / wired but incomplete · `[ ]` not started.

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
