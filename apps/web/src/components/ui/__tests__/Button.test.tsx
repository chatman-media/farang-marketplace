import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { Button } from "../Button"

afterEach(cleanup)

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("applies the primary variant classes by default", () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole("button").className).toContain("bg-primary-600")
  })

  it("applies the chosen variant and size classes", () => {
    render(
      <Button variant="error" size="lg">
        Danger
      </Button>,
    )
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("bg-error-600")
    expect(btn.className).toContain("px-6 py-3")
  })

  it("merges custom className", () => {
    render(<Button className="custom-class">X</Button>)
    expect(screen.getByRole("button").className).toContain("custom-class")
  })

  it("is disabled when loading and shows a spinner", () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole("button")
    expect(btn).toBeDisabled()
    expect(btn.querySelector("svg")).toBeInTheDocument()
  })

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("does not render a spinner when not loading", () => {
    render(<Button>No spinner</Button>)
    expect(screen.getByRole("button").querySelector("svg")).toBeNull()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Press
      </Button>,
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).not.toHaveBeenCalled()
  })
})
