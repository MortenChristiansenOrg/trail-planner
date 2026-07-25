import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  createShareToken,
  createTrip,
  parsePlannedTripJson,
  type NewTripInput,
  type PlannedTrip,
} from "@/features/trips/model";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import type { Destination } from "@/features/catalog/catalog";

type TripStoreValue = {
  trips: PlannedTrip[];
  create: (input: NewTripInput) => Promise<PlannedTrip>;
  update: (trip: PlannedTrip) => Promise<void>;
  remove: (tripId: string) => Promise<void>;
  share: (tripId: string) => Promise<string | undefined>;
};

const storageKey = "trail-planner:mvp-trips:v1";
const recoveryStorageKey = `${storageKey}:recovery`;
const TripStoreContext = createContext<TripStoreValue | null>(null);

type StoredTrips = {
  trips: PlannedTrip[];
  preservedEntries: unknown[];
  unparsedRaw?: string;
};

function loadTrips(): StoredTrips {
  if (typeof window === "undefined") return { trips: [], preservedEntries: [] };
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return { trips: [], preservedEntries: [] };
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) {
      return { trips: [], preservedEntries: [], unparsedRaw: raw };
    }
    const trips: PlannedTrip[] = [];
    const preservedEntries: unknown[] = [];
    for (const entry of value) {
      const parsed = parsePlannedTripJson(JSON.stringify(entry));
      if (parsed) trips.push(parsed);
      else preservedEntries.push(entry);
    }
    return { trips, preservedEntries };
  } catch {
    return { trips: [], preservedEntries: [], unparsedRaw: raw };
  }
}

function restoreTravelOptionIds(
  trip: PlannedTrip,
  catalogDestinations: Destination[],
): PlannedTrip {
  const catalogDestination = catalogDestinations.find((destination) =>
    destination.id === trip.destinationId ||
    destination.aliases.includes(trip.destinationId)
  );
  if (!catalogDestination) return trip;
  const catalogTravel = catalogDestination.travel;
  let changed = catalogDestination.id !== trip.destinationId;
  const travelSnapshot = trip.travelSnapshot.map((estimate) => {
    const current = catalogTravel.find(({ mode }) => mode === estimate.mode);
    if (!current) return estimate;
    // A trip keeps its saved costs and availability. Only lookup IDs are
    // repaired, while personalized IDs retain their encoded origin/profile.
    const currentOptionId = current.available
      ? estimate.origin
        ? estimate.optionId?.replace(
            `-${trip.destinationId}`,
            `-${catalogDestination.id}`,
          ) ?? current.optionId
        : current.optionId
      : undefined;
    if (estimate.optionId !== currentOptionId) {
      changed = true;
      return { ...estimate, optionId: currentOptionId };
    }
    return estimate;
  });
  return changed
    ? {
        ...trip,
        destinationId: catalogDestination.id,
        travelSnapshot,
      }
    : trip;
}

export function TripStoreProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const [stored] = useState(loadTrips);
  const [trips, setTrips] = useState<PlannedTrip[]>(stored.trips);
  const userMutation = useRef(false);

  useEffect(() => {
    if (stored.unparsedRaw && !userMutation.current) return;
    if (stored.unparsedRaw && !window.localStorage.getItem(recoveryStorageKey)) {
      window.localStorage.setItem(recoveryStorageKey, stored.unparsedRaw);
    }
    window.localStorage.setItem(
      storageKey,
      JSON.stringify([...trips, ...stored.preservedEntries]),
    );
  }, [stored, trips]);

  useEffect(() => {
    if (!catalog.ready) return;
    setTrips((current) => {
      const restored = current.map((trip) =>
        restoreTravelOptionIds(trip, catalog.destinations)
      );
      return restored.some((trip, index) => trip !== current[index])
        ? restored
        : current;
    });
  }, [catalog.destinations, catalog.ready]);

  const create = async (input: NewTripInput) => {
    const trip = createTrip(input);
    userMutation.current = true;
    setTrips((current) => [...current, trip]);
    return trip;
  };

  const update = async (trip: PlannedTrip) => {
    const next = { ...trip, updatedAt: Date.now() };
    userMutation.current = true;
    setTrips((current) => current.map((item) => (item.id === next.id ? next : item)));
  };

  const remove = async (tripId: string) => {
    userMutation.current = true;
    setTrips((current) => current.filter((item) => item.id !== tripId));
  };

  const share = async (tripId: string) => {
    const existing = trips.find((trip) => trip.id === tripId);
    if (!existing) return undefined;
    const token = existing.shareToken ?? createShareToken();
    userMutation.current = true;
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, shareToken: token, updatedAt: Date.now() } : trip));
    return token;
  };

  return <TripStoreContext value={{ trips, create, update, remove, share }}>{children}</TripStoreContext>;
}

