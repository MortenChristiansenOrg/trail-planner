import { ClerkProvider, useAuth } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import {
  ConfiguredAuthSession,
  PreviewAuthSession,
} from "@/features/auth/AuthSession";
import {
  ConfiguredPreferencesProvider,
  PreviewPreferencesProvider,
} from "@/features/preferences/PreferencesSession";
import { ConvexTripStoreProvider, TripStoreProvider } from "@/features/trips/TripStore";
import {
  ConvexCatalogProvider,
  StaticCatalogProvider,
} from "@/features/catalog/CatalogProvider";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;
const convexUrl = (import.meta.env.VITE_CONVEX_URL ??
  import.meta.env.CONVEX_URL) as string | undefined;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppProviders({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey || !convex) {
    return (
      <PreviewAuthSession>
        <PreviewPreferencesProvider>
          <StaticCatalogProvider>
            <TripStoreProvider>{children}</TripStoreProvider>
          </StaticCatalogProvider>
        </PreviewPreferencesProvider>
      </PreviewAuthSession>
    );
  }

  return (
    <ClerkProvider appearance={{ theme: shadcn }} publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConfiguredAuthSession>
          <ConfiguredPreferencesProvider>
            <ConvexCatalogProvider>
              <ConvexTripStoreProvider>{children}</ConvexTripStoreProvider>
            </ConvexCatalogProvider>
          </ConfiguredPreferencesProvider>
        </ConfiguredAuthSession>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
