import {
  getDanishCity,
  powertrains,
  type HomeCity,
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
import { useUser } from "@clerk/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  preferencesAreAnonymous,
  preferencesBelongToAccount,
} from "./preferenceOwnership";

export const preferenceStorageKey = "trail-planner:preferences:v1";
const preferenceOwnerStorageKey = "trail-planner:preferences:owner:v1";

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
    writeAnonymousPreferences(next);
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
  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id;
  const { isAuthenticated, isLoading } = useConvexAuth();
  const remote = useQuery(
    api.preferences.current,
    isAuthenticated ? {} : "skip",
  );
  const upsert = useMutation(api.preferences.upsert);
  const [local, setLocal] = useState(loadLocalPreferences);
  const [localOwnerId, setLocalOwnerId] = useState(loadLocalPreferenceOwner);
  const [mergedUserId, setMergedUserId] = useState<string | null>(null);
  const activeUserId = useRef(userId);
  const mergingUserId = useRef<string | null>(null);

  useEffect(() => {
    activeUserId.current = userId;
  }, [userId]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !userId ||
      remote !== null ||
      !local ||
      !preferencesBelongToAccount(localOwnerId, userId) ||
      mergingUserId.current
    ) {
      return;
    }
    if (preferencesAreAnonymous(localOwnerId)) {
      claimLocalPreferences(userId);
      setLocalOwnerId(userId);
    }
    mergingUserId.current = userId;
    void upsert(local)
      .then(() => {
        if (activeUserId.current !== userId) return;
        clearLocalPreferences();
        setLocal(null);
        setLocalOwnerId(null);
        setMergedUserId(userId);
      })
      .catch((error: unknown) => {
        console.warn("Unable to merge browser preferences into the account", error);
      })
      .finally(() => {
        if (mergingUserId.current === userId) {
          mergingUserId.current = null;
        }
      });
  }, [isAuthenticated, local, localOwnerId, remote, upsert, userId]);

  const normalizedRemote = normalizePreferences(remote);
  useEffect(() => {
    const next = normalizePreferences(remote);
    if (
      !next ||
      !userId ||
      !local ||
      !preferencesBelongToAccount(localOwnerId, userId)
    ) {
      return;
    }
    clearLocalPreferences();
    setLocal(null);
    setLocalOwnerId(null);
  }, [local, localOwnerId, remote, userId]);

  const save = async (next: UserPreferences) => {
    if (isAuthenticated && userId) {
      await upsert(next);
      return;
    }
    writeAnonymousPreferences(next);
    setLocalOwnerId(null);
    setLocal(next);
  };
  const localForAccount =
    userId && preferencesBelongToAccount(localOwnerId, userId)
      ? local
      : null;
  const ready =
    userLoaded &&
    !isLoading &&
    (!isAuthenticated || (Boolean(userId) && remote !== undefined));

  return (
    <PreferencesContext
      value={{
        preferences: isAuthenticated
          ? normalizedRemote ?? localForAccount
          : preferencesAreAnonymous(localOwnerId)
            ? local
            : null,
        ready,
        save,
        storage: isAuthenticated ? "account" : "anonymous",
        mergedAnonymousPreferences: mergedUserId === userId,
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

function writeAnonymousPreferences(preferences: UserPreferences) {
  window.localStorage.setItem(preferenceStorageKey, JSON.stringify(preferences));
  window.localStorage.removeItem(preferenceOwnerStorageKey);
}

function loadLocalPreferenceOwner() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(preferenceOwnerStorageKey);
}

function claimLocalPreferences(userId: string) {
  window.localStorage.setItem(preferenceOwnerStorageKey, userId);
}

function clearLocalPreferences() {
  window.localStorage.removeItem(preferenceStorageKey);
  window.localStorage.removeItem(preferenceOwnerStorageKey);
}

function normalizePreferences(value: unknown): UserPreferences | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<UserPreferences>;
  const city = normalizeHomeCity(candidate.homeCity);
  const vehicle = candidate.vehicle;
  if (
    !city ||
    !vehicle ||
    !powertrains.includes(vehicle.powertrain) ||
    !positive(vehicle.version) ||
    !positive(vehicle.consumptionPer100Km) ||
    !nonNegative(vehicle.energyPricePerUnit) ||
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
    },
  };
}

function normalizeHomeCity(value: unknown): HomeCity | null {
  if (!value || typeof value !== "object") return null;
  const city = value as Partial<HomeCity>;
  const legacyCity =
    typeof city.key === "string" ? getDanishCity(city.key) : undefined;
  if (legacyCity) return legacyCity;
  if (
    typeof city.key !== "string" ||
    typeof city.name !== "string" ||
    city.countryCode !== "DK" ||
    !Array.isArray(city.coordinates) ||
    city.coordinates.length !== 2 ||
    !city.coordinates.every(Number.isFinite) ||
    !officialPlaceId.test(city.key)
  ) {
    return null;
  }
  const [longitude, latitude] = city.coordinates;
  if (
    !city.name.trim() ||
    longitude < 8 ||
    longitude > 15.2 ||
    latitude < 54.5 ||
    latitude > 57.8
  ) {
    return null;
  }
  return {
    key: city.key,
    name: city.name.trim(),
    countryCode: "DK",
    municipality:
      typeof city.municipality === "string"
        ? city.municipality.trim() || undefined
        : undefined,
    coordinates: [longitude, latitude],
  };
}

const officialPlaceId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const nonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const optionalNonNegative = (value: unknown) =>
  value === undefined || nonNegative(value);
