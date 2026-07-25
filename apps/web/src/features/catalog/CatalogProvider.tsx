import { usePaginatedQuery, useQuery } from "convex/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  CatalogDestinationDetail,
  CatalogDestinationDigest,
} from "@trail-planner/domain";
import { api } from "../../../../../convex/_generated/api";
import {
  destinationFromDigest,
  destinationWithDetail,
  destinations as staticDestinations,
  loadStaticCatalogDetail,
  staticCatalogVersion,
  type Destination,
} from "@/features/catalog/catalog";

type CatalogContextValue = {
  destinations: Destination[];
  catalogVersion: string | null;
  ready: boolean;
  details: Record<string, CatalogDestinationDetail | null | undefined>;
  requestDetail: (destinationKey: string) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function StaticCatalogProvider({ children }: { children: ReactNode }) {
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, CatalogDestinationDetail | null | undefined>>({});

  useEffect(() => {
    let cancelled = false;
    const missingKeys = requestedKeys.filter((key) => !(key in details));
    if (!missingKeys.length) return;
    void Promise.all(
      missingKeys.map(async (key) => {
        try {
          return [key, await loadStaticCatalogDetail(key)] as const;
        } catch (error) {
          console.error(`Unable to load catalog detail for ${key}`, error);
          return [key, null] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setDetails((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, [details, requestedKeys]);

  const requestDetail = (destinationKey: string) => {
    setRequestedKeys((current) =>
      current.includes(destinationKey) ? current : [...current, destinationKey]
    );
  };

  return (
    <CatalogContext.Provider
      value={{
        destinations: staticDestinations,
        catalogVersion: staticCatalogVersion,
        ready: true,
        details,
        requestDetail,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function ConvexCatalogProvider({ children }: { children: ReactNode }) {
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);
  const result = usePaginatedQuery(
    api.destinations.listExplore,
    {},
    { initialNumItems: 50 },
  );
  const { loadMore, status } = result;
  useEffect(() => {
    if (status === "CanLoadMore") loadMore(50);
  }, [loadMore, status]);
  const queriedDetails = useQuery(
    api.destinations.detailsByKeys,
    requestedKeys.length ? { destinationKeys: requestedKeys } : "skip",
  ) as (CatalogDestinationDetail | null)[] | undefined;
  const details = Object.fromEntries(
    requestedKeys.map((key, index) => [key, queriedDetails?.[index]]),
  );
  const page = result.results as CatalogDestinationDigest[];
  const destinations = page.map(destinationFromDigest);
  const catalogVersion = page[0]?.catalogVersion ?? null;
  const requestDetail = (destinationKey: string) => {
    setRequestedKeys((current) =>
      current.includes(destinationKey) ? current : [...current, destinationKey]
    );
  };

  return (
    <CatalogContext.Provider
      value={{
        destinations,
        catalogVersion,
        ready: status === "Exhausted",
        details,
        requestDetail,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("Catalog provider is missing");
  return context;
}

export function useCatalogDestination(
  destinationKey: string | undefined,
  loadDetail = true,
  baseDestination?: Destination,
) {
  const catalog = useCatalog();
  const requestDetail = catalog.requestDetail;
  useEffect(() => {
    if (loadDetail && destinationKey) requestDetail(destinationKey);
  }, [destinationKey, loadDetail, requestDetail]);
  const destination = baseDestination ??
    catalog.destinations.find((item) => item.id === destinationKey);
  const detail = destinationKey ? catalog.details[destinationKey] : undefined;
  if (!destination || !detail) return destination;
  return destinationWithDetail(destination, detail);
}
