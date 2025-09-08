# 👥 CRM Service

## 📋 Обзор

CRM Service - это система управления взаимоотношениями с клиентами для платформы Thailand Marketplace. Он обеспечивает полный цикл работы с клиентами: от первого контакта до долгосрочного сопровождения, включая управление лидами, автоматизацию маркетинга, аналитику и поддержку клиентов.

## 🔧 Технические характеристики

- **Порт разработки**: 3008
- **База данных**: PostgreSQL (crm_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Email**: SendGrid, AWS SES
- **SMS**: Twilio, AWS SNS
- **Тестирование**: Vitest (6 тестов)
- **Покрытие тестами**: 85%+

## 🏗️ Архитектура

### Структура проекта
```
services/crm-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── leads/      # Управление лидами
│   │   ├── contacts/   # Управление контактами
│   │   ├── campaigns/  # Маркетинговые кампании
│   │   ├── automation/ # Автоматизация
│   │   ├── analytics/  # Аналитика
│   │   ├── support/    # Поддержка клиентов
│   │   └── communication/ # Коммуникации
│   ├── workflows/      # Бизнес-процессы
│   ├── templates/      # Шаблоны сообщений
│   ├── utils/          # Утилиты
│   ├── db/             # Конфигурация БД
│   ├── jobs/           # Фоновые задачи
│   └── types/          # TypeScript типы
├── templates/          # Email/SMS шаблоны
│   ├── email/
│   ├── sms/
│   └── push/
├── workflows/          # Конфигурации workflow
├── tests/              # Тесты
└── package.json
```

### Модель данных

#### Contact (Контакт)
```typescript
interface Contact {
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
  
  // Адрес
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Социальные сети
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    line?: string;
    whatsapp?: string;
  };
  
  // CRM данные
  source: ContactSource;         // WEBSITE, REFERRAL, SOCIAL, ADVERTISING, etc.
  status: ContactStatus;         // ACTIVE, INACTIVE, BLOCKED, DELETED
  tags: string[];                // Теги для категоризации
  
  // Предпочтения
  language: string;              // Предпочитаемый язык
  timezone: string;              // Часовой пояс
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    phone: boolean;
  };
  
  // Связи
  userId?: string;               // Связь с пользователем системы
  assignedTo?: string;           // Назначенный менеджер
  
  // Метрики
  totalInteractions: number;     // Общее количество взаимодействий
  lastInteractionAt?: Date;      // Последнее взаимодействие
  lifetimeValue: number;         // Пожизненная ценность клиента
  
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

#### Segment (Сегмент)
```typescript
interface Segment {
  id: string;
  
  // Основная информация
  name: string;
  description?: string;
  
  // Критерии сегментации
  criteria: SegmentCriteria;
  
  // Тип сегмента
  type: SegmentType;             // STATIC, DYNAMIC
  
  // Статистика
  contactCount: number;          // Количество контактов
  lastUpdated: Date;             // Последнее обновление
  
  // Создатель
  createdBy: string;
  teamId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentCriteria {
  conditions: SegmentCondition[];
  operator: 'AND' | 'OR';        // Логический оператор между условиями
}

interface SegmentCondition {
  field: string;                 // Поле для фильтрации
  operator: ConditionOperator;   // EQUALS, NOT_EQUALS, CONTAINS, GREATER_THAN, etc.
  value: any;                    // Значение для сравнения
  dataType: 'string' | 'number' | 'date' | 'boolean';
}
```

## 🎯 Основные возможности

### 1. Управление лидами

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

### Управление контактами

#### GET /api/crm/contacts
Получение списка контактов

**Параметры:**
```
?page=1
&limit=20
&search=john
&status=ACTIVE
&source=WEBSITE
&tags=vip,premium
&assignedTo=manager-uuid
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact-uuid",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@example.com",
        "phone": "+66123456789",
        "status": "ACTIVE",
        "source": "WEBSITE",
        "tags": ["vip", "premium"],
        "assignedTo": "manager-uuid",
        "lifetimeValue": 150000,
        "lastInteractionAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

#### POST /api/crm/contacts
Создание нового контакта

#### PUT /api/crm/contacts/:id
Обновление контакта

#### DELETE /api/crm/contacts/:id
Удаление контакта

#### GET /api/crm/contacts/:id/interactions
История взаимодействий с контактом

### Управление лидами

#### GET /api/crm/leads
Получение списка лидов

#### POST /api/crm/leads
Создание нового лида

**Запрос:**
```json
{
  "contactId": "contact-uuid",
  "title": "Interested in Bangkok Condo",
  "description": "Looking for 2-bedroom condo in Sukhumvit area",
  "estimatedValue": 50000,
  "probability": 70,
  "source": "WEBSITE",
  "propertyInterest": {
    "type": "CONDO",
    "location": "Sukhumvit, Bangkok",
    "priceRange": {
      "min": 40000,
      "max": 60000
    },
    "bedrooms": 2,
    "amenities": ["pool", "gym", "bts"]
  }
}
```

#### PUT /api/crm/leads/:id/stage
Обновление этапа лида

#### GET /api/crm/leads/pipeline
Получение воронки продаж

### Кампании

#### GET /api/crm/campaigns
Список кампаний

#### POST /api/crm/campaigns
Создание кампании

#### POST /api/crm/campaigns/:id/send
Запуск кампании

#### GET /api/crm/campaigns/:id/report
Отчет по кампании

### Сегменты

#### GET /api/crm/segments
Список сегментов

#### POST /api/crm/segments
Создание сегмента

**Запрос:**
```json
{
  "name": "High-Value Prospects",
  "description": "Prospects with high estimated value",
  "type": "DYNAMIC",
  "criteria": {
    "operator": "AND",
    "conditions": [
      {
        "field": "estimatedValue",
        "operator": "GREATER_THAN",
        "value": 100000,
        "dataType": "number"
      },
      {
        "field": "status",
        "operator": "EQUALS",
        "value": "QUALIFIED",
        "dataType": "string"
      }
    ]
  }
}
```

#### PUT /api/crm/segments/:id/refresh
Обновление динамического сегмента

### Автоматизация

#### GET /api/crm/workflows
Список workflow

#### POST /api/crm/workflows
Создание workflow

#### POST /api/crm/workflows/:id/trigger
Запуск workflow

### Аналитика

#### GET /api/crm/analytics/sales
Отчет по продажам

#### GET /api/crm/analytics/leads
Аналитика лидов

#### GET /api/crm/analytics/campaigns
Аналитика кампаний

#### GET /api/crm/analytics/team
Производительность команды

## 🔄 Фоновые задачи

### Автоматизация и уведомления
```typescript
// Обработка просроченных задач
const processOverdueTasks = async () => {
  const overdueTasks = await this.taskRepository.findOverdue();
  
  for (const task of overdueTasks) {
    // Уведомление ответственного
    await this.notificationService.sendOverdueTaskNotification(task);
    
    // Эскалация, если задача просрочена более чем на 24 часа
    if (this.isOverdue(task, 24)) {
      await this.escalateTask(task);
    }
  }
};

// Обновление динамических сегментов
const updateDynamicSegments = async () => {
  const dynamicSegments = await this.segmentRepository.findDynamic();
  
  for (const segment of dynamicSegments) {
    await this.segmentationService.updateSegmentContacts(segment.id);
  }
};

// Расчет метрик производительности
const calculatePerformanceMetrics = async () => {
  const teams = await this.teamRepository.findAll();
  
  for (const team of teams) {
    const metrics = await this.analyticsService.calculateTeamMetrics(team.id);
    await this.metricsRepository.saveTeamMetrics(team.id, metrics);
  }
};

// Автоматическое назначение лидов
const autoAssignLeads = async () => {
  const unassignedLeads = await this.leadRepository.findUnassigned();
  
  for (const lead of unassignedLeads) {
    const bestManager = await this.findBestManager(lead);
    if (bestManager) {
      await this.leadRepository.update(lead.id, {
        assignedTo: bestManager.id
      });
      
      await this.notificationService.notifyLeadAssignment(lead, bestManager);
    }
  }
};
```

## 🧪 Тестирование

### Покрытие тестами (6 тестов)

1. **contacts.test.ts** - Управление контактами
   - CRUD операции
   - Поиск и фильтрация
   - Валидация данных
   - Дедупликация

2. **leads.test.ts** - Управление лидами
   - Создание и обновление лидов
   - Смена этапов
   - Расчет воронки продаж
   - Автоназначение

3. **campaigns.test.ts** - Маркетинговые кампании
   - Создание кампаний
   - Отправка сообщений
   - Отслеживание метрик
   - A/B тестирование

4. **segments.test.ts** - Сегментация
   - Создание сегментов
   - Динамическое обновление
   - Критерии фильтрации
   - Анализ сегментов

5. **automation.test.ts** - Автоматизация
   - Создание workflow
   - Выполнение шагов
   - Условная логика
   - Обработка ошибок

6. **analytics.test.ts** - Аналитика
   - Расчет метрик
   - Генерация отчетов
   - Анализ трендов
   - Производительность команды

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
PORT=3008
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/crm_service_db

# Redis
REDIS_URL=redis://localhost:6379

# Email сервисы
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@thailand-marketplace.com
AWS_SES_ACCESS_KEY=your-aws-access-key
AWS_SES_SECRET_KEY=your-aws-secret-key
AWS_SES_REGION=ap-southeast-1

# SMS сервисы
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
AWS_SNS_ACCESS_KEY=your-aws-access-key
AWS_SNS_SECRET_KEY=your-aws-secret-key

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
DATADOG_API_KEY=your-datadog-key

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
- **SendGrid/AWS SES**: Email маркетинг
- **Twilio/AWS SNS**: SMS рассылки
- **Google Analytics**: Веб-аналитика
- **Facebook Pixel**: Ретаргетинг
- **Google Ads**: Отслеживание конверсий
- **Zapier**: Интеграция с внешними системами

## 📊 Мониторинг и метрики

### Ключевые метрики
```typescript
interface CRMMetrics {
  // Лиды
  totalLeads: number;
  newLeadsToday: number;
  qualifiedLeadsRate: number;
  conversionRate: number;
  averageSalesCycle: number;
  
  // Контакты
  totalContacts: number;
  activeContacts: number;
  contactGrowthRate: number;
  
  // Кампании
  activeCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
  campaignROI: number;
  
  // Команда
  averageResponseTime: number;
  taskCompletionRate: number;
  teamProductivity: number;
  
  // Доходы
  totalRevenue: number;
  averageDealSize: number;
  revenueGrowthRate: number;
}
```

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