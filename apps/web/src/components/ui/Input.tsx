import React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const inputClasses = `
    block w-full rounded-md shadow-sm sm:text-sm
    ${
      error
        ? "border-error-300 text-error-900 placeholder-error-300 focus:border-error-500 focus:ring-error-500"
        : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
    }
    ${leftIcon ? "pl-10" : ""}
    ${rightIcon ? "pr-10" : ""}
    ${className}
  `.trim()

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={`h-5 w-5 ${error ? "text-error-400" : "text-gray-400"}`}>{leftIcon}</div>
          </div>
        )}

        <input id={inputId} className={inputClasses} {...props} />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className={`h-5 w-5 ${error ? "text-error-400" : "text-gray-400"}`}>{rightIcon}</div>
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
