import { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { installLocalStorageMock } from "../../test/local-storage-mock"
import { act, cleanup, renderHook } from "../../test/render-helper"
import { FavoritesProvider, useFavorites } from "../FavoritesContext"

installLocalStorageMock()

const STORAGE_KEY = "mkt_favorites"

const wrapper = ({ children }: { children: ReactNode }) => <FavoritesProvider>{children}</FavoritesProvider>

describe("FavoritesContext", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  describe("default context (no provider)", () => {
    it("returns empty defaults when used outside a provider", () => {
      const { result } = renderHook(() => useFavorites())
      expect(result.current.ids).toEqual([])
      expect(result.current.has("anything")).toBe(false)
      // toggle is a no-op stub; should not throw
      expect(() => result.current.toggle("x")).not.toThrow()
    })
  })

  describe("FavoritesProvider", () => {
    it("starts empty when localStorage is empty", () => {
      const { result } = renderHook(() => useFavorites(), { wrapper })
      expect(result.current.ids).toEqual([])
    })

    it("hydrates initial state from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["a", "b"]))
      const { result } = renderHook(() => useFavorites(), { wrapper })
      expect(result.current.ids).toEqual(["a", "b"])
      expect(result.current.has("a")).toBe(true)
      expect(result.current.has("c")).toBe(false)
    })

    it("falls back to empty when localStorage contains invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "{not valid json")
      const { result } = renderHook(() => useFavorites(), { wrapper })
      expect(result.current.ids).toEqual([])
    })

    it("toggle adds an id and persists it", () => {
      const { result } = renderHook(() => useFavorites(), { wrapper })

      act(() => {
        result.current.toggle("listing-1")
      })

      expect(result.current.ids).toEqual(["listing-1"])
      expect(result.current.has("listing-1")).toBe(true)
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(["listing-1"])
    })

    it("toggle removes an id that is already present", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["listing-1"]))
      const { result } = renderHook(() => useFavorites(), { wrapper })

      act(() => {
        result.current.toggle("listing-1")
      })

      expect(result.current.ids).toEqual([])
      expect(result.current.has("listing-1")).toBe(false)
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual([])
    })

    it("toggling multiple ids accumulates and persists them", () => {
      const { result } = renderHook(() => useFavorites(), { wrapper })

      act(() => {
        result.current.toggle("a")
      })
      act(() => {
        result.current.toggle("b")
      })

      expect(result.current.ids).toEqual(["a", "b"])
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(["a", "b"])
    })
  })
})
