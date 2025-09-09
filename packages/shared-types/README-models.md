# Thailand Marketplace - Enhanced Data Models

## 🎯 Overview

Расширенная система типов данных для Thailand Marketplace, поддерживающая
универсальную торговую площадку для любых товаров и услуг.

## 📋 Основные модели

### 🚗 Vehicle Types (`vehicle.ts`)

Универсальная модель для всех видов транспорта:

#### Поддерживаемые типы транспорта:

- **Скутеры** (SCOOTER) - Honda PCX, Yamaha NMAX, etc.
- **Мотоциклы** (MOTORCYCLE) - Yamaha R3, Kawasaki Ninja, etc.
- **Автомобили** (CAR) - седаны, хэтчбеки, внедорожники
- **Велосипеды** (BICYCLE) - горные, городские, электро
- **Грузовики** (TRUCK) - пикапы, фургоны
- **Лодки** (BOAT) - скоростные, рыболовные
- **Гидроциклы** (JET_SKI)
- **Квадроциклы** (ATV)

#### Ключевые особенности:

```typescript
interface Vehicle {
  // Базовая информация
  type: VehicleType
  category: VehicleCategory // economy, premium, luxury, sport
  condition: VehicleCondition // new, excellent, good, fair
  status: VehicleStatus // available, rented, maintenance

  // Детальные характеристики
  specifications: VehicleSpecifications
  documents: VehicleDocuments // номера, страховка, техосмотр
  maintenance: VehicleMaintenance // история обслуживания
  pricing: VehiclePricing // гибкая система ценообразования
  location: VehicleLocation // локация и доставка
}
```

#### Система ценообразования:

- **Базовые тарифы**: почасовая, дневная, недельная, месячная аренда
- **Сезонные цены**: высокий/низкий сезон
- **Скидки за длительность**: 4-7 дней, 8-14 дней, месячная аренда
- **Дополнительные расходы**: залог, страховка, доставка, топливо

#### Система обслуживания:

- **История ТО**: даты, пробег, следующее обслуживание
- **Состояние компонентов**: масла, тормоза, фильтры, свечи
- **Аксессуары**: шлемы, замки, зарядки, GPS-трекеры

### 📦 Product Types (`product.ts`)

Универсальная модель для любых товаров:

#### Поддерживаемые категории:

- **Электроника** (ELECTRONICS) - смартфоны, ноутбуки, камеры
- **Мебель** (FURNITURE) - диваны, столы, кровати
- **Одежда** (CLOTHING) - рубашки, платья, обувь
- **Спорт** (SPORTS) - велосипеды, серфборды, снаряжение
- **Инструменты** (TOOLS) - дрели, пилы, измерительные приборы
- **Книги** (BOOKS) - учебники, художественная литература
- **Дом и сад** (HOME_GARDEN) - растения, декор, садовый инвентарь
- **Ювелирные изделия** (JEWELRY)
- **Игрушки** (TOYS)
- **Здоровье и красота** (HEALTH_BEAUTY)
- **Еда и напитки** (FOOD_BEVERAGE)
- **Недвижимость** (REAL_ESTATE)

#### Ключевые особенности:

```typescript
interface Product {
  // Базовая информация
  type: ProductType
  category: string // конкретная категория
  condition: ProductCondition // new, like_new, excellent, good
  status: ProductStatus // active, sold, rented, reserved
  listingType: ProductListingType // sale, rent, both, service

  // Детальная информация
  specifications: ProductSpecifications // гибкие характеристики
  pricing: ProductPricing // цены, скидки, рассрочка
  availability: ProductAvailability // наличие, доставка
  seller: ProductSeller // информация о продавце
}
```

#### Гибкая система характеристик:

- **Технические спецификации**: любые ключ-значение пары
- **Физические свойства**: размеры, вес, материал, цвет
- **Комплектация**: что входит в комплект
- **Гарантия**: тип, срок, поддержка

#### Система ценообразования:

- **Типы цен**: фиксированная, договорная, аукцион, по запросу
- **Аренда**: почасовая, дневная, недельная, месячная
- **Аукцион**: стартовая ставка, резервная цена, шаг торгов
- **Рассрочка**: беспроцентная, с процентами, разные сроки
- **Оптовые цены**: скидки за количество

### 👤 Customer Profile (`user.ts`)

Расширенный профиль клиента для международного рынка:

#### Документы и верификация:

```typescript
interface CustomerProfile extends User {
  // Документы удостоверения личности
  passportNumber?: string
  passportExpiry?: string
  passportCountry?: string
  nationalId?: string
  drivingLicense?: string
  drivingLicenseExpiry?: string

  // Контактная информация
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }

  // Уровень верификации
  verificationLevel: "none" | "basic" | "verified" | "premium"
  verificationDocuments: {
    passport: boolean
    drivingLicense: boolean
    nationalId: boolean
    proofOfAddress: boolean
    creditCheck: boolean
  }
}
```

