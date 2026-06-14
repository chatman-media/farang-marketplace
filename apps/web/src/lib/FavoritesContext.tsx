import React, { createContext, useCallback, useContext, useState } from "react"

const KEY = "mkt_favorites"

function loadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

interface FavoritesCtx {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const Ctx = createContext<FavoritesCtx>({ ids: [], has: () => false, toggle: () => {} })

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(loadIds)

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return <Ctx.Provider value={{ ids, has, toggle }}>{children}</Ctx.Provider>
}

export function useFavorites() {
  return useContext(Ctx)
}
