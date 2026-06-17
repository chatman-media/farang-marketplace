// jsdom in this package's vitest setup runs on an "about:blank" origin where
// `window.localStorage` is not available (it is undefined). Several units under
// test (FavoritesContext, TokenManager, ListingCard) rely on localStorage, so
// we install a small in-memory polyfill on the global object. This is purely a
// test concern and touches no production source or config.
export function installLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  const mock: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: mock,
  })

  return mock
}
