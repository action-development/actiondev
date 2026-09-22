"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "./types";
import { en } from "./en";
import { es } from "./es";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "es",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Hydrate from localStorage after mount (SSR safe)
  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "en" || saved === "es") {
      // Tiene que ser en un efecto: el servidor no ve `localStorage`, así que
      // leerlo en el inicializador de `useState` desajustaría la hidratación.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { locale } = useLocale();
  return locale === "es" ? es : en;
}
