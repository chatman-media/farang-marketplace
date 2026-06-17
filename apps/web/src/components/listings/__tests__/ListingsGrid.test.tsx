import { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { FavoritesProvider } from "../../../lib/FavoritesContext"
import { cleanup, render, screen } from "../../../test/render-helper"
import { ListingsGrid } from "../ListingsGrid"

afterEach(cleanup)

const wrap = (ui: ReactNode) => (
  <MemoryRouter>
    <FavoritesProvider>{ui}</FavoritesProvider>
  </MemoryRouter>
)

const makeListing = (id: string) =>
  ({
    id,
    title: `Listing ${id}`,
    description: "A description",
    category: "service",
    price: 100,
    location: { city: "Bangkok", region: "Bangkok" },
    images: [],
    createdAt: new Date("2026-01-01").toISOString(),
  }) as any

describe("ListingsGrid", () => {
  it("renders skeleton placeholders while loading", () => {
    const { container } = render(wrap(<ListingsGrid listings={[]} loading />))
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6)
  })

  it("renders an error state with the error message", () => {
    render(wrap(<ListingsGrid listings={[]} error="Something broke" />))
    expect(screen.getByText("Error loading listings")).toBeInTheDocument()
    expect(screen.getByText("Something broke")).toBeInTheDocument()
  })

  it("renders the empty state with a custom message", () => {
    render(wrap(<ListingsGrid listings={[]} emptyMessage="Nothing here yet" />))
    expect(screen.getByRole("heading", { name: "No listings found" })).toBeInTheDocument()
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument()
  })

  it("renders the empty state when listings is null", () => {
    render(wrap(<ListingsGrid listings={null as any} />))
    expect(screen.getByRole("heading", { name: "No listings found" })).toBeInTheDocument()
  })

  it("renders one card per listing", () => {
    render(wrap(<ListingsGrid listings={[makeListing("1"), makeListing("2")]} />))
    expect(screen.getByText("Listing 1")).toBeInTheDocument()
    expect(screen.getByText("Listing 2")).toBeInTheDocument()
  })

  it("applies the column class for the chosen number of columns", () => {
    const { container } = render(wrap(<ListingsGrid listings={[makeListing("1")]} columns={4} />))
    const grid = container.querySelector(".grid")
    expect(grid?.className).toContain("xl:grid-cols-4")
  })
})
