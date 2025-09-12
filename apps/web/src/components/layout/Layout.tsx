import { User } from "@marketplace/shared-types"
import React from "react"
import { Footer } from "./Footer"
import { Header } from "./Header"

interface LayoutProps {
  children: React.ReactNode
  isAuthenticated?: boolean
  user?: User
  onLogout?: () => void
  showFooter?: boolean
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isAuthenticated = false,
  user,
  onLogout,
  showFooter = true,
  className = "",
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header isAuthenticated={isAuthenticated} user={user} onLogout={onLogout} />

      <main className={`flex-1 ${className}`}>{children}</main>

      {showFooter && <Footer />}
    </div>
  )
}
