import * as React from "react"
import { CONFIG } from "@/config"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark")

  React.useEffect(() => {
    // Load theme from localStorage on mount
    try {
      const stored = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) as Theme | null
      if (stored) {
        setTheme(stored)
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
  }, [])

  React.useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    // Save to localStorage
    try {
      localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }, [theme])

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
