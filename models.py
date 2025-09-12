from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone


class Customer(models.Model):
    """
    Модель клиента для системы аренды мотоциклов.
    Клиент идентифицируется по номеру телефона и/или Telegram ID.
    """
    # Основная информация о клиенте
    name = models.CharField(
        max_length=200,
        verbose_name="Имя клиента",
        help_text="Полное имя клиента"
    )

    # Контактная информация для идентификации
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
        verbose_name="Номер телефона",
        help_text="Основной способ идентификации клиента"
    )

    telegram_id = models.BigIntegerField(
        null=True,
        blank=True,
        unique=True,
        verbose_name="Telegram ID",
        help_text="ID пользователя в Telegram для чат-бота"
    )

    telegram_username = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Telegram Username",
        help_text="@username в Telegram"
    )

    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    # Статус клиента
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активный клиент",
        help_text="Может ли клиент арендовать скутеры"
    )

    # Дополнительная информация
    notes = models.TextField(
        blank=True,
        verbose_name="Заметки",
        help_text="Дополнительная информация о клиенте"
    )

    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['telegram_id']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone_number})"

    def get_identifier(self):
        """Возвращает основной идентификатор клиента"""
        return self.telegram_id if self.telegram_id else self.phone_number


class Scooter(models.Model):
    """
    Модель скутера/мотоцикла для аренды.
    Содержит всю техническую информацию и данные о техническом обслуживании.
    """
    # Основные характеристики
    model = models.CharField(
        max_length=100,
        verbose_name="Модель",
        help_text="Модель скутера/мотоцикла"
    )

    power = models.CharField(
        max_length=50,
        verbose_name="Мощность",
        help_text="Мощность двигателя (например, 125cc, 150cc)"
    )

    year = models.PositiveIntegerField(
        verbose_name="Год выпуска",
        help_text="Год производства"
    )

    color = models.CharField(
        max_length=50,
        verbose_name="Цвет",
        help_text="Цвет скутера"
    )

    # Идентификация
    old_scooter_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Номер скутера (старый)",
        help_text="Старый номер для идентификации"
    )

    # Наклейки и маркировка
    sticker = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Наклейка",
        help_text="Информация о наклейке на скутере"
    )

    rental_sticker = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Наклейка о аренде",
        help_text="Наклейка с информацией об аренде"
    )

    # Фотографии
    main_photo = models.ImageField(
        upload_to='scooters/main/',
        null=True,
        blank=True,
        verbose_name="Главное фото",
        help_text="Основная фотография скутера"
    )

    photo_link = models.URLField(
        blank=True,
        verbose_name="Ссылка на фото",
        help_text="Ссылка на дополнительные фотографии"
    )

    # GPS трекинг
    sinotrack_gps = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Sinotrack GPS",
        help_text="ID GPS трекера Sinotrack"
    )

    # Статус
    is_available = models.BooleanField(
        default=True,
        verbose_name="Доступен для аренды",
        help_text="Может ли скутер быть арендован"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата добавления"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Скутер"
        verbose_name_plural = "Скутеры"
        ordering = ['model', 'year']
        indexes = [
            models.Index(fields=['old_scooter_number']),
            models.Index(fields=['is_available']),
        ]

    def __str__(self):
        return f"{self.model} {self.year} ({self.old_scooter_number})"


class ScooterMaintenance(models.Model):
    """
    Модель для отслеживания технического обслуживания скутеров.
    Содержит информацию о замене масла, тормозов, фильтров и других компонентов.
    """
    scooter = models.OneToOneField(
        Scooter,
        on_delete=models.CASCADE,
        related_name='maintenance',
        verbose_name="Скутер"
    )

    # Замена жидкостей и расходников (в километрах)
    engine_oil_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Масло двигателя (км)",
        help_text="Пробег при последней замене масла двигателя"
    )

    gear_oil_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Масло коробки (км)",
        help_text="Пробег при последней замене масла коробки передач"
    )

    radiator_water_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Вода радиатор (км)",
        help_text="Пробег при последней замене охлаждающей жидкости"
    )

    # Тормозная система
    front_brakes_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Тормоза передние (км)",
        help_text="Пробег при последней замене передних тормозных колодок"
    )

    rear_brakes_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Тормоза задние (км)",
        help_text="Пробег при последней замене задних тормозных колодок"
    )

    # Фильтры и свечи
    air_filter_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Воздушный фильтр (км)",
        help_text="Пробег при последней замене воздушного фильтра"
    )

    spark_plugs_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Свечи (км)",
        help_text="Пробег при последней замене свечей зажигания"
    )

    # Документы (даты)
    tech_inspection_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Тех талон дата",
        help_text="Дата технического осмотра"
    )

    insurance_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Страховка дата",
        help_text="Дата окончания страховки"
    )

    # Компоненты и аксессуары
    cigarette_lighter = models.BooleanField(
        default=False,
        verbose_name="Прикуриватель",
        help_text="Наличие прикуривателя"
    )

    front_bearing = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Передний подшипник",
        help_text="Состояние переднего подшипника"
    )

    rear_bearing = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Задний подшипник",
        help_text="Состояние заднего подшипника"
    )

    front_tire = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Резина передняя",
        help_text="Состояние передней резины"
    )

    rear_tire = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Резина задняя",
        help_text="Состояние задней резины"
    )

    battery = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Батарея",
        help_text="Состояние аккумулятора"
    )

    belt = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Ремень",
        help_text="Состояние ремня вариатора"
    )

    starter = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Стартер",
        help_text="Состояние стартера"
    )

    gasket = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Прокладка",
        help_text="Состояние прокладок"
    )

    water = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Вода",
        help_text="Уровень и состояние охлаждающей жидкости"
    )

    # Дата последнего обслуживания
    last_service_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата последнего ТО",
        help_text="Дата последнего технического обслуживания"
    )

    replacement_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата замены",
        help_text="Дата замены компонентов"
    )

    class Meta:
        verbose_name = "Техническое обслуживание"
        verbose_name_plural = "Техническое обслуживание"

    def __str__(self):
        return f"ТО для {self.scooter}"


