import { render } from "@testing-library/react";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import PropTypes from "prop-types";
import { AuthContextProvider } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { ThemeContext } from "../context/ThemeContext";
import { CoversationContextProvider } from "../context/ConversationContext";

// Mock localStorage for tests
const mockLocalStorage = {
  getItem: vi.fn(() =>
    JSON.stringify({
      _id: "test-user",
      username: "testuser",
      shopId: "test-shop",
      role: "employee",
    })
  ),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock socket.io-client to prevent network calls in tests
vi.mock("socket.io-client", () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Custom render function with all providers
export function renderWithProviders(ui, options = {}) {
  const AllTheProviders = ({ children }) => {
    const mockThemeValue = {
      theme: "light",
      setTheme: vi.fn(),
    };

    const mockSocketValue = {
      socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        disconnect: vi.fn(),
      },
      onlineUsers: [],
    };

    return (
      <BrowserRouter>
        <AuthContextProvider>
          <ThemeContext.Provider value={mockThemeValue}>
            <CoversationContextProvider>
              <SocketContext.Provider value={mockSocketValue}>
                {children}
              </SocketContext.Provider>
            </CoversationContextProvider>
          </ThemeContext.Provider>
        </AuthContextProvider>
      </BrowserRouter>
    );
  };

  AllTheProviders.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}
