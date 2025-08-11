import { render } from "@testing-library/react";
import FilterBar from "../components/FilterBar";
import type { Filters } from "../lib/filter";

describe("FilterBar accessibility", () => {
  const filters: Filters = { type: "", status: "", start: "", end: "", authority: "" };
  it("has labels for inputs", () => {
    const { getByLabelText } = render(
      <FilterBar filters={filters} setFilters={() => {}} />
    );
    expect(getByLabelText(/Type/)).toBeDefined();
    expect(getByLabelText(/Status/)).toBeDefined();
    expect(getByLabelText(/Start/)).toBeDefined();
    expect(getByLabelText(/End/)).toBeDefined();
    expect(getByLabelText(/Authority/)).toBeDefined();
  });
});
