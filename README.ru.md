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

**Премиальная многоязычная маркетплейс-платформа для Таиланда — недвижимость, транспорт, услуги и многое другое.**

</div>

---

## Обзор

Farang Marketplace — это монорепозиторий на **модульном монолите**, объединяющий тайских жителей, экспатов и туристов на единой двуязычной платформе. Одно Fastify-приложение (`apps/api`) собирает инкапсулированные доменные модули (user, listing, booking, payment, CRM, agency), которые делят один пул подключений к PostgreSQL; фоновые задачи выполняются в отдельном worker-процессе. Из коробки включает интегрированную CRM, Telegram Mini App, платежи в блокчейне TON и поддержку PromptPay.

- **Универсальные объявления** — недвижимость, транспорт, оборудование, услуги, вакансии, мероприятия
- **Двуязычность прежде всего** — английский + тайский (ไทย) как основные языки; также поддерживаются русский, китайский и арабский
- **Интегрированная CRM** — многоканальный inbox: Email · Telegram · WhatsApp с автоматическими follow-up
- **Telegram Mini App** — просмотр и покупки прямо в Telegram
- **Тайские платежи** — PromptPay, банковские переводы, блокчейн TON, Stripe
- **Премиальное позиционирование** — международные стандарты дизайна, которым доверяют как местные жители, так и экспаты

---

## Архитектура

Единое разворачиваемое API собирает доменные модули; каждый модуль по-прежнему живёт в своём workspace-пакете и экспортирует инкапсулированный Fastify-плагин роутов (`registerXRoutes`), который монтирует корневое приложение.

```
farang-marketplace/
├── apps/
│   ├── api/              # ← модульный монолит: собирает все модули в одно Fastify-приложение (:3000)
│   │   └── src/
│   │       ├── app.ts        # сквозные плагины (один раз) + монтирование всех модулей
│   │       ├── server.ts     # HTTP-точка входа
│   │       ├── worker.ts     # фоновые задачи (BullMQ + CRM cron) — отдельный процесс
│   │       └── plugins/      # общие декораторы auth + db (fastify-plugin)
│   ├── web/              # React + Vite — основной каталог
│   ├── admin/            # React + Vite — панель администратора
│   └── ton-app/          # TON-кошелёк / мини-приложение
├── services/            # доменные модули (библиотеки для apps/api, не отдельные серверы)
│   ├── user-service/     # Регистрация, профили, JWT      → /api/auth, /api/profile, /api/oauth
│   ├── listing-service/  # Объявления, категории, провайдеры → /api/listings, /api/categories, …
│   ├── booking-service/  # Бронирования, доступность, цены → /api/bookings, /api/availability, …
│   ├── payment-service/  # TON · Stripe · PromptPay + BullMQ → /api/v1/payments, /api/v1/webhooks
│   ├── crm-service/      # Лиды, inbox, follow-up         → /api/crm, /webhook
│   ├── agency-service/   # Агентства и объявления          → /api/agencies, /api/services, …
│   └── storage-service/  # Загрузка файлов (Vercel Blob, библиотека)
└── packages/
    ├── shared-types/     # Общие TypeScript-интерфейсы
    ├── database-schema/  # Схемы Drizzle ORM + общий пул подключений (sharedDb)
    ├── auth/             # Общий JWT-middleware (request.user, app.authenticate)
    ├── logger/           # Структурированные логи Pino
    └── i18n/             # Переводы i18next
```

> **Почему монолит?** Разрезать на отдельные сервисы, но делить одну базу и одну схему — значит платить полную цену микросервисов (N деплоев, сетевые хопы, нет общих транзакций) и не получить их плюсов. Модули изолированы инкапсуляцией Fastify, поэтому любой можно вынести в отдельный сервис позже — когда реальная нагрузка этого потребует.

---

## Технологический стек

