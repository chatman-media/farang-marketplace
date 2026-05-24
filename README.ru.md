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

Farang Marketplace — это монорепозиторий на микросервисах, объединяющий тайских жителей, экспатов и туристов на единой двуязычной платформе. Из коробки включает интегрированную CRM, Telegram Mini App, платежи в блокчейне TON и поддержку PromptPay.

- **Универсальные объявления** — недвижимость, транспорт, оборудование, услуги, вакансии, мероприятия
- **Двуязычность прежде всего** — английский + тайский (ไทย) как основные языки; также поддерживаются русский, китайский и арабский
- **Интегрированная CRM** — многоканальный inbox: Email · Telegram · WhatsApp с автоматическими follow-up
- **Telegram Mini App** — просмотр и покупки прямо в Telegram
- **Тайские платежи** — PromptPay, банковские переводы, блокчейн TON, Stripe
- **Премиальное позиционирование** — международные стандарты дизайна, которым доверяют как местные жители, так и экспаты

---

## Архитектура

```
farang-marketplace/
├── apps/
│   ├── web/              # React + Vite — основной каталог
│   ├── admin/            # React + Vite — панель администратора
│   └── ton-app/          # TON-кошелёк / мини-приложение
├── services/
│   ├── api-gateway/      # Основная точка входа — роутинг и авторизация
│   ├── user-service/     # Регистрация, профили, JWT-аутентификация   :3001
│   ├── listing-service/  # CRUD объявлений, поиск, категории          :3003
│   ├── booking-service/  # Бронирования и управление доступностью     :3004
│   ├── payment-service/  # TON · Stripe · PromptPay + BullMQ          :3009
│   ├── crm-service/      # Лиды, inbox, автоматические follow-up      :3007
│   ├── storage-service/  # Загрузка файлов через MinIO S3             :3008
│   └── agency-service/   # Агентские аккаунты и объявления            :3005
└── packages/
    ├── shared-types/     # Общие TypeScript-интерфейсы
    ├── database-schema/  # Схемы Drizzle ORM
    ├── logger/           # Структурированные логи Pino
    └── i18n/             # Переводы i18next
```

---

## Технологический стек

| Категория | Технология |
|---|---|
| Runtime | [Bun](https://bun.sh/) 1.3+ |
| Фронтенд | [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 8 |
| Бэкенд | Микросервисы [Fastify](https://fastify.dev/) |
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

### Запуск всех сервисов

```bash
bun run dev:ui
```

| Сервис | URL |
|---|---|
| Веб-приложение | http://localhost:5173 |
| Панель администратора | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Listing Service | http://localhost:3003 |
| Booking Service | http://localhost:3004 |
| CRM Service | http://localhost:3007 |
| Storage Service | http://localhost:3008 |
| Payment Service | http://localhost:3009 |

### Переменные окружения

Скопируйте `.env.example` в `.env` в каждой директории сервиса и заполните ваши данные. Все файлы `.env.test` предварительно настроены для Docker Compose.

---

## Доступные команды

| Команда | Описание |
|---|---|
| `bun run dev` | Запуск всех сервисов в режиме разработки |
| `bun run dev:ui` | Запуск всех сервисов с TUI-панелью Turborepo |
| `bun run build` | Сборка всех приложений для продакшена |
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
- [x] Микросервисы: user, listing, booking, payment, CRM, storage, agency
- [x] API Gateway с JWT-авторизацией
- [x] PostgreSQL + Drizzle ORM
- [x] Файловое хранилище MinIO
- [x] Redis + очереди BullMQ
- [x] Многоязычный i18n (EN · TH · RU · ZH · AR)
- [x] CI/CD с GitHub Actions
- [x] Покрытие тестами с Codecov

### Фаза 2 — Продукт

- [ ] Веб-витрина (React + Vite)
- [ ] Панель администратора
- [ ] Уведомления через Telegram Bot
- [ ] Telegram Mini App
- [ ] Платежи в блокчейне TON
- [ ] PromptPay и тайские банковские переводы
- [ ] Интеграция со Stripe
- [ ] Многоканальный CRM-inbox (Email · Telegram · WhatsApp)
- [ ] Автоматические follow-up для лидов

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
