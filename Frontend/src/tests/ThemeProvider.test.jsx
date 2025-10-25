import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "../context/ThemeContext";
import { useTheme } from "../context/useTheme";

// Test component to use the theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it("provides default theme", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("loads theme from localStorage", () => {
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("toggles theme", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const currentTheme = screen.getByTestId("current-theme");
    const toggleButton = screen.getByTestId("toggle-theme");

    expect(currentTheme).toHaveTextContent("light");

    fireEvent.click(toggleButton);

    expect(currentTheme).toHaveTextContent("dark");

    fireEvent.click(toggleButton);

    expect(currentTheme).toHaveTextContent("light");
  });

  it("saves theme to localStorage", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId("toggle-theme");

    fireEvent.click(toggleButton);

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("applies theme class to document", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("light")).toBe(true);

    const toggleButton = screen.getByTestId("toggle-theme");
    fireEvent.click(toggleButton);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});