| Категория | Технология |
|---|---|
| Runtime | [Bun](https://bun.sh/) 1.3+ |
| Фронтенд | [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 8 |
| Бэкенд | Модульный монолит на [Fastify](https://fastify.dev/) |
| Язык | [TypeScript](https://www.typescriptlang.org/) 6 |
| База данных | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| Кэш / Очереди | [Redis](https://redis.io/) + [BullMQ](https://bullmq.io/) |
| Файловое хранилище | [MinIO](https://min.io/) (S3-совместимое) |
| Платежи | TON blockchain · [Stripe](https://stripe.com/) · PromptPay |
| Мессенджеры | Telegram Bot API · WhatsApp Business API · Nodemailer |
| Монорепо | [Turborepo](https://turbo.build/) |
| Линтер | [Biome](https://biomejs.dev/) |
| Тесты | [Vitest](https://vitest.dev/) |
| i18n | [i18next](https://www.i18next.com/) (EN · TH · RU · ZH · AR) |

---

## Быстрый старт

### Требования

- [Bun](https://bun.sh/) 1.3+
- [Docker](https://www.docker.com/) и Docker Compose

### Установка

```bash
git clone git@github.com:chatman-media/farang-marketplace.git
cd farang-marketplace
bun install
```

### Запуск инфраструктуры

```bash
# Остановите локальный PostgreSQL, чтобы избежать конфликтов портов
brew services stop postgresql@14   # macOS

# Запустите PostgreSQL + Redis + MinIO
docker-compose up -d
```

### Запуск приложения

```bash
bun run dev            # собирает модули и запускает единое API (http://localhost:3000)
bun run worker         # (опционально, в отдельном терминале) фоновые задачи: CRM cron + BullMQ
```

| Поверхность | URL |
|---|---|
| API (все модули) | http://localhost:3000 |
| Health-check | http://localhost:3000/health |
| Веб-приложение | http://localhost:5173 |
| Панель администратора | http://localhost:5174 |

Все доменные роуты (`/api/auth`, `/api/listings`, `/api/bookings`, `/api/v1/payments`, `/api/crm`, `/api/agencies`, …) обслуживает единое API на порту `3000` — отдельных портов по сервисам больше нет.

### Переменные окружения

Скопируйте корневой `.env.example` в `.env` и заполните данные — монолит читает один `.env`. Все файлы `.env.test` предварительно настроены для Docker Compose.

---

## Доступные команды

| Команда | Описание |
|---|---|
| `bun run dev` | Сборка модулей и запуск API (модульный монолит) |
| `bun run dev:ui` | То же, с TUI-панелью Turborepo |
| `bun run worker` | Запуск worker-процесса фоновых задач (CRM cron + BullMQ) |
| `bun run start` | Сборка и запуск API в продакшен-режиме |
| `bun run build` | Сборка всех приложений и модулей для продакшена |
| `bun run test` | Запуск тестов по всем пакетам |
| `bun run test:coverage` | Запуск тестов с отчётом о покрытии |
| `bun run lint` | Линтинг кода с Biome |
| `bun run lint:fix` | Автоматическое исправление проблем линтера |
| `bun run type-check` | Проверка типов TypeScript |
| `bun run docker:up` | Запуск Docker-инфраструктуры |
| `bun run docker:down` | Остановка Docker-инфраструктуры |

---

## Роадмап

### Фаза 1 — Фундамент

- [x] Монорепозиторий с Turborepo
- [x] Доменные модули: user, listing, booking, payment, CRM, agency (+ storage как библиотека)
- [x] **Модульный монолит** (`apps/api`) — единое Fastify-приложение, общий JWT-auth, один пул PostgreSQL
- [x] Отдельный worker-процесс (CRM cron; BullMQ payment jobs за флагом)
- [x] PostgreSQL + Drizzle ORM
- [x] Redis + очереди BullMQ
- [x] Многоязычный i18n (EN · TH · RU · ZH · AR)
- [x] CI/CD с GitHub Actions
- [x] Покрытие тестами с Codecov

### Фаза 2 — Продукт

- [x] Бэкенд-модули с HTTP-роутами и тестами (auth, listings, bookings, payments, CRM, agencies)
- [~] Веб-витрина (React + Vite) — страницы auth, объявлений, профиля; детали/создание/оплата в работе
- [ ] Панель администратора (пока заглушка)
- [ ] Уведомления через Telegram Bot
- [ ] Telegram Mini App (TON-приложение пока заглушка)
- [~] Платежи TON · Stripe · PromptPay — сервисы подключены, часть сценариев ещё заглушки
- [ ] Создание/редактирование объявлений (контроллеры vehicle/product пока возвращают placeholder)
- [~] Многоканальный CRM-inbox (Email · Telegram · WhatsApp) — слой сервисов готов
- [~] Автоматические follow-up для лидов — cron и движок автоматизаций готовы

> Легенда: `[x]` готово · `[~]` частично / подключено, но не завершено · `[ ]` не начато.

### Фаза 3 — Рост

- [ ] Мобильное приложение (PWA / React Native)
- [ ] Поиск и рекомендации на базе ИИ
- [ ] Портал для агентств
- [ ] Дашборд аналитики
- [ ] Мультирегиональный деплой
- [ ] Публичный API + SDK маркетплейса

---

## Лицензия

[MIT](LICENSE) © 2025 [Chatman Media](https://github.com/chatman-media)
