# 👥 CRM Service

## 📋 Обзор

CRM Service - это комплексная система управления взаимоотношениями с клиентами для платформы Thailand Marketplace. Он обеспечивает полный цикл работы с клиентами: от первого контакта до долгосрочного сопровождения, включая управление лидами, автоматизацию маркетинга, систему шаблонов, сегментацию клиентов, аналитику и поддержку клиентов.

## 🔧 Технические характеристики

- **Порт разработки**: 3008
- **Фреймворк**: Fastify (TypeScript)
- **База данных**: PostgreSQL (crm_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Email**: AWS SES
- **Мессенджеры**: Telegram, WhatsApp, Line
- **Тестирование**: Vitest (235 тестов)
- **Покрытие тестами**: 99.6% (234/235 тестов проходят)
- **Автоматизация**: Система workflow и крон-задач
- **Шаблоны**: Система шаблонов сообщений с переменными
- **Сегментация**: Динамическая сегментация клиентов

## 🏗️ Архитектура

### Структура проекта
```
services/crm-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   │   ├── CRMController.ts        # Основные CRM операции
│   │   ├── TemplateController.ts   # Управление шаблонами
│   │   └── SegmentController.ts    # Управление сегментами
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   │   ├── Customer.ts             # Модель клиента (расширенная)
│   │   ├── Lead.ts                 # Модель лида
│   │   ├── Template.ts             # Модель шаблона
│   │   └── Segment.ts              # Модель сегмента
│   ├── routes/         # Маршруты API
│   │   ├── crm.ts                  # Основные CRM маршруты
│   │   ├── templates.ts            # Маршруты шаблонов
│   │   └── segments.ts             # Маршруты сегментов
│   ├── services/       # Бизнес-логика
│   │   ├── CRMService.ts           # Основной CRM сервис
│   │   ├── AutomationService.ts    # Автоматизация workflow
│   │   ├── TemplateService.ts      # Управление шаблонами
│   │   ├── SegmentationService.ts  # Сегментация клиентов
│   │   ├── CommunicationService.ts # Мультиканальные коммуникации
│   │   ├── CronService.ts          # Фоновые задачи
│   │   ├── EmailService.ts         # Email сервис
│   │   └── LineService.ts          # Line мессенджер
│   ├── db/             # База данных
│   │   ├── connection.ts           # Подключение к БД
│   │   ├── schema.sql              # Схема БД
│   │   └── migrations/             # Миграции
│   │       ├── 001_initial.sql
│   │       ├── 002_add_customers.sql
│   │       ├── 003_add_message_templates.sql
│   │       └── 004_add_segments.sql
│   ├── test/           # Тесты (235 тестов)
│   │   ├── Customer.test.ts        # Тесты модели клиента
│   │   ├── Lead.test.ts            # Тесты модели лида
│   │   ├── Template.test.ts        # Тесты модели шаблона
│   │   ├── Segment.test.ts         # Тесты модели сегмента
│   │   ├── CRMService.test.ts      # Тесты CRM сервиса
│   │   ├── AutomationService.test.ts # Тесты автоматизации
│   │   ├── TemplateService.test.ts # Тесты шаблонов
│   │   ├── TemplateController.test.ts # Тесты API шаблонов
│   │   ├── SegmentationService.test.ts # Тесты сегментации
│   │   ├── SegmentController.test.ts # Тесты API сегментов
│   │   ├── CommunicationService.test.ts # Тесты коммуникаций
│   │   ├── CronService.test.ts     # Тесты крон-задач
│   │   ├── EmailService.test.ts    # Тесты email
│   │   └── LineService.test.ts     # Тесты Line
│   ├── utils/          # Утилиты
│   └── types/          # TypeScript типы
└── package.json
```

### Модель данных

#### Customer (Клиент) - Расширенная модель
```typescript
interface Customer {
  id: string;                    // UUID

  // Основная информация
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;

  // Дополнительная информация
  company?: string;
  jobTitle?: string;
  website?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;

  // Адрес
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  // Социальные контакты (обновлено)
  socialContacts?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    line?: string;
    whatsapp?: string;
    telegram?: string;
    wechat?: string;
    linkedin?: string;
  };

  // CRM данные
  source: CustomerSource;        // WEBSITE, REFERRAL, SOCIAL, ADVERTISING, etc.
  status: CustomerStatus;        // lead, prospect, customer, inactive, blocked
  tags: string[];                // Теги для категоризации
  leadScore: number;             // Оценка лида (0-100)

  // Предпочтения
  language: string;              // Предпочитаемый язык
  timezone: string;              // Часовой пояс
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    telegram: boolean;
    line: boolean;
    push: boolean;
  };

  // Связи
  userId?: string;               // Связь с пользователем системы
  assignedTo?: string;           // Назначенный менеджер

  // Метрики (автоматически обновляемые)
  totalInteractions: number;     // Общее количество взаимодействий
  lastInteractionAt?: Date;      // Последнее взаимодействие
  lifetimeValue: number;         // Пожизненная ценность клиента
  totalSpent: number;            // Общая сумма потраченных средств
  averageOrderValue: number;     // Средний чек
  purchaseFrequency: number;     // Частота покупок
  lastPurchaseAt?: Date;         // Последняя покупка

  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}
```

#### Lead (Лид)
```typescript
interface Lead {
  id: string;
  contactId: string;
  
  // Информация о лиде
  title: string;                 // Название лида
  description?: string;          // Описание
  
  // Статус и этап
  status: LeadStatus;            // NEW, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
  stage: string;                 // Этап в воронке продаж
  priority: LeadPriority;        // HIGH, MEDIUM, LOW
  
  // Финансовая информация
  estimatedValue: number;        // Предполагаемая стоимость
  probability: number;           // Вероятность закрытия (0-100)
  currency: string;              // Валюта
  
  // Источник и кампания
  source: LeadSource;            // WEBSITE, REFERRAL, ADVERTISING, SOCIAL, etc.
  campaign?: string;             // Маркетинговая кампания
  medium?: string;               // Канал привлечения
  
  // Недвижимость (если применимо)
  propertyInterest?: {
    type: PropertyType;          // CONDO, HOUSE, VILLA, etc.
    location: string;            // Интересующая локация
    priceRange: {
      min: number;
      max: number;
    };
    bedrooms?: number;
    amenities?: string[];
  };
  
  // Назначение и владение
  assignedTo?: string;           // Назначенный менеджер
  teamId?: string;               // Команда
  
  // Временные рамки
  expectedCloseDate?: Date;      // Ожидаемая дата закрытия
  lastActivityAt?: Date;         // Последняя активность
  
  // Метаданные
  customFields: Record<string, any>; // Кастомные поля
  
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}
```

#### Campaign (Кампания)
```typescript
interface Campaign {
  id: string;
  
  // Основная информация
  name: string;
  description?: string;
  type: CampaignType;            // EMAIL, SMS, PUSH, SOCIAL, MIXED
  
  // Статус и расписание
  status: CampaignStatus;        // DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED
  startDate: Date;
  endDate?: Date;
  
  // Целевая аудитория
  targetAudience: {
    segmentIds: string[];        // ID сегментов
    filters: AudienceFilter[];   // Дополнительные фильтры
    excludeSegments?: string[];  // Исключаемые сегменты
  };
  
  // Контент
  content: {
    subject?: string;            // Тема (для email)
    message: string;             // Основное сообщение
    templateId?: string;         // ID шаблона
    attachments?: string[];      // Вложения
    callToAction?: {
      text: string;
      url: string;
    };
  };
  
  // Настройки отправки
  sendingOptions: {
    timezone: string;            // Часовой пояс для отправки
    sendTime?: string;           // Время отправки (HH:mm)
    frequency?: CampaignFrequency; // ONCE, DAILY, WEEKLY, MONTHLY
    maxSends?: number;           // Максимальное количество отправок
  };
  
  // Метрики
  metrics: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    unsubscribed: number;
    bounced: number;
  };
  
  // Создатель и команда
  createdBy: string;
  teamId?: string;
  
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}
```

#### Interaction (Взаимодействие)
```typescript
interface Interaction {
  id: string;
  contactId: string;
  leadId?: string;
  
  // Тип взаимодействия
  type: InteractionType;         // EMAIL, CALL, MEETING, SMS, CHAT, FORM_SUBMISSION
  direction: InteractionDirection; // INBOUND, OUTBOUND
  
  // Содержание
  subject?: string;              // Тема
  content?: string;              // Содержание
  summary?: string;              // Краткое описание
  
  // Канал и метод
  channel: CommunicationChannel; // EMAIL, PHONE, SMS, CHAT, SOCIAL
  method?: string;               // Конкретный метод (WhatsApp, Line, etc.)
  
  // Участники
  participants: {
    userId?: string;             // Сотрудник компании
    contactId: string;           // Контакт
    role: ParticipantRole;       // SENDER, RECIPIENT, PARTICIPANT
  }[];
  
  // Результат
  outcome?: InteractionOutcome;  // SUCCESSFUL, FAILED, NO_ANSWER, SCHEDULED_FOLLOWUP
  nextAction?: {
    type: string;
    dueDate: Date;
    assignedTo: string;
    description: string;
  };
  
  // Метаданные
  duration?: number;             // Длительность (для звонков/встреч)
  attachments?: string[];        // Вложения
  tags: string[];
  
  // Автоматизация
  automationId?: string;         // ID автоматизации (если автоматическое)
  campaignId?: string;           // ID кампании
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Template (Шаблон сообщений) - Новая модель
```typescript
interface Template {
  id: string;

  // Основная информация
  name: string;
  description?: string;
  category: TemplateCategory;    // EMAIL, SMS, TELEGRAM, WHATSAPP, etc.

  // Содержимое
  subject?: string;              // Тема (для email)
  content: string;               // Основное содержимое с переменными

  // Переменные и логика
  variables: string[];           // Доступные переменные {{variable}}
  hasConditionalLogic: boolean;  // Поддержка {{#if}} условий

  // Статус и использование
  isActive: boolean;
  usageCount: number;            // Количество использований
  lastUsedAt?: Date;

  // Метаданные
  tags: string[];
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}
```

#### Segment (Сегмент) - Расширенная модель
```typescript
interface Segment {
  id: string;

  // Основная информация
  name: string;
  description?: string;

  // Критерии сегментации (расширенные)
  criteria: SegmentCriteria[];
  operator: 'AND' | 'OR';        // Логический оператор между критериями

  // Тип сегмента
  type: SegmentType;             // STATIC, DYNAMIC

  // Статистика
  customerCount: number;         // Количество клиентов
  lastCalculatedAt: Date;        // Последний пересчёт

  // Статус
  isActive: boolean;

  // Создатель
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

interface SegmentCriteria {
  field: string;                 // Поле для фильтрации (15 доступных полей)
  operator: SegmentOperator;     // 20+ операторов сравнения
  value: any;                    // Значение для сравнения
  dataType: SegmentDataType;     // STRING, NUMBER, DATE, BOOLEAN, ENUM
}

// Доступные поля для сегментации
enum SegmentField {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  PHONE = 'phone',
  STATUS = 'status',
  LEAD_SCORE = 'leadScore',
  TOTAL_SPENT = 'totalSpent',
  LIFETIME_VALUE = 'lifetimeValue',
  LAST_INTERACTION_AT = 'lastInteractionAt',
  CREATED_AT = 'createdAt',
  TAGS = 'tags',
  SOURCE = 'source',
  ASSIGNED_TO = 'assignedTo',
  LANGUAGE = 'language',
  COUNTRY = 'country'
}

// Операторы сравнения
enum SegmentOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  DATE_BEFORE = 'date_before',
  DATE_AFTER = 'date_after',
  DATE_BETWEEN = 'date_between',
  REGEX_MATCH = 'regex_match',
  ARRAY_CONTAINS = 'array_contains',
  ARRAY_NOT_CONTAINS = 'array_not_contains'
}
```

## 🎯 Основные возможности

### 1. Расширенное управление клиентами

- **Автоматическое обновление метрик**: Система автоматически пересчитывает метрики клиентов при каждом взаимодействии
- **Интеграция с коммуникациями**: Все взаимодействия автоматически отслеживаются и влияют на метрики
- **Расширенная модель**: 15+ полей клиента включая leadScore, lifetimeValue, totalSpent
- **Автоматизация**: Триггеры workflow при изменении данных клиента

### 2. Система шаблонов сообщений

- **Переменные**: Поддержка `{{variable}}` для персонализации сообщений
- **Условная логика**: Поддержка `{{#if condition}}` для динамического контента
- **Мультиканальность**: Шаблоны для email, SMS, Telegram, WhatsApp, Line
- **REST API**: Полное управление шаблонами через API (9 endpoints)
- **Предпросмотр**: Возможность предварительного просмотра с тестовыми данными
- **Статистика**: Отслеживание использования шаблонов

### 3. Динамическая сегментация клиентов

- **15 полей для сегментации**: firstName, lastName, email, status, leadScore, totalSpent, etc.
- **20+ операторов**: equals, contains, greater_than, date_before, regex_match, etc.
- **Логические операторы**: AND/OR для сложных условий
- **Автоматический пересчёт**: Крон-задача каждые 6 часов обновляет сегменты
- **REST API**: 10 endpoints для управления сегментами
- **Кэширование**: Результаты сохраняются в customer_segment_memberships
- **Статистика**: Аналитика по сегментам и их эффективности

### 4. Автоматизация workflow

- **Триггеры**: customer_created, lead_updated, interaction_logged
- **Условия**: Проверка статуса, значений полей, времени
- **Действия**: Отправка сообщений, обновление данных, создание задач
- **Интеграция с шаблонами**: Автоматическая замена хардкода на шаблоны
- **Обработка ошибок**: Graceful handling с логированием

### 5. Фоновые задачи (CronService)

- **Пересчёт метрик кампаний**: Каждый час
- **Обновление метрик клиентов**: Каждые 5 минут
- **Автоматизация лидов**: Ежедневно
- **Очистка данных**: Еженедельно
- **Пересчёт сегментов**: Каждые 6 часов

### 6. Мультиканальные коммуникации

- **Каналы**: Email (AWS SES), Telegram, WhatsApp, Line
- **Унифицированный API**: Один метод для отправки в любой канал
- **Автоматический выбор**: Система выбирает лучший канал для клиента
- **Отслеживание**: Все взаимодействия логируются и влияют на метрики
- **Bulk отправка**: Массовая рассылка с обработкой ошибок

```typescript
class LeadManagementService {
  async createLead(leadData: CreateLeadData): Promise<Lead> {
    // Создание лида
    const lead = await this.leadRepository.create({
      ...leadData,
      status: 'NEW',
      stage: 'Initial Contact',
      createdAt: new Date()
    });
    
    // Автоматическое назначение менеджера
    const assignedManager = await this.assignManager(lead);
    if (assignedManager) {
      lead.assignedTo = assignedManager.id;
      await this.leadRepository.update(lead.id, { assignedTo: assignedManager.id });
    }
    
    // Запуск автоматизации для новых лидов
    await this.automationService.triggerWorkflow('new_lead', {
      leadId: lead.id,
      contactId: lead.contactId
    });
    
    // Уведомление команды
    await this.notificationService.notifyNewLead(lead, assignedManager);
    
    return lead;
  }
  
  async updateLeadStage(
    leadId: string, 
    newStage: string, 
    userId: string
  ): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const oldStage = lead.stage;
    
    // Обновление этапа
    const updatedLead = await this.leadRepository.update(leadId, {
      stage: newStage,
      lastActivityAt: new Date()
    });
    
    // Логирование изменения
    await this.activityService.logStageChange({
      leadId,
      oldStage,
      newStage,
      changedBy: userId,
      timestamp: new Date()
    });
    
    // Запуск автоматизации для смены этапа
    await this.automationService.triggerWorkflow('stage_change', {
      leadId,
      oldStage,
      newStage,
      userId
    });
    
    return updatedLead;
  }
  
  async getLeadPipeline(filters?: PipelineFilters): Promise<PipelineData> {
    const leads = await this.leadRepository.findWithFilters(filters);
    
    // Группировка по этапам
    const pipeline = leads.reduce((acc, lead) => {
      if (!acc[lead.stage]) {
        acc[lead.stage] = {
          leads: [],
          totalValue: 0,
          count: 0
        };
      }
      
      acc[lead.stage].leads.push(lead);
      acc[lead.stage].totalValue += lead.estimatedValue;
      acc[lead.stage].count++;
      
      return acc;
    }, {} as Record<string, PipelineStage>);
    
    return {
      stages: pipeline,
      totalLeads: leads.length,
      totalValue: leads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
      conversionRates: await this.calculateConversionRates(leads)
    };
  }
}
```

### 2. Автоматизация маркетинга

```typescript
class MarketingAutomationService {
  async createWorkflow(workflowData: CreateWorkflowData): Promise<Workflow> {
    const workflow = await this.workflowRepository.create({
      ...workflowData,
      status: 'DRAFT',
      createdAt: new Date()
    });
    
    // Валидация workflow
    await this.validateWorkflow(workflow);
    
    return workflow;
  }
  
  async triggerWorkflow(
    workflowId: string, 
    triggerData: WorkflowTriggerData
  ): Promise<WorkflowExecution> {
    const workflow = await this.workflowRepository.findById(workflowId);
    if (!workflow || workflow.status !== 'ACTIVE') {
      throw new Error('Workflow not found or inactive');
    }
    
    // Создание выполнения workflow
    const execution = await this.workflowExecutionRepository.create({
      workflowId,
      triggerData,
      status: 'RUNNING',
      startedAt: new Date()
    });
    
    // Запуск первого шага
    await this.executeWorkflowStep(execution, workflow.steps[0]);
    
    return execution;
  }
  
  private async executeWorkflowStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<void> {
    try {
      switch (step.type) {
        case 'SEND_EMAIL':
          await this.executeSendEmailStep(execution, step);
          break;
          
        case 'SEND_SMS':
          await this.executeSendSMSStep(execution, step);
          break;
          
        case 'WAIT':
          await this.executeWaitStep(execution, step);
          break;
          
        case 'UPDATE_CONTACT':
          await this.executeUpdateContactStep(execution, step);
          break;
          
        case 'ADD_TO_SEGMENT':
          await this.executeAddToSegmentStep(execution, step);
          break;
          
        case 'CONDITION':
          await this.executeConditionStep(execution, step);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
      
      // Переход к следующему шагу
      const nextStep = this.getNextStep(execution, step);
      if (nextStep) {
        await this.executeWorkflowStep(execution, nextStep);
      } else {
        // Завершение workflow
        await this.completeWorkflowExecution(execution);
      }
      
    } catch (error) {
      await this.handleWorkflowError(execution, step, error);
    }
  }
}
```

### 3. Сегментация клиентов

```typescript
class SegmentationService {
  async createSegment(segmentData: CreateSegmentData): Promise<Segment> {
    const segment = await this.segmentRepository.create({
      ...segmentData,
      contactCount: 0,
      createdAt: new Date()
    });
    
    // Если динамический сегмент, сразу рассчитываем контакты
    if (segment.type === 'DYNAMIC') {
      await this.updateSegmentContacts(segment.id);
    }
    
    return segment;
  }
  
  async updateSegmentContacts(segmentId: string): Promise<void> {
    const segment = await this.segmentRepository.findById(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }
    
    // Получение контактов по критериям
    const contacts = await this.getContactsByCriteria(segment.criteria);
    
    // Обновление связей
    await this.segmentContactRepository.deleteBySegmentId(segmentId);
    
    const segmentContacts = contacts.map(contact => ({
      segmentId,
      contactId: contact.id,
      addedAt: new Date()
    }));
    
    await this.segmentContactRepository.createMany(segmentContacts);
    
    // Обновление счетчика
    await this.segmentRepository.update(segmentId, {
      contactCount: contacts.length,
      lastUpdated: new Date()
    });
  }
  
  private async getContactsByCriteria(
    criteria: SegmentCriteria
  ): Promise<Contact[]> {
    let query = this.contactRepository.createQueryBuilder('contact');
    
    // Применение условий
    criteria.conditions.forEach((condition, index) => {
      const paramName = `param${index}`;
      const whereClause = this.buildWhereClause(condition, paramName);
      
      if (index === 0) {
        query = query.where(whereClause, { [paramName]: condition.value });
      } else {
        if (criteria.operator === 'AND') {
          query = query.andWhere(whereClause, { [paramName]: condition.value });
        } else {
          query = query.orWhere(whereClause, { [paramName]: condition.value });
        }
      }
    });
    
    return await query.getMany();
  }
  
  async getSegmentInsights(segmentId: string): Promise<SegmentInsights> {
    const segment = await this.segmentRepository.findById(segmentId);
    const contacts = await this.getSegmentContacts(segmentId);
    
    // Анализ демографии
    const demographics = this.analyzeDemographics(contacts);
    
    // Анализ поведения
    const behavior = await this.analyzeBehavior(contacts);
    
    // Анализ ценности
    const value = await this.analyzeValue(contacts);
    
    return {
      segment,
      totalContacts: contacts.length,
      demographics,
      behavior,
      value,
      recommendations: await this.generateRecommendations(contacts)
    };
  }
}
```

### 4. Аналитика и отчетность

```typescript
class AnalyticsService {
  async generateSalesReport(
    dateRange: DateRange,
    filters?: ReportFilters
  ): Promise<SalesReport> {
    
    const leads = await this.leadRepository.findInDateRange(dateRange, filters);
    const interactions = await this.interactionRepository.findInDateRange(dateRange, filters);
    
    // Основные метрики
    const metrics = {
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(l => l.status === 'QUALIFIED').length,
      closedWonLeads: leads.filter(l => l.status === 'CLOSED_WON').length,
      closedLostLeads: leads.filter(l => l.status === 'CLOSED_LOST').length,
      totalRevenue: leads
        .filter(l => l.status === 'CLOSED_WON')
        .reduce((sum, l) => sum + l.estimatedValue, 0),
      averageDealSize: 0,
      conversionRate: 0,
      averageSalesCycle: 0
    };
    
    metrics.averageDealSize = metrics.totalRevenue / metrics.closedWonLeads || 0;
    metrics.conversionRate = (metrics.closedWonLeads / metrics.totalLeads) * 100 || 0;
    
    // Анализ воронки продаж
    const funnelAnalysis = await this.analyzeSalesFunnel(leads);
    
    // Анализ источников лидов
    const sourceAnalysis = this.analyzeLeadSources(leads);
    
    // Анализ производительности команды
    const teamPerformance = await this.analyzeTeamPerformance(leads, interactions);
    
    return {
      dateRange,
      metrics,
      funnelAnalysis,
      sourceAnalysis,
      teamPerformance,
      trends: await this.calculateTrends(dateRange, metrics)
    };
  }
  
  async generateCampaignReport(campaignId: string): Promise<CampaignReport> {
    const campaign = await this.campaignRepository.findById(campaignId);
    const interactions = await this.interactionRepository.findByCampaignId(campaignId);
    
    // Метрики доставки
    const deliveryMetrics = {
      sent: campaign.metrics.totalSent,
      delivered: campaign.metrics.delivered,
      bounced: campaign.metrics.bounced,
      deliveryRate: (campaign.metrics.delivered / campaign.metrics.totalSent) * 100
    };
    
    // Метрики вовлечения
    const engagementMetrics = {
      opened: campaign.metrics.opened,
      clicked: campaign.metrics.clicked,
      openRate: (campaign.metrics.opened / campaign.metrics.delivered) * 100,
      clickRate: (campaign.metrics.clicked / campaign.metrics.delivered) * 100,
      clickToOpenRate: (campaign.metrics.clicked / campaign.metrics.opened) * 100
    };
    
    // Метрики конверсии
    const conversionMetrics = {
      converted: campaign.metrics.converted,
      conversionRate: (campaign.metrics.converted / campaign.metrics.delivered) * 100,
      revenue: await this.calculateCampaignRevenue(campaignId),
      roi: 0 // Рассчитывается ниже
    };
    
    conversionMetrics.roi = (
      (conversionMetrics.revenue - campaign.cost) / campaign.cost
    ) * 100;
    
    return {
      campaign,
      deliveryMetrics,
      engagementMetrics,
      conversionMetrics,
      audienceInsights: await this.getCampaignAudienceInsights(campaignId),
      recommendations: await this.generateCampaignRecommendations(campaign)
    };
  }
}
```

## 🌐 API Endpoints

### Управление клиентами
- `GET /api/crm/customers` - Список клиентов с фильтрацией и поиском
- `POST /api/crm/customers` - Создание нового клиента
- `GET /api/crm/customers/:id` - Получение клиента по ID
- `PUT /api/crm/customers/:id` - Обновление клиента
- `DELETE /api/crm/customers/:id` - Удаление клиента
- `GET /api/crm/customers/:id/interactions` - История взаимодействий

### Управление лидами
- `GET /api/crm/leads` - Список лидов с фильтрацией
- `POST /api/crm/leads` - Создание нового лида
- `PUT /api/crm/leads/:id/stage` - Обновление этапа лида
- `GET /api/crm/leads/pipeline` - Воронка продаж

### Шаблоны сообщений (9 endpoints)
- `GET /api/crm/templates` - Список шаблонов с пагинацией
- `POST /api/crm/templates` - Создание шаблона
- `GET /api/crm/templates/:id` - Получение шаблона
- `PUT /api/crm/templates/:id` - Обновление шаблона
- `DELETE /api/crm/templates/:id` - Удаление шаблона
- `POST /api/crm/templates/:id/preview` - Предпросмотр с переменными
- `GET /api/crm/templates/search` - Поиск шаблонов
- `GET /api/crm/templates/stats` - Статистика использования
- `GET /api/crm/templates/variables` - Доступные переменные

### Сегментация клиентов (10 endpoints)
- `GET /api/crm/segments` - Список сегментов
- `POST /api/crm/segments` - Создание сегмента
- `GET /api/crm/segments/:id` - Получение сегмента
- `PUT /api/crm/segments/:id` - Обновление сегмента
- `DELETE /api/crm/segments/:id` - Удаление сегмента
- `GET /api/crm/segments/:id/customers` - Клиенты сегмента
- `POST /api/crm/segments/:id/preview` - Предпросмотр сегмента
- `GET /api/crm/segments/fields` - Доступные поля для сегментации
- `GET /api/crm/segments/search` - Поиск сегментов
- `GET /api/crm/segments/stats` - Статистика сегментов

### Автоматизация
- `GET /api/crm/workflows` - Список workflow
- `POST /api/crm/workflows` - Создание workflow
- `POST /api/crm/workflows/:id/trigger` - Запуск workflow

### Аналитика
- `GET /api/crm/analytics/sales` - Отчет по продажам
- `GET /api/crm/analytics/campaigns` - Аналитика кампаний

## 🔄 Фоновые задачи (CronService)

### Активные крон-задачи
1. **Пересчёт метрик кампаний** (каждый час)
   - Обновление статистики открытий, кликов, конверсий
   - Расчёт ROI и эффективности кампаний

2. **Обновление метрик клиентов** (каждые 5 минут)
   - Пересчёт lifetimeValue, totalSpent, averageOrderValue
   - Обновление количества взаимодействий

3. **Автоматизация лидов** (ежедневно)
   - Запуск follow-up для неактивных лидов
   - Автоматическое назначение менеджеров

4. **Очистка данных** (еженедельно)
   - Удаление старых логов взаимодействий
   - Архивирование завершённых workflow

5. **Пересчёт сегментов** (каждые 6 часов)
   - Обновление динамических сегментов
   - Пересчёт количества клиентов в сегментах

## 🧪 Тестирование

### Покрытие тестами (235 тестов - 99.6% успешность)

**Модели (82 теста):**
- Customer.test.ts (16 тестов) - Валидация модели клиента
- Lead.test.ts (25 тестов) - Валидация модели лида
- Template.test.ts (22 тестов) - Валидация модели шаблона
- Segment.test.ts (19 тестов) - Валидация модели сегмента

**Сервисы (108 тестов):**
- CRMService.test.ts (20 тестов) - Основная бизнес-логика
- AutomationService.test.ts (9 тестов) - Workflow автоматизация
- TemplateService.test.ts (18 тестов) - Управление шаблонами
- SegmentationService.test.ts (16 тестов) - Сегментация клиентов
- CommunicationService.test.ts (15 тестов) - Мультиканальные коммуникации
- CronService.test.ts (18 тестов) - Фоновые задачи
- EmailService.test.ts (11 тестов) - Email сервис
- LineService.test.ts (13 тестов) - Line мессенджер

**API контроллеры (33 теста):**
- TemplateController.test.ts (18 тестов) - API шаблонов
- SegmentController.test.ts (15 тестов) - API сегментов

### Запуск тестов
```bash
# Все тесты
npm test

# Конкретный тест
npm test -- Template

# С подробным выводом
npm test -- --reporter=verbose
```

## 🚀 Развертывание

### Переменные окружения
```env
# Сервер
PORT=3008
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/crm_service_db

# Redis
REDIS_URL=redis://localhost:6379

# Email сервисы
AWS_SES_ACCESS_KEY=your-aws-access-key
AWS_SES_SECRET_KEY=your-aws-secret-key
AWS_SES_REGION=ap-southeast-1
AWS_SES_FROM_EMAIL=noreply@thailand-marketplace.com

# Мессенджеры
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
WHATSAPP_API_TOKEN=your-whatsapp-token
LINE_CHANNEL_ACCESS_TOKEN=your-line-token

# Push уведомления
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id

# Интеграции
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3006

# Внешние API
GOOGLE_ANALYTICS_ID=your-ga-id
FACEBOOK_PIXEL_ID=your-fb-pixel-id
GOOGLE_ADS_CUSTOMER_ID=your-google-ads-id

# Файловое хранилище
AWS_S3_BUCKET=crm-attachments
AWS_S3_REGION=ap-southeast-1
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key

# Мониторинг
SENTRY_DSN=your-sentry-dsn

# Безопасность
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret

# Лимиты
MAX_REQUESTS_PER_MINUTE=1000
MAX_CAMPAIGN_RECIPIENTS=10000
MAX_ATTACHMENT_SIZE=25MB
```

## 🔄 Интеграции

### Внутренние сервисы
- **User Service**: Синхронизация профилей пользователей
- **Listing Service**: Отслеживание интереса к недвижимости
- **Booking Service**: Конверсия лидов в бронирования
- **Payment Service**: Отслеживание платежей и доходов
- **AI Service**: Скоринг лидов и персонализация

### Внешние интеграции
- **AWS SES**: Email рассылки
- **Telegram Bot API**: Telegram сообщения
- **WhatsApp Business API**: WhatsApp сообщения
- **Line Messaging API**: Line сообщения
- **Google Analytics**: Веб-аналитика
- **Facebook Pixel**: Ретаргетинг

## 📊 Мониторинг и метрики

### Ключевые метрики

**Клиенты:**
- Общее количество клиентов
- Новые клиенты за период
- Активные клиенты
- Средний LTV (Lifetime Value)
- Частота взаимодействий

**Шаблоны:**
- Количество активных шаблонов
- Частота использования
- Эффективность по каналам

**Сегменты:**
- Количество активных сегментов
- Средний размер сегмента
- Покрытие клиентской базы

**Автоматизация:**
- Количество активных workflow
- Успешность выполнения
- Время обработки

### Дашборды
- Воронка продаж в реальном времени
- Производительность кампаний
- Активность команды
- Анализ источников лидов
- Прогнозирование доходов

## 📈 Производительность

### Оптимизации
- Индексирование базы данных
- Кеширование часто используемых данных
- Асинхронная обработка кампаний
- Пагинация больших списков
- Оптимизация SQL запросов

### Масштабирование
- Горизонтальное масштабирование
- Разделение чтения и записи
- Шардинг по регионам
- CDN для статических ресурсов
- Микросервисная архитектура

---

**Контакты для поддержки:**
- 📧 Email: crm-service@thailand-marketplace.com
- 📱 Slack: #crm-service-support
- 👥 CRM Team: crm-team@thailand-marketplace.com
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=crm-service)