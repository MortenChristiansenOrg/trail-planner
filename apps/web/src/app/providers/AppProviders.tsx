import { ClerkProvider, useAuth } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppProviders({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey || !convex) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider appearance={{ theme: shadcn }} publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
