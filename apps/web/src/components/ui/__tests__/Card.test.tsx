import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "../../../test/render-helper"
import { Card } from "../Card"

afterEach(cleanup)

describe("Card", () => {
  it("renders children inside the base card", () => {
    render(<Card>content</Card>)
    expect(screen.getByText("content")).toBeInTheDocument()
  })

  it("applies the base card classes", () => {
    const { container } = render(<Card>x</Card>)
    expect(container.firstChild).toHaveClass("bg-white", "rounded-lg")
  })

  it("merges custom className", () => {
    const { container } = render(<Card className="my-card">x</Card>)
    expect(container.firstChild).toHaveClass("my-card")
  })

  it("renders Card.Header with header styling", () => {
    const { container } = render(<Card.Header>head</Card.Header>)
    expect(screen.getByText("head")).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border-b")
  })

  it("renders Card.Body", () => {
    render(<Card.Body>body</Card.Body>)
    expect(screen.getByText("body")).toBeInTheDocument()
  })

  it("renders Card.Footer with footer styling", () => {
    const { container } = render(<Card.Footer>foot</Card.Footer>)
    expect(screen.getByText("foot")).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border-t")
  })

  it("composes header, body and footer together", () => {
    render(
      <Card>
        <Card.Header>H</Card.Header>
        <Card.Body>B</Card.Body>
        <Card.Footer>F</Card.Footer>
      </Card>,
    )
    expect(screen.getByText("H")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("F")).toBeInTheDocument()
  })
})
