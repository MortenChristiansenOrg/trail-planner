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
  detailKey: string | null;
  detail: CatalogDestinationDetail | null | undefined;
  requestDetail: (destinationKey: string | null) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function StaticCatalogProvider({ children }: { children: ReactNode }) {
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogDestinationDetail | null | undefined>();

  useEffect(() => {
    let cancelled = false;
    if (!detailKey) {
      setDetail(undefined);
      return;
    }
    setDetail(undefined);
    void loadStaticCatalogDetail(detailKey).then((value) => {
      if (!cancelled) setDetail(value);
    });
    return () => {
      cancelled = true;
    };
  }, [detailKey]);

  return (
    <CatalogContext.Provider
      value={{
        destinations: staticDestinations,
        catalogVersion: staticCatalogVersion,
        ready: true,
        detailKey,
        detail,
        requestDetail: setDetailKey,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function ConvexCatalogProvider({ children }: { children: ReactNode }) {
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const result = usePaginatedQuery(
    api.destinations.listExplore,
    {},
    { initialNumItems: 50 },
  );
  const detail = useQuery(
    api.destinations.detailByKey,
    detailKey ? { destinationKey: detailKey } : "skip",
  ) as CatalogDestinationDetail | null | undefined;
  const page = result.results as unknown as CatalogDestinationDigest[];
  const destinations = page.map(destinationFromDigest);
  const catalogVersion = page[0]?.catalogVersion ?? null;

  return (
    <CatalogContext.Provider
      value={{
        destinations,
        catalogVersion,
        ready: result.status !== "LoadingFirstPage",
        detailKey,
        detail,
        requestDetail: setDetailKey,
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
  if (!destination || catalog.detailKey !== destinationKey || !catalog.detail) return destination;
  return destinationWithDetail(destination, catalog.detail);
}
