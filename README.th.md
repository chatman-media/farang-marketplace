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

**แพลตฟอร์มมาร์เก็ตเพลสพรีเมียมหลายภาษาสำหรับประเทศไทย — อสังหาริมทรัพย์ ยานพาหนะ บริการ และอื่นๆ อีกมากมาย**

</div>

---

## ภาพรวม

Farang Marketplace คือโมโนเรโปสถาปัตยกรรมไมโครเซอร์วิสที่เชื่อมต่อคนไทย ชาวต่างชาติ และนักท่องเที่ยวบนแพลตฟอร์มสองภาษาเดียวกัน พร้อมด้วย CRM ในตัว Telegram Mini App การชำระเงินบนบล็อกเชน TON และรองรับ PromptPay

- **ประกาศสากล** — อสังหาริมทรัพย์ ยานพาหนะ อุปกรณ์ บริการ งาน กิจกรรม
- **สองภาษาเป็นหลัก** — ภาษาอังกฤษ + ภาษาไทย (ไทย) เป็นภาษาหลัก รองรับรัสเซีย จีน และอาหรับด้วย
- **CRM บูรณาการ** — กล่องข้อความหลายช่องทาง: Email · Telegram · WhatsApp พร้อมระบบติดตามอัตโนมัติ
- **Telegram Mini App** — ดูและซื้อสินค้าโดยไม่ต้องออกจาก Telegram
- **การชำระเงินไทย** — PromptPay โอนเงินธนาคาร บล็อกเชน TON และ Stripe
- **ตำแหน่งพรีเมียม** — มาตรฐานการออกแบบระดับสากลที่ทั้งคนไทยและชาวต่างชาติไว้วางใจ

---

## สถาปัตยกรรม

```
farang-marketplace/
├── apps/
│   ├── web/              # React + Vite — หน้าร้านหลัก
│   ├── admin/            # React + Vite — แผงผู้ดูแลระบบ
│   └── ton-app/          # TON wallet mini app
├── services/
│   ├── api-gateway/      # จุดเข้าหลัก — เส้นทางและการยืนยันตัวตน
│   ├── user-service/     # การลงทะเบียน โปรไฟล์ JWT auth          :3001
│   ├── listing-service/  # CRUD ประกาศ การค้นหา หมวดหมู่          :3003
│   ├── booking-service/  # การจองและการจัดการความพร้อมใช้งาน      :3004
│   ├── payment-service/  # TON · Stripe · PromptPay + BullMQ      :3009
│   ├── crm-service/      # ลูกค้า กล่องข้อความ ติดตามอัตโนมัติ   :3007
│   ├── storage-service/  # อัปโหลดไฟล์ผ่าน MinIO S3              :3008
│   └── agency-service/   # บัญชีเอเจนซี่และประกาศ                :3005
└── packages/
    ├── shared-types/     # TypeScript interfaces ที่ใช้ร่วมกัน
    ├── database-schema/  # Drizzle ORM schemas
    ├── logger/           # Pino structured logging
    └── i18n/             # การแปล i18next
```

---

## เทคโนโลยีที่ใช้

