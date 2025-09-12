import React from "react"

export interface BadgeProps {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "success" | "warning" | "error"
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "primary", size = "md", className = "" }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full"

  const variantClasses = {
    primary: "bg-primary-100 text-primary-800",
    secondary: "bg-secondary-100 text-secondary-800",
    success: "bg-success-100 text-success-800",
    warning: "bg-warning-100 text-warning-800",
    error: "bg-error-100 text-error-800",
  }

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return <span className={classes}>{children}</span>
}
