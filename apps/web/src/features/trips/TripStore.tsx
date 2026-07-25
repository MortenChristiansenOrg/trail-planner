import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  createShareToken,
  createTrip,
  type NewTripInput,
  type PlannedTrip,
} from "@/features/trips/model";
import { destinationById } from "@/features/catalog/catalog";

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
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PlannedTrip[]).map(restoreTravelOptionIds) : [];
  } catch {
    return [];
  }
}

function restoreTravelOptionIds(trip: PlannedTrip): PlannedTrip {
  const catalogTravel = destinationById.get(trip.destinationId)?.travel;
  if (!catalogTravel) return trip;
  return {
    ...trip,
    travelSnapshot: trip.travelSnapshot.map((estimate) => {
      const current = catalogTravel.find(({ mode }) => mode === estimate.mode);
      if (!current) return estimate;
      if (!estimate.available && current.available && estimate.note.includes("not been verified")) return current;
      return estimate.available && current.optionId && !estimate.optionId
        ? { ...estimate, optionId: current.optionId }
        : estimate;
    }),
  };
}

export function TripStoreProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<PlannedTrip[]>(loadTrips);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(trips));
  }, [trips]);

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
    setTrips(stateJsons.map((state) => restoreTravelOptionIds(JSON.parse(state) as PlannedTrip)));
  }, [isAuthenticated, stateJsons]);

  const create = async (input: NewTripInput) => {
    const draft = createTrip(input);
    const state = await createState({
      destinationKey: draft.destinationId,
      plannedMonth: draft.plannedMonth,
      stateJson: JSON.stringify(draft),
    });
    const saved = restoreTravelOptionIds(JSON.parse(state) as PlannedTrip);
    setTrips((current) => [...current, saved]);
    return saved;
  };

  const update = async (trip: PlannedTrip) => {
    const next = { ...trip, updatedAt: Date.now() };
    const state = await updateState({ tripId: trip.id as never, stateJson: JSON.stringify(next) });
    const saved = restoreTravelOptionIds(JSON.parse(state) as PlannedTrip);
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
