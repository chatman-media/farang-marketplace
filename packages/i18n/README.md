# @thailand-marketplace/i18n

Internationalization (i18n) package for Thailand Marketplace with support for 5
languages.

## 🌐 Supported Languages

- **English** (en) - Default
- **Russian** (ru) - Русский
- **Thai** (th) - ไทย
- **Chinese** (cn) - 中文
- **Arabic** (ar) - العربية (RTL support)

## 📦 Installation

```bash
bun add @thailand-marketplace/i18n
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { t, tAuth, tCommon, changeLanguage } from "@thailand-marketplace/i18n"

// Basic translation
console.log(t("common.welcome")) // "Welcome"

// Namespace-specific translations
console.log(tAuth("login")) // "Login"
console.log(tCommon("search")) // "Search"

// Change language
await changeLanguage("ru")
console.log(t("common.welcome")) // "Добро пожаловать"
```

### React Integration

```tsx
import React from "react"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@thailand-marketplace/i18n"

function App() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t("common.welcome")}</h1>
      <LanguageSwitcher variant='dropdown' showFlags={true} />
    </div>
  )
}
```

## 🛠️ API Reference

### Translation Functions

- `t(key, options?)` - General translation function
- `tAuth(key, options?)` - Authentication translations
- `tCommon(key, options?)` - Common UI translations
- `tError(key, options?)` - Error messages
- `tValidation(key, options?)` - Form validation messages

### Language Management

- `changeLanguage(language)` - Change current language
- `getCurrentLanguage()` - Get current language
- `getLanguageDirection(language?)` - Get text direction (ltr/rtl)

### Formatting Utilities

- `formatCurrency(amount, currency?)` - Format currency
- `formatDate(date, options?)` - Format date
- `formatTime(date, options?)` - Format time

### React Components

- `<LanguageSwitcher />` - Language selection component

## 🎨 LanguageSwitcher Component

```tsx
<LanguageSwitcher
  variant='dropdown' // "dropdown" | "buttons" | "minimal"
  showFlags={true} // Show country flags
  className='custom-class'
/>
```

## 📝 Translation Keys Structure

```typescript
{
  common: {
    welcome: "Welcome",
    search: "Search",
    // ... more common translations
  },
  auth: {
    login: "Login",
    logout: "Logout",
    // ... authentication translations
  },
  marketplace: {
    title: "Thailand Marketplace",
    // ... marketplace specific translations
  },
  errors: {
    generic: "Something went wrong",
    // ... error messages
  },
  validation: {
    required: "This field is required",
    // ... validation messages
  }
}
```

## 🌍 Adding New Languages

1. Create a new translation file in `src/locales/`
2. Add the language to `SUPPORTED_LANGUAGES` in `src/index.ts`
3. Update the language detector configuration
4. Add flag emoji to `LanguageSwitcher` component

## 🔧 Development

```bash
# Build the package
bun run build

# Run tests
bun run test

# Type check
bun run type-check
```

## 📄 License

MIT License - see LICENSE file for details.
