import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { MarketingFooter } from "../MarketingFooter";
import { SOCIALS } from "@/lib/localPages";

describe("Shared social profiles", () => {
  it("lists exactly the Facebook and Instagram profiles", () => {
    expect(SOCIALS.map((s) => s.href)).toEqual([
      "https://www.facebook.com/pleasantcovedesign",
      "https://www.instagram.com/pleasantcovedesign",
    ]);
  });

  it("renders both profiles in the site footer, opening safely in a new tab", () => {
    render(
      <MemoryRouter>
        <MarketingFooter />
      </MemoryRouter>,
    );

    const nav = screen.getByRole("navigation", { name: "Social media" });
    const links = [...nav.querySelectorAll("a")];

    expect(links.map((a) => a.getAttribute("href"))).toEqual(SOCIALS.map((s) => s.href));
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("aria-label")).toBeTruthy();
    }
  });
});
