import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PricingSection from "../pricing-section";
import { ALACARTE_SERVICES } from "@/lib/pricingMenu";

describe("Unified pricing inquiries", () => {
  afterEach(cleanup);

  it("routes every individual-service quote to the shared inquiry with its service context", () => {
    render(<MemoryRouter><PricingSection /></MemoryRouter>);
    const links = screen.getAllByRole("link", { name: "Request a quote" })
      .filter((link) => link.getAttribute("href")?.includes("&request="));
    expect(links).toHaveLength(10);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      ALACARTE_SERVICES.map((service) => `/get-demo?service=other&request=${service.id}`),
    );
  });
});
