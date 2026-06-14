import { ListingCategory } from "@marketplace/shared-types"
import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ListingsGrid } from "../components/listings"
import { Button, Input, Select } from "../components/ui"
import { useListings } from "../lib/query"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  query: string
  category: string
  listingType: string // "" | "rental" | "sale"
  province: string
  condition: string // "" | "new" | "used"
  minPrice: string
  maxPrice: string
  sortBy: string
}

const INITIAL_FILTERS: Filters = {
  query: "",
  category: "",
  listingType: "",
  province: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "createdAt:desc",
}

const LIMIT = 12

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { value: "", label: "Все" },
  { value: ListingCategory.VEHICLES, label: "🚗 Транспорт" },
  { value: ListingCategory.PRODUCTS, label: "📦 Товары" },
  { value: ListingCategory.SERVICES, label: "🛠️ Услуги" },
  { value: ListingCategory.TRANSPORTATION, label: "🚌 Доставка" },
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

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Сначала новые" },
  { value: "createdAt:asc", label: "Сначала старые" },
  { value: "price:asc", label: "Цена: по возрастанию" },
  { value: "price:desc", label: "Цена: по убыванию" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtersToParams(f: Filters, page: number): URLSearchParams {
  const p = new URLSearchParams()
  if (f.query) p.set("q", f.query)
  if (f.category) p.set("category", f.category)
  if (f.listingType) p.set("type", f.listingType)
  if (f.province) p.set("province", f.province)
  if (f.condition) p.set("condition", f.condition)
  if (f.minPrice) p.set("minPrice", f.minPrice)
  if (f.maxPrice) p.set("maxPrice", f.maxPrice)
  if (f.sortBy && f.sortBy !== "createdAt:desc") p.set("sortBy", f.sortBy)
  if (page > 1) p.set("page", String(page))
  return p
}

function paramsToFilters(p: URLSearchParams): [Filters, number] {
  return [
    {
      query: p.get("q") || "",
      category: p.get("category") || "",
      listingType: p.get("type") || "",
      province: p.get("province") || "",
      condition: p.get("condition") || "",
      minPrice: p.get("minPrice") || "",
      maxPrice: p.get("maxPrice") || "",
      sortBy: p.get("sortBy") || "createdAt:desc",
    },
    Math.max(1, Number(p.get("page")) || 1),
  ]
}

function buildApiFilters(f: Filters, page: number) {
  const api: Record<string, any> = { page, limit: LIMIT }
  if (f.category) api.category = f.category
  if (f.province) api.location = { region: f.province, country: "TH" }
  if (f.minPrice || f.maxPrice)
    api.priceRange = {
      min: f.minPrice ? Number(f.minPrice) : 0,
      max: f.maxPrice ? Number(f.maxPrice) : Number.MAX_SAFE_INTEGER,
    }
  return api
}

// ─── FilterSidebar ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onApply: () => void
  onReset: () => void
}

