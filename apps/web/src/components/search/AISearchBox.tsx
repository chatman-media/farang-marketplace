import React, { useEffect, useRef, useState } from "react"
import { useDebounce } from "../../hooks/useDebounce"
import { Button, Input } from "../ui"

interface SearchSuggestion {
  id: string
  text: string
  type: "query" | "location" | "category" | "tag"
  icon?: React.ReactNode
}

interface AISearchBoxProps {
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
}

export const AISearchBox: React.FC<AISearchBoxProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search for properties, services, or vehicles...",
  className = "",
}) => {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchBoxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Mock AI suggestions - in real implementation, this would call an AI service
  const generateAISuggestions = (searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim()) return []

    const suggestions: SearchSuggestion[] = []

    // Location suggestions
    const locations = ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi", "Koh Samui"]
    locations.forEach((location) => {
      if (location.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push({
          id: `location-${location}`,
          text: `Properties in ${location}`,
          type: "location",
          icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        })
      }
    })

    // Category suggestions
    const categories = [
      { name: "Condo", icon: "🏢" },
      { name: "House", icon: "🏠" },
      { name: "Villa", icon: "🏡" },
      { name: "Car", icon: "🚗" },
      { name: "Motorcycle", icon: "🏍️" },
      { name: "Cleaning Service", icon: "🧹" },
      { name: "Massage", icon: "💆" },
    ]

    categories.forEach((category) => {
      if (category.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push({
          id: `category-${category.name}`,
          text: `${category.icon} ${category.name}`,
          type: "category",
        })
      }
    })

    // Smart query suggestions
    const smartSuggestions = [
      "luxury villa with pool",
      "budget apartment near BTS",
      "car rental with driver",
      "massage service at home",
      "cleaning service weekly",
      "beachfront property",
      "mountain view condo",
      "pet-friendly apartment",
    ]

    smartSuggestions.forEach((suggestion) => {
      if (suggestion.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push({
          id: `smart-${suggestion}`,
          text: suggestion,
          type: "query",
          icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          ),
        })
      }
    })

    return suggestions.slice(0, 8) // Limit to 8 suggestions
  }

  useEffect(() => {
    if (debouncedQuery) {
      const newSuggestions = generateAISuggestions(debouncedQuery)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [debouncedQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSuggestionSelect?.(suggestion)
    onSearch(suggestion.text)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div ref={searchBoxRef} className={`relative ${className}`}>
      <div className="flex">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            rightIcon={
              query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setSuggestions([])
                    setShowSuggestions(false)
                    inputRef.current?.focus()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            }
          />
        </div>
        <Button onClick={handleSearch} className="ml-2" disabled={!query.trim()}>
          Search
        </Button>
      </div>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                  index === selectedIndex ? "bg-primary-50 text-primary-700" : "text-gray-700"
                }`}
              >
                {suggestion.icon && <span className="flex-shrink-0 text-gray-400">{suggestion.icon}</span>}
                <span className="flex-1 truncate">{suggestion.text}</span>
                <span className="flex-shrink-0 text-xs text-gray-400 capitalize">{suggestion.type}</span>
              </button>
            ))}
          </div>

          {/* AI Powered Badge */}
          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>AI-powered suggestions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
