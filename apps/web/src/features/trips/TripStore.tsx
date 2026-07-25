import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  createShareToken,
  createTrip,
  parsePlannedTripJson,
  parsePlannedTripsJson,
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
const TripStoreContext = createContext<TripStoreValue | null>(null);

function loadTrips(): PlannedTrip[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey);
  return raw ? parsePlannedTripsJson(raw) : [];
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
    if (!estimate.available && current.available && estimate.note.includes("not been verified")) {
      changed = true;
      return current;
    }
    // A trip keeps its saved costs and availability. Option IDs may be
    // repaired, but personalized IDs must retain their encoded origin/profile.
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
  const [trips, setTrips] = useState<PlannedTrip[]>(loadTrips);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(trips));
  }, [trips]);

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
    setTrips((current) => [...current, trip]);
    return trip;
  };

  const update = async (trip: PlannedTrip) => {
    const next = { ...trip, updatedAt: Date.now() };
    setTrips((current) => current.map((item) => (item.id === next.id ? next : item)));
  };

  const remove = async (tripId: string) => {
    setTrips((current) => current.filter((item) => item.id !== tripId));
  };

  const share = async (tripId: string) => {
    const existing = trips.find((trip) => trip.id === tripId);
    if (!existing) return undefined;
    const token = existing.shareToken ?? createShareToken();
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
    if (!parsed) throw new Error("Created trip state is invalid");
    const saved = restoreTravelOptionIds(parsed, catalog.destinations);
    setTrips((current) => [...current, saved]);
    return saved;
  };

  const update = async (trip: PlannedTrip) => {
    const next = { ...trip, updatedAt: Date.now() };
    const state = await updateState({ tripId: trip.id as never, stateJson: JSON.stringify(next) });
    const parsed = parsePlannedTripJson(state);
    if (!parsed) throw new Error("Updated trip state is invalid");
    const saved = restoreTravelOptionIds(parsed, catalog.destinations);
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

export function useTripStore() {
  const store = use(TripStoreContext);
  if (!store) throw new Error("TripStoreProvider is missing");
  return store;
}
