import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import TrackingView from "../components/Messages/TrackingView";

// Mock the formatTime utility
vi.mock("../utils/formatTime", () => ({
  formatMessageTime: vi.fn(() => "12/10/2024 14:30"),
}));

describe("TrackingView Basic Tests", () => {
  const mockMessages = [
    {
      _id: "1",
      isExternalRequest: true,
      direction: "outgoing",
      externalStatus: "pending",
      createdAt: "2024-10-12T14:30:00Z",
      orderNumber: "EXT-001",
      buyer: "Test Buyer",
      senderId: { fullName: "John Employee" },
      receiverId: { fullName: "Jane Warehouse" },
      messages: [{ ean: "123456", naziv: "Product 1", qty: 2 }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the tracking view title", () => {
    renderWithProviders(<TrackingView messages={mockMessages} />);

    expect(
      screen.getByText("External Requests Management")
    ).toBeInTheDocument();
  });

  it("displays basic message information", () => {
    renderWithProviders(<TrackingView messages={mockMessages} />);

    expect(screen.getByText("EXT-001")).toBeInTheDocument();
    expect(screen.getByText("Test Buyer")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    renderWithProviders(<TrackingView messages={[]} />);

    expect(screen.getByText("No Matching Requests")).toBeInTheDocument();
  });
});
