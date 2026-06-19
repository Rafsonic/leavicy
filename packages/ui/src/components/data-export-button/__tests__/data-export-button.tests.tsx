import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataExportButton } from "../data-export-button";

describe("DataExportButton", () => {
  it("renders with stable id, data-cy and data-component", () => {
    render(<DataExportButton />);
    const btn = screen.getByRole("button", { name: /download my data/i });
    expect(btn.getAttribute("id")).toBe("export-my-data-button");
    expect(btn.getAttribute("data-cy")).toBe("export-my-data-button");
    expect(btn.getAttribute("data-component")).toBe("DataExportButton");
  });
});
