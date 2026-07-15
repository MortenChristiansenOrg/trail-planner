import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Map, Menu, Route, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthSession } from "@/features/auth/AuthSession";
import { defaultExploreSearch } from "@/features/explore/search";

export function AppShell({
  children,
  fullHeight = false,
}: {
  children: ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <div className={fullHeight ? "app-shell app-shell--fixed" : "app-shell"}>
      <AppHeader />
      {!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL ? (
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
      <span className="brand__mark" aria-hidden="true">
        <Compass />
        <span className="brand__route" />
      </span>
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
        <Button
          aria-label={auth.configured ? "Open account" : "Preview account"}
          className="account-button"
          onClick={auth.configured ? (auth.signedIn ? auth.openProfile : auth.signIn) : undefined}
          size="sm"
          variant="outline"
        >
          <UserRound />
          <span>{auth.loading ? "Connecting…" : auth.signedIn ? auth.name : "Sign in"}</span>
        </Button>
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
              <Link to="/explore" search={defaultExploreSearch}><Map /> Explore destinations</Link>
              <Link to="/trips"><Route /> Planned trips</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
