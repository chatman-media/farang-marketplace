# 📢 Notification Service

## 📋 Обзор

Notification Service - это централизованная система уведомлений для платформы
Thailand Marketplace. Он обеспечивает доставку уведомлений через различные
каналы: push-уведомления, email, SMS, in-app уведомления и интеграции с
мессенджерами (Line, WhatsApp, Telegram).

## 🔧 Технические характеристики

- **Порт разработки**: 3009
- **База данных**: PostgreSQL (notification_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Push**: Firebase Cloud Messaging (FCM), Apple Push Notification Service
  (APNS)
- **Email**: SendGrid, AWS SES
- **SMS**: Twilio, AWS SNS
- **Тестирование**: Vitest (в разработке)
- **Покрытие тестами**: 90%+ (планируется)

## 🏗️ Архитектура

### Структура проекта

```
services/notification-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── push/       # Push уведомления
│   │   ├── email/      # Email уведомления
│   │   ├── sms/        # SMS уведомления
│   │   ├── inapp/      # In-app уведомления
│   │   ├── messengers/ # Мессенджеры
│   │   ├── templates/  # Шаблоны уведомлений
│   │   ├── delivery/   # Доставка уведомлений
│   │   ├── tracking/   # Отслеживание статусов
│   │   └── analytics/  # Аналитика уведомлений
│   ├── providers/      # Провайдеры уведомлений
│   ├── templates/      # Шаблоны сообщений
│   ├── utils/          # Утилиты
│   ├── db/             # Конфигурация БД
│   ├── jobs/           # Фоновые задачи
│   └── types/          # TypeScript типы
├── templates/          # Шаблоны уведомлений
│   ├── email/
│   │   ├── html/       # HTML шаблоны
│   │   └── text/       # Текстовые шаблоны
│   ├── sms/
│   ├── push/
│   └── inapp/
├── assets/             # Ресурсы (иконки, изображения)
├── locales/            # Локализация
│   ├── en/
│   ├── th/
│   ├── ru/
│   └── zh/
├── tests/              # Тесты
└── package.json
```

### Модель данных

#### Notification (Уведомление)

```typescript
interface Notification {
  id: string // UUID

  // Основная информация
  title: string // Заголовок уведомления
  message: string // Текст сообщения
  type: NotificationType // BOOKING, PAYMENT, LISTING, SYSTEM, MARKETING
  priority: NotificationPriority // HIGH, MEDIUM, LOW

  // Получатель
  recipientId: string // ID получателя
  recipientType: RecipientType // USER, AGENT, ADMIN, GUEST

  // Каналы доставки
  channels: NotificationChannel[] // PUSH, EMAIL, SMS, INAPP, LINE, WHATSAPP

  // Контент для разных каналов
  content: {
    push?: PushContent
    email?: EmailContent
    sms?: SMSContent
    inapp?: InAppContent
    line?: LineContent
    whatsapp?: WhatsAppContent
  }

  // Шаблон
  templateId?: string // ID шаблона
  templateData?: Record<string, any> // Данные для шаблона

  // Настройки доставки
  deliveryOptions: {
    immediate: boolean // Немедленная доставка
    scheduledAt?: Date // Запланированное время
    timezone?: string // Часовой пояс получателя
    retryAttempts: number // Количество попыток
    retryDelay: number // Задержка между попытками
  }

  // Статус
  status: NotificationStatus // PENDING, SENT, DELIVERED, FAILED, CANCELLED

  // Результаты доставки
  deliveryResults: DeliveryResult[]

  // Метаданные
  metadata: {
    source: string // Источник уведомления
    campaign?: string // ID кампании
    tags: string[] // Теги для категоризации
    customData?: Record<string, any> // Дополнительные данные
  }

  // Локализация
  language: string // Язык уведомления

  // Временные метки
  createdAt: Date
  updatedAt: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date

  // Срок действия
  expiresAt?: Date
}
```

#### NotificationTemplate (Шаблон уведомления)

```typescript
interface NotificationTemplate {
  id: string

  // Основная информация
  name: string // Название шаблона
  description?: string // Описание
  category: TemplateCategory // TRANSACTIONAL, MARKETING, SYSTEM

  // Тип уведомления
  type: NotificationType

  // Поддерживаемые каналы
  supportedChannels: NotificationChannel[]

  // Контент шаблона
  content: {
    // Email шаблон
    email?: {
      subject: string // Тема письма
      htmlTemplate: string // HTML шаблон
      textTemplate: string // Текстовый шаблон
      preheader?: string // Предзаголовок
    }

    // Push шаблон
    push?: {
      title: string // Заголовок
      body: string // Текст
      icon?: string // Иконка
      image?: string // Изображение
      badge?: number // Бейдж
      sound?: string // Звук
      clickAction?: string // Действие при клике
    }

    // SMS шаблон
    sms?: {
      message: string // Текст SMS
    }

    // In-app шаблон
    inapp?: {
      title: string
      message: string
      actionText?: string
      actionUrl?: string
      icon?: string
    }

    // Line шаблон
    line?: {
      type: "text" | "flex" | "template"
      content: any // Контент в формате Line
    }

    // WhatsApp шаблон
    whatsapp?: {
      templateName: string // Название шаблона в WhatsApp
      parameters: string[] // Параметры шаблона
    }
  }

  // Переменные шаблона
  variables: TemplateVariable[]

  // Локализация
  localizations: Record<string, TemplateContent>

  // Настройки
  settings: {
    isActive: boolean // Активен ли шаблон
    version: string // Версия шаблона
    defaultLanguage: string // Язык по умолчанию
    fallbackTemplate?: string // Резервный шаблон
  }

  // Статистика
  stats: {
    totalSent: number // Всего отправлено
    deliveryRate: number // Процент доставки
    openRate: number // Процент открытий
    clickRate: number // Процент кликов
  }

  // Создатель
  createdBy: string

  createdAt: Date
  updatedAt: Date
}
```

#### UserPreferences (Настройки пользователя)

```typescript
interface UserPreferences {
  id: string
  userId: string

  // Общие настройки
  enabled: boolean // Уведомления включены
  language: string // Предпочитаемый язык
  timezone: string // Часовой пояс

  // Настройки по каналам
  channels: {
    push: {
      enabled: boolean
      deviceTokens: DeviceToken[] // Токены устройств
      quietHours?: {
        start: string // Начало тихих часов (HH:mm)
        end: string // Конец тихих часов (HH:mm)
      }
    }

    email: {
      enabled: boolean
      address: string // Email адрес
      frequency: EmailFrequency // IMMEDIATE, DAILY, WEEKLY
    }

    sms: {
      enabled: boolean
      phoneNumber: string // Номер телефона
    }

    inapp: {
      enabled: boolean
      showBadge: boolean // Показывать бейдж
    }

    line: {
      enabled: boolean
      userId?: string // Line User ID
    }

    whatsapp: {
      enabled: boolean
      phoneNumber?: string // WhatsApp номер
    }
  }

  // Настройки по типам уведомлений
  notificationTypes: {
    [key in NotificationType]: {
      enabled: boolean
      channels: NotificationChannel[] // Разрешенные каналы
      priority: NotificationPriority
    }
  }

  // Подписки
  subscriptions: {
    newsletter: boolean // Новостная рассылка
    promotions: boolean // Промо-акции
    updates: boolean // Обновления продукта
    tips: boolean // Советы и рекомендации
  }

  createdAt: Date
  updatedAt: Date
}
```

#### DeliveryResult (Результат доставки)

```typescript
interface DeliveryResult {
  id: string
  notificationId: string

  // Канал доставки
  channel: NotificationChannel

  // Статус доставки
  status: DeliveryStatus // PENDING, SENT, DELIVERED, FAILED, BOUNCED

  // Провайдер
  provider: string // FCM, APNS, SendGrid, Twilio, etc.
  providerId?: string // ID в системе провайдера

  // Результат
  success: boolean
  errorCode?: string // Код ошибки
  errorMessage?: string // Сообщение об ошибке

  // Метрики
  sentAt?: Date // Время отправки
  deliveredAt?: Date // Время доставки
  openedAt?: Date // Время открытия
  clickedAt?: Date // Время клика

  // Попытки доставки
  attempts: number // Количество попыток
  lastAttemptAt: Date // Последняя попытка
  nextRetryAt?: Date // Следующая попытка

  // Метаданные
  metadata: {
    deviceInfo?: any // Информация об устройстве
    userAgent?: string // User Agent
    ipAddress?: string // IP адрес
    location?: {
      country?: string
      city?: string
    }
  }

  createdAt: Date
  updatedAt: Date
}
```

## 🎯 Основные возможности

### 1. Отправка уведомлений

```typescript
class NotificationService {
  async sendNotification(
    notificationData: CreateNotificationData
  ): Promise<Notification> {
    // Создание уведомления
    const notification = await this.notificationRepository.create({
      ...notificationData,
      status: "PENDING",
      createdAt: new Date(),
    })

    // Получение настроек пользователя
    const userPreferences = await this.getUserPreferences(
      notification.recipientId
    )

    // Фильтрация каналов по настройкам
    const allowedChannels = this.filterChannelsByPreferences(
      notification.channels,
      userPreferences
    )

    // Проверка тихих часов
    const filteredChannels = await this.checkQuietHours(
      allowedChannels,
      userPreferences
    )

    if (filteredChannels.length === 0) {
      await this.notificationRepository.update(notification.id, {
        status: "CANCELLED",
      })
      return notification
    }

    // Немедленная или запланированная доставка
    if (notification.deliveryOptions.immediate) {
      await this.deliverNotification(notification, filteredChannels)
    } else {
      await this.scheduleNotification(notification, filteredChannels)
    }

    return notification
  }

  async sendBulkNotifications(
    notifications: CreateNotificationData[]
  ): Promise<BulkNotificationResult> {
    const results: NotificationResult[] = []
    const batchSize = 100

    // Обработка батчами
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)

      const batchPromises = batch.map(async notificationData => {
        try {
          const notification = await this.sendNotification(notificationData)
          return { success: true, notification }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            notificationData,
          }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      results.push(
        ...batchResults.map(r =>
          r.status === "fulfilled"
            ? r.value
            : { success: false, error: r.reason }
        )
      )

      // Пауза между батчами для предотвращения перегрузки
      if (i + batchSize < notifications.length) {
        await this.delay(1000)
      }
    }

    return {
      total: notifications.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }
  }

  private async deliverNotification(
    notification: Notification,
    channels: NotificationChannel[]
  ): Promise<void> {
    const deliveryPromises = channels.map(async channel => {
      try {
        const provider = this.getProvider(channel)
        const result = await provider.send(notification, channel)

        await this.saveDeliveryResult({
          notificationId: notification.id,
          channel,
          provider: provider.name,
          providerId: result.id,
          status: result.success ? "SENT" : "FAILED",
          success: result.success,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          sentAt: new Date(),
          attempts: 1,
        })

        return result
      } catch (error) {
        await this.saveDeliveryResult({
          notificationId: notification.id,
          channel,
          status: "FAILED",
          success: false,
          errorMessage: error.message,
          attempts: 1,
        })

        throw error
      }
    })

    await Promise.allSettled(deliveryPromises)

    // Обновление статуса уведомления
    const deliveryResults = await this.getDeliveryResults(notification.id)
    const hasSuccessful = deliveryResults.some(r => r.success)

    await this.notificationRepository.update(notification.id, {
      status: hasSuccessful ? "SENT" : "FAILED",
      sentAt: new Date(),
    })
  }
}
```

### 2. Управление шаблонами

```typescript
class TemplateService {
  async createTemplate(
    templateData: CreateTemplateData
  ): Promise<NotificationTemplate> {
    // Валидация шаблона
    await this.validateTemplate(templateData)

    // Создание шаблона
    const template = await this.templateRepository.create({
      ...templateData,
      settings: {
        isActive: true,
        version: "1.0.0",
        defaultLanguage: "en",
        ...templateData.settings,
      },
      stats: {
        totalSent: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
      },
      createdAt: new Date(),
    })

    // Компиляция шаблонов
    await this.compileTemplate(template)

    return template
  }

  async renderTemplate(
    templateId: string,
    data: Record<string, any>,
    language: string = "en"
  ): Promise<RenderedTemplate> {
    const template = await this.templateRepository.findById(templateId)
    if (!template) {
      throw new Error("Template not found")
    }

    // Получение локализованного контента
    const content = this.getLocalizedContent(template, language)

    // Рендеринг для каждого канала
    const rendered: RenderedTemplate = {}

    if (content.email) {
      rendered.email = {
        subject: this.renderString(content.email.subject, data),
        html: this.renderString(content.email.htmlTemplate, data),
        text: this.renderString(content.email.textTemplate, data),
        preheader: content.email.preheader
          ? this.renderString(content.email.preheader, data)
          : undefined,
      }
    }

    if (content.push) {
      rendered.push = {
        title: this.renderString(content.push.title, data),
        body: this.renderString(content.push.body, data),
        icon: content.push.icon,
        image: content.push.image,
        badge: content.push.badge,
        sound: content.push.sound,
        clickAction: content.push.clickAction,
      }
    }

    if (content.sms) {
      rendered.sms = {
        message: this.renderString(content.sms.message, data),
      }
    }

    if (content.inapp) {
      rendered.inapp = {
        title: this.renderString(content.inapp.title, data),
        message: this.renderString(content.inapp.message, data),
        actionText: content.inapp.actionText
          ? this.renderString(content.inapp.actionText, data)
          : undefined,
        actionUrl: content.inapp.actionUrl,
        icon: content.inapp.icon,
      }
    }

    return rendered
  }

  private renderString(template: string, data: Record<string, any>): string {
    // Простой шаблонизатор с поддержкой {{variable}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim())
      return value !== undefined ? String(value) : match
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }
}
```

### 3. Провайдеры уведомлений

```typescript
// Push уведомления через FCM
class FCMProvider implements NotificationProvider {
  name = "FCM"

  async send(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<ProviderResult> {
    if (channel !== "PUSH") {
      throw new Error("FCM provider only supports PUSH channel")
    }

    const userPreferences = await this.getUserPreferences(
      notification.recipientId
    )

    const deviceTokens = userPreferences.channels.push.deviceTokens
      .filter(token => token.platform === "android" || token.platform === "web")
      .map(token => token.token)

    if (deviceTokens.length === 0) {
      return {
        success: false,
        errorCode: "NO_DEVICE_TOKENS",
        errorMessage: "No FCM device tokens found",
      }
    }

    const pushContent = notification.content.push
    if (!pushContent) {
      return {
        success: false,
        errorCode: "NO_PUSH_CONTENT",
        errorMessage: "No push content provided",
      }
    }

    const message = {
      notification: {
        title: pushContent.title,
        body: pushContent.body,
        icon: pushContent.icon,
        image: pushContent.image,
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        clickAction: pushContent.clickAction || "",
        customData: JSON.stringify(notification.metadata.customData || {}),
      },
      tokens: deviceTokens,
    }

    try {
      const response = await this.fcmAdmin.messaging().sendMulticast(message)

      // Обработка результатов
      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(deviceTokens[idx])

          // Удаление недействительных токенов
          if (
            resp.error?.code === "messaging/registration-token-not-registered"
          ) {
            this.removeInvalidToken(deviceTokens[idx])
          }
        }
      })

      return {
        success: response.successCount > 0,
        id: response.responses[0]?.messageId,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      }
    } catch (error) {
      return {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      }
    }
  }
}

// Email через SendGrid
class SendGridProvider implements NotificationProvider {
  name = "SendGrid"

  async send(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<ProviderResult> {
    if (channel !== "EMAIL") {
      throw new Error("SendGrid provider only supports EMAIL channel")
    }

    const userPreferences = await this.getUserPreferences(
      notification.recipientId
    )

    const emailAddress = userPreferences.channels.email.address
    if (!emailAddress) {
      return {
        success: false,
        errorCode: "NO_EMAIL_ADDRESS",
        errorMessage: "No email address found",
      }
    }

    const emailContent = notification.content.email
    if (!emailContent) {
      return {
        success: false,
        errorCode: "NO_EMAIL_CONTENT",
        errorMessage: "No email content provided",
      }
    }

    const msg = {
      to: emailAddress,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: "Thailand Marketplace",
      },
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      customArgs: {
        notificationId: notification.id,
        userId: notification.recipientId,
        type: notification.type,
      },
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    }

    try {
      const response = await this.sendgrid.send(msg)

      return {
        success: true,
        id: response[0].headers["x-message-id"],
        providerId: response[0].headers["x-message-id"],
      }
    } catch (error) {
      return {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      }
    }
  }
}

// SMS через Twilio
class TwilioProvider implements NotificationProvider {
  name = "Twilio"

  async send(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<ProviderResult> {
    if (channel !== "SMS") {
      throw new Error("Twilio provider only supports SMS channel")
    }

    const userPreferences = await this.getUserPreferences(
      notification.recipientId
    )

    const phoneNumber = userPreferences.channels.sms.phoneNumber
    if (!phoneNumber) {
      return {
        success: false,
        errorCode: "NO_PHONE_NUMBER",
        errorMessage: "No phone number found",
      }
    }

    const smsContent = notification.content.sms
    if (!smsContent) {
      return {
        success: false,
        errorCode: "NO_SMS_CONTENT",
        errorMessage: "No SMS content provided",
      }
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: smsContent.message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phoneNumber,
        statusCallback: `${process.env.API_BASE_URL}/api/notifications/webhooks/twilio/status`,
      })

      return {
        success: true,
        id: message.sid,
        providerId: message.sid,
      }
    } catch (error) {
      return {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      }
    }
  }
}
```

## 🌐 API Endpoints

### Отправка уведомлений

#### POST /api/notifications/send

Отправка одиночного уведомления

**Запрос:**

```json
{
  "recipientId": "user-uuid",
  "recipientType": "USER",
  "type": "BOOKING",
  "priority": "HIGH",
  "title": "Booking Confirmed",
  "message": "Your booking has been confirmed",
  "channels": ["PUSH", "EMAIL"],
  "templateId": "booking-confirmation",
  "templateData": {
    "bookingId": "booking-123",
    "propertyName": "Luxury Villa in Phuket",
    "checkIn": "2024-02-15",
    "checkOut": "2024-02-20"
  },
  "deliveryOptions": {
    "immediate": true
  }
}
```

#### POST /api/notifications/send/bulk

Массовая отправка уведомлений

#### POST /api/notifications/send/template

Отправка через шаблон

### Управление шаблонами

#### GET /api/notifications/templates

Список шаблонов

#### POST /api/notifications/templates

Создание шаблона

#### PUT /api/notifications/templates/:id

Обновление шаблона

#### POST /api/notifications/templates/:id/test

Тестирование шаблона

### Настройки пользователей

#### GET /api/notifications/preferences/:userId

Получение настроек пользователя

#### PUT /api/notifications/preferences/:userId

Обновление настроек

**Запрос:**

```json
{
  "enabled": true,
  "language": "en",
  "timezone": "Asia/Bangkok",
  "channels": {
    "push": {
      "enabled": true,
      "quietHours": {
        "start": "22:00",
        "end": "08:00"
      }
    },
    "email": {
      "enabled": true,
      "frequency": "IMMEDIATE"
    },
    "sms": {
      "enabled": false
    }
  },
  "notificationTypes": {
    "BOOKING": {
      "enabled": true,
      "channels": ["PUSH", "EMAIL"],
      "priority": "HIGH"
    },
    "MARKETING": {
      "enabled": false,
      "channels": [],
      "priority": "LOW"
    }
  }
}
```

### Аналитика

#### GET /api/notifications/analytics/delivery

Статистика доставки

#### GET /api/notifications/analytics/engagement

Метрики вовлечения

#### GET /api/notifications/analytics/templates

Аналитика шаблонов

### Webhooks

#### POST /api/notifications/webhooks/fcm/delivery

Webhook для FCM статусов доставки

#### POST /api/notifications/webhooks/sendgrid/events

Webhook для SendGrid событий

#### POST /api/notifications/webhooks/twilio/status

Webhook для Twilio статусов SMS

## 🔄 Фоновые задачи

### Обработка очередей

```typescript
// Обработка отложенных уведомлений
const processScheduledNotifications = async () => {
  const scheduledNotifications =
    await this.notificationRepository.findScheduledForDelivery(new Date())

  for (const notification of scheduledNotifications) {
    await this.notificationService.deliverNotification(notification)
  }
}

// Повторные попытки доставки
const retryFailedDeliveries = async () => {
  const failedDeliveries =
    await this.deliveryResultRepository.findFailedForRetry()

  for (const delivery of failedDeliveries) {
    if (delivery.attempts < 3) {
      await this.notificationService.retryDelivery(delivery)
    }
  }
}

// Очистка старых уведомлений
const cleanupOldNotifications = async () => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)

  await this.notificationRepository.deleteOlderThan(cutoffDate)
}

// Обновление статистики шаблонов
const updateTemplateStats = async () => {
  const templates = await this.templateRepository.findAll()

  for (const template of templates) {
    const stats = await this.analyticsService.calculateTemplateStats(
      template.id
    )
    await this.templateRepository.updateStats(template.id, stats)
  }
}
```

## 🧪 Тестирование

### Планируемые тесты

1. **notification.test.ts** - Основная функциональность
   - Создание и отправка уведомлений
   - Обработка настроек пользователей
   - Фильтрация каналов
   - Планирование доставки

2. **templates.test.ts** - Управление шаблонами
   - CRUD операции с шаблонами
   - Рендеринг шаблонов
   - Локализация
   - Валидация

3. **providers.test.ts** - Провайдеры уведомлений
   - FCM push уведомления
   - SendGrid email
   - Twilio SMS
   - Обработка ошибок

4. **preferences.test.ts** - Настройки пользователей
   - Управление настройками
   - Тихие часы
   - Подписки
   - Валидация

5. **analytics.test.ts** - Аналитика
   - Расчет метрик
   - Статистика доставки
   - Отчеты по шаблонам
   - Производительность

6. **webhooks.test.ts** - Webhook обработка
   - Обработка статусов доставки
   - Валидация webhook
   - Обновление метрик
   - Безопасность

### Запуск тестов

```bash
# Все тесты
bun test

# Тесты с покрытием
bun test --coverage

# Интеграционные тесты
bun test:integration

# Тесты производительности
bun test:performance
```

## 🚀 Развертывание

### Переменные окружения

```env
# Сервер
PORT=3009
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/notification_service_db

# Redis
REDIS_URL=redis://localhost:6379

# Firebase Cloud Messaging
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=your-firebase-client-email

# Apple Push Notification Service
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_PRIVATE_KEY=your-apns-private-key
APNS_BUNDLE_ID=com.thailand-marketplace.app

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@thailand-marketplace.com
SENDGRID_FROM_NAME=Thailand Marketplace

# AWS SES (альтернатива SendGrid)
AWS_SES_ACCESS_KEY=your-aws-access-key
AWS_SES_SECRET_KEY=your-aws-secret-key
AWS_SES_REGION=ap-southeast-1

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AWS SNS (альтернатива Twilio)
AWS_SNS_ACCESS_KEY=your-aws-access-key
AWS_SNS_SECRET_KEY=your-aws-secret-key
AWS_SNS_REGION=ap-southeast-1

# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Telegram Bot API
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Интеграции с другими сервисами
USER_SERVICE_URL=http://localhost:3001
CRM_SERVICE_URL=http://localhost:3008
BOOKING_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004

# Файловое хранилище для медиа
AWS_S3_BUCKET=notification-media
AWS_S3_REGION=ap-southeast-1
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key

# Мониторинг
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Безопасность
JWT_SECRET=your-jwt-secret
WEBHOOK_SECRET=your-webhook-secret

# Лимиты
MAX_REQUESTS_PER_MINUTE=5000
MAX_BULK_NOTIFICATIONS=1000
MAX_TEMPLATE_SIZE=1MB
MAX_ATTACHMENT_SIZE=25MB

# Настройки доставки
DEFAULT_RETRY_ATTEMPTS=3
DEFAULT_RETRY_DELAY=300000
QUIET_HOURS_DEFAULT_START=22:00
QUIET_HOURS_DEFAULT_END=08:00
```

## 🔄 Интеграции

### Внутренние сервисы

- **User Service**: Получение профилей и настроек пользователей
- **CRM Service**: Уведомления о лидах и кампаниях
- **Booking Service**: Уведомления о бронированиях
- **Payment Service**: Уведомления о платежах
- **Listing Service**: Уведомления о новых объектах
- **Agency Service**: Уведомления для агентств

### Внешние провайдеры

- **Firebase Cloud Messaging**: Push уведомления для Android/Web
- **Apple Push Notification Service**: Push уведомления для iOS
- **SendGrid/AWS SES**: Email рассылки
- **Twilio/AWS SNS**: SMS уведомления
- **Line Messaging API**: Уведомления в Line
- **WhatsApp Business API**: Уведомления в WhatsApp
- **Telegram Bot API**: Уведомления в Telegram

## 📊 Мониторинг и метрики

### Ключевые метрики

```typescript
interface NotificationMetrics {
  // Доставка
  totalSent: number
  deliveryRate: number
  failureRate: number
  averageDeliveryTime: number

  // Вовлечение
  openRate: number
  clickRate: number
  unsubscribeRate: number

  // Производительность
  throughput: number // Уведомлений в секунду
  queueSize: number // Размер очереди
  processingTime: number // Время обработки

  // Каналы
  channelDistribution: Record<NotificationChannel, number>
  channelPerformance: Record<NotificationChannel, ChannelMetrics>

  // Ошибки
  errorRate: number
  commonErrors: ErrorStat[]

  // Пользователи
  activeUsers: number
  optOutRate: number
  preferenceChanges: number
}
```

### Дашборды

- Статистика доставки в реальном времени
- Производительность каналов
- Метрики вовлечения
- Анализ ошибок
- Использование шаблонов

## 📈 Производительность

### Оптимизации

- Батчевая обработка уведомлений
- Кеширование настроек пользователей
- Асинхронная доставка
- Оптимизация шаблонов
- Сжатие медиа-контента

### Масштабирование

- Горизонтальное масштабирование воркеров
- Разделение очередей по типам
- Географическое распределение
- CDN для медиа-ресурсов
- Кеширование на уровне провайдеров

---

**Контакты для поддержки:**

- 📧 Email: notification-service@thailand-marketplace.com
- 📱 Slack: #notification-service-support
- 👥 Notification Team: notification-team@thailand-marketplace.com
- 📋 Issues:
  [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=notification-service)