| หมวดหมู่ | เทคโนโลยี |
|---|---|
| Runtime | [Bun](https://bun.sh/) 1.3+ |
| ฟรอนต์เอนด์ | [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 8 |
| แบ็กเอนด์ | ไมโครเซอร์วิส [Fastify](https://fastify.dev/) |
| ภาษาโปรแกรม | [TypeScript](https://www.typescriptlang.org/) 6 |
| ฐานข้อมูล | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| แคช / คิว | [Redis](https://redis.io/) + [BullMQ](https://bullmq.io/) |
| จัดเก็บไฟล์ | [MinIO](https://min.io/) (S3-compatible) |
| การชำระเงิน | TON blockchain · [Stripe](https://stripe.com/) · PromptPay |
| การส่งข้อความ | Telegram Bot API · WhatsApp Business API · Nodemailer |
| Monorepo | [Turborepo](https://turbo.build/) |
| Linting | [Biome](https://biomejs.dev/) |
| การทดสอบ | [Vitest](https://vitest.dev/) |
| i18n | [i18next](https://www.i18next.com/) (EN · TH · RU · ZH · AR) |

---

## เริ่มต้นอย่างรวดเร็ว

### ข้อกำหนดเบื้องต้น

- [Bun](https://bun.sh/) 1.3+
- [Docker](https://www.docker.com/) และ Docker Compose

### การติดตั้ง

```bash
git clone git@github.com:chatman-media/farang-marketplace.git
cd farang-marketplace
bun install
```

### เริ่มต้นโครงสร้างพื้นฐาน

```bash
# หยุด PostgreSQL ในเครื่องเพื่อหลีกเลี่ยงความขัดแย้งของพอร์ต
brew services stop postgresql@14   # macOS

# เปิดใช้งาน PostgreSQL + Redis + MinIO
docker-compose up -d
```

### รันบริการทั้งหมด

```bash
bun run dev:ui
```

| บริการ | URL |
|---|---|
| เว็บแอป | http://localhost:5173 |
| แผงผู้ดูแลระบบ | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Listing Service | http://localhost:3003 |
| Booking Service | http://localhost:3004 |
| CRM Service | http://localhost:3007 |
| Storage Service | http://localhost:3008 |
| Payment Service | http://localhost:3009 |

### ตัวแปรสภาพแวดล้อม

คัดลอก `.env.example` ไปยัง `.env` ในแต่ละไดเรกทอรีบริการและกรอกข้อมูลของคุณ ไฟล์ `.env.test` ทั้งหมดได้รับการกำหนดค่าล่วงหน้าสำหรับ Docker Compose แล้ว

---

## คำสั่งที่ใช้ได้

| คำสั่ง | คำอธิบาย |
|---|---|
| `bun run dev` | เริ่มบริการทั้งหมดในโหมดพัฒนา |
| `bun run dev:ui` | เริ่มบริการทั้งหมดพร้อมแผง TUI ของ Turborepo |
| `bun run build` | สร้างแอปและบริการทั้งหมดสำหรับโปรดักชัน |
| `bun run test` | รันการทดสอบในทุกแพ็กเกจ |
| `bun run test:coverage` | รันการทดสอบพร้อมรายงาน coverage |
| `bun run lint` | ตรวจสอบโค้ดด้วย Biome |
| `bun run lint:fix` | แก้ไขปัญหา linting อัตโนมัติ |
| `bun run type-check` | ตรวจสอบประเภท TypeScript |
| `bun run docker:up` | เริ่มโครงสร้างพื้นฐาน Docker |
| `bun run docker:down` | หยุดโครงสร้างพื้นฐาน Docker |

---

## แผนงาน (Roadmap)

### ระยะที่ 1 — รากฐาน

- [x] Monorepo ด้วย Turborepo
- [x] Microservices: user, listing, booking, payment, CRM, storage, agency
- [x] API Gateway พร้อม JWT auth
- [x] PostgreSQL + Drizzle ORM
- [x] จัดเก็บไฟล์ MinIO
- [x] Redis + คิว BullMQ
- [x] i18n หลายภาษา (EN · TH · RU · ZH · AR)
- [x] CI/CD ด้วย GitHub Actions
- [x] ครอบคลุมการทดสอบด้วย Codecov

### ระยะที่ 2 — ผลิตภัณฑ์

- [ ] เว็บสโตร์ฟรอนต์ (React + Vite)
- [ ] แผงผู้ดูแลระบบ
- [ ] การแจ้งเตือนผ่าน Telegram Bot
- [ ] Telegram Mini App
- [ ] การชำระเงินบนบล็อกเชน TON
- [ ] PromptPay และโอนเงินผ่านธนาคารไทย
- [ ] การผสานรวม Stripe
- [ ] CRM inbox หลายช่องทาง (Email · Telegram · WhatsApp)
- [ ] ติดตามลูกค้าเป้าหมายอัตโนมัติ

### ระยะที่ 3 — การเติบโต

- [ ] แอปมือถือ (PWA / React Native)
- [ ] การค้นหาและคำแนะนำด้วย AI
- [ ] พอร์ทัลเอเจนซี่
- [ ] แดชบอร์ดวิเคราะห์ข้อมูล
- [ ] การปรับใช้หลายภูมิภาค
- [ ] Public API + marketplace SDK

---

## ใบอนุญาต

[MIT](LICENSE) © 2025 [Chatman Media](https://github.com/chatman-media)
