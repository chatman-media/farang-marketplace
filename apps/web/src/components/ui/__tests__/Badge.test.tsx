import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "../../../test/render-helper"
import { Badge } from "../Badge"

afterEach(cleanup)

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("uses the primary variant by default", () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText("Default").className).toContain("bg-primary-100")
  })

  it("applies the chosen variant classes", () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText("Active").className).toContain("bg-success-100")
  })

  it("applies the chosen size classes", () => {
    render(<Badge size="lg">Large</Badge>)
    expect(screen.getByText("Large").className).toContain("px-3 py-1 text-sm")
  })

  it("uses the medium size by default", () => {
    render(<Badge>Md</Badge>)
    expect(screen.getByText("Md").className).toContain("px-2.5 py-0.5")
  })

  it("merges custom className", () => {
    render(<Badge className="extra">X</Badge>)
    expect(screen.getByText("X").className).toContain("extra")
  })
})
