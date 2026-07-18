import { lazy, Suspense } from "react";

export type MapMarker = {
  id: string;
  label: string;
  coordinates: [number, number];
  badge?: string;
};

export type TrailLine = {
  id: string;
  coordinates: [number, number][];
  label?: string;
  kind?: "trail" | "journey";
  styleMode?: "walk" | "car" | "rail" | "bus" | "flight" | "ferry" | "shuttle" | "transfer";
};

const MapCanvas = lazy(() => import("@/features/maps/MapCanvas"));

export function TrailMap(props: {
  markers: MapMarker[];
  selectedId?: string;
  lines?: TrailLine[];
  mode?: "explore" | "detail";
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`map-frame ${props.className ?? ""}`} data-line-count={props.lines?.length ?? 0}>
      <Suspense fallback={<MapFallback label="Drawing the map…" />}>
        <MapCanvas {...props} />
      </Suspense>
    </div>
  );
}

function MapFallback({ label }: { label: string }) {
  return (
    <div className="map-fallback" role="status">
      <span className="map-fallback__contour" />
      <span>{label}</span>
    </div>
  );
}
