# Документация Thailand Marketplace (Русский)

Добро пожаловать в документацию платформы Thailand Marketplace на русском языке.

## 📚 Доступные разделы

### 🔐 Аутентификация
- [README.md](auth/README.md) - Обзор системы аутентификации
- [oauth-api.md](auth/oauth-api.md) - Документация OAuth API
- [oauth-setup-guide.md](auth/oauth-setup-guide.md) - Руководство по настройке OAuth провайдеров

### 🛠️ Разработка
- [development.md](development.md) - Руководство по разработке и настройке окружения

## 🌐 Другие языки

- [English](../en/README.md) - English documentation
- [中文](../cn/README.md) - 中文文档

## 🚀 Быстрый старт

### Система аутентификации
Наша платформа поддерживает множественные способы входа:

- ✅ **Email/Password** - традиционная регистрация
- ✅ **Google OAuth 2.0** - вход через Google аккаунт
- ✅ **Apple Sign In** - вход через Apple ID
- ✅ **TikTok Login Kit** - вход через TikTok
- ✅ **Telegram Login Widget** - вход через Telegram
- ✅ **LINE Login** - вход через LINE (популярен в Таиланде)
- ✅ **WhatsApp Business API** - вход через WhatsApp

### Начало работы

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ```

2. **Установите зависимости**
   ```bash
   bun install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp services/user-service/.env.example services/user-service/.env
   # Отредактируйте .env файл с вашими настройками
   ```

4. **Запустите сервисы**
   ```bash
   bun run dev
   ```

## 📖 Структура документации

```
docs/ru/
├── README.md                    # Этот файл
├── development.md               # Руководство по разработке
└── auth/                        # Документация аутентификации
    ├── README.md               # Обзор системы аутентификации
    ├── oauth-api.md            # OAuth API документация
    └── oauth-setup-guide.md    # Руководство по настройке
```

## 🛠️ Технологии

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, OAuth 2.0
- **Testing**: Vitest
- **Package Manager**: Bun

## 📞 Поддержка

Для получения помощи:
- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #support
- 🐛 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues)

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](../../LICENSE) для деталей.

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, прочитайте [CONTRIBUTING.md](../../CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## 📈 Статус проекта

- ✅ **Аутентификация**: Полностью реализована
- 🔄 **Marketplace**: В разработке
- 📋 **Admin Panel**: Планируется
- 📱 **Mobile App**: Планируется

---

*Последнее обновление: Январь 2024*