function FilterSidebar({ filters, onChange, onApply, onReset }: FilterSidebarProps) {
  const hasActive = filters.listingType || filters.province || filters.condition || filters.minPrice || filters.maxPrice

  return (
    <div className="space-y-6">
      {/* Тип */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Тип</p>
        <div className="flex gap-2">
          {[
            { value: "", label: "Любой" },
            { value: "rental", label: "Аренда" },
            { value: "sale", label: "Продажа" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ listingType: opt.value })}
              className={[
                "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                filters.listingType === opt.value
                  ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Провинция */}
      <Select
        label="Провинция"
        placeholder="Любая"
        value={filters.province}
        onChange={(e) => onChange({ province: e.target.value })}
        options={PROVINCES}
      />

      {/* Цена */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Цена (THB)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="от"
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <Input
            placeholder="до"
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Состояние */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Состояние</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "", label: "Любое" },
            { value: "new", label: "Новое" },
            { value: "used", label: "Б/у" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ condition: opt.value })}
              className={[
                "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                filters.condition === opt.value
                  ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопки */}
      <div className="space-y-2 pt-1">
        <Button className="w-full" onClick={onApply}>
          Применить
        </Button>
        {hasActive && (
          <button type="button" onClick={onReset} className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number
  total: number
  limit: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  // Show at most 7 page buttons
  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={[
              "w-9 h-9 text-sm rounded-md border transition-colors",
              p === page
                ? "bg-primary-600 border-primary-600 text-white font-medium"
                : "border-gray-300 text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        →
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [localFilters, setLocalFilters] = useState<Filters>(() => paramsToFilters(searchParams)[0])
  const [page, setPage] = useState<number>(() => paramsToFilters(searchParams)[1])
  const [appliedFilters, setAppliedFilters] = useState<Filters>(localFilters)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data, isLoading, error } = useListings({
    ...buildApiFilters(appliedFilters, page),
  })

  // Sync URL whenever applied filters or page change
  useEffect(() => {
    setSearchParams(filtersToParams(appliedFilters, page), { replace: true })
  }, [appliedFilters, page, setSearchParams])

  const applyFilters = () => {
    setAppliedFilters(localFilters)
    setPage(1)
    setMobileFiltersOpen(false)
  }

  const resetFilters = () => {
    const reset = { ...INITIAL_FILTERS, query: localFilters.query, sortBy: localFilters.sortBy }
    setLocalFilters(reset)
    setAppliedFilters(reset)
    setPage(1)
  }

  const patchLocal = (patch: Partial<Filters>) => setLocalFilters((f) => ({ ...f, ...patch }))

  const handleCategoryTab = (cat: string) => {
    const updated = { ...appliedFilters, category: cat }
    setLocalFilters(updated)
    setAppliedFilters(updated)
    setPage(1)
  }

  const handleSort = (sortBy: string) => {
    const updated = { ...appliedFilters, sortBy }
    setLocalFilters(updated)
    setAppliedFilters(updated)
  }

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFilters()
  }

  const total = data?.total ?? 0
  const listings = data?.listings ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top search bar */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Поиск по объявлениям..."
            value={localFilters.query}
            onChange={(e) => patchLocal({ query: e.target.value })}
            onKeyDown={handleSearchKey}
            className="block w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <Button onClick={applyFilters}>Найти</Button>
        <Link
          to="/listings/new"
          className="hidden sm:inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          + Подать объявление
        </Link>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleCategoryTab(tab.value)}
            className={[
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              appliedFilters.category === tab.value
                ? "bg-primary-600 border-primary-600 text-white"
                : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="flex gap-6 items-start">
        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-60 shrink-0 bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wide">Фильтры</h2>
          <FilterSidebar filters={localFilters} onChange={patchLocal} onApply={applyFilters} onReset={resetFilters} />
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Results bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm text-gray-600">
              {isLoading ? "Загрузка..." : `${total.toLocaleString("ru")} объявлений`}
            </span>

            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Фильтры
              </button>

              {/* Sort */}
              <Select
                value={appliedFilters.sortBy}
                onChange={(e) => handleSort(e.target.value)}
                options={SORT_OPTIONS}
                className="text-sm py-1.5"
              />

              {/* Grid/List toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Сетка"
                  className={[
                    "p-2 transition-colors",
                    viewMode === "grid" ? "bg-primary-600 text-white" : "text-gray-500 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="Список"
                  className={[
                    "p-2 transition-colors",
                    viewMode === "list" ? "bg-primary-600 text-white" : "text-gray-500 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Listings */}
          <ListingsGrid
            listings={listings}
            loading={isLoading}
            error={error?.message ?? null}
            columns={viewMode === "list" ? 1 : 3}
            emptyMessage={
              appliedFilters.query
                ? `Ничего не найдено по запросу «${appliedFilters.query}». Попробуйте изменить фильтры.`
                : "Объявлений пока нет. Будьте первым!"
            }
          />

          {/* Pagination */}
          <Pagination
            page={page}
            total={total}
            limit={LIMIT}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          />
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          {/* Panel */}
          <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-900">Фильтры</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterSidebar
                filters={localFilters}
                onChange={patchLocal}
                onApply={applyFilters}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
