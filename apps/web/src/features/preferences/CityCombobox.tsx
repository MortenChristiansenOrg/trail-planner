import type { HomeCity } from "@trail-planner/domain";
import { LoaderCircle } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  loadDanishCities,
  normalizeCityQuery,
  searchDanishCities,
} from "@/features/preferences/cityCatalog";

export function CityCombobox({
  ariaLabel = "Home city",
  id,
  invalid = false,
  onChange,
  value,
}: {
  ariaLabel?: string;
  id: string;
  invalid?: boolean;
  onChange: (city: HomeCity | null) => void;
  value: HomeCity | null;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [hasTyped, setHasTyped] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [resultSet, setResultSet] = useState<{
    query: string;
    cities: HomeCity[];
  }>({ query: "", cities: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeCityQuery(query);
  const normalizedDeferredQuery = normalizeCityQuery(deferredQuery);
  const results =
    resultSet.query === normalizedQuery ? resultSet.cities : [];
  const searchPending = normalizedQuery !== normalizedDeferredQuery;
  const listId = `${id}-results`;

  useEffect(() => {
    if (!hasTyped) setQuery(value?.name ?? "");
  }, [hasTyped, value?.key, value?.name]);

  useEffect(() => {
    const search = deferredQuery.trim();
    const resultQuery = normalizeCityQuery(search);
    if (!hasTyped || !resultQuery) {
      setResultSet({ query: "", cities: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    void loadDanishCities()
      .then((cities) => {
        if (cancelled) return;
        setResultSet({
          query: resultQuery,
          cities: searchDanishCities(cities, search),
        });
        setActiveIndex(0);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deferredQuery, hasTyped]);

  const selectCity = (city: HomeCity) => {
    setQuery(city.name);
    setHasTyped(false);
    setOpen(false);
    onChange(city);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        (current - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectCity(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showResults = hasTyped && Boolean(normalizedQuery);

  return (
    <Popover
      onOpenChange={(nextOpen) => setOpen(nextOpen && showResults)}
      open={open && showResults}
    >
      <PopoverAnchor asChild>
        <Input
          aria-label={ariaLabel}
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listId}-${results[activeIndex].key}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open && showResults}
          aria-invalid={invalid}
          autoComplete="off"
          id={id}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setHasTyped(true);
            setOpen(Boolean(nextQuery.trim()));
            setActiveIndex(0);
            onChange(null);
          }}
          onFocus={() => {
            if (showResults) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a Danish city"
          role="combobox"
          value={query}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="city-combobox-results w-[var(--radix-popover-trigger-width)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div aria-label="Danish cities" id={listId} role="listbox">
          {loading || searchPending ? (
            <p className="city-combobox-status" role="status">
              <LoaderCircle /> Loading cities…
            </p>
          ) : loadFailed ? (
            <p className="city-combobox-status" role="alert">
              Cities could not be loaded. Keep typing to retry.
            </p>
          ) : results.length ? (
            results.map((city, index) => (
              <button
                aria-selected={index === activeIndex}
                className="city-combobox-option"
                id={`${listId}-${city.key}`}
                key={city.key}
                onClick={() => selectCity(city)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span>{city.name}</span>
                {city.municipality ? <small>{city.municipality}</small> : null}
              </button>
            ))
          ) : (
            <p className="city-combobox-status">No Danish cities found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