class Rental(models.Model):
    """
    Модель аренды, связывающая клиента и скутер.
    Содержит информацию о периоде аренды и условиях.
    """
    RENTAL_STATUS_CHOICES = [
        ('active', 'Активная аренда'),
        ('completed', 'Завершена'),
        ('cancelled', 'Отменена'),
        ('overdue', 'Просрочена'),
    ]

    # Связи
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='rentals',
        verbose_name="Клиент"
    )

    scooter = models.ForeignKey(
        Scooter,
        on_delete=models.CASCADE,
        related_name='rentals',
        verbose_name="Скутер"
    )

    # Даты аренды
    start_date = models.DateTimeField(
        verbose_name="Начало аренды",
        help_text="Дата и время начала аренды"
    )

    end_date = models.DateTimeField(
        verbose_name="Конец аренды",
        help_text="Планируемая дата и время окончания аренды"
    )

    actual_end_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Фактическое окончание",
        help_text="Фактическая дата возврата скутера"
    )

    # Статус и условия
    status = models.CharField(
        max_length=20,
        choices=RENTAL_STATUS_CHOICES,
        default='active',
        verbose_name="Статус аренды"
    )

    daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Дневная ставка",
        help_text="Стоимость аренды за день"
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Общая сумма",
        help_text="Итоговая стоимость аренды"
    )

    deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Залог",
        help_text="Размер залога"
    )

    # Дополнительная информация
    notes = models.TextField(
        blank=True,
        verbose_name="Заметки",
        help_text="Дополнительная информация об аренде"
    )

    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Аренда"
        verbose_name_plural = "Аренды"
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.customer.name} - {self.scooter} ({self.start_date.date()})"

    def duration_days(self):
        """Возвращает продолжительность аренды в днях"""
        end = self.actual_end_date or self.end_date
        return (end.date() - self.start_date.date()).days + 1

    def is_overdue(self):
        """Проверяет, просрочена ли аренда"""
        if self.status == 'active' and self.end_date < timezone.now():
            return True
        return False


class PricingTier(models.Model):
    """
    Модель тарифов для различных периодов аренды и сезонов.
    Содержит все ценовые категории согласно требованиям.
    """
    PERIOD_CHOICES = [
        ('1_year', '1 год аренды'),
        ('6_month_high', '6 месяцев высокий сезон'),
        ('6_month_low', '6 месяцев низкий сезон'),
        ('1_3_days', '1-3 дня'),
        ('4_7_days', '4-7 дней'),
        ('7_14_days', '7-14 дней'),
        ('15_25_days', '15-25 дней'),
    ]

    MONTH_CHOICES = [
        ('december', 'Декабрь'),
        ('january', 'Январь'),
        ('february', 'Февраль'),
        ('march', 'Март'),
        ('april', 'Апрель'),
        ('may', 'Май'),
        ('summer', 'Лето'),
        ('september', 'Сентябрь'),
        ('october', 'Октябрь'),
        ('november', 'Ноябрь'),
    ]

    # Связь со скутером (может быть общий тариф или индивидуальный)
    scooter = models.ForeignKey(
        Scooter,
        on_delete=models.CASCADE,
        related_name='pricing_tiers',
        null=True,
        blank=True,
        verbose_name="Скутер",
        help_text="Оставьте пустым для общего тарифа"
    )

    # Основная цена
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Базовая цена",
        help_text="Основная цена за день"
    )

    # Долгосрочная аренда
    one_year_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="1 год аренды",
        help_text="Цена за год аренды"
    )

    six_month_high_season = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="6 месяцев высокий сезон",
        help_text="Цена за 6 месяцев в высокий сезон"
    )

    six_month_low_season = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="6 месяцев низкий сезон",
        help_text="Цена за 6 месяцев в низкий сезон"
    )

    # Краткосрочная аренда
    days_1_3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="1-3 дня",
        help_text="Цена за день при аренде 1-3 дня"
    )

    days_4_7 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="4-7 дней",
        help_text="Цена за день при аренде 4-7 дней"
    )

    days_7_14 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="7-14 дней",
        help_text="Цена за день при аренде 7-14 дней"
    )

    days_15_25 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="15-25 дней",
        help_text="Цена за день при аренде 15-25 дней"
    )

    # Сезонные цены
    december_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Декабрь",
        help_text="Цена в декабре"
    )

    january_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Январь",
        help_text="Цена в январе"
    )

    february_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Февраль",
        help_text="Цена в феврале"
    )

    march_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Март",
        help_text="Цена в марте"
    )

    april_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Апрель",
        help_text="Цена в апреле"
    )

    may_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Май",
        help_text="Цена в мае"
    )

    summer_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Лето",
        help_text="Цена летом"
    )

    september_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Сентябрь",
        help_text="Цена в сентябре"
    )

    october_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Октябрь",
        help_text="Цена в октябре"
    )

    november_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Ноябрь",
        help_text="Цена в ноябре"
    )

    # Метаданные
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активный тариф",
        help_text="Используется ли этот тариф"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Тариф"
        verbose_name_plural = "Тарифы"
        ordering = ['scooter', '-created_at']

    def __str__(self):
        if self.scooter:
            return f"Тариф для {self.scooter}"
        return f"Общий тариф (базовая цена: {self.base_price})"

    def get_price_for_duration(self, days):
        """Возвращает цену за день в зависимости от продолжительности аренды"""
        if days <= 3:
            return self.days_1_3 or self.base_price
        elif days <= 7:
            return self.days_4_7 or self.base_price
        elif days <= 14:
            return self.days_7_14 or self.base_price
        elif days <= 25:
            return self.days_15_25 or self.base_price
        else:
            return self.base_price


class ChatHistory(models.Model):
    """
    Модель для хранения истории переписки с клиентами.
    Используется DeepSeek для контекстных ответов.
    """
    PLATFORM_CHOICES = [
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('phone', 'Телефон'),
        ('email', 'Email'),
        ('other', 'Другое'),
    ]

    MESSAGE_TYPE_CHOICES = [
        ('incoming', 'Входящее'),
        ('outgoing', 'Исходящее'),
        ('system', 'Системное'),
    ]

    # Связь с клиентом
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='chat_history',
        verbose_name="Клиент"
    )

    # Информация о сообщении
    platform = models.CharField(
        max_length=20,
        choices=PLATFORM_CHOICES,
        verbose_name="Платформа",
        help_text="Платформа, через которую было отправлено сообщение"
    )

    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        verbose_name="Тип сообщения"
    )

    message_text = models.TextField(
        verbose_name="Текст сообщения",
        help_text="Содержание сообщения"
    )

    # Метаданные сообщения
    external_message_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Внешний ID сообщения",
        help_text="ID сообщения в внешней системе (Telegram, WhatsApp)"
    )

    sender_name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name="Имя отправителя",
        help_text="Имя отправителя (если отличается от клиента)"
    )

    # Контекст для DeepSeek
    context_summary = models.TextField(
        blank=True,
        verbose_name="Краткое содержание",
        help_text="Краткое содержание для DeepSeek контекста"
    )

    is_processed_by_ai = models.BooleanField(
        default=False,
        verbose_name="Обработано ИИ",
        help_text="Было ли сообщение обработано DeepSeek"
    )

    ai_response = models.TextField(
        blank=True,
        verbose_name="Ответ ИИ",
        help_text="Ответ, сгенерированный DeepSeek"
    )

    # Временные метки
    message_timestamp = models.DateTimeField(
        verbose_name="Время сообщения",
        help_text="Время отправки/получения сообщения"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания записи"
    )

    # Дополнительные данные
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Дополнительные данные",
        help_text="JSON с дополнительной информацией о сообщении"
    )

    class Meta:
        verbose_name = "История чата"
        verbose_name_plural = "История чатов"
        ordering = ['-message_timestamp']
        indexes = [
            models.Index(fields=['customer', 'message_timestamp']),
            models.Index(fields=['platform', 'message_type']),
            models.Index(fields=['is_processed_by_ai']),
        ]

    def __str__(self):
        return f"{self.customer.name} - {self.platform} ({self.message_timestamp.date()})"

    def get_context_for_ai(self):
        """Возвращает контекст сообщения для DeepSeek"""
        return {
            'customer_name': self.customer.name,
            'customer_phone': self.customer.phone_number,
            'platform': self.platform,
            'message_type': self.message_type,
            'message_text': self.message_text,
            'context_summary': self.context_summary,
            'timestamp': self.message_timestamp.isoformat(),
        }


class ScooterRentalRecord(models.Model):
    """
    Единая модель для всех данных о скутере, аренде и обслуживании
    Все поля в одной таблице для удобного редактирования
    """
    # Основные характеристики скутера
    power = models.CharField(
        max_length=50,
        verbose_name="Power",
        help_text="Мощность двигателя"
    )

    model = models.CharField(
        max_length=100,
        verbose_name="Model",
        help_text="Модель скутера"
    )

    year = models.PositiveIntegerField(
        verbose_name="Year",
        help_text="Год выпуска"
    )

    # Клиент
    customer_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Имя клиента",
        help_text="Имя арендатора"
    )

    # Наклейки
    sticker = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Наклейка",
        help_text="Информация о наклейке"
    )

    # Аренда
    rental_start = models.DateField(
        null=True,
        blank=True,
        verbose_name="Начало аренды",
        help_text="Дата начала аренды"
    )

    rental_end = models.DateField(
        null=True,
        blank=True,
        verbose_name="Конец аренды",
        help_text="Дата окончания аренды"
    )

    # Номера
    customer_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Номер клиента",
        help_text="Телефон клиента"
    )

    old_scooter_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Номер скутера (старый)",
        help_text="Старый номер скутера"
    )

    # Техническое обслуживание
    replacement_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата замены",
        help_text="Дата последней замены"
    )

    engine_oil_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Масло движ км",
        help_text="Пробег замены масла двигателя"
    )

    gear_oil = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Gear oil",
        help_text="Масло коробки передач"
    )

    radiator_water = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Вода радиатор",
        help_text="Охлаждающая жидкость"
    )

    front_brakes_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Тормоза передние км",
        help_text="Пробег замены передних тормозов"
    )

    rear_brakes_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Тормоза задние км",
        help_text="Пробег замены задних тормозов"
    )

    air_filter_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Воздушный фильтр км",
        help_text="Пробег замены воздушного фильтра"
    )

    spark_plugs_km = models.PositiveIntegerField(
        default=0,
        verbose_name="Свечи км",
        help_text="Пробег замены свечей"
    )

    # Документы
    tech_inspection_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Тех талон дата",
        help_text="Дата технического осмотра"
    )

    insurance_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Страховка дата",
        help_text="Дата окончания страховки"
    )

    # Компоненты
    cigarette_lighter = models.BooleanField(
        default=False,
        verbose_name="Прикуриватель",
        help_text="Наличие прикуривателя"
    )

    front_bearing = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Передний подшипник",
        help_text="Состояние переднего подшипника"
    )

    rear_bearing = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Задний подшипник",
        help_text="Состояние заднего подшипника"
    )

    front_tire = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Резина передняя",
        help_text="Состояние передней резины"
    )

    rear_tire = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Резина задняя",
        help_text="Состояние задней резины"
    )

    rental_sticker = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Наклейка о аренде",
        help_text="Наклейка с информацией об аренде"
    )

    battery = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Батарея",
        help_text="Состояние аккумулятора"
    )

    belt = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Ремень",
        help_text="Состояние ремня"
    )

    starter = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Стартер",
        help_text="Состояние стартера"
    )

    gasket = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Прокладка",
        help_text="Состояние прокладок"
    )

    water = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Вода",
        help_text="Уровень воды"
    )

    sinotrack_gps = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Sinotrack GPS",
        help_text="ID GPS трекера"
    )

    rear_disc_needs_replacement = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Задний диск",
        help_text="Задний диск надо менять. чтоб задний тормоз не скрипел. но вроде не скрипит"
    )

    color = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Цвет",
        help_text="Цвет скутера"
    )

    # Фотографии
    main_photo = models.ImageField(
        upload_to='scooters/main/',
        null=True,
        blank=True,
        verbose_name="Главное фото",
        help_text="Основная фотография"
    )

    photo_link = models.URLField(
        blank=True,
        verbose_name="Ссылка на фото",
        help_text="Ссылка на дополнительные фото"
    )

    # Цены
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Price",
        help_text="Базовая цена"
    )

    one_year_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="1 year rent",
        help_text="Цена за год"
    )

    six_month_high_season = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="6 month high season",
        help_text="6 месяцев высокий сезон"
    )

    six_month_low_season = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="6 month low season",
        help_text="6 месяцев низкий сезон"
    )

    days_1_3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="1-3 days",
        help_text="Цена за 1-3 дня"
    )

    days_4_7 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="4-7 days",
        help_text="Цена за 4-7 дней"
    )

    days_7_14 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="7-14 days",
        help_text="Цена за 7-14 дней"
    )

    days_15_25 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="15-25 day",
        help_text="Цена за 15-25 дней"
    )

    # Сезонные цены
    december_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="December",
        help_text="Цена в декабре"
    )

    january_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="January",
        help_text="Цена в январе"
    )

    february_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="February",
        help_text="Цена в феврале"
    )

    march_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="March",
        help_text="Цена в марте"
    )

    april_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="April",
        help_text="Цена в апреле"
    )

    may_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="May",
        help_text="Цена в мае"
    )

    summer_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Summer",
        help_text="Цена летом"
    )

    september_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="September",
        help_text="Цена в сентябре"
    )

    october_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="October",
        help_text="Цена в октябре"
    )

    november_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="November",
        help_text="Цена в ноябре"
    )

    # Метаданные
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Запись о скутере"
        verbose_name_plural = "Записи о скутерах"
        ordering = ['old_scooter_number']

    def __str__(self):
        return f"{self.model} {self.year} ({self.old_scooter_number})"


