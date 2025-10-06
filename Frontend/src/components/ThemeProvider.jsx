import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ThemeContext } from "../context/ThemeContext";
import { themes } from "../utils/themes";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && themes.includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []); // themes is imported, no need to include in deps

  // Apply theme to document and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (themes.includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const value = {
    theme,
    themes,
    changeTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
