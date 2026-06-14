import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ImageUploader } from "../components/listings"
import { Button, Input, Select, Textarea } from "../components/ui"
import { listingsService } from "../lib/api/services/listings"

// ─── Types ──────────────────────────────────────────────────────────────────

type Category = "vehicles" | "products" | "services" | "real_estate"
type ListingType = "rent" | "sell"
type PricePeriod = "day" | "week" | "month" | ""
type Currency = "THB" | "USD"
type Condition = "new" | "used" | ""

interface FormData {
  // Step 1
  category: Category | ""
  listingType: ListingType
  // Step 2
  title: string
  description: string
  price: string
  currency: Currency
  pricePeriod: PricePeriod
  // Step 3
  images: string[]
  // Step 4
  province: string
  address: string
  condition: Condition
  phone: string
}

const INITIAL: FormData = {
  category: "",
  listingType: "rent",
  title: "",
  description: "",
  price: "",
  currency: "THB",
  pricePeriod: "day",
  images: [],
  province: "",
  address: "",
  condition: "",
  phone: "",
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; icon: string; comingSoon?: boolean }[] = [
  { id: "vehicles", label: "Транспорт", icon: "🚗" },
  { id: "products", label: "Товары", icon: "📦" },
  { id: "services", label: "Услуги", icon: "🛠️" },
  { id: "real_estate", label: "Недвижимость", icon: "🏠" },
]

const PROVINCES = [
  "Бангкок",
  "Пхукет",
  "Чиангмай",
  "Паттайя",
  "Самуи",
  "Краби",
  "Чианграй",
  "Хуахин",
  "Ко Чанг",
  "Удон Тхани",
  "Кхон Каен",
  "Накхон Ратчасима",
  "Хат Яй",
  "Аюттхая",
  "Канчанабури",
].map((p) => ({ value: p, label: p }))

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "THB", label: "฿ THB" },
  { value: "USD", label: "$ USD" },
]

