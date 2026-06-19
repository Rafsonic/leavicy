import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataExportButton } from "../data-export-button";

const rpc = vi.fn();

vi.mock("@repo/database/client", () => ({
  createClient: () => ({ rpc }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("DataExportButton", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("renders with stable id, data-cy and data-component", () => {
    render(<DataExportButton />);
    const btn = screen.getByRole("button", { name: /download my data/i });
    expect(btn.getAttribute("id")).toBe("export-my-data-button");
    expect(btn.getAttribute("data-cy")).toBe("export-my-data-button");
    expect(btn.getAttribute("data-component")).toBe("DataExportButton");
  });

  it("downloads the export under the Leavicy-branded filename", async () => {
    rpc.mockResolvedValue({ data: { records: [] }, error: null });

    render(<DataExportButton />);

    // Capture the anchor the handler builds without breaking React's own
    // createElement calls (render has already happened by now).
    const anchor = document.createElement("a");
    const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    fireEvent.click(
      screen.getByRole("button", { name: /download my data/i }),
    );

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(anchor.download).toBe("leavicy-my-data.json");
    expect(rpc).toHaveBeenCalledWith("export_my_data");

    createElementSpy.mockRestore();
  });
});
