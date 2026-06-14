import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ListingsGrid } from "../components/listings"
import { listingImageUrl } from "../components/listings/ImageUploader"
import type { ReviewData } from "../components/reviews"
import { ReviewCard } from "../components/reviews"
import { Badge, Button } from "../components/ui"
import { useFavorites } from "../lib/FavoritesContext"
import { useFeaturedListings, useListing } from "../lib/query"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: any, currency?: string): string {
  if (!price) return "Цена не указана"
  if (typeof price === "object") {
    const amount = new Intl.NumberFormat("ru-RU").format(price.amount)
    const cur = price.currency || currency || "THB"
    const period = price.period
      ? ` / ${price.period === "day" ? "день" : price.period === "week" ? "неделя" : price.period === "month" ? "мес." : price.period}`
      : ""
    return `${amount} ${cur}${period}`
  }
  return `${new Intl.NumberFormat("ru-RU").format(price)} ${currency || "THB"}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    vehicles: "Транспорт",
    transportation: "Доставка",
    products: "Товары",
    services: "Услуги",
    real_estate: "Недвижимость",
  }
  return map[cat] || cat
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

function Gallery({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const [copied, setCopied] = useState(false)

  const safeImages = images?.length ? images : ["/placeholder-listing.jpg"]
  const mainSrc = safeImages[current]
  const isServerPath = mainSrc.startsWith("/uploads/")

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3]">
        <img
          src={isServerPath ? listingImageUrl(mainSrc) : mainSrc}
          alt="Фото объявления"
          className="w-full h-full object-cover"
        />

        {/* Navigation arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c: number) => (c - 1 + safeImages.length) % safeImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c: number) => (c + 1) % safeImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              ›
            </button>
          </>
        )}

        {/* Counter */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1} / {safeImages.length}
          </div>
        )}

        {/* Share */}
        <button
          onClick={shareUrl}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-colors"
          title="Поделиться"
        >
          {copied ? (
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((src, i) => {
            const thumbSrc = src.startsWith("/uploads/") ? listingImageUrl(src) : src
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={[
                  "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                  i === current ? "border-primary-500" : "border-transparent hover:border-gray-300",
                ].join(" ")}
              >
                <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Seller Card ─────────────────────────────────────────────────────────────

function SellerCard({ owner, phone }: { owner: any; phone?: string }) {
  if (!owner) return null
  const { firstName, lastName, avatar, rating } = owner.profile || {}
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={firstName} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
            {initials || "?"}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">
            {firstName} {lastName}
          </p>
          {rating != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="h-3.5 w-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link
          to={"/messages/new"}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-primary-500 text-primary-700 font-medium text-sm hover:bg-primary-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Написать продавцу
        </Link>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Позвонить
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Details Table ────────────────────────────────────────────────────────────

function DetailsTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center px-4 py-3 bg-white">
          <span className="w-40 text-sm text-gray-500 shrink-0">{label}</span>
          <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 bg-gray-200 rounded w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="bg-gray-200 rounded-2xl aspect-[4/3]" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Demo reviews for the UI
const DEMO_REVIEWS: ReviewData[] = [
  {
    id: "r1",
    reviewerName: "Somchai W.",
    rating: 5,
    content: "Отличное состояние, всё как на фото. Продавец быстро вышел на связь.",
    createdAt: "2026-05-20T10:00:00Z",
    isVerified: true,
  },
  {
    id: "r2",
    reviewerName: "Maria K.",
    rating: 4,
    content: "Хорошее качество, рекомендую. Небольшие царапины, но цена соответствует.",
    createdAt: "2026-04-15T14:30:00Z",
  },
]

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { has, toggle } = useFavorites()
  const favorited = has(id ?? "")

  const { data: listing, isLoading, error } = useListing(id ?? "")
  // Load a few similar listings (same category, later will be filtered by category)
  const { data: similarRaw } = useFeaturedListings(6)
  const similar = (similarRaw as any[])?.filter((l: any) => l.id !== id).slice(0, 3) ?? []

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <DetailSkeleton />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Объявление не найдено или было удалено.</p>
        <Button onClick={() => navigate("/listings")}>← Назад к каталогу</Button>
      </div>
    )
  }

  const l = listing as any
  const images: string[] = l.images ?? []
  const location = l.location ?? {}
  const locationStr = [location.address, location.city ?? location.province ?? location.region]
    .filter(Boolean)
    .join(", ")

  const detailRows: [string, string][] = [
    ["Категория", categoryLabel(l.category)],
    l.type ? ["Тип", l.type === "rental" ? "Аренда" : l.type === "sale" ? "Продажа" : l.type] : null,
    location.region || location.province ? ["Провинция", location.region ?? location.province ?? ""] : null,
    l.condition ? ["Состояние", l.condition === "new" ? "Новое" : "Б/у"] : null,
    l.viewCount != null ? ["Просмотры", String(l.viewCount)] : null,
    ["Опубликовано", formatDate(l.createdAt)],
  ].filter(Boolean) as [string, string][]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link to="/listings" className="hover:text-primary-600 transition-colors">
          Объявления
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{l.title}</span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: gallery + description + details */}
        <div className="lg:col-span-2 space-y-6">
          <Gallery images={images} />

          {/* Title + price (mobile — above description) */}
          <div className="lg:hidden">
            <PriceTitleCard
              listing={l}
              formatPrice={formatPrice}
              locationStr={locationStr}
              favorited={favorited}
              onFavorite={() => toggle(id ?? "")}
            />
            <div className="mt-4">
              <SellerCard owner={l.owner} phone={l.contactPhone} />
            </div>
          </div>

          {/* Description */}
          {l.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Описание</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{l.description}</p>
            </div>
          )}

          {/* Amenities */}
          {l.amenities?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Особенности</h2>
              <div className="flex flex-wrap gap-2">
                {l.amenities.map((a: string) => (
                  <Badge key={a} variant="secondary">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Details table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Характеристики</h2>
            <DetailsTable rows={detailRows} />
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Отзывы</h2>
              <span className="text-sm text-gray-400">{DEMO_REVIEWS.length} отзыва</span>
            </div>
            <div className="space-y-3">
              {DEMO_REVIEWS.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: price + seller (desktop) */}
        <div className="hidden lg:block space-y-4">
          <PriceTitleCard
            listing={l}
            formatPrice={formatPrice}
            locationStr={locationStr}
            favorited={favorited}
            onFavorite={() => toggle(id ?? "")}
          />
          <SellerCard owner={l.owner} phone={l.contactPhone} />
        </div>
      </div>

      {/* Similar listings */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Похожие объявления</h2>
          <ListingsGrid listings={similar} columns={3} />
        </div>
      )}
    </div>
  )
}

// ─── Price + title card (extracted to avoid duplicate JSX) ────────────────────

interface PriceTitleCardProps {
  listing: any
  formatPrice: (p: any, c?: string) => string
  locationStr: string
  favorited: boolean
  onFavorite: () => void
}

function PriceTitleCard({ listing: l, formatPrice, locationStr, favorited, onFavorite }: PriceTitleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      {/* Status + featured badges */}
      <div className="flex gap-2 flex-wrap">
        {l.isVerified && <Badge variant="success">Проверено</Badge>}
        {l.featured && <Badge variant="warning">В топе</Badge>}
        {l.status && l.status !== "active" && (
          <Badge variant="secondary">{l.status === "sold" ? "Продано" : l.status}</Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 leading-snug">{l.title}</h1>

      {/* Price */}
      <p className="text-2xl font-bold text-primary-600">{formatPrice(l.price, l.currency)}</p>

      {/* Location */}
      {locationStr && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{locationStr}</span>
        </div>
      )}

      {/* Favorite */}
      <button
        type="button"
        onClick={onFavorite}
        className={[
          "flex items-center gap-2 w-full py-2.5 rounded-xl border text-sm font-medium transition-colors",
          favorited
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
        ].join(" ")}
      >
        <svg className="h-4 w-4" fill={favorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {favorited ? "В избранном" : "В избранное"}
      </button>
    </div>
  )
}
