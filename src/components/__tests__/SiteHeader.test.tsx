import { render, screen } from "@testing-library/react";
import React from "react";
import SiteHeader from "../SiteHeader";

describe("SiteHeader", () => {
  it("renders the header/brand", () => {
    render(<SiteHeader />);
    // Adjust selector to match the component (role/text/alt):
    // Prefer arole check if header has role="banner"
    const banner = screen.queryByRole("banner");
    if (banner) {
      expect(banner).toBeInTheDocument();
    } else {
      // fallback to a brand text that exists in SiteHeader:
      // update the regex to whatever the brand text is (e.g., Public Notice Portal)
      expect(screen.getByText(/civicnotices/i)).toBeInTheDocument();
    }
  });
});
