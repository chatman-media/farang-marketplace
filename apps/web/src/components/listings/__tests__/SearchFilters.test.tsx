import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { SearchFilters } from "../SearchFilters"

afterEach(cleanup)

const setup = (filters: any = {}) => {
  const onFiltersChange = vi.fn()
  const onSearch = vi.fn()
  render(<SearchFilters filters={filters} onFiltersChange={onFiltersChange} onSearch={onSearch} />)
  return { onFiltersChange, onSearch }
}

describe("SearchFilters", () => {
  it("renders the search input with the current query", () => {
    setup({ query: "scooter" })
    expect(screen.getByPlaceholderText("Search listings...")).toHaveValue("scooter")
  })

  it("calls onSearch when the Search button is clicked", () => {
    const { onSearch } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Search" }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it("updates the query filter on input change", () => {
    const { onFiltersChange } = setup({ query: "" })
    fireEvent.change(screen.getByPlaceholderText("Search listings..."), {
      target: { value: "house" },
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "house" })
  })

  it("sets a field to undefined when cleared to empty string", () => {
    const { onFiltersChange } = setup({ query: "x", category: "vehicle" })
    const categorySelect = screen.getByDisplayValue("Vehicles")
    fireEvent.change(categorySelect, { target: { value: "" } })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", category: undefined })
  })

  it("clears all filters down to an empty query", () => {
    const { onFiltersChange } = setup({ query: "x", category: "vehicle" })
    fireEvent.click(screen.getByRole("button", { name: "Clear All" }))
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "" })
  })

  it("toggles the advanced filters section", () => {
    setup()
    expect(screen.queryByText("Min Price (THB)")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    expect(screen.getByText("Min Price (THB)")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Hide Filters/ }))
    expect(screen.queryByText("Min Price (THB)")).toBeNull()
  })

  it("parses min price into a number", () => {
    const { onFiltersChange } = setup({ query: "x" })
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "1500" } })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", minPrice: 1500 })
  })

  it("sets max price to undefined when cleared", () => {
    const { onFiltersChange } = setup({ query: "x", maxPrice: 5000 })
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    fireEvent.change(screen.getByPlaceholderText("No limit"), { target: { value: "" } })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", maxPrice: undefined })
  })

  it("parses comma-separated tags into an array", () => {
    const { onFiltersChange } = setup({ query: "x" })
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    fireEvent.change(screen.getByPlaceholderText("Enter tags (comma separated)"), {
      target: { value: "wifi, pool , " },
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", tags: ["wifi", "pool"] })
  })

  it("sets tags to undefined when no valid tags remain", () => {
    const { onFiltersChange } = setup({ query: "x" })
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    fireEvent.change(screen.getByPlaceholderText("Enter tags (comma separated)"), {
      target: { value: "  , ," },
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", tags: undefined })
  })

  it("toggles the featured checkbox", () => {
    const { onFiltersChange } = setup({ query: "x" })
    fireEvent.click(screen.getByRole("button", { name: /Show Filters/ }))
    fireEvent.click(screen.getByRole("checkbox"))
    expect(onFiltersChange).toHaveBeenCalledWith({ query: "x", featured: true })
  })
})
