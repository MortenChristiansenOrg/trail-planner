import {
  createDefaultPreferences,
  getDanishCity,
  powertrains,
  type UserPreferences,
} from "@trail-planner/domain";
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export const preferenceStorageKey = "trail-planner:preferences:v1";

type PreferencesSession = {
  preferences: UserPreferences | null;
  ready: boolean;
  save: (preferences: UserPreferences) => Promise<void>;
  storage: "anonymous" | "account";
  mergedAnonymousPreferences: boolean;
};

const PreferencesContext = createContext<PreferencesSession | null>(null);

export function PreviewPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(loadLocalPreferences);

  const save = async (next: UserPreferences) => {
    writeLocalPreferences(next);
    setPreferences(next);
  };

  return (
    <PreferencesContext
      value={{
        preferences,
        ready: true,
        save,
        storage: "anonymous",
        mergedAnonymousPreferences: false,
      }}
    >
      {children}
    </PreferencesContext>
  );
}

export function ConfiguredPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const remote = useQuery(
    api.preferences.current,
    isAuthenticated ? {} : "skip",
  );
  const upsert = useMutation(api.preferences.upsert);
  const [local, setLocal] = useState(loadLocalPreferences);
  const [merged, setMerged] = useState(false);
  const merging = useRef(false);

  useEffect(() => {
    if (
      !isAuthenticated ||
      remote !== null ||
      !local ||
      merging.current
    ) {
      return;
    }
    merging.current = true;
    void upsert(local)
      .then(() => setMerged(true))
      .catch((error: unknown) => {
        console.warn("Unable to merge browser preferences into the account", error);
      })
      .finally(() => {
        merging.current = false;
      });
  }, [isAuthenticated, local, remote, upsert]);

  const normalizedRemote = normalizePreferences(remote);
  useEffect(() => {
    const next = normalizePreferences(remote);
    if (!next) return;
    writeLocalPreferences(next);
    setLocal((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    );
  }, [remote]);

  const save = async (next: UserPreferences) => {
    writeLocalPreferences(next);
    setLocal(next);
    if (isAuthenticated) await upsert(next);
  };
  const ready = !isLoading && (!isAuthenticated || remote !== undefined);

  return (
    <PreferencesContext
      value={{
        preferences: isAuthenticated ? normalizedRemote ?? local : local,
        ready,
        save,
        storage: isAuthenticated ? "account" : "anonymous",
        mergedAnonymousPreferences: merged,
      }}
    >
      {children}
    </PreferencesContext>
  );
}

export function usePreferences() {
  const session = use(PreferencesContext);
  if (!session) throw new Error("Preferences provider is missing");
  return session;
}

function loadLocalPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(preferenceStorageKey);
    return raw ? normalizePreferences(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocalPreferences(preferences: UserPreferences) {
  window.localStorage.setItem(preferenceStorageKey, JSON.stringify(preferences));
}

function normalizePreferences(value: unknown): UserPreferences | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<UserPreferences>;
  const storedCity = candidate.homeCity;
  const city =
    storedCity && typeof storedCity.key === "string"
      ? getDanishCity(storedCity.key)
      : undefined;
  const vehicle = candidate.vehicle;
  if (
    !city ||
    !vehicle ||
    !powertrains.includes(vehicle.powertrain) ||
    !positive(vehicle.version) ||
    !positive(vehicle.consumptionPer100Km) ||
    !nonNegative(vehicle.energyPricePerUnit) ||
    !nonNegative(vehicle.tollsDkk) ||
    !nonNegative(vehicle.ferriesDkk) ||
    !nonNegative(vehicle.parkingDkk) ||
    !optionalNonNegative(vehicle.costPerKmOverrideDkk) ||
    !optionalNonNegative(vehicle.chargingPlan?.pricePerKwh)
  ) {
    return null;
  }
  return {
    version: positive(candidate.version) ? candidate.version : 1,
    homeCity: city,
    vehicle: {
      version: vehicle.version,
      powertrain: vehicle.powertrain,
      consumptionPer100Km: vehicle.consumptionPer100Km,
      energyPricePerUnit: vehicle.energyPricePerUnit,
      costPerKmOverrideDkk: vehicle.costPerKmOverrideDkk,
      chargingPlan:
        vehicle.powertrain === "ev" &&
        vehicle.chargingPlan?.name.trim() &&
        nonNegative(vehicle.chargingPlan.pricePerKwh)
          ? {
              name: vehicle.chargingPlan.name.trim(),
              pricePerKwh: vehicle.chargingPlan.pricePerKwh,
            }
          : undefined,
      tollsDkk: vehicle.tollsDkk,
      ferriesDkk: vehicle.ferriesDkk,
      parkingDkk: vehicle.parkingDkk,
    },
  };
}

export function preferencesForCity(cityKey: string) {
  const city = getDanishCity(cityKey);
  return city ? createDefaultPreferences(city) : null;
}

const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const nonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const optionalNonNegative = (value: unknown) =>
  value === undefined || nonNegative(value);
