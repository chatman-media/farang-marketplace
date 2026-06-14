import React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  const textareaClasses = `
    block w-full rounded-md shadow-sm sm:text-sm resize-y
    ${
      error
        ? "border-error-300 text-error-900 placeholder-error-300 focus:border-error-500 focus:ring-error-500"
        : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
    }
    ${className}
  `.trim()

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
        </label>
      )}
      <textarea id={textareaId} rows={rows} className={textareaClasses} {...props} />
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
