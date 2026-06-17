import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { Select } from "../Select"

afterEach(cleanup)

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C", disabled: true },
]

describe("Select", () => {
  it("renders a label associated with the select", () => {
    render(<Select label="Choice" options={options} />)
    expect(screen.getByLabelText("Choice")).toBeInTheDocument()
  })

  it("renders all provided options", () => {
    render(<Select label="Choice" options={options} />)
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument()
  })

  it("marks disabled options as disabled", () => {
    render(<Select label="Choice" options={options} />)
    expect(screen.getByRole("option", { name: "Option C" })).toBeDisabled()
  })

  it("renders a disabled placeholder option when provided", () => {
    render(<Select label="Choice" options={options} placeholder="Pick one" />)
    const placeholder = screen.getByRole("option", { name: "Pick one" })
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toBeDisabled()
  })

  it("shows error styling and message", () => {
    render(<Select label="Choice" options={options} error="Required" />)
    expect(screen.getByText("Required")).toBeInTheDocument()
    expect(screen.getByLabelText("Choice").className).toContain("border-error-300")
  })

  it("shows helper text when there is no error", () => {
    render(<Select label="Choice" options={options} helperText="Hint" />)
    expect(screen.getByText("Hint")).toBeInTheDocument()
  })

  it("fires onChange when a new value is selected", () => {
    const onChange = vi.fn()
    render(<Select label="Choice" options={options} value="a" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Choice"), { target: { value: "b" } })
    expect(onChange).toHaveBeenCalled()
  })
})