class CustomerCommunications(models.Model):
    """
    Модель для хранения всех входящих коммуникаций с клиентами.
    Отдельная таблица для тестирования интеграции DeepSeek с множественными источниками данных.
    """
    # Основная информация о клиенте
    name = models.CharField(
        max_length=200,
        verbose_name="Имя клиента",
        help_text="Имя клиента из коммуникации"
    )

    # Контактная информация
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        verbose_name="Номер телефона",
        help_text="Номер телефона клиента"
    )

    telegram_username = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Telegram Username",
        help_text="@username в Telegram"
    )

    # Статус клиента
    is_client = models.BooleanField(
        default=False,
        verbose_name="Является клиентом",
        help_text="Отметка о том, что это активный клиент"
    )

    # История аренды
    has_rented_before = models.BooleanField(
        default=False,
        verbose_name="Арендовал скутер ранее?",
        help_text="Отметка о том, что клиент уже арендовал скутеры ранее"
    )

    # История общения
    chat_history = models.TextField(
        blank=True,
        verbose_name="История чата",
        help_text="Текстовое поле для хранения всех сообщений клиента"
    )

    # Информация об общении с менеджером
    manager_communication_info = models.TextField(
        blank=True,
        verbose_name="Информация об общении с менеджером",
        help_text="Подробная информация о всех взаимодействиях с менеджером: звонки, встречи, договоренности, особые требования и т.д."
    )

    # Дополнительные поля для связи с основной системой
    related_customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='communications',
        verbose_name="Связанный клиент",
        help_text="Связь с основной таблицей клиентов"
    )

    # Метаданные
    first_contact_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата первого контакта"
    )

    last_contact_date = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата последнего контакта"
    )

    # Дополнительная информация
    notes = models.TextField(
        blank=True,
        verbose_name="Заметки",
        help_text="Дополнительные заметки о коммуникации"
    )

    communication_platform = models.CharField(
        max_length=50,
        choices=[
            ('telegram', 'Telegram'),
            ('whatsapp', 'WhatsApp'),
            ('phone', 'Телефон'),
            ('email', 'Email'),
            ('website', 'Веб-сайт'),
            ('other', 'Другое'),
        ],
        default='telegram',
        verbose_name="Платформа общения",
        help_text="Основная платформа для общения с клиентом"
    )

    class Meta:
        verbose_name = "Коммуникация с клиентом"
        verbose_name_plural = "Коммуникации с клиентами"
        ordering = ['-last_contact_date']
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['telegram_username']),
            models.Index(fields=['is_client']),
            models.Index(fields=['communication_platform']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone_number}) - {self.communication_platform}"

    def get_recent_messages(self, limit=5):
        """Возвращает последние сообщения из истории чата"""
        if not self.chat_history:
            return []

        # Простое разделение по строкам для демонстрации
        messages = self.chat_history.split('\n')
        return messages[-limit:] if messages else []

    def add_message(self, message, sender='customer'):
        """Добавляет новое сообщение в историю чата"""
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        new_message = f"[{timestamp}] {sender}: {message}"

        if self.chat_history:
            self.chat_history += f"\n{new_message}"
        else:
            self.chat_history = new_message

        self.save()


class DeepSeekPromptTemplate(models.Model):
    """
    Модель для хранения и управления промптами DeepSeek AI
    """
    name = models.CharField(
        max_length=200,
        verbose_name="Название промпта",
        help_text="Краткое название для идентификации промпта"
    )

    description = models.TextField(
        blank=True,
        verbose_name="Описание",
        help_text="Описание назначения и особенностей промпта"
    )

    system_prompt = models.TextField(
        verbose_name="Системный промпт",
        help_text="Основной системный промпт для DeepSeek AI"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Активный",
        help_text="Использовать этот промпт по умолчанию"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Промпт DeepSeek AI"
        verbose_name_plural = "Промпты DeepSeek AI"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} {'(активный)' if self.is_active else ''}"

    def save(self, *args, **kwargs):
        # Если этот промпт становится активным, деактивируем остальные
        if self.is_active:
            DeepSeekPromptTemplate.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_prompt(cls):
        """Получить активный промпт"""
        return cls.objects.filter(is_active=True).first()

    @classmethod
    def get_default_prompt(cls):
        """Получить промпт по умолчанию или создать его"""
        active_prompt = cls.get_active_prompt()
        if active_prompt:
            return active_prompt

        # Создаем промпт по умолчанию, если его нет
        default_prompt = cls.objects.create(
            name="Стандартный промпт консультанта",
            description="Базовый промпт для консультации по аренде скутеров",
            system_prompt="""Вы - профессиональный консультант по аренде мотоциклов и скутеров в Таиланде.

Ваши задачи:
- Помогать клиентам выбрать подходящий скутер
- Предоставлять точную информацию о ценах и условиях аренды
- Учитывать историю общения с клиентом
- Быть дружелюбным и профессиональным
- Предлагать несколько вариантов скутеров, если они доступны

Отвечайте на русском языке, используйте эмодзи для дружелюбности.""",
            is_active=True
        )
        return default_prompt
