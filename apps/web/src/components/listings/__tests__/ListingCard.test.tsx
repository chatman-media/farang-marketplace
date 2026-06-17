import { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { FavoritesProvider } from "../../../lib/FavoritesContext"
import { installLocalStorageMock } from "../../../test/local-storage-mock"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { ListingCard } from "../ListingCard"

installLocalStorageMock()

const wrap = (ui: ReactNode) => (
  <MemoryRouter>
    <FavoritesProvider>{ui}</FavoritesProvider>
  </MemoryRouter>
)

const baseListing = {
  id: "l1",
  title: "Cozy Apartment",
  description: "A nice place to stay",
  category: "property",
  price: 1500,
  location: { city: "Bangkok", region: "Bangkok" },
  images: ["https://example.com/img.jpg"],
  createdAt: new Date("2026-01-15").toISOString(),
}

describe("ListingCard", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it("renders title, description and category", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    expect(screen.getByText("Cozy Apartment")).toBeInTheDocument()
    expect(screen.getByText("A nice place to stay")).toBeInTheDocument()
    expect(screen.getByText("property")).toBeInTheDocument()
  })

  it("links to the listing detail page", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/listings/l1")
  })

  it("renders the listing image when present", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    const img = screen.getByAltText("Cozy Apartment") as HTMLImageElement
    expect(img.src).toBe("https://example.com/img.jpg")
  })

  it("renders a placeholder when there are no images", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, images: [] } as any} />))
    expect(screen.queryByAltText("Cozy Apartment")).toBeNull()
  })

  it("formats a numeric price as THB currency", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, price: 2000 } as any} />))
    // Thai currency formatting includes the THB/฿ symbol and the amount.
    expect(screen.getByText(/2,000/)).toBeInTheDocument()
  })

  it("formats an object price and shows the period", () => {
    const listing = {
      ...baseListing,
      price: { amount: 800, currency: "THB", period: "hour" },
    }
    render(wrap(<ListingCard listing={listing as any} />))
    expect(screen.getByText(/800/)).toBeInTheDocument()
    expect(screen.getByText("per hour")).toBeInTheDocument()
  })

  it("shows the Active badge for active listings", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, status: "active" } as any} />))
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows the Inactive badge for non-active listings", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, status: "draft" } as any} />))
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("renders a Featured badge when featured", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, featured: true } as any} />))
    expect(screen.getByText("Featured")).toBeInTheDocument()
  })

  it("shows the rating and review count", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, rating: 4.567, reviewCount: 12 } as any} />))
    expect(screen.getByText("4.6 (12)")).toBeInTheDocument()
  })

  it("falls back to 0.0 (0) when rating is missing", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    expect(screen.getByText("0.0 (0)")).toBeInTheDocument()
  })

  it("renders the address when provided", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, location: { address: "1 Main St" } } as any} />))
    expect(screen.getByText("1 Main St")).toBeInTheDocument()
  })

  it("renders city, region when address is absent", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    expect(screen.getByText("Bangkok, Bangkok")).toBeInTheDocument()
  })

  it("renders up to 3 amenities plus an overflow badge", () => {
    const listing = { ...baseListing, amenities: ["Wifi", "Pool", "Gym", "Parking", "AC"] }
    render(wrap(<ListingCard listing={listing as any} />))
    expect(screen.getByText("Wifi")).toBeInTheDocument()
    expect(screen.getByText("Pool")).toBeInTheDocument()
    expect(screen.getByText("Gym")).toBeInTheDocument()
    // 5 amenities -> first 3 shown + "+2" overflow
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("toggles favorite state when the favorite button is clicked", () => {
    render(wrap(<ListingCard listing={baseListing as any} />))
    const favBtn = screen.getByRole("button", { name: "В избранное" })
    fireEvent.click(favBtn)
    // After toggling on, the aria-label flips to the remove label.
    expect(screen.getByRole("button", { name: "Убрать из избранного" })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem("mkt_favorites") as string)).toContain("l1")
  })

  it("renders the service category icon for service listings", () => {
    const { container } = render(wrap(<ListingCard listing={{ ...baseListing, category: "service" } as any} />))
    expect(screen.getByText("service")).toBeInTheDocument()
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0)
  })

  it("renders the default category icon for unknown categories", () => {
    render(wrap(<ListingCard listing={{ ...baseListing, category: "misc" } as any} />))
    expect(screen.getByText("misc")).toBeInTheDocument()
  })
})
