# 📊 Codecov Setup Guide

Пошаговая инструкция для настройки Codecov покрытия кода.

## ✅ Что уже настроено

- [x] Конфигурация Codecov (`codecov.yml`)
- [x] GitHub Actions workflow (`.github/workflows/coverage.yml`)
- [x] Скрипты для генерации отчетов
- [x] Документация (`docs/COVERAGE.md`)
- [x] Badges в README.md
- [x] CODECOV_TOKEN в `.env`

## 🔧 Что нужно сделать

### 1. Добавить CODECOV_TOKEN в GitHub Secrets

#### Шаг 1: Получить токен от Codecov

1. Зайди на https://codecov.io/
2. Залогинься через GitHub
3. Выбери репозиторий `chatman-media/farang-marketplace`
4. Если репозиторий еще не добавлен:
   - Нажми "Add a repository"
   - Выбери `farang-marketplace`
5. Скопируй **Upload Token** (он выглядит примерно так: `a8da14c9-14b5-455c-8d5c-709fdb40d706`)

#### Шаг 2: Добавить токен в GitHub Secrets

**Вариант A: Через веб-интерфейс GitHub**

1. Открой https://github.com/chatman-media/farang-marketplace/settings/secrets/actions
2. Нажми **"New repository secret"**
3. Name: `CODECOV_TOKEN`
4. Secret: вставь токен из Codecov
5. Нажми **"Add secret"**

**Вариант B: Через GitHub CLI**

```bash
# Аутентифицируйся (если еще не сделал)
gh auth login

# Добавь секрет
gh secret set CODECOV_TOKEN
# Вставь токен и нажми Enter
```

#### Шаг 3: Обновить badge токен в README

1. На странице Codecov для твоего репозитория найди секцию "Badge"
2. Скопируй URL с правильным токеном
3. Обнови строку в `README.md`:

```markdown
[![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?token=ТВОЙ_BADGE_TOKEN)](https://codecov.io/gh/chatman-media/farang-marketplace)
```

### 2. Протестировать локально

```bash
# 1. Запусти тесты с покрытием
bun run test:coverage

# 2. Объедини отчеты
bun run test:coverage:merge

# 3. Сгенерируй полный отчет (откроется в браузере)
bun run test:coverage:report

# 4. Загрузи в Codecov (опционально)
bun run test:coverage:upload
```

### 3. Проверить CI/CD

После добавления секрета:

```bash
# Сделай коммит и push
git add .
git commit -m "feat: add Codecov integration"
git push

# Проверь workflow
gh workflow view "Coverage Report"
gh run list --workflow="coverage.yml"
```

## 📊 Структура покрытия

```
coverage/
├── merged/                    # Объединенные отчеты
│   ├── lcov.info             # Для Codecov
│   ├── coverage-summary.json # Суммарная статистика
│   └── coverage.json         # Полные данные
├── html/                     # HTML отчеты
│   └── index.html           # Открой в браузере
└── reports/                  # По сервисам
    ├── user-service.json
    ├── payment-service.json
    └── ...
```

## 🎯 Целевые показатели покрытия

| Уровень | Покрытие | Описание |
|---------|----------|----------|
| 🟢 Отлично | 90%+ | Premium quality |
| 🟡 Хорошо | 80-89% | Production ready |
| 🟠 Приемлемо | 70-79% | Needs improvement |
| 🔴 Плохо | <70% | Блокирует PR |

### По сервисам

- **Payment Service**: 90% (критический)
- **User Service**: 85%
- **Listing Service**: 85%
- **Booking Service**: 85%
- **CRM Service**: 80%
- **API Gateway**: 80%
- **Общий проект**: 80%

## 📈 Как использовать

### В Pull Requests

1. Создай PR
2. Дождись запуска workflow
3. Проверь комментарий с покрытием
4. Убедись что покрытие не упало
5. Codecov покажет diff покрытия

### В разработке

```bash
# Быстрый чек покрытия для одного сервиса
cd services/payment-service
bun run test:coverage

# Посмотреть HTML отчет
open coverage/index.html
```

### В CI/CD

- **Push в main/develop**: Автоматическая генерация
- **Pull Request**: Проверка + комментарий
- **Daily cron**: Ежедневная статистика

## 🔍 Полезные команды

```bash
# Проверить текущее покрытие
bun run test:coverage:report

# Открыть HTML отчет
open coverage/html/index.html

# Проверить статус Codecov
gh workflow view "Coverage Report"

# Вручную загрузить в Codecov
codecov -f coverage/merged/lcov.info -t $CODECOV_TOKEN

# Посмотреть покрытие конкретного сервиса
cd services/user-service && bun run test:coverage
```

## 📚 Документация

- [Полная документация](./docs/COVERAGE.md)
- [Codecov Dashboard](https://app.codecov.io/gh/chatman-media/farang-marketplace)
- [GitHub Actions Workflows](https://github.com/chatman-media/farang-marketplace/actions)

## 🆘 Проблемы?

### Coverage не генерируется

```bash
# Проверь что установлены зависимости
bun install

# Проверь vitest конфиг в каждом сервисе
cat services/*/vitest.config.ts
```

### Codecov не загружается

```bash
# Проверь секрет
gh secret list | grep CODECOV

# Проверь логи workflow
gh run list --workflow="coverage.yml"
gh run view <run-id> --log
```

### Badge не работает

1. Зайди на Codecov
2. Скопируй правильный URL badge
3. Обнови README.md

## ✅ Checklist

- [ ] CODECOV_TOKEN добавлен в GitHub Secrets
- [ ] Badge токен обновлен в README.md
- [ ] Локальная генерация покрытия работает
- [ ] CI/CD workflow успешно выполнился
- [ ] Badge отображается в README
- [ ] Codecov dashboard показывает данные

---

**Токен из .env**: `a8da14c9-14b5-455c-8d5c-709fdb40d706`

Используй его для настройки!
