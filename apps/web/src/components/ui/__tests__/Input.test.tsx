import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { Input } from "../Input"

afterEach(cleanup)

describe("Input", () => {
  it("renders a label associated with the input", () => {
    render(<Input label="Email" />)
    const input = screen.getByLabelText("Email")
    expect(input).toBeInTheDocument()
  })

  it("uses a provided id for label association", () => {
    render(<Input id="my-input" label="Name" />)
    expect(screen.getByLabelText("Name").id).toBe("my-input")
  })

  it("renders an error message and error styling", () => {
    render(<Input label="Email" error="Required" />)
    expect(screen.getByText("Required")).toBeInTheDocument()
    expect(screen.getByLabelText("Email").className).toContain("border-error-300")
  })

  it("renders helper text only when there is no error", () => {
    const { rerender } = render(<Input label="Email" helperText="We never share it" />)
    expect(screen.getByText("We never share it")).toBeInTheDocument()

    rerender(<Input label="Email" helperText="We never share it" error="Bad" />)
    expect(screen.queryByText("We never share it")).toBeNull()
    expect(screen.getByText("Bad")).toBeInTheDocument()
  })

  it("renders left and right icons", () => {
    render(<Input leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />} />)
    expect(screen.getByTestId("left")).toBeInTheDocument()
    expect(screen.getByTestId("right")).toBeInTheDocument()
  })

  it("adds padding classes when icons are present", () => {
    render(<Input label="Search" leftIcon={<span />} rightIcon={<span />} />)
    const input = screen.getByLabelText("Search")
    expect(input.className).toContain("pl-10")
    expect(input.className).toContain("pr-10")
  })

  it("forwards value and onChange", () => {
    const onChange = vi.fn()
    render(<Input label="Q" value="hello" onChange={onChange} />)
    const input = screen.getByLabelText("Q") as HTMLInputElement
    expect(input.value).toBe("hello")
    fireEvent.change(input, { target: { value: "world" } })
    expect(onChange).toHaveBeenCalled()
  })
})