const PERIOD_OPTIONS: { value: PricePeriod; label: string }[] = [
  { value: "day", label: "в день" },
  { value: "week", label: "в неделю" },
  { value: "month", label: "в месяц" },
  { value: "", label: "фиксированная" },
]

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = ["Категория", "Описание", "Фото", "Детали"]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done ? "bg-green-500 text-white" : active ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`mt-1 text-xs ${active ? "text-primary-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-5 transition-colors ${done ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1: Category ────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Выберите категорию</h2>
      <p className="text-sm text-gray-500 mb-6">Что вы хотите разместить?</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            disabled={cat.comingSoon}
            onClick={() => {
              if (!cat.comingSoon) onChange({ category: cat.id })
            }}
            className={[
              "relative flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all",
              cat.comingSoon
                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                : data.category === cat.id
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
            ].join(" ")}
          >
            <span className="text-4xl mb-3">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-800">{cat.label}</span>
            {cat.comingSoon && (
              <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                Скоро
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Тип: аренда / продажа */}
      <div className="mt-8">
        <p className="text-sm font-medium text-gray-700 mb-3">Тип объявления</p>
        <div className="flex gap-3">
          {(["rent", "sell"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ listingType: t })}
              className={[
                "px-5 py-2 rounded-lg border text-sm font-medium transition-colors",
                data.listingType === t
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300",
              ].join(" ")}
            >
              {t === "rent" ? "Аренда" : "Продажа"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!data.category} size="lg">
          Далее →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 2: Basic info ──────────────────────────────────────────────────────

function Step2({
  data,
  onChange,
  onNext,
  onBack,
  errors,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Описание</h2>
        <p className="text-sm text-gray-500 mt-0.5">Расскажите о том, что вы предлагаете</p>
      </div>

      <Input
        label="Заголовок объявления"
        placeholder="Например: Honda PCX 150 в аренду, Пхукет"
        value={data.title}
        onChange={(e) => onChange({ title: e.target.value })}
        error={errors.title}
        maxLength={100}
        helperText={`${data.title.length}/100`}
      />

      <Textarea
        label="Описание"
        placeholder="Подробно опишите что предлагаете: состояние, особенности, что входит в стоимость..."
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        error={errors.description}
        rows={5}
        maxLength={2000}
        helperText={`${data.description.length}/2000 (минимум 20 символов)`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <Input
            label="Цена"
            type="number"
            min="0"
            placeholder="0"
            value={data.price}
            onChange={(e) => onChange({ price: e.target.value })}
            error={errors.price}
          />
        </div>

        <Select
          label="Валюта"
          value={data.currency}
          onChange={(e) => onChange({ currency: e.target.value as Currency })}
          options={CURRENCY_OPTIONS}
        />

        {data.listingType === "rent" && (
          <Select
            label="Период"
            value={data.pricePeriod}
            onChange={(e) => onChange({ pricePeriod: e.target.value as PricePeriod })}
            options={PERIOD_OPTIONS}
          />
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <Button onClick={onNext} size="lg">
          Далее →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Photos ──────────────────────────────────────────────────────────

function Step3({
  data,
  onChange,
  onNext,
  onBack,
  errors,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Фотографии</h2>
        <p className="text-sm text-gray-500 mt-0.5">Объявления с фото получают в 3 раза больше откликов</p>
      </div>

      <ImageUploader value={data.images} onChange={(images) => onChange({ images })} max={20} />
      {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <Button onClick={onNext} size="lg">
          Далее →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 4: Details + submit ─────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  onSubmit,
  onBack,
  errors,
  submitting,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  onSubmit: () => void
  onBack: () => void
  errors: Partial<Record<keyof FormData, string>>
  submitting: boolean
}) {
  const showCondition = data.category === "vehicles" || data.category === "products"
  const showRealEstate = data.category === "real_estate"

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Детали</h2>
        <p className="text-sm text-gray-500 mt-0.5">Укажите местоположение и контактные данные</p>
      </div>

      <Select
        label="Провинция"
        placeholder="Выберите провинцию"
        value={data.province}
        onChange={(e) => onChange({ province: e.target.value })}
        options={PROVINCES}
        error={errors.province}
      />

      <Input
        label="Адрес / район"
        placeholder="Например: Patong Beach, Bangla Road"
        value={data.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />

      {showCondition && (
        <Select
          label="Состояние"
          placeholder="Выберите состояние"
          value={data.condition}
          onChange={(e) => onChange({ condition: e.target.value as Condition })}
          options={[
            { value: "new", label: "Новое" },
            { value: "used", label: "Б/у" },
          ]}
        />
      )}

      {showRealEstate && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Площадь (м²)"
            type="number"
            placeholder="45"
            value={(data as any).area ?? ""}
            onChange={(e) => onChange({ ...(data as any), area: e.target.value })}
          />
          <Input
            label="Комнат"
            type="number"
            placeholder="2"
            value={(data as any).rooms ?? ""}
            onChange={(e) => onChange({ ...(data as any), rooms: e.target.value })}
          />
          <Input
            label="Этаж"
            type="number"
            placeholder="3"
            value={(data as any).floor ?? ""}
            onChange={(e) => onChange({ ...(data as any), floor: e.target.value })}
          />
          <Select
            label="Мебель"
            placeholder="Наличие"
            value={(data as any).furnished ?? ""}
            onChange={(e) => onChange({ ...(data as any), furnished: e.target.value })}
            options={[
              { value: "yes", label: "С мебелью" },
              { value: "partial", label: "Частично" },
              { value: "no", label: "Без мебели" },
            ]}
          />
        </div>
      )}

      <Input
        label="Контактный телефон"
        type="tel"
        placeholder="+66 ..."
        value={data.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
        error={errors.phone}
      />

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          ← Назад
        </Button>
        <Button onClick={onSubmit} size="lg" loading={submitting} disabled={submitting}>
          Опубликовать объявление
        </Button>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function CreateListingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const patch = (update: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...update }))
    // clear errors for changed fields
    const keys = Object.keys(update) as (keyof FormData)[]
    setErrors((prev) => {
      const next = { ...prev }
      for (const k of keys) delete next[k]
      return next
    })
  }

  // Validation per step
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}

    if (step === 0) {
      if (!data.category) errs.category = "Выберите категорию"
    }

    if (step === 1) {
      if (data.title.trim().length < 5) errs.title = "Заголовок — минимум 5 символов"
      if (data.description.trim().length < 20) errs.description = "Описание — минимум 20 символов"
      if (!data.price || Number(data.price) <= 0) errs.price = "Укажите цену"
    }

    if (step === 2) {
      if (data.images.length === 0) errs.images = "Добавьте хотя бы одно фото"
    }

    if (step === 3) {
      if (!data.province) errs.province = "Выберите провинцию"
      if (!data.phone.trim()) errs.phone = "Укажите контактный телефон"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validate()) setStep((s) => s + 1)
  }
  const back = () => setStep((s) => s - 1)

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        type: data.listingType === "rent" ? "rental" : "sale",
        price: {
          amount: Number(data.price),
          currency: data.currency,
          ...(data.listingType === "rent" && data.pricePeriod ? { period: data.pricePeriod } : {}),
        },
        location: {
          city: data.address || data.province,
          region: data.province,
          country: "TH",
        },
        images: data.images,
        features: [],
        availability: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        ...(data.condition ? { condition: data.condition } : {}),
      }

      const result = await listingsService.createListing(payload as any)
      const id = (result as any)?.data?.id || (result as any)?.id
      navigate(id ? `/listings/${id}` : "/listings")
    } catch (err: any) {
      setApiError(err?.message || "Ошибка при публикации. Попробуйте ещё раз.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Подать объявление</h1>
        <p className="text-sm text-gray-500 mt-1">Заполните форму — займёт не более 2 минут</p>
      </div>

      <StepBar current={step} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {step === 0 && <Step1 data={data} onChange={patch} onNext={next} />}
        {step === 1 && <Step2 data={data} onChange={patch} onNext={next} onBack={back} errors={errors} />}
        {step === 2 && <Step3 data={data} onChange={patch} onNext={next} onBack={back} errors={errors} />}
        {step === 3 && (
          <Step4 data={data} onChange={patch} onSubmit={submit} onBack={back} errors={errors} submitting={submitting} />
        )}
      </div>

      {apiError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{apiError}</div>
      )}
    </div>
  )
}
