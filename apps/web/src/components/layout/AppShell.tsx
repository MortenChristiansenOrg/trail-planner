import { Link, useRouterState } from "@tanstack/react-router";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Map, Menu, Route, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthSession } from "@/features/auth/AuthSession";
import { defaultExploreSearch } from "@/features/explore/search";
import { BrandMark } from "@/components/layout/BrandMark";

export function AppShell({
  children,
  fullHeight = false,
}: {
  children: ReactNode;
  fullHeight?: boolean;
}) {
  const showPreviewRibbon =
    !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL;
  const shellClassName = [
    "app-shell",
    fullHeight ? "app-shell--fixed" : null,
    fullHeight && showPreviewRibbon ? "app-shell--with-ribbon" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      <AppHeader />
      {showPreviewRibbon ? (
        <div className="preview-ribbon">
          Local preview · trips are saved in this browser
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link aria-label="Trail Planner home" className="brand" to="/">
      <BrandMark />
      {compact ? null : <span>Trail Planner</span>}
    </Link>
  );
}

function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const auth = useAuthSession();

  return (
    <header className="app-header">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link className={pathname.startsWith("/explore") ? "is-active" : ""} to="/explore" search={defaultExploreSearch}>
          <Map /> Explore
        </Link>
        <Link className={pathname.startsWith("/trips") ? "is-active" : ""} to="/trips">
          <Route /> Planned trips
        </Link>
      </nav>
      <div className="header-actions">
        <AuthControls auth={auth} />
        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Open navigation" className="mobile-menu" size="icon" variant="outline">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent className="paper-sheet" side="right">
            <SheetHeader>
              <SheetTitle>Trail Planner</SheetTitle>
              <SheetDescription>Choose where you want to continue.</SheetDescription>
            </SheetHeader>
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <SheetClose asChild>
                <Link to="/explore" search={defaultExploreSearch}><Map /> Explore destinations</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/trips"><Route /> Planned trips</Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function AuthControls({ auth }: { auth: ReturnType<typeof useAuthSession> }) {
  if (!auth.configured || auth.loading) {
    return (
      <Button
        aria-label={auth.configured ? "Connecting account" : "Preview account"}
        className="account-button"
        disabled={auth.loading}
        size="sm"
        variant="outline"
      >
        <UserRound />
        <span>{auth.loading ? "Connecting…" : auth.name}</span>
      </Button>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button className="auth-action" size="sm" variant="outline">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="auth-action" size="sm">
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
