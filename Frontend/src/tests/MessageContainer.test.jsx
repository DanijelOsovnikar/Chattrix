import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MessageContainer from "../components/Messages/MessageContainer";
import useConversation from "../store/useConversation";

// Mock the store
vi.mock("../store/useConversation");

// Mock child components
vi.mock("../components/Messages/Messages", () => ({
  default: () => <div data-testid="messages">Messages Component</div>,
}));

vi.mock("../components/Messages/MessageInput", () => ({
  default: () => <div data-testid="message-input">Message Input</div>,
}));

describe("MessageContainer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows welcome message when no conversation is selected", () => {
    useConversation.mockReturnValue({
      selectedConversation: null,
    });

    render(<MessageContainer />);

    expect(
      screen.getByText(/select a chat to start messaging/i)
    ).toBeInTheDocument();
  });

  it("renders chat interface when conversation is selected", () => {
    useConversation.mockReturnValue({
      selectedConversation: {
        _id: "123",
        participants: [
          { fullName: "John Doe", userName: "john" },
          { fullName: "Jane Smith", userName: "jane" },
        ],
      },
    });

    render(<MessageContainer />);

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });

  it("displays conversation header with participant names", () => {
    useConversation.mockReturnValue({
      selectedConversation: {
        _id: "123",
        participants: [
          { fullName: "John Doe", userName: "john" },
          { fullName: "Jane Smith", userName: "jane" },
        ],
      },
    });

    render(<MessageContainer />);

    // Assuming the header shows participant names
    expect(screen.getByText(/john doe|jane smith/i)).toBeInTheDocument();
  });

  it("handles special tracking conversation", () => {
    useConversation.mockReturnValue({
      selectedConversation: {
        _id: "tracking_outgoing_requests",
        participants: [],
      },
    });

    render(<MessageContainer />);

    // Should render messages component for tracking
    expect(screen.getByTestId("messages")).toBeInTheDocument();
  });
});
