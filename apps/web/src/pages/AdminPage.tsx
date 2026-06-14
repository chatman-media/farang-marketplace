import { useState } from "react"
import { Link } from "react-router-dom"
import { Badge, Button } from "../components/ui"
import { useListings, useUser } from "../lib/query"

type ListingStatus = "pending" | "active" | "rejected"

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { variant: any; label: string }> = {
    pending: { variant: "warning", label: "На модерации" },
    active: { variant: "success", label: "Активно" },
    rejected: { variant: "error", label: "Отклонено" },
  }
  const { variant, label } = map[status] ?? { variant: "secondary", label: status }
  return <Badge variant={variant}>{label}</Badge>
}

export function AdminPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const u = user as any
  const isAdmin = u?.role === "admin" || u?.role === "moderator"

  const { data: listingsRaw, isLoading: listingsLoading } = useListings({ limit: 50 } as any)
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all")
  const [decisions, setDecisions] = useState<Partial<Record<string, "active" | "rejected">>>({})

  if (userLoading) {
    return <div className="p-16 text-center text-gray-400">Загрузка...</div>
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Необходимо войти в аккаунт.</p>
        <Link to="/login">
          <Button>Войти</Button>
        </Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">🚫</p>
        <p className="text-gray-700 font-medium">Доступ запрещён</p>
        <p className="text-gray-400 text-sm mt-1">Эта страница доступна только администраторам.</p>
      </div>
    )
  }

  const listings = ((listingsRaw as any)?.listings ?? listingsRaw ?? []) as any[]
  const filtered = listings.filter((l: any) => {
    if (filter === "pending") return l.status === "pending" || !l.isActive
    if (filter === "active") return l.status === "active" || l.isActive
    return true
  })

  const decide = (id: string, decision: "active" | "rejected") => {
    setDecisions((prev) => ({ ...prev, [id]: decision }))
  }

  const pendingCount = listings.filter((l: any) => l.status === "pending" || !l.isActive).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl">🛡</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Панель модерации</h1>
          <p className="text-gray-500 text-sm">
            {pendingCount > 0 ? `${pendingCount} объявлений ожидают проверки` : "Нет новых объявлений на модерации"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Всего", value: listings.length, color: "text-gray-700" },
          { label: "На модерации", value: pendingCount, color: "text-yellow-600" },
          {
            label: "Активных",
            value: listings.filter((l: any) => l.isActive || l.status === "active").length,
            color: "text-green-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {(["all", "pending", "active"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              "pb-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              filter === f
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {f === "all" ? "Все" : f === "pending" ? "На модерации" : "Активные"}
          </button>
        ))}
      </div>

      {/* Listings table */}
      {listingsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Нет объявлений в этой категории</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((l: any) => {
            const decision = decisions[l.id]
            const effectiveStatus: ListingStatus =
              decision ?? (l.status === "active" || l.isActive ? "active" : "pending")
            return (
              <div key={l.id} className="flex items-center gap-4 px-4 py-3">
                {l.images?.[0] && (
                  <img src={l.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/listings/${l.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-gray-400 truncate">
                    {l.category} · {new Date(l.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <StatusBadge status={effectiveStatus} />
                {effectiveStatus === "pending" ? (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="success" onClick={() => decide(l.id, "active")}>
                      Одобрить
                    </Button>
                    <Button size="sm" variant="error" onClick={() => decide(l.id, "rejected")}>
                      Отклонить
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 shrink-0 w-36 text-right">
                    {effectiveStatus === "active" ? "✓ Одобрено" : "✗ Отклонено"}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
