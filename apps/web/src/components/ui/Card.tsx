import React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>
  Body: React.FC<CardBodyProps>
  Footer: React.FC<CardFooterProps>
} = ({ children, className = "", padding = true }) => {
  const baseClasses = "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
  const paddingClasses = padding ? "" : ""

  return <div className={`${baseClasses} ${paddingClasses} ${className}`}>{children}</div>
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 border-b border-gray-200 bg-gray-50 ${className}`}>{children}</div>
}

const CardBody: React.FC<CardBodyProps> = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>{children}</div>
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
