import { usePaginatedQuery, useQuery } from "convex/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
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
  const failedKeys = useRef(new Set<string>());
  const inFlight = useRef(
    new Map<string, Promise<readonly [string, CatalogDestinationDetail | null | undefined]>>(),
  );

  useEffect(() => {
    let cancelled = false;
    const missingKeys = requestedKeys.filter((key) => !(key in details));
    if (!missingKeys.length) return;
    const pending = missingKeys.map((key) => {
      const existing = inFlight.current.get(key);
      if (existing) return existing;
      const request = (async () => {
        try {
          const detail = await loadStaticCatalogDetail(key);
          failedKeys.current.delete(key);
          return [key, detail] as const;
        } catch (error) {
          console.error(`Unable to load catalog detail for ${key}`, error);
          failedKeys.current.add(key);
          return [key, undefined] as const;
        } finally {
          inFlight.current.delete(key);
        }
      })();
      inFlight.current.set(key, request);
      return request;
    });
    for (const request of pending) {
      void request.then(([key, detail]) => {
        if (!cancelled && detail !== undefined) {
          setDetails((current) => ({ ...current, [key]: detail }));
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [details, requestedKeys]);

  const requestDetail = (destinationKey: string) => {
    if (failedKeys.current.delete(destinationKey)) {
      setRequestedKeys((current) => [
        ...current.filter((key) => key !== destinationKey),
        destinationKey,
      ]);
      return;
    }
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
  ) as { requestedKey: string; detail: CatalogDestinationDetail | null }[] | undefined;
  const details = Object.fromEntries(
    queriedDetails?.map(({ requestedKey, detail }) => [requestedKey, detail]) ?? [],
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
