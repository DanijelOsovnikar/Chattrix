import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Messages from "../components/Messages/Messages";
import useConversation from "../store/useConversation";

// Mock hooks
vi.mock("../context/hooks/useGetMessages", () => ({
  default: vi.fn(() => ({ loading: false })),
}));

vi.mock("../context/hooks/useListenMessages", () => ({
  default: vi.fn(),
}));

vi.mock("../store/useConversation");

// Mock child components
vi.mock("../components/Messages/Message", () => ({
  default: ({ message }) => (
    <div data-testid="message">{message.message || message.orderNumber}</div>
  ),
}));

vi.mock("../components/Messages/TrackingView", () => ({
  default: ({ messages }) => (
    <div data-testid="tracking-view">
      Tracking View ({messages.length} items)
    </div>
  ),
}));

describe("Messages Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders regular messages for normal conversations", () => {
    useConversation.mockReturnValue({
      messages: [
        {
          _id: "1",
          message: "Hello there",
          senderId: "user1",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          message: "How are you?",
          senderId: "user2",
          createdAt: new Date().toISOString(),
        },
      ],
      selectedConversation: {
        _id: "conv123",
      },
    });

    render(<Messages />);

    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
    expect(screen.queryByTestId("tracking-view")).not.toBeInTheDocument();
  });

  it("renders tracking view for tracking conversation", () => {
    const trackingMessages = [
      {
        _id: "1",
        isExternalRequest: true,
        direction: "outgoing",
        orderNumber: "EXT-001",
      },
      {
        _id: "2",
        isExternalRequest: true,
        direction: "incoming",
        orderNumber: "EXT-002",
      },
    ];

    useConversation.mockReturnValue({
      messages: trackingMessages,
      selectedConversation: {
        _id: "tracking_outgoing_requests",
      },
    });

    render(<Messages />);

    expect(screen.getByTestId("tracking-view")).toBeInTheDocument();
    expect(screen.getByText("Tracking View (2 items)")).toBeInTheDocument();
    expect(screen.queryByTestId("message")).not.toBeInTheDocument();
  });

  it("shows loading state", async () => {
    const { default: useGetMessages } = await import(
      "../context/hooks/useGetMessages"
    );
    useGetMessages.mockReturnValue({ loading: true });

    useConversation.mockReturnValue({
      messages: [],
      selectedConversation: {
        _id: "conv123",
      },
    });

    render(<Messages />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    useConversation.mockReturnValue({
      messages: [],
      selectedConversation: {
        _id: "conv123",
      },
    });

    render(<Messages />);

    expect(
      screen.getByText(/send a message to start the conversation/i)
    ).toBeInTheDocument();
  });

  it("renders messages in correct order", () => {
    useConversation.mockReturnValue({
      messages: [
        {
          _id: "1",
          message: "First message",
          senderId: "user1",
          createdAt: "2024-01-01T10:00:00Z",
        },
        {
          _id: "2",
          message: "Second message",
          senderId: "user2",
          createdAt: "2024-01-01T10:01:00Z",
        },
      ],
      selectedConversation: {
        _id: "conv123",
      },
    });

    render(<Messages />);

    const messages = screen.getAllByTestId("message");
    expect(messages[0]).toHaveTextContent("First message");
    expect(messages[1]).toHaveTextContent("Second message");
  });
});
