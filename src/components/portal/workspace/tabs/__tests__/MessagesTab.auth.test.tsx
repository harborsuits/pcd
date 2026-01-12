import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock supabase client before importing MessagesTab
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

const fetchSpy = vi.fn();
global.fetch = fetchSpy as unknown as typeof fetch;

import { MessagesTab } from "../MessagesTab";

describe("MessagesTab auth", () => {
  beforeEach(() => {
    fetchSpy.mockReset();
  });

  it("does not fetch messages when session is missing", async () => {
    render(<MessagesTab token="TEST_TOKEN" businessName="Test Business" />);

    // Wait a tick for effects to run; fetch should never be called
    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it("shows error when trying to send without a session", async () => {
    render(<MessagesTab token="TEST_TOKEN" businessName="Test Business" />);

    const input = await screen.findByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "hello" } });

    // Use stable aria-label selector
    const sendBtn = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/sign in again/i)).toBeInTheDocument();
    });
  });
});
