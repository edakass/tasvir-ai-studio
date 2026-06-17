import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("tasvir-language") || "en"
  );

  const setLanguage = (nextLanguage) => {
    localStorage.setItem("tasvir-language", nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      isTurkish: language === "tr",
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
