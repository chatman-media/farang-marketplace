# Thailand Marketplace Documentation (English)

Welcome to the Thailand Marketplace platform documentation in English.

## 📚 Available Sections

### 🔐 Authentication

- [README.md](auth/README.md) - Authentication system overview
- [oauth-api.md](auth/oauth-api.md) - OAuth API documentation
- [oauth-setup-guide.md](auth/oauth-setup-guide.md) - OAuth providers setup
  guide

### 🛠️ Development

- [development.md](development.md) - Development guide and environment setup

## 🌐 Other Languages

- [Русский](../ru/README.md) - Русская документация
- [中文](../cn/README.md) - 中文文档

## 🚀 Quick Start

### Authentication System

Our platform supports multiple login methods:

- ✅ **Email/Password** - traditional registration
- ✅ **Google OAuth 2.0** - login via Google account
- ✅ **Apple Sign In** - login via Apple ID
- ✅ **TikTok Login Kit** - login via TikTok
- ✅ **Telegram Login Widget** - login via Telegram
- ✅ **LINE Login** - login via LINE (popular in Thailand)
- ✅ **WhatsApp Business API** - login via WhatsApp

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cp services/user-service/.env.example services/user-service/.env
   # Edit the .env file with your settings
   ```

4. **Start services**
   ```bash
   bun run dev
   ```

## 📖 Documentation Structure

```
docs/en/
├── README.md                    # This file
├── development.md               # Development guide
└── auth/                        # Authentication documentation
    ├── README.md               # Authentication system overview
    ├── oauth-api.md            # OAuth API documentation
    └── oauth-setup-guide.md    # Setup guide
```

## 🛠️ Technologies

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, OAuth 2.0
- **Testing**: Vitest
- **Package Manager**: Bun

## 📞 Support

For help:

- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #support
- 🐛 Issues:
  [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues)

## 📄 License

This project is licensed under the MIT License - see the
[LICENSE](../../LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](../../CONTRIBUTING.md)
for information on how to contribute.

## 📈 Project Status

- ✅ **Authentication**: Fully implemented
- 🔄 **Marketplace**: In development
- 📋 **Admin Panel**: Planned
- 📱 **Mobile App**: Planned

---

_Last updated: January 2024_
