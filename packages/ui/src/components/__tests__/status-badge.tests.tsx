import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it("renders the human-readable label for a status", () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeTruthy();
  });

  it("renders the label for a pending status", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeTruthy();
  });
});
