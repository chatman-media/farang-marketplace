import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "../../../test/render-helper"
import { Textarea } from "../Textarea"

afterEach(cleanup)

describe("Textarea", () => {
  it("renders a label associated with the textarea", () => {
    render(<Textarea label="Bio" />)
    expect(screen.getByLabelText("Bio")).toBeInTheDocument()
  })

  it("defaults to 4 rows", () => {
    render(<Textarea label="Bio" />)
    expect(screen.getByLabelText("Bio")).toHaveAttribute("rows", "4")
  })

  it("respects a custom rows value", () => {
    render(<Textarea label="Bio" rows={8} />)
    expect(screen.getByLabelText("Bio")).toHaveAttribute("rows", "8")
  })

  it("renders error styling and message", () => {
    render(<Textarea label="Bio" error="Too short" />)
    expect(screen.getByText("Too short")).toBeInTheDocument()
    expect(screen.getByLabelText("Bio").className).toContain("border-error-300")
  })

  it("renders helper text only when there is no error", () => {
    const { rerender } = render(<Textarea label="Bio" helperText="Optional" />)
    expect(screen.getByText("Optional")).toBeInTheDocument()

    rerender(<Textarea label="Bio" helperText="Optional" error="Bad" />)
    expect(screen.queryByText("Optional")).toBeNull()
  })

  it("forwards value and onChange", () => {
    const onChange = vi.fn()
    render(<Textarea label="Bio" value="hi" onChange={onChange} />)
    const ta = screen.getByLabelText("Bio") as HTMLTextAreaElement
    expect(ta.value).toBe("hi")
    fireEvent.change(ta, { target: { value: "bye" } })
    expect(onChange).toHaveBeenCalled()
  })
})
