import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantStatCards } from "../tenant-stat-cards";
import type { PlatformStats } from "@repo/database/types";

const stats: PlatformStats = {
  total_tenants: 5,
  active_tenants: 3,
  suspended_tenants: 2,
  archived_tenants: 1,
  total_users: 42,
  total_requests: 100,
  pending_requests: 7,
};

describe("TenantStatCards", () => {
  it("sets data-component and forwards id to data-cy on the root", () => {
    const { container } = render(
      <TenantStatCards id="platform-stats" stats={stats} />,
    );
    const root = container.querySelector("[data-component='TenantStatCards']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("platform-stats");
  });

  it("renders the headline metrics from the stats", () => {
    render(<TenantStatCards id="platform-stats" stats={stats} />);
    expect(screen.getByText("5")).toBeTruthy(); // total tenants
    expect(screen.getByText("42")).toBeTruthy(); // users
    expect(screen.getByText("100")).toBeTruthy(); // requests
    expect(screen.getByText("7")).toBeTruthy(); // pending
    expect(screen.getByText(/3 active · 1 archived/)).toBeTruthy();
  });
});
