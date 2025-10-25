import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Conversations from "../components/Conversations";
import useConversation from "../store/useConversation";
import { renderWithProviders } from "./test-utils";

// Mock hooks
vi.mock("../context/hooks/useGetConversations", () => ({
  default: vi.fn(() => ({ loading: false })),
}));

vi.mock("../store/useConversation");

// Mock child components
vi.mock("../components/Converastion", () => ({
  default: ({ conversation, isSelected, onClick }) => (
    <div
      data-testid="conversation-item"
      onClick={() => onClick(conversation)}
      className={isSelected ? "selected" : ""}
    >
      {conversation.participants?.[0]?.fullName || conversation._id}
    </div>
  ),
}));

vi.mock("../components/SearchInput", () => ({
  default: ({ onSearch }) => (
    <input
      data-testid="search-input"
      placeholder="Search conversations"
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

const mockAuthContextValue = {
  authUser: {
    id: "1",
    userName: "testuser",
    fullName: "Test User",
    role: "employee",
  },
  setAuthUser: vi.fn(),
};

// Use renderWithProviders instead of custom wrapper

describe("Conversations Component", () => {
  const mockSetSelectedConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useConversation.mockReturnValue({
      selectedConversation: null,
      setSelectedConversation: mockSetSelectedConversation,
    });
  });

  it("renders conversations list", () => {
    renderWithProviders(<Conversations />);

    expect(screen.getByTestId("conversation-item")).toBeInTheDocument();
  });

  it("shows search input", () => {
    renderWithProviders(<Conversations />);

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows tracking section for managers", () => {
    const managerUser = {
      ...mockAuthContextValue.authUser,
      role: "manager",
    };

    render(<ConversationsWrapper authUser={managerUser} />);

    expect(screen.getByText(/tracking/i)).toBeInTheDocument();
  });

  it("shows tracking section for admins", () => {
    const adminUser = {
      ...mockAuthContextValue.authUser,
      role: "admin",
    };

    render(<ConversationsWrapper authUser={adminUser} />);

    expect(screen.getByText(/tracking/i)).toBeInTheDocument();
  });

  it("does not show tracking section for regular employees", () => {
    render(<ConversationsWrapper />);

    expect(screen.queryByText(/tracking/i)).not.toBeInTheDocument();
  });

  it("handles conversation selection", async () => {
    const { default: useGetConversations } = await import(
      "../context/hooks/useGetConversations"
    );
    useGetConversations.mockReturnValue({
      loading: false,
      conversations: [
        {
          _id: "conv1",
          participants: [{ fullName: "John Doe", userName: "john" }],
        },
      ],
    });

    render(<ConversationsWrapper />);

    const conversationItem = screen.getByText("John Doe");
    fireEvent.click(conversationItem);

    expect(mockSetSelectedConversation).toHaveBeenCalledWith({
      _id: "conv1",
      participants: [{ fullName: "John Doe", userName: "john" }],
    });
  });

  it("shows loading state", async () => {
    const { default: useGetConversations } = await import(
      "../context/hooks/useGetConversations"
    );
    useGetConversations.mockReturnValue({
      loading: true,
      conversations: [],
    });

    render(<ConversationsWrapper />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows empty state when no conversations", async () => {
    const { default: useGetConversations } = await import(
      "../context/hooks/useGetConversations"
    );
    useGetConversations.mockReturnValue({
      loading: false,
      conversations: [],
    });

    render(<ConversationsWrapper />);

    expect(screen.getByText(/no conversations found/i)).toBeInTheDocument();
  });
});
