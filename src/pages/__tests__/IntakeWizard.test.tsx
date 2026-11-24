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

  it.each([
    ["service=demo", "demo", "demo", true],
    ["service=website", "website", "website", true],
    ["service=ai", "ai", "ai_receptionist", false],
    ["service=ai_receptionist", "ai", "ai_receptionist", false],
    ["service=both", "website", "website", true],
    ["service=other", "other", "other", false],
    ["product=pilot", "ai", "ai_receptionist", false],
  ])("preselects and opens %s while retaining payload intent", async (query, selected, payloadService, needsTown) => {
    invoke.mockResolvedValue({ data: { project_token: "mock-project" }, error: null });
    render(<MemoryRouter initialEntries={[`/get-demo?${query}&tier=custom-business&trial=true`]}><GetDemo /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "How can I help?", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "What is this about?" })).toHaveValue(selected);
    const user = await enterEssentials();
    if (needsTown) {
      expect(screen.getByLabelText("Where do you serve customers? *")).toBeRequired();
      await user.type(screen.getByLabelText("Where do you serve customers? *"), "Damariscotta");
    }
    await user.click(screen.getByRole("button", { name: /Send inquiry|Build my preview/ }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("leads/request-demo", expect.objectContaining({
      body: expect.objectContaining({
        service_type: payloadService,
        tier: "custom-business",
        product_type: query === "product=pilot" ? "pilot" : null,
        is_trial: true,
        city: needsTown ? "Damariscotta" : null,
      }),
    })));
  });

  it("opens the same short inquiry with an individual service preselected", async () => {
    invoke.mockResolvedValue({ data: { project_token: "mock-project" }, error: null });
    render(<MemoryRouter initialEntries={["/get-demo?service=other&request=forms_routing"]}><GetDemo /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Ask about Forms & Lead Routing", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "What is this about?" })).toHaveValue("other");
    expect(screen.getByLabelText("Message *")).toHaveValue("I’m interested in Forms & Lead Routing.");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Business name *"), "PCD");
    await user.type(screen.getByLabelText("Email *"), "qa@example.com");
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("leads/request-demo", expect.objectContaining({
      body: expect.objectContaining({ service_type: "other", custom_request: "I’m interested in Forms & Lead Routing." }),
    })));
  });

  it("uses the shared shell for review requests", () => {
    render(<MemoryRouter initialEntries={["/get-demo?service=review&town=newcastle&industry=contractor"]}><GetDemo /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Get a free website review", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Client login" })).toHaveAttribute("href", "/portal");
    expect(screen.getByRole("link", { name: "Send a general inquiry." })).toHaveAttribute("href", "/get-demo");
    expect(screen.getByRole("link", { name: "Email Ben" })).toHaveAttribute("href", "mailto:pleasantcovedesign@gmail.com");
  });

  it("shows exactly three required existing-website fields and accepts a bare domain", async () => {
    invoke.mockResolvedValue({ data: { ok: true, project_token: "existing-project" }, error: null });
    render(<MemoryRouter initialEntries={["/get-demo?service=existing"]}><GetDemo /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Get help with your website", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Client login" })).toHaveAttribute("href", "/portal");
    const website = screen.getByLabelText("Current website");
    const email = screen.getByLabelText("Your email");
    const message = screen.getByLabelText("What would you like to fix or improve?");
    for (const field of [website, email, message]) expect(field).toBeRequired();
    expect(screen.queryByLabelText(/Business name/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Where do you serve/)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(website, "example.com");
    await user.type(email, "owner@example.com");
    await user.type(message, "Please fix our contact form.");
    await user.click(screen.getByRole("button", { name: "Send website inquiry" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    const body = invoke.mock.calls[0][1].body;
    expect(body).toEqual(expect.objectContaining({
      service_type: "website",
      inquiry_type: "existing",
      website: "https://example.com/",
      existing_site_url: "https://example.com/",
      email: "owner@example.com",
      custom_request: "Please fix our contact form.",
      city: null,
    }));
    expect(body).not.toHaveProperty("business_name");
    expect(await screen.findByText("Thanks, I got your inquiry. I’ll take a look at your site and follow up by email.")).toBeInTheDocument();
  });

  it("accepts a full existing-website URL without adding business or service-area fields", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(<MemoryRouter initialEntries={["/get-demo?service=existing"]}><GetDemo /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Current website"), "https://example.com/services");
    await user.type(screen.getByLabelText("Your email"), "owner@example.com");
    await user.type(screen.getByLabelText("What would you like to fix or improve?"), "Add a services page.");
    await user.click(screen.getByRole("button", { name: "Send website inquiry" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("leads/request-demo", expect.objectContaining({
      body: expect.objectContaining({ website: "https://example.com/services", existing_site_url: "https://example.com/services" }),
    })));
  });

  it("shows inline existing-website validation without calling the lead endpoint", async () => {
    render(<MemoryRouter initialEntries={["/get-demo?service=existing"]}><GetDemo /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Current website"), "not a url");
    await user.type(screen.getByLabelText("Your email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send website inquiry" }));
    expect(screen.getByText("Enter a valid domain or full URL, such as yourbusiness.com.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Tell me a little about what you’d like to change.")).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("preserves existing-website entries and allows retry after a failed send", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error("Mocked failure") }).mockResolvedValueOnce({ data: { ok: true }, error: null });
    render(<MemoryRouter initialEntries={["/get-demo?service=existing"]}><GetDemo /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Current website"), "example.com");
    await user.type(screen.getByLabelText("Your email"), "owner@example.com");
    await user.type(screen.getByLabelText("What would you like to fix or improve?"), "Make the site easier to use.");
    await user.click(screen.getByRole("button", { name: "Send website inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your entries are still here");
    expect(screen.getByLabelText("Current website")).toHaveValue("example.com");
    expect(screen.getByLabelText("Your email")).toHaveValue("owner@example.com");
    expect(screen.getByLabelText("What would you like to fix or improve?")).toHaveValue("Make the site easier to use.");
    await user.click(screen.getByRole("button", { name: "Send website inquiry" }));
    expect(await screen.findByText("Thanks, I got your inquiry. I’ll take a look at your site and follow up by email.")).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("retains the same input nodes, focus and caret through ordinary typing", async () => {
    openInquiry();
    const user = userEvent.setup();
    for (const [label, value] of [["Business name *", "PCD"], ["Email *", "qa@example.com"], ["Message *", "Please improve my website."]]) {
      const field = screen.getByLabelText(label) as HTMLInputElement;
      await user.type(field, value);
      expect(screen.getByLabelText(label)).toBe(field);
      expect(field).toHaveValue(value);
      expect(field).toHaveFocus();
      if (field.type !== "email") expect(field.selectionStart).toBe(value.length);
    }
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
      expect(screen.getByRole("button", { name: /Send inquiry|Build my preview/ })).toBeDisabled();
    }
    expect(invoke).not.toHaveBeenCalled();
  });

  it("blocks repeat submission while loading and shows a guest receipt on mocked success", async () => {
    let finish: (value: unknown) => void = () => { throw new Error("Pending request missing"); };
    invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    openInquiry();
    const user = await enterEssentials();
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(invoke).toHaveBeenCalledTimes(1);
    finish({ data: { project_token: "mock-project" }, error: null });
    expect(await screen.findByRole("link", { name: /Create my account/ })).toHaveAttribute("href", expect.stringContaining("token=mock-project"));
  });

  it("preserves typed values and allows retry after a mocked submission error", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("Mocked failure") });
    openInquiry();
    const user = await enterEssentials();
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your entries are still here");
    expect(screen.getByRole("button", { name: "Send inquiry" })).toBeEnabled();
    expect(screen.getByLabelText("Message *")).toHaveValue("Please improve my website.");
  });
});