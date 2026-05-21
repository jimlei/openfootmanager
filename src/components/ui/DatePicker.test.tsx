import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DatePicker } from "./DatePicker";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: "en" },
  }),
}));

afterEach(() => {
  vi.useRealTimers();
});

function getMonthCombobox() {
  return screen.getByRole("combobox", { name: "date.month" });
}

async function selectMonth(label: string) {
  fireEvent.click(getMonthCombobox());
  fireEvent.click(await screen.findByRole("option", { name: label }));
}

describe("DatePicker", () => {
  it("renders the initial ISO date across the day, month, and year fields", () => {
    render(<DatePicker value="1999-02-03" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("DD")).toHaveValue("03");
    expect(screen.getByPlaceholderText("YYYY")).toHaveValue("1999");
    expect(getMonthCombobox()).toHaveTextContent("February");
  });

  it("emits a padded ISO date once all fields are complete", async () => {
    const onChange = vi.fn();
    render(<DatePicker value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("DD"), { target: { value: "7" } });
    fireEvent.blur(screen.getByPlaceholderText("DD"));

    await selectMonth("March");

    fireEvent.change(screen.getByPlaceholderText("YYYY"), { target: { value: "2024" } });

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith("2024-03-07");
    });
  });

  it("clamps the selected day when changing to a shorter month", async () => {
    const onChange = vi.fn();
    render(<DatePicker value="2024-01-31" onChange={onChange} />);

    onChange.mockClear();

    await selectMonth("February");

    await waitFor(() => {
      expect(screen.getByPlaceholderText("DD")).toHaveValue("29");
      expect(onChange).toHaveBeenLastCalledWith("2024-02-29");
    });
  });

  it("revalidates leap-day selections when the year changes", async () => {
    const onChange = vi.fn();
    render(<DatePicker value="2024-02-29" onChange={onChange} />);

    onChange.mockClear();
    fireEvent.change(screen.getByPlaceholderText("YYYY"), { target: { value: "2023" } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("DD")).toHaveValue("28");
      expect(onChange).toHaveBeenLastCalledWith("2023-02-28");
    });
  });

  it("normalizes two-digit years on blur using the current century", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));

    const onChange = vi.fn();
    render(<DatePicker value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("DD"), { target: { value: "1" } });
    fireEvent.blur(screen.getByPlaceholderText("DD"));

    fireEvent.click(getMonthCombobox());
    fireEvent.click(screen.getByRole("option", { name: "January" }));

    const yearInput = screen.getByPlaceholderText("YYYY");
    fireEvent.change(yearInput, { target: { value: "26" } });
    fireEvent.blur(yearInput);

    expect(yearInput).toHaveValue("1926");
    expect(onChange).toHaveBeenLastCalledWith("1926-01-01");
  });

  it("opens the month list from the keyboard", async () => {
    render(<DatePicker value="" onChange={vi.fn()} />);

    const monthCombobox = getMonthCombobox();
    monthCombobox.focus();
    fireEvent.keyDown(monthCombobox, { key: "ArrowDown" });

    expect(await screen.findByRole("option", { name: "January" })).toBeInTheDocument();
  });
});
