import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "./Select";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: boolean;
}

interface DateParts {
  day: string;
  month: string;
  year: string;
}

interface MonthOption {
  value: string;
  label: string;
}

function parseDateValue(value: string): DateParts | null {
  const parts = value.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;
  return { day, month, year };
}

function formatDateValue(day: string, month: string, year: string) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function clampDayValue(dayValue: string, monthValue: string, yearValue: string) {
  if (!dayValue || parseInt(dayValue) <= 0) {
    return dayValue;
  }

  const monthNumber = parseInt(monthValue) || 1;
  const yearNumber = parseInt(yearValue) || 2000;
  const maxDays = getDaysInMonth(monthNumber, yearNumber);
  return Math.min(parseInt(dayValue), maxDays).toString();
}

function normaliseDayOnBlur(dayValue: string) {
  if (dayValue && parseInt(dayValue) > 0) {
    return parseInt(dayValue).toString().padStart(2, "0");
  }

  return "";
}

function normaliseYearOnBlur(yearValue: string, currentYear: number) {
  if (yearValue.length === 0 || yearValue.length === 4) {
    return yearValue;
  }

  const parsedYear = parseInt(yearValue);
  if (Number.isNaN(parsedYear) || parsedYear >= 100) {
    return yearValue;
  }

  const currentCentury = Math.floor(currentYear / 100) * 100;
  return currentCentury + parsedYear > currentYear
    ? (currentCentury - 100 + parsedYear).toString()
    : (currentCentury + parsedYear).toString();
}

function createMonths(language: string): MonthOption[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1);
    return {
      value: (i + 1).toString(),
      label: d.toLocaleString(language, { month: "long" }),
    };
  });
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const { t, i18n } = useTranslation();

  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    const nextValue = parseDateValue(value);
    if (nextValue) {
      setYear(nextValue.year);
      setMonth(nextValue.month);
      setDay(nextValue.day);
    }
  }, [value]);

  useEffect(() => {
    if (day && month && year && year.length === 4) {
      onChange(formatDateValue(day, month, year));
    }
  }, [day, month, year, onChange]);

  const months = useMemo(() => createMonths(i18n.language), [i18n.language]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newDay = e.target.value.replace(/\D/g, '');
    if (newDay.length > 2) newDay = newDay.slice(0, 2);

    setDay(clampDayValue(newDay, month, year));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newYear = e.target.value.replace(/\D/g, '');
    if (newYear.length > 4) newYear = newYear.slice(0, 4);
    setYear(newYear);

    if (day && month && newYear.length === 4) {
      setDay(clampDayValue(day, month, newYear));
    }
  };

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth);

    if (day && year.length === 4) {
      const clampedDay = clampDayValue(day, nextMonth, year);
      if (clampedDay !== day) {
        setDay(clampedDay.padStart(2, "0"));
      }
    }
  };

  const fieldClassName = (hasError: boolean) =>
    `w-full bg-gray-50 dark:bg-navy-900 border text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 ${hasError
      ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 dark:border-navy-600 focus:border-primary-500 focus:ring-primary-500/20"
    }`;

  const monthErrorClassName = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
    : "";

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1">
        <input
          type="text"
          inputMode="numeric"
          aria-label={t('date.day', 'DD')}
          placeholder={t('date.day', 'DD')}
          value={day}
          onChange={handleDayChange}
          onBlur={() => setDay(normaliseDayOnBlur(day))}
          className={`${fieldClassName(Boolean(error))} text-center`}
        />
      </div>

      <div className="flex-[2]">
        <Select
          aria-label={t('date.month')}
          fullWidth
          variant="form"
          selectSize="lg"
          value={month}
          placeholder={t('date.month')}
          className={monthErrorClassName}
          onChange={(event) => handleMonthChange(event.target.value)}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value.padStart(2, "0")}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex-[1.5]">
        <input
          type="text"
          inputMode="numeric"
          aria-label={t('date.year', 'YYYY')}
          placeholder={t('date.year', 'YYYY')}
          value={year}
          onChange={handleYearChange}
          onBlur={() => {
            if (year.length > 0 && year.length < 4) {
              const normalisedYear = normaliseYearOnBlur(year, new Date().getFullYear());
              if (normalisedYear !== year) {
                setYear(normalisedYear);
              }
            }
          }}
          className={`${fieldClassName(Boolean(error))} text-center`}
        />
      </div>
    </div>
  );
}
