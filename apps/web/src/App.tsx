import { QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { Layout } from "./components/layout"
import { Badge, Button, Card } from "./components/ui"
import { FEATURES_CONFIG, getEnabledCategories, HERO_CONFIG } from "./config/marketplace"
import { queryClient } from "./lib/query"
import { ListingsPage, LoginPage, ProfilePage, RegisterPage } from "./pages"
import { CategoryPage } from "./pages/CategoryPage"
import DebugAPI from "./test/DebugAPI"
import ReactQueryTest from "./test/ReactQueryTest"

// React Query Devtools wrapper
const DevtoolsWrapper: React.FC = () => {
  const [DevtoolsComponent, setDevtoolsComponent] = React.useState<React.ComponentType<any> | null>(null)

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@tanstack/react-query-devtools").then((module) => {
        setDevtoolsComponent(() => module.ReactQueryDevtools as React.ComponentType<any>)
      })
    }
  }, [])

  if (!DevtoolsComponent) return null
  return <DevtoolsComponent initialIsOpen={false} />
}

// Home page component
const HomePage: React.FC = () => {
  const enabledCategories = getEnabledCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-primary-600">{HERO_CONFIG.title}</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          {HERO_CONFIG.description}
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link to={HERO_CONFIG.primaryButton.href}>
              <Button size="lg" className="w-full sm:w-auto">
                {HERO_CONFIG.primaryButton.text}
              </Button>
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link to={HERO_CONFIG.secondaryButton.href}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {HERO_CONFIG.secondaryButton.text}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900">What we offer</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Everything you need for living and working in Thailand
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {enabledCategories.map((category) => (
            <Link key={category.id} to={category.route} className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Card.Body>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-md bg-${category.color}-500 text-white`}
                      >
                        {category.icon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    </div>
                  </div>
                  <p className="mt-2 text-base text-gray-500">{category.description}</p>
                  {category.badge && (
                    <div className="mt-3">
                      <Badge variant={category.color}>{category.badge}</Badge>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900">Why Choose Us</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            We make finding and booking services in Thailand simple and secure
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_CONFIG.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto text-2xl">
                {feature.icon}
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-base text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/transportation" element={<CategoryPage />} />
            <Route path="/tours" element={<CategoryPage />} />
            <Route path="/services" element={<CategoryPage />} />
            <Route path="/vehicles" element={<CategoryPage />} />
            <Route path="/products" element={<CategoryPage />} />
            <Route path="/about" element={<div className="p-8 text-center">About page coming soon...</div>} />
            <Route path="/test-react-query" element={<ReactQueryTest />} />
            <Route path="/debug-api" element={<DebugAPI />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </Router>
      {/* React Query Devtools - only shows in development */}
      <DevtoolsWrapper />
    </QueryClientProvider>
  )
}

export default App
