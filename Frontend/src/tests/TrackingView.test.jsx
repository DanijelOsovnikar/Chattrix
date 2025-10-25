import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TrackingView from "../components/Messages/TrackingView";

// Mock the formatTime utility
vi.mock("../utils/formatTime", () => ({
  formatMessageTime: vi.fn(() => "12/10/2024 14:30"),
}));

describe("TrackingView", () => {
  const mockMessages = [
    {
      _id: "1",
      isExternalRequest: true,
      direction: "outgoing",
      externalStatus: "pending",
      createdAt: "2024-10-12T14:30:00Z",
      orderNumber: "EXT-001",
      buyer: "Test Buyer",
      buyerName: "Test Buyer Name",
      senderId: { fullName: "John Employee", _id: "emp1" },
      receiverId: { fullName: "Jane Warehouse", _id: "wh1" },
      messages: [
        { ean: "123456", naziv: "Product 1", qty: 2 },
        { ean: "789012", naziv: "Product 2", qty: 1 },
      ],
    },
    {
      _id: "2",
      isExternalRequest: true,
      direction: "incoming",
      externalStatus: "sending",
      createdAt: "2024-10-12T15:45:00Z",
      orderNumber: "EXT-002",
      buyer: "Another Buyer",
      senderId: { fullName: "External Employee", _id: "ext1" },
      receiverId: { fullName: "Our Employee", _id: "our1" },
      messages: [{ ean: "345678", naziv: "Product 3", qty: 1 }],
    },
    {
      _id: "3",
      isExternalRequest: true,
      direction: "outgoing",
      externalStatus: "rejected",
      createdAt: "2024-10-12T16:00:00Z",
      orderNumber: "EXT-003",
      buyer: "Third Buyer",
      senderId: { fullName: "Another Employee", _id: "emp2" },
      receiverId: { fullName: "Another Warehouse", _id: "wh2" },
      messages: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the tracking view with title and description", () => {
    render(<TrackingView messages={mockMessages} />);

    expect(
      screen.getByText("External Requests Management")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Track all external requests - both sent and received")
    ).toBeInTheDocument();
  });

  it("displays filter controls", () => {
    render(<TrackingView messages={mockMessages} />);

    // Should have three select dropdowns for filtering
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(3);

    // Should show the filter labels
    expect(screen.getByText("Request Direction")).toBeInTheDocument();
    expect(screen.getByText("Request Status")).toBeInTheDocument();
    expect(screen.getByText("Items Per Page")).toBeInTheDocument();
  });

  it("shows all messages by default", () => {
    render(<TrackingView messages={mockMessages} />);

    expect(screen.getByText("EXT-001")).toBeInTheDocument();
    expect(screen.getByText("EXT-002")).toBeInTheDocument();
    expect(screen.getByText("EXT-003")).toBeInTheDocument();
  });

  it("filters messages by direction", async () => {
    render(<TrackingView messages={mockMessages} />);

    const directionFilter = screen.getAllByRole("combobox")[0]; // First select is direction
    fireEvent.change(directionFilter, { target: { value: "outgoing" } });

    await waitFor(() => {
      expect(screen.getByText("EXT-001")).toBeInTheDocument();
      expect(screen.getByText("EXT-003")).toBeInTheDocument();
      expect(screen.queryByText("EXT-002")).not.toBeInTheDocument();
    });
  });

  it("filters messages by status", async () => {
    render(<TrackingView messages={mockMessages} />);

    const statusFilter = screen.getAllByRole("combobox")[1]; // Second select is status
    fireEvent.change(statusFilter, { target: { value: "pending" } });

    await waitFor(() => {
      expect(screen.getByText("EXT-001")).toBeInTheDocument();
      expect(screen.queryByText("EXT-002")).not.toBeInTheDocument();
      expect(screen.queryByText("EXT-003")).not.toBeInTheDocument();
    });
  });

  it("displays correct status icons and colors", () => {
    render(<TrackingView messages={mockMessages} />);

    // Check that status text appears
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("SENDING")).toBeInTheDocument();
    expect(screen.getByText("REJECTED")).toBeInTheDocument();
  });

  it("shows direction badges correctly", () => {
    render(<TrackingView messages={mockMessages} />);

    expect(screen.getAllByText("📤 OUTGOING")).toHaveLength(2);
    expect(screen.getAllByText("📥 INCOMING")).toHaveLength(1);
  });

  it("displays product information correctly", () => {
    render(<TrackingView messages={mockMessages} />);

    expect(
      screen.getByText("Product 1 (EAN: 123456) - Qty: 2")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Product 2 (EAN: 789012) - Qty: 1")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Product 3 (EAN: 345678) - Qty: 1")
    ).toBeInTheDocument();
  });

  it("shows correct sender/receiver information based on direction", () => {
    render(<TrackingView messages={mockMessages} />);

    // For outgoing messages
    expect(
      screen.getByText("John Employee (Our Employee)")
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Warehouse")).toBeInTheDocument();

    // For incoming messages
    expect(screen.getByText("External Employee")).toBeInTheDocument();
    expect(screen.getByText("Our Employee (Our Employee)")).toBeInTheDocument();
  });

  it("handles pagination correctly", () => {
    render(<TrackingView messages={mockMessages} />);

    // Should show pagination controls
    expect(
      screen.getByText((content) => content.includes("Showing"))
    ).toBeInTheDocument();

    // All messages should be visible by default
    expect(screen.getByText("EXT-001")).toBeInTheDocument();
    expect(screen.getByText("EXT-002")).toBeInTheDocument();
    expect(screen.getByText("EXT-003")).toBeInTheDocument();
  });

  it("shows empty state when no messages match filters", () => {
    render(<TrackingView messages={mockMessages} />);

    const statusFilter = screen.getAllByRole("combobox")[1]; // Second select is status
    fireEvent.change(statusFilter, { target: { value: "keeping" } });

    expect(screen.getByText("No Matching Requests")).toBeInTheDocument();
    expect(
      screen.getByText(/No requests match the current filters/)
    ).toBeInTheDocument();
  });

  it("shows empty state when no external requests exist", () => {
    render(<TrackingView messages={[]} />);

    expect(screen.getByText("No Matching Requests")).toBeInTheDocument();
    expect(screen.getByText(/No external requests found/)).toBeInTheDocument();
  });

  it("resets to first page when filters change", () => {
    const manyMessages = Array.from({ length: 15 }, (_, i) => ({
      ...mockMessages[0],
      _id: `msg-${i}`,
      orderNumber: `EXT-${String(i).padStart(3, "0")}`,
      externalStatus: i < 10 ? "pending" : "sending",
    }));

    render(<TrackingView messages={manyMessages} />);

    // Apply status filter
    const statusFilter = screen.getAllByRole("combobox")[1]; // Second select is status
    fireEvent.change(statusFilter, { target: { value: "pending" } });

    // Should show filtered results
    expect(
      screen.getByText((content) => content.includes("Showing"))
    ).toBeInTheDocument();
  });

  it("displays results summary correctly", () => {
    render(<TrackingView messages={mockMessages} />);

    expect(
      screen.getByText((content) => {
        return (
          content.includes("Showing") &&
          content.includes("3") &&
          content.includes("requests")
        );
      })
    ).toBeInTheDocument();
  });
});
