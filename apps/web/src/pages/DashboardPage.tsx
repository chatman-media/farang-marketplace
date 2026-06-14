import React, { useState } from "react"
import { Link } from "react-router-dom"
import { ListingsGrid } from "../components/listings"
import { Button } from "../components/ui"
import { useUser, useUserListings } from "../lib/query"

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const userId = (user as any)?.id ?? ""
  const { data: listings, isLoading: listingsLoading } = useUserListings(userId)

  const [tab, setTab] = useState<"active" | "all">("active")

  const allListings = (listings as any[]) ?? []
  const activeListings = allListings.filter((l: any) => l.status === "active" || l.isActive)
  const totalViews = allListings.reduce((sum: number, l: any) => sum + (l.viewCount ?? 0), 0)

  const displayed = tab === "active" ? activeListings : allListings

  if (userLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Для доступа к личному кабинету необходимо войти в аккаунт.</p>
        <Link to="/login">
          <Button>Войти</Button>
        </Link>
      </div>
    )
  }

  const u = user as any
  const firstName = u.profile?.firstName ?? u.firstName ?? u.email?.split("@")[0] ?? "Пользователь"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Привет, {firstName}!</h1>
          <p className="text-gray-500 text-sm mt-1">Ваш личный кабинет продавца</p>
        </div>
        <Link to="/listings/new">
          <Button>
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Новое объявление
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Всего объявлений"
          value={allListings.length}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          label="Активных"
          value={activeListings.length}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Просмотров"
          value={totalViews}
          color="bg-purple-50 text-purple-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          }
        />
        <StatCard
          label="Рейтинг"
          value={(u.profile?.rating ?? u.rating ?? 0).toFixed(1)}
          color="bg-yellow-50 text-yellow-600"
          icon={
            <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
      </div>

      {/* My Listings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Мои объявления</h2>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={[
                "px-3 py-1.5 transition-colors",
                tab === "active" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Активные
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={[
                "px-3 py-1.5 transition-colors",
                tab === "all" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Все
            </button>
          </div>
        </div>

        {listingsLoading ? (
          <ListingsGrid listings={[]} loading columns={3} />
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {tab === "active" ? "Нет активных объявлений" : "У вас ещё нет объявлений"}
            </p>
            <Link to="/listings/new">
              <Button variant="outline" size="sm">
                Подать объявление
              </Button>
            </Link>
          </div>
        ) : (
          <ListingsGrid listings={displayed} columns={3} />
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/profile", label: "Редактировать профиль", icon: "👤" },
          { href: "/favorites", label: "Избранное", icon: "❤️" },
          { href: "/messages", label: "Сообщения", icon: "💬" },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
