import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReviewRequestForm } from "../ReviewRequestForm";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

const renderForm = (contextNote?: string) => render(
  <MemoryRouter><ReviewRequestForm contextNote={contextNote} /></MemoryRouter>,
);

async function enterRequiredFields(website: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name *"), "Alex Smith");
  await user.type(screen.getByLabelText("Email *"), "alex@example.com");
  await user.type(screen.getByLabelText("Current website *"), website);
  return user;
}

describe("Review request inquiry", () => {
  beforeEach(() => invoke.mockReset());
  afterEach(cleanup);

  it.each(["example.com", "https://example.com/services"])("accepts %s", async (website) => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    renderForm();
    const user = await enterRequiredFields(website);
    await user.click(screen.getByRole("button", { name: "Send me my free review" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("website-review", {
      body: expect.objectContaining({ website_url: website, email: "alex@example.com" }),
    }));
  });

  it("keeps validated town and industry context with the request", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    renderForm("Town: Newcastle, ME\nIndustry: Contractors");
    const user = await enterRequiredFields("example.com");
    await user.type(screen.getByLabelText(/What feels off/), "The contact form is confusing.");
    await user.click(screen.getByRole("button", { name: "Send me my free review" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("website-review", {
      body: expect.objectContaining({ note: "Town: Newcastle, ME\nIndustry: Contractors\nThe contact form is confusing." }),
    }));
  });

  it("retains entries after a failed request", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("Mocked failure") });
    renderForm();
    const user = await enterRequiredFields("example.com");
    await user.click(screen.getByRole("button", { name: "Send me my free review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your entries are still here");
    expect(screen.getByLabelText("Current website *")).toHaveValue("example.com");
    expect(screen.getByLabelText("Email *")).toHaveValue("alex@example.com");
  });
});
