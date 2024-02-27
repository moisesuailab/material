import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider } from "@emotion/react";
import { Box } from "@mui/system";

import { DarkTheme, LightTheme } from "./../themes";

interface IThemeContextData {
  themeName: "light" | "dark";
  toggleTheme(): void;
}

export const ThemeContext = createContext({} as IThemeContextData);

interface IAppThemeProviderProps {
  children?: React.ReactNode;
}

export const AppThemeProvider: React.FC<IAppThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<"light" | "dark">(() => {
    const storageValue = localStorage.getItem("theme");
    if (storageValue) {
      return JSON.parse(storageValue);
    } else {
      return "light";
    }
  });

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(themeName));
  }, [themeName]);

  const toggleTheme = useCallback(() => {
    setThemeName((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const theme = useMemo(() => {
    if (themeName === "light") return LightTheme;
    return DarkTheme;
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      <Box
        width="100vw"
        height="100vh"
        bgcolor={theme.palette.background.default}
      >
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Box>
    </ThemeContext.Provider>
  );
};
