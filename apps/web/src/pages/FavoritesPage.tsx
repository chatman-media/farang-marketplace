import { Link } from "react-router-dom"
import { ListingCard } from "../components/listings/ListingCard"
import { Button } from "../components/ui"
import { useFavorites } from "../lib/FavoritesContext"
import { useListing } from "../lib/query"

function FavoriteItem({ id, onRemove }: { id: string; onRemove: () => void }) {
  const { data, isLoading } = useListing(id)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-xl h-48 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="relative rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
        Объявление удалено
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xs"
          type="button"
        >
          ✕
        </button>
      </div>
    )
  }

  return <ListingCard listing={data as any} />
}

export function FavoritesPage() {
  const { ids, toggle } = useFavorites()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
        {ids.length > 0 && <span className="text-sm text-gray-500">{ids.length} объявлений</span>}
      </div>

      {ids.length === 0 ? (
        <div className="text-center py-20">
          <svg className="mx-auto h-16 w-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="text-lg font-medium text-gray-700 mb-2">Здесь пока пусто</h2>
          <p className="text-gray-400 mb-6">Нажмите ❤ на любом объявлении, чтобы сохранить его сюда</p>
          <Link to="/listings">
            <Button>Смотреть объявления</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ids.map((id) => (
            <FavoriteItem key={id} id={id} onRemove={() => toggle(id)} />
          ))}
        </div>
      )}
    </div>
  )
}
