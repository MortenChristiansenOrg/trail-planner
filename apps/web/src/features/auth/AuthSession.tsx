import { createContext, use, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/react";
import { useConvexAuth } from "convex/react";

export type AuthSession = {
  configured: boolean;
  loading: boolean;
  signedIn: boolean;
  name: string;
  signIn: () => void;
  signOut: () => void;
  openProfile: () => void;
};

const AuthSessionContext = createContext<AuthSession | null>(null);

export function PreviewAuthSession({ children }: { children: ReactNode }) {
  return (
    <AuthSessionContext
      value={{
        configured: false,
        loading: false,
        signedIn: true,
        name: "Preview hiker",
        signIn: () => undefined,
        signOut: () => undefined,
        openProfile: () => undefined,
      }}
    >
      {children}
    </AuthSessionContext>
  );
}

export function ConfiguredAuthSession({ children }: { children: ReactNode }) {
  const clerk = useClerk();
  const { user, isLoaded } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const name = user?.firstName ?? user?.fullName ?? "Hiker";

  return (
    <AuthSessionContext
      value={{
        configured: true,
        loading: !isLoaded || isLoading,
        signedIn: Boolean(user) && isAuthenticated,
        name,
        signIn: () => clerk.openSignIn(),
        signOut: () => void clerk.signOut(),
        openProfile: () => clerk.openUserProfile(),
      }}
    >
      {children}
    </AuthSessionContext>
  );
}

export function useAuthSession() {
  const session = use(AuthSessionContext);
  if (!session) throw new Error("AuthSession provider is missing");
  return session;
}
