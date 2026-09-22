import { createContext, useContext, useEffect, useState } from "react";

/* Supported themes */
export const THEMES = {
  light: "light",
  dark:  "dark",
  eye:   "eye",   // eye-protection / warm mode
};

const STORAGE_KEY = "payrollpro_theme";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return Object.values(THEMES).includes(saved) ? saved : "light";
    } catch {
      return "light";
    }
  });

  /* Apply data-theme attribute to <html> so CSS variables take effect globally */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = (t) => {
    if (Object.values(THEMES).includes(t)) setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
