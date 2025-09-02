import { filterNotices, type Filters, type Notice } from "../lib/filter";

describe("filterNotices", () => {
  const notices: Notice[] = [
    { type: "Planning", status: "Open", deadline: "2024-10-01", council: "A", submitted: "2024-09-01" },
    { type: "Traffic Order", status: "Closed", deadline: "2024-08-01", council: "B", submitted: "2024-07-01" },
  ];

  it("filters by status", () => {
    const filters: Filters = { type: "", status: "Open", start: "", end: "", authority: "" };
    const res = filterNotices(notices, filters);
    expect(res).toHaveLength(1);
    expect(res[0].status).toBe("Open");
  });

  it("filters by type", () => {
    const filters: Filters = { type: "Planning", status: "", start: "", end: "", authority: "" };
    const res = filterNotices(notices, filters);
    expect(res).toHaveLength(1);
    expect(res[0].type).toBe("Planning");
  });
});
