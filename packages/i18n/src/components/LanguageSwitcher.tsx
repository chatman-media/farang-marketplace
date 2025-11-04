import React from "react"
import { useTranslation } from "react-i18next"
import { changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from "../index"

interface LanguageSwitcherProps {
  className?: string
  showFlags?: boolean
  variant?: "dropdown" | "buttons" | "minimal"
}

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: "🇺🇸",
  ru: "🇷🇺",
  th: "🇹🇭",
  cn: "🇨🇳",
  ar: "🇸🇦",
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  showFlags = true,
  variant = "dropdown",
}) => {
  const { t } = useTranslation()
  const currentLanguage = getCurrentLanguage()

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language)
      // Optionally reload the page to apply RTL/LTR changes
      if (language === "ar" || currentLanguage === "ar") {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to change language:", error)
    }
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={t("common.language")}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {showFlags && LANGUAGE_FLAGS[code as SupportedLanguage]} {name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }

  if (variant === "buttons") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              currentLanguage === code ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label={`${t("common.language")}: ${name}`}
          >
            {showFlags && LANGUAGE_FLAGS[code as SupportedLanguage]} {name}
          </button>
        ))}
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className={`w-8 h-8 text-lg rounded-full transition-all ${
              currentLanguage === code ? "bg-blue-500 text-white scale-110" : "hover:bg-gray-100 hover:scale-105"
            }`}
            title={name}
            aria-label={`${t("common.language")}: ${name}`}
          >
            {LANGUAGE_FLAGS[code as SupportedLanguage]}
          </button>
        ))}
      </div>
    )
  }

  return null
}

export default LanguageSwitcher
