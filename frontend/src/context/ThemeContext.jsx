import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("tasvir-theme") || "dark"
  );

  const setTheme = (nextTheme) => {
    localStorage.setItem("tasvir-theme", nextTheme);
    setThemeState(nextTheme);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" ? "light" : "dark";
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isLight: theme === "light",
      setTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
