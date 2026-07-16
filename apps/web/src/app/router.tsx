import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode } from "react";
import { parseExploreSearch, toSearchParams, type ExploreSearch } from "@/features/explore/search";

const LandingPage = lazy(() => import("@/features/landing/LandingPage").then((module) => ({ default: module.LandingPage })));
const ExplorePage = lazy(() => import("@/features/explore/ExplorePage").then((module) => ({ default: module.ExplorePage })));
const TripsPage = lazy(() => import("@/features/trips/TripsPage").then((module) => ({ default: module.TripsPage })));
const TripDetailPage = lazy(() => import("@/features/trips/TripDetailPage").then((module) => ({ default: module.TripDetailPage })));
const SharePage = lazy(() => import("@/features/trips/SharePage").then((module) => ({ default: module.SharePage })));

function RouteLoading({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loading" role="status">Opening the planning map…</div>}>{children}</Suspense>;
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <RouteLoading><LandingPage /></RouteLoading>,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  validateSearch: (search) => parseExploreSearch(search),
  component: ExploreRouteComponent,
});

function ExploreRouteComponent() {
  const search = exploreRoute.useSearch();
  const navigate = exploreRoute.useNavigate();
  const onSearchChange = (next: ExploreSearch, replace = false) => {
    void navigate({ search: toSearchParams(next), replace });
  };
  return <RouteLoading><ExplorePage onSearchChange={onSearchChange} search={search} /></RouteLoading>;
}

const tripsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trips",
  component: () => <RouteLoading><TripsPage /></RouteLoading>,
});

const tripDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trips/$tripId",
  component: () => {
    const { tripId } = tripDetailRoute.useParams();
    return <RouteLoading><TripDetailPage tripId={tripId} /></RouteLoading>;
  },
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/$token",
  component: () => {
    const { token } = shareRoute.useParams();
    return <RouteLoading><SharePage token={token} /></RouteLoading>;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  tripsRoute,
  tripDetailRoute,
  shareRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
