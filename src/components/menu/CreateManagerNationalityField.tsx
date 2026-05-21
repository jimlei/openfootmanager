import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check } from "lucide-react";
import { Select } from "../ui/Select";
import type { CountryFlag } from "../ui/CountryFlag";
import type { CreateManagerFormData } from "./CreateManagerForm";

type NationalityOption = { code: string; name: string };

type CountryResources = {
    allNationalities: (locale?: string) => NationalityOption[];
    countryName: (countryCode: string, locale?: string) => string;
    CountryFlag: typeof CountryFlag;
};

interface CreateManagerNationalityFieldProps {
    nationality: CreateManagerFormData["nationality"];
    error?: string;
    locale: string;
    onChange: (value: CreateManagerFormData["nationality"]) => void;
    onClearError: () => void;
}

let countryResourcesPromise: Promise<CountryResources> | null = null;

export function resetCountryResourcesCache(): void {
    countryResourcesPromise = null;
}

async function loadCountryResources(): Promise<CountryResources> {
    countryResourcesPromise ??= Promise.all([
        import("../../lib/countries"),
        import("../ui/CountryFlag"),
    ]).then(([countriesModule, flagModule]) => ({
        allNationalities: countriesModule.allNationalities,
        countryName: countriesModule.countryName,
        CountryFlag: flagModule.CountryFlag,
    }));

    return countryResourcesPromise;
}

export default function CreateManagerNationalityField({
    nationality,
    error,
    locale,
    onChange,
    onClearError,
}: CreateManagerNationalityFieldProps) {
    const { t } = useTranslation();
    const [resources, setResources] = useState<CountryResources | null>(null);
    const [isLoadingResources, setIsLoadingResources] = useState(true);

    useEffect(() => {
        let isMounted = true;

        void loadCountryResources()
            .then((loadedResources) => {
                if (isMounted) {
                    setResources(loadedResources);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingResources(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const nationalities = useMemo(
        () => (resources ? resources.allNationalities(locale) : []),
        [locale, resources],
    );

    const isDisabled = isLoadingResources && nationalities.length === 0;
    const Flag = resources?.CountryFlag;

    const renderCountryLabel = (code: string, name: ReactNode) => (
        <span className="flex items-center gap-2">
            {Flag ? (
                <Flag
                    code={code}
                    locale={locale}
                    className="text-lg leading-none"
                />
            ) : null}
            <span className="truncate">{name}</span>
        </span>
    );

    return (
        <div id="create-manager-field-nationality">
            <label
                htmlFor="create-manager-nationality"
                className="mb-1.5 block text-xs font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
                {t("createManager.countryOfOrigin")}
            </label>
            <Select
                id="create-manager-nationality"
                aria-label={t("createManager.countryOfOrigin")}
                fullWidth
                variant="form"
                selectSize="lg"
                value={nationality}
                placeholder={isDisabled ? t("common.loading") : t("createManager.selectCountry")}
                searchable
                placement="top"
                searchPlaceholder={t("createManager.searchNationalities")}
                emptyResultsLabel={t("menu.noResults")}
                disabled={isDisabled}
                className={error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                    : ""
                }
                onChange={(event) => {
                    onChange(event.target.value);
                    onClearError();
                }}
                renderValue={(option) =>
                    option
                        ? renderCountryLabel(option.value, option.label)
                        : undefined
                }
                renderOption={(option, { isSelected }) => (
                    <>
                        {renderCountryLabel(option.value, option.label)}
                        {isSelected ? (
                            <Check className="ml-2 h-4 w-4 shrink-0 text-primary-500" />
                        ) : null}
                    </>
                )}
            >
                {nationalities.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                        {entry.name}
                    </option>
                ))}
            </Select>

            {error ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            ) : null}
        </div>
    );
}