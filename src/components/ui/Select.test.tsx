import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Globe } from "lucide-react";
import { Select } from "./Select";

describe("Select", () => {
  it("renders the selected option label", () => {
    render(
      <Select value="en" aria-label="Language">
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent(
      "English",
    );
  });

  it("opens the option list when clicked", () => {
    render(
      <Select defaultValue="en" aria-label="Language">
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Language" }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Português" })).toBeInTheDocument();
  });

  it("calls onChange and updates the displayed label when an option is chosen", () => {
    const onChange = vi.fn();

    render(
      <Select defaultValue="en" aria-label="Language" onChange={onChange}>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Language" }));
    fireEvent.click(screen.getByRole("option", { name: "Português" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("pt");
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent(
      "Português",
    );
  });

  it("applies custom classes and renders the leading icon", () => {
    render(
      <Select
        defaultValue="en"
        aria-label="Language"
        icon={<Globe />}
        variant="subtle"
        className="my-select"
      >
        <option value="en">English</option>
      </Select>,
    );

    const combobox = screen.getByRole("combobox", { name: "Language" });
    expect(combobox.className).toContain("bg-gray-100");
    expect(combobox.className).toContain("my-select");
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("submits a hidden input value when a name is provided", () => {
    render(
      <Select defaultValue="pt" name="language" aria-label="Language">
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    const hiddenInput = document.querySelector(
      'input[type="hidden"][name="language"]',
    ) as HTMLInputElement | null;

    expect(hiddenInput).not.toBeNull();
    expect(hiddenInput?.value).toBe("pt");
  });

  it("shows a placeholder when no value is selected", () => {
    render(
      <Select value="" placeholder="Pick one" aria-label="Language">
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent(
      "Pick one",
    );
  });

  it("shows a placeholder when renderValue is provided but no value is selected", () => {
    render(
      <Select
        value=""
        placeholder="Pick one"
        aria-label="Language"
        renderValue={(option) => (option ? `Selected: ${option.label}` : undefined)}
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent(
      "Pick one",
    );
  });

  it("filters searchable options and supports keyboard selection", () => {
    const onChange = vi.fn();

    render(
      <Select
        searchable
        searchPlaceholder="Search languages"
        emptyResultsLabel="Nothing found"
        aria-label="Language"
        onChange={onChange}
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
        <option value="de">Deutsch</option>
      </Select>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Language" }));

    const searchInput = screen.getByPlaceholderText("Search languages");
    fireEvent.change(searchInput, { target: { value: "deu" } });

    expect(screen.getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "English" })).not.toBeInTheDocument();

    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("de");
  });
});