export function ConvexTripStoreProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const { isAuthenticated } = useConvexAuth();
  const stateJsons = useQuery(api.trips.mineStates, isAuthenticated ? {} : "skip");
  const createState = useMutation(api.trips.createState);
  const updateState = useMutation(api.trips.updateState);
  const removeMine = useMutation(api.trips.removeMine);
  const createShare = useMutation(api.shareLinks.createOrGet);
  const [trips, setTrips] = useState<PlannedTrip[]>([]);

  useEffect(() => {
    if (!isAuthenticated || stateJsons === undefined) {
      setTrips([]);
      return;
    }
    setTrips(stateJsons.flatMap((state) => {
      const trip = parsePlannedTripJson(state);
      return trip
        ? [restoreTravelOptionIds(trip, catalog.destinations)]
        : [];
    }));
  }, [catalog.destinations, isAuthenticated, stateJsons]);

  const create = async (input: NewTripInput) => {
    const draft = createTrip(input);
    const state = await createState({
      destinationKey: draft.destinationId,
      plannedMonth: draft.plannedMonth,
      stateJson: JSON.stringify(draft),
    });
    const parsed = parsePlannedTripJson(state);
    if (!parsed) console.error("The server returned an invalid created trip state; using the committed local draft.");
    const identity = serverTripIdentity(state);
    const committed = parsed ?? {
      ...draft,
      id: identity.id ?? draft.id,
      createdAt: identity.createdAt ?? draft.createdAt,
      updatedAt: identity.updatedAt ?? draft.updatedAt,
    };
    const saved = restoreTravelOptionIds(committed, catalog.destinations);
    setTrips((current) => [...current, saved]);
    return saved;
  };

  const update = async (trip: PlannedTrip) => {
    const next = { ...trip, updatedAt: Date.now() };
    const state = await updateState({ tripId: trip.id as never, stateJson: JSON.stringify(next) });
    const parsed = parsePlannedTripJson(state);
    if (!parsed) console.error("The server returned an invalid updated trip state; using the committed local update.");
    const identity = serverTripIdentity(state);
    const committed = parsed ?? {
      ...next,
      id: identity.id ?? next.id,
      updatedAt: identity.updatedAt ?? next.updatedAt,
    };
    const saved = restoreTravelOptionIds(committed, catalog.destinations);
    setTrips((current) => current.map((item) => item.id === saved.id ? saved : item));
  };

  const remove = async (tripId: string) => {
    await removeMine({ tripId: tripId as never });
    setTrips((current) => current.filter((item) => item.id !== tripId));
  };

  const share = async (tripId: string) => {
    const persisted = await createShare({ tripId: tripId as never });
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, shareToken: persisted } : trip));
    return persisted;
  };

  return <TripStoreContext value={{ trips, create, update, remove, share }}>{children}</TripStoreContext>;
}

function serverTripIdentity(stateJson: string) {
  try {
    const value = JSON.parse(stateJson) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const state = value as Record<string, unknown>;
    return {
      id: typeof state.id === "string" ? state.id : undefined,
      createdAt: typeof state.createdAt === "number" && Number.isFinite(state.createdAt)
        ? state.createdAt
        : undefined,
      updatedAt: typeof state.updatedAt === "number" && Number.isFinite(state.updatedAt)
        ? state.updatedAt
        : undefined,
    };
  } catch {
    return {};
  }
}

export function useTripStore() {
  const store = use(TripStoreContext);
  if (!store) throw new Error("TripStoreProvider is missing");
  return store;
}
