// Lightweight render helpers that avoid @testing-library/react.
//
// In this monorepo worktree there are two copies of React resolvable:
// the app copy (apps/web/node_modules/react @ 19.2.0) and a hoisted root
// copy (@ 19.2.6). @testing-library/react resolves react-dom from the root
// copy while app source files resolve react from the app copy, so its
// `render` drives a different React instance than the components under test
// and any component that calls a hook throws "Cannot read properties of null
// (reading 'useState')".
//
// To keep tests within this package self-contained (and without touching
// config or production source), we render with the app-resolved
// react-dom/client + React.act, and query/interact with the framework-agnostic
// @testing-library/dom (screen, fireEvent, within, etc.).
import { fireEvent as domFireEvent, screen, within } from "@testing-library/dom"
import type { ReactElement } from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"

export { screen, within }

// Wrap @testing-library/dom's fireEvent so each dispatched event flushes any
// resulting React state updates synchronously inside act(), matching the
// behaviour of @testing-library/react's fireEvent.
type DomFireEvent = typeof domFireEvent
export const fireEvent = new Proxy(domFireEvent, {
  apply(target, _thisArg, args: Parameters<DomFireEvent>) {
    let returnValue: boolean = false
    act(() => {
      returnValue = (target as (...a: unknown[]) => boolean)(...args)
    })
    return returnValue
  },
  get(target, prop: string) {
    const original = (target as unknown as Record<string, (...a: unknown[]) => boolean>)[prop]
    if (typeof original !== "function") return original
    return (...args: unknown[]) => {
      let returnValue: boolean = false
      act(() => {
        returnValue = original(...args)
      })
      return returnValue
    }
  },
}) as DomFireEvent

interface RenderResult {
  container: HTMLElement
  unmount: () => void
  rerender: (ui: ReactElement) => void
}

const mountedRoots: Array<{ root: Root; container: HTMLElement }> = []

export function render(ui: ReactElement): RenderResult {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(ui)
  })

  mountedRoots.push({ root, container })

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount()
      })
    },
    rerender: (next: ReactElement) => {
      act(() => {
        root.render(next)
      })
    },
  }
}

export function cleanup(): void {
  while (mountedRoots.length > 0) {
    const entry = mountedRoots.pop()
    if (!entry) continue
    act(() => {
      entry.root.unmount()
    })
    entry.container.remove()
  }
}

interface RenderHookResult<TResult, TProps> {
  result: { current: TResult }
  rerender: (props?: TProps) => void
  unmount: () => void
}

export function renderHook<TResult, TProps = undefined>(
  callback: (props: TProps) => TResult,
  options?: { initialProps?: TProps; wrapper?: (props: { children: ReactElement }) => ReactElement },
): RenderHookResult<TResult, TProps> {
  const result = { current: undefined as unknown as TResult }
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)

  function TestComponent({ hookProps }: { hookProps: TProps }) {
    result.current = callback(hookProps)
    return null
  }

  const renderWithProps = (props: TProps) => {
    const inner = <TestComponent hookProps={props} />
    const tree = options?.wrapper ? options.wrapper({ children: inner }) : inner
    act(() => {
      root.render(tree)
    })
  }

  let currentProps = (options?.initialProps as TProps) ?? (undefined as unknown as TProps)
  renderWithProps(currentProps)
  mountedRoots.push({ root, container })

  return {
    result,
    rerender: (props?: TProps) => {
      if (props !== undefined) currentProps = props
      renderWithProps(currentProps)
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
    },
  }
}

export { act }
