import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const { invoke, toast } = vi.hoisted(() => ({ invoke: vi.fn(), toast: vi.fn() }));
vi.mock("@/integrations/supabase/portalClient", () => ({
  portalSupabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    functions: { invoke },
  },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/components/SEOHead", () => ({ SEOHead: () => null }));
vi.mock("@/components/intake/ReviewRequestForm", () => ({ ReviewRequestForm: () => null }));

import GetDemo from "../IntakeWizard";

const openInquiry = () => {
  render(<MemoryRouter initialEntries={["/get-demo"]}><GetDemo /></MemoryRouter>);
  const summary = screen.getByText("Prefer a short website inquiry?");
  const disclosure = summary.closest("details");
  if (!disclosure) throw new Error("Inquiry disclosure missing");
  disclosure.open = true;
  fireEvent(disclosure, new Event("toggle"));
  return disclosure;
};

async function enterEssentials() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Business name *"), "PCD");
  await user.type(screen.getByLabelText("Email *"), "qa@example.com");
  await user.type(screen.getByLabelText("Message *"), "Please improve my website.");
  return user;
}

describe("Contact inquiry regressions", () => {
  beforeEach(() => { invoke.mockReset(); toast.mockReset(); });
  afterEach(cleanup);

  it("retains the same input nodes, focus and caret through ordinary typing", async () => {
    const disclosure = openInquiry();
    const user = userEvent.setup();
    for (const [label, value] of [["Business name *", "PCD"], ["Email *", "qa@example.com"], ["Message *", "Please improve my website."]]) {
      const field = screen.getByLabelText(label) as HTMLInputElement;
      await user.type(field, value);
      expect(screen.getByLabelText(label)).toBe(field);
      expect(field).toHaveValue(value);
      expect(field).toHaveFocus();
      if (field.type !== "email") expect(field.selectionStart).toBe(value.length);
    }
    expect(disclosure.open).toBe(true);
  });

  it("preserves optional disclosure and values when service changes", async () => {
    openInquiry();
    const user = await enterEssentials();
    const optional = screen.getByText("More details (optional)").closest("details");
    if (!optional) throw new Error("Optional disclosure missing");
    optional.open = true;
    fireEvent(optional, new Event("toggle"));
    await user.type(screen.getByLabelText("Your name"), "QA customer");
    await user.selectOptions(screen.getByLabelText("What is this about?"), "existing");
    expect(optional.open).toBe(true);
    expect(screen.getByLabelText("Your name")).toHaveValue("QA customer");
    expect(screen.getByLabelText("Business name *")).toHaveValue("PCD");
    await user.type(screen.getByLabelText("Where do you serve customers? *"), "Damariscotta");
    await user.selectOptions(screen.getByLabelText("What is this about?"), "other");
    expect(screen.getByLabelText("Town or service area")).toHaveValue("Damariscotta");
    expect(optional.open).toBe(true);
  });

  it("requires business, email and message plus town only for location-dependent services", async () => {
    openInquiry();
    const user = await enterEssentials();
    for (const label of ["Business name *", "Email *", "Message *"]) expect(screen.getByLabelText(label)).toBeRequired();
    expect(screen.getByLabelText("Town or service area")).not.toBeRequired();
    for (const service of ["demo", "website", "existing"]) {
      await user.selectOptions(screen.getByLabelText("What is this about?"), service);
      expect(screen.getByLabelText("Where do you serve customers? *")).toBeRequired();
      expect(screen.getByRole("button", { name: /Send it|Build my preview/ })).toBeDisabled();
    }
    expect(invoke).not.toHaveBeenCalled();
  });

  it("blocks repeat submission while loading and shows a guest receipt on mocked success", async () => {
    let finish: (value: unknown) => void = () => { throw new Error("Pending request missing"); };
    invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    openInquiry();
    const user = await enterEssentials();
    await user.click(screen.getByRole("button", { name: "Send it" }));
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(invoke).toHaveBeenCalledTimes(1);
    finish({ data: { project_token: "mock-project" }, error: null });
    expect(await screen.findByRole("link", { name: /Create my account/ })).toHaveAttribute("href", expect.stringContaining("token=mock-project"));
  });

  it("preserves typed values and allows retry after a mocked submission error", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("Mocked failure") });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const disclosure = openInquiry();
      const user = await enterEssentials();
      await user.click(screen.getByRole("button", { name: "Send it" }));
      await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
      expect(screen.getByRole("button", { name: "Send it" })).toBeEnabled();
      expect(screen.getByLabelText("Message *")).toHaveValue("Please improve my website.");
      expect(disclosure.open).toBe(true);
    } finally { consoleError.mockRestore(); }
  });
});