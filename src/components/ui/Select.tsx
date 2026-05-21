import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  selectSize?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "muted" | "highlighted" | "placeholder" | "form";
  icon?: ReactNode;
  fullWidth?: boolean;
  wrapperClassName?: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  title?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  placeholder?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  placement?: "bottom" | "top";
  filterOption?: (option: SelectOption, normalizedQuery: string) => boolean;
  renderOption?: (
    option: SelectOption,
    context: { isSelected: boolean; isActive: boolean },
  ) => ReactNode;
  renderValue?: (option: SelectOption | null) => ReactNode;
  emptyResultsLabel?: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface NativeOptionProps {
  value?: string | number | readonly string[];
  disabled?: boolean;
  children?: ReactNode;
}

export function normaliseSelectSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function defaultFilterOption(option: SelectOption, normalizedQuery: string): boolean {
  const normalizedLabel = normaliseSelectSearchText(String(option.label ?? ""));
  const normalizedValue = normaliseSelectSearchText(option.value);
  return (
    normalizedLabel.includes(normalizedQuery) ||
    normalizedValue.includes(normalizedQuery)
  );
}

function parseOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") {
      return [];
    }

    const option = child as ReactElement<NativeOptionProps>;

    return [
      {
        value: String(option.props.value ?? ""),
        label: option.props.children,
        disabled: option.props.disabled,
      },
    ];
  });
}

export function Select({
  selectSize = "md",
  variant = "default",
  icon,
  fullWidth = false,
  wrapperClassName = "",
  className = "",
  children,
  style,
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  id,
  required,
  title,
  tabIndex,
  autoFocus,
  onBlur,
  onFocus,
  placeholder,
  searchable = false,
  searchPlaceholder,
  placement = "bottom",
  filterOption = defaultFilterOption,
  renderOption,
  renderValue,
  emptyResultsLabel,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const controlledValue = value !== undefined ? String(value) : undefined;

  const options = useMemo(() => parseOptions(children), [children]);

  const [uncontrolledValue, setUncontrolledValue] = useState(() => {
    if (controlledValue !== undefined) {
      return controlledValue;
    }

    if (defaultValue !== undefined) {
      return String(defaultValue);
    }

    return "";
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const currentValue = controlledValue ?? uncontrolledValue;
  const selectedOption =
    currentValue.length > 0
      ? options.find((option) => option.value === currentValue) ?? null
      : null;
  const selectedValue = selectedOption?.value ?? "";

  const normalizedSearchQuery = normaliseSelectSearchText(searchQuery);
  const visibleOptions = useMemo(() => {
    const enabledOptions = options.filter((option) => !option.disabled);

    if (!searchable || normalizedSearchQuery.length === 0) {
      return enabledOptions;
    }

    return enabledOptions.filter((option) =>
      filterOption(option, normalizedSearchQuery),
    );
  }, [filterOption, normalizedSearchQuery, options, searchable]);

  useEffect(() => {
    if (controlledValue !== undefined || options.length === 0) {
      return;
    }

    if (
      uncontrolledValue.length > 0 &&
      !options.some((option) => option.value === uncontrolledValue)
    ) {
      setUncontrolledValue("");
    }
  }, [controlledValue, options, uncontrolledValue]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = visibleOptions.findIndex(
      (option) => option.value === selectedValue,
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);

    if (searchable) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen, searchable, selectedValue, visibleOptions]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const handleSelect = (nextValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }

    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);

    setIsOpen(false);
  };

  const openDropdown = () => {
    if (disabled || options.length === 0) {
      return;
    }

    setIsOpen(true);
  };

  const toggleOpen = () => {
    if (disabled || options.length === 0) {
      return;
    }

    setIsOpen((open) => !open);
  };

  const moveActiveIndex = (direction: 1 | -1) => {
    if (visibleOptions.length === 0) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const baseIndex = currentIndex >= 0 ? currentIndex : 0;
      return (baseIndex + direction + visibleOptions.length) % visibleOptions.length;
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }

      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }

      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }

      const activeOption = visibleOptions[activeIndex];
      if (activeOption) {
        handleSelect(activeOption.value);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const activeOption = visibleOptions[activeIndex];
      if (activeOption) {
        handleSelect(activeOption.value);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const base =
    "rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed";

  const triggerContent = selectedOption
    ? (renderValue?.(selectedOption) ?? selectedOption.label)
    : (placeholder ?? "");
  const showPlaceholderStyle = !selectedOption && placeholder !== undefined;

  const formSurface =
    "bg-gray-50 dark:bg-navy-900 border-gray-300 dark:border-navy-600 focus:border-primary-500 focus:ring-primary-500/20";
  const variants = {
    default:
      "bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-600 text-gray-700 dark:text-gray-200",
    subtle:
      "bg-gray-100 dark:bg-navy-700 border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300",
    muted:
      "bg-gray-50 dark:bg-navy-700 border-gray-200 dark:border-navy-600 text-gray-700 dark:text-gray-300",
    highlighted:
      "bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/40 text-primary-700 dark:text-primary-300 font-bold",
    placeholder:
      "bg-gray-50 dark:bg-navy-700 border-gray-200 dark:border-navy-600 text-gray-400 dark:text-gray-500",
    form: `${formSurface} text-gray-900 dark:text-white`,
  };

  const triggerVariantClass =
    variant === "form" && showPlaceholderStyle ? formSurface : variants[variant];

  const sizes = {
    xs: "py-0.5 text-[10px]",
    sm: "py-1.5 text-xs",
    md: "py-2 text-sm",
    lg: "py-3 text-base",
  };

  const leftPadding = icon
    ? { xs: "pl-7", sm: "pl-8", md: "pl-9", lg: "pl-9" }[selectSize]
    : "pl-3";

  const rightPadding = { xs: "pr-6", sm: "pr-8", md: "pr-9", lg: "pr-9" }[selectSize];
  const iconInset = { xs: "left-2", sm: "left-2.5", md: "left-3", lg: "left-3" }[selectSize];
  const chevronInset = { xs: "right-2", sm: "right-2.5", md: "right-3", lg: "right-3" }[
    selectSize
  ];
  const chevronSize = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-4 h-4", lg: "w-4 h-4" }[
    selectSize
  ];
  const optionTextSize = { xs: "text-[10px]", sm: "text-xs", md: "text-sm", lg: "text-sm" }[
    selectSize
  ];

  const dropdownPositionClassName =
    placement === "top"
      ? "bottom-full mb-1"
      : "top-full mt-1";

  optionRefs.current = [];

  return (
    <div
      ref={wrapperRef}
      className={`relative ${fullWidth ? "w-full" : ""} ${isOpen ? "z-50" : ""} ${wrapperClassName}`}
    >
      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
        />
      ) : null}
      {icon ? (
        <span
          className={`pointer-events-none absolute inset-y-0 ${iconInset} flex items-center text-gray-400 dark:text-gray-500`}
          aria-hidden="true"
        >
          <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        </span>
      ) : null}
      <button
        type="button"
        id={id}
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        tabIndex={tabIndex}
        autoFocus={autoFocus}
        className={`${base} ${triggerVariantClass} ${sizes[selectSize]} ${leftPadding} ${rightPadding} ${fullWidth ? "w-full" : ""} ${className} flex items-center justify-between text-left`}
        style={style}
        onClick={(event) => {
          event.stopPropagation();
          toggleOpen();
        }}
        onKeyDown={handleTriggerKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        <span
          className={`truncate ${showPlaceholderStyle ? "form-placeholder-text" : "text-gray-900 dark:text-white"}`}
        >
          {triggerContent}
        </span>
      </button>
      <span
        className={`pointer-events-none absolute inset-y-0 ${chevronInset} flex items-center text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        aria-hidden="true"
      >
        <ChevronDown className={chevronSize} />
      </span>

      {isOpen ? (
        <div
          className={`absolute left-0 right-0 ${dropdownPositionClassName} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-navy-600 dark:bg-navy-800`}
        >
          {searchable ? (
            <div className="border-b border-gray-100 p-2 dark:border-navy-600">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                placeholder={searchPlaceholder}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 dark:border-navy-600 dark:bg-navy-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          ) : null}
          <div
            id={listboxId}
            role="listbox"
            aria-required={required}
            className={`${searchable ? "max-h-[min(20rem,calc(100vh-9rem))]" : "max-h-60"} overflow-y-auto overscroll-contain p-1`}
          >
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                {emptyResultsLabel}
              </p>
            ) : (
              visibleOptions.map((option, index) => {
                const isSelected = option.value === currentValue;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={`${optionTextSize} flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${isSelected ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400" : isActive ? "bg-gray-100 text-gray-900 dark:bg-navy-700 dark:text-white" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-700"} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!option.disabled) {
                        handleSelect(option.value);
                      }
                    }}
                  >
                    {renderOption ? (
                      renderOption(option, { isSelected, isActive })
                    ) : (
                      <>
                        <span className="truncate">{option.label}</span>
                        {isSelected ? (
                          <Check className="ml-2 h-4 w-4 shrink-0" />
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
