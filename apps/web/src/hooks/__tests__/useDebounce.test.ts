import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, renderHook } from "../../test/render-helper"
import { useDebounce } from "../useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500))
    expect(result.current).toBe("initial")
  })

  it("does not update before the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe("a")
  })

  it("updates to the latest value after the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe("b")
  })

  it("only applies the most recent value when changes happen rapidly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "first" },
    })

    rerender({ value: "second" })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ value: "third" })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    // Still within debounce window of the latest change
    expect(result.current).toBe("first")

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe("third")
  })

  it("works with non-string values such as numbers", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 1 },
    })

    rerender({ value: 42 })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe(42)
  })
})