#### История аренды и предпочтения:

- **Статистика**: общее количество аренд, потраченная сумма, рейтинг
- **Предпочтения**: типы транспорта, ценовой диапазон, локации
- **Коммуникации**: email, SMS, WhatsApp, Telegram, LINE
- **Платежи**: карты, банковские переводы, цифровые кошельки, криптовалюты

#### Система доверия:

- **Оценка риска**: числовой скор от 0 до 100
- **Черный список**: статус и причина блокировки
- **Маркетинг**: согласие на рекламу, реферальные коды

## 🔗 Интеграция с существующими типами

### Листинги (`listing.ts`)

Обновленные типы листингов с поддержкой новых категорий:

```typescript
// Специализированный листинг для транспорта
interface VehicleListing extends Listing {
  category: ListingCategory.VEHICLES
  vehicleType: VehicleType
  vehicle: Vehicle
  rentalTerms?: {
    minimumAge: number
    licenseRequired: boolean
    depositRequired: boolean
    insuranceIncluded: boolean
    fuelPolicy: string
    mileageLimit?: number
    restrictions?: string[]
  }
}

// Специализированный листинг для товаров
interface ProductListing extends Listing {
  category: ListingCategory.PRODUCTS
  productType: ProductType
  product: Product
  shippingOptions?: {
    localDelivery: boolean
    nationalShipping: boolean
    internationalShipping: boolean
    pickupAvailable: boolean
    shippingCost?: number
    freeShippingThreshold?: number
  }
}
```

## 🛠️ Валидация и константы

### Правила валидации:

```typescript
export const VEHICLE_VALIDATION = {
  SPECIFICATIONS: {
    MAKE: { MIN_LENGTH: 2, MAX_LENGTH: 50 },
    MODEL: { MIN_LENGTH: 1, MAX_LENGTH: 100 },
    YEAR: { MIN: 1900, MAX: new Date().getFullYear() + 2 },
  },
  PRICING: {
    MIN_PRICE: 0.01,
    MAX_PRICE: 1000000,
    MIN_DEPOSIT: 0,
    MAX_DEPOSIT: 100000,
  },
  IMAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
  },
}

export const PRODUCT_VALIDATION = {
  TITLE: { MIN_LENGTH: 5, MAX_LENGTH: 200 },
  DESCRIPTION: { MIN_LENGTH: 20, MAX_LENGTH: 5000 },
  IMAGES: { MIN_COUNT: 1, MAX_COUNT: 30 },
  TAGS: { MIN_COUNT: 1, MAX_COUNT: 20 },
  PRICE: { MIN_AMOUNT: 0.01, MAX_AMOUNT: 10000000 },
}
```

## 🚀 Примеры использования

### Создание листинга скутера:

```typescript
const scooterListing: VehicleListing = {
  category: ListingCategory.VEHICLES,
  vehicleType: VehicleType.SCOOTER,
  vehicle: {
    specifications: {
      make: "Honda",
      model: "PCX 150",
      year: 2022,
      fuelType: FuelType.GASOLINE,
      transmission: TransmissionType.CVT,
      // ... другие характеристики
    },
    pricing: {
      dailyRate: 800,
      weeklyRate: 5000,
      monthlyRate: 18000,
      securityDeposit: 5000,
      currency: "THB",
    },
    // ... остальные поля
  },
  rentalTerms: {
    minimumAge: 18,
    licenseRequired: true,
    depositRequired: true,
    insuranceIncluded: true,
    fuelPolicy: "full_to_full",
  },
}
```

### Создание листинга товара:

```typescript
const productListing: ProductListing = {
  category: ListingCategory.PRODUCTS,
  productType: ProductType.ELECTRONICS,
  product: {
    title: "iPhone 15 Pro Max 256GB",
    type: ProductType.ELECTRONICS,
    condition: ProductCondition.NEW,
    listingType: ProductListingType.SALE,
    pricing: {
      price: 45000,
      currency: "THB",
      priceType: "fixed",
      installmentAvailable: true,
    },
    // ... остальные поля
  },
  shippingOptions: {
    localDelivery: true,
    nationalShipping: true,
    pickupAvailable: true,
    freeShippingThreshold: 50000,
  },
}
```

## ✅ Готово к использованию

Все типы протестированы и готовы для интеграции в:

- ✅ **Listing Service** - создание и управление объявлениями
- ✅ **Search Service** - поиск и фильтрация
- ✅ **Booking Service** - бронирование и аренда
- ✅ **User Service** - управление профилями клиентов
- ✅ **Payment Service** - обработка платежей
- ✅ **Admin Panel** - модерация и управление

Система поддерживает любые типы товаров и услуг, от скутеров до недвижимости! 🎉
