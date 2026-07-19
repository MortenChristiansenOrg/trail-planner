import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMarker, TrailLine } from "@/features/maps/TrailMap";

const styleUrl = "https://tiles.openfreemap.org/styles/liberty";

function lineFeatureCollection(lines: TrailLine[], selectedId?: string) {
  return {
    type: "FeatureCollection" as const,
    features: lines.map((line) => ({
      type: "Feature" as const,
      properties: {
        id: line.id,
        kind: line.kind ?? "trail",
        label: line.label ?? "",
        mode: line.styleMode ?? "car",
        selected: line.id === selectedId,
      },
      geometry: { type: "LineString" as const, coordinates: line.coordinates },
    })),
  };
}

export default function MapCanvas({
  markers,
  selectedId,
  lines = [],
  mode = "explore",
  onSelect,
}: {
  markers: MapMarker[];
  selectedId?: string;
  lines?: TrailLine[];
  mode?: "explore" | "detail";
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const selectRef = useRef(onSelect);
  const linesRef = useRef(lines);
  const selectedIdRef = useRef(selectedId);
  selectRef.current = onSelect;
  linesRef.current = lines;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [8.5, 54.5],
      zoom: mode === "explore" ? 3.1 : 10.5,
      attributionControl: false,
      cooperativeGestures: false,
      scrollZoom: true,
    });
    const controlPosition = mode === "explore" ? "top-right" : "bottom-right";
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), controlPosition);
    map.addControl(new maplibregl.AttributionControl({ compact: true }), controlPosition);
    const collapseAttribution = () => {
      map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    };
    collapseAttribution();
    map.on("styledata", collapseAttribution);
    map.on("sourcedata", collapseAttribution);
    const stopCollapsingAttribution = () => {
      collapseAttribution();
      map.off("styledata", collapseAttribution);
      map.off("sourcedata", collapseAttribution);
    };
    map.once("idle", stopCollapsingAttribution);
    const attributionTimer = window.setTimeout(collapseAttribution, 500);
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    const resizeTimer = window.setTimeout(() => map.resize(), 550);
    map.on("load", () => {
      map.addSource("trail-lines", {
        type: "geojson",
        data: lineFeatureCollection(linesRef.current, selectedIdRef.current),
      });
      map.addLayer({
        id: "trail-lines-shadow",
        type: "line",
        source: "trail-lines",
        filter: ["!=", ["get", "kind"], "journey"],
        paint: { "line-color": "#fff8e7", "line-width": 5, "line-opacity": 0.72 },
      });
      map.addLayer({
        id: "trail-lines",
        type: "line",
        source: "trail-lines",
        filter: ["!=", ["get", "kind"], "journey"],
        paint: {
          "line-color": "#b54831",
          "line-width": 2.4,
          "line-dasharray": [1.4, 1.8],
          "line-opacity": 0.88,
        },
      });
      map.addLayer({
        id: "selected-trail-line",
        type: "line",
        source: "trail-lines",
        filter: ["all", ["!=", ["get", "kind"], "journey"], ["==", ["get", "selected"], true]],
        paint: { "line-color": "#8f2f20", "line-width": 4, "line-opacity": 1 },
      });
      map.addLayer({
        id: "journey-line-shadow",
        type: "line",
        source: "trail-lines",
        filter: ["==", ["get", "kind"], "journey"],
        paint: { "line-color": "#fff8e7", "line-width": 7, "line-opacity": 0.78 },
      });
      map.addLayer({
        id: "journey-line",
        type: "line",
        source: "trail-lines",
        filter: ["==", ["get", "kind"], "journey"],
        paint: {
          "line-color": ["match", ["get", "mode"], "flight", "#3568a8", "rail", "#69528f", "bus", "#b7791f", "ferry", "#167285", "walk", "#52794b", "shuttle", "#8a5d3c", "transfer", "#7b7468", "#b54831"],
          "line-width": 4,
          "line-opacity": 1,
        },
      });
    });
    mapRef.current = map;
    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      mapRef.current = null;
      resizeObserver.disconnect();
      window.clearTimeout(resizeTimer);
      window.clearTimeout(attributionTimer);
      map.off("styledata", collapseAttribution);
      map.off("sourcedata", collapseAttribution);
      map.off("idle", stopCollapsingAttribution);
      map.remove();
    };
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((marker) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `atlas-marker${marker.id === selectedId ? " is-selected" : ""}`;
      element.setAttribute("aria-label", marker.label);
      element.innerHTML = marker.badge ? `<span>${marker.badge}</span>` : "";
      element.addEventListener("click", () => selectRef.current?.(marker.id));
      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat(marker.coordinates)
        .addTo(map);
    });

    if (selectedId) {
      const selectedLine = lines.find((line) => line.id === selectedId);
      const journeyLine = lines.find((line) => line.kind === "journey");
      const selected = markers.find((marker) => marker.id === selectedId);
      if (mode === "explore" && journeyLine?.coordinates.length) {
        const compact = map.getContainer().clientWidth <= 800;
        const bounds = journeyLine.coordinates.reduce(
          (current, coordinates) => current.extend(coordinates),
          new maplibregl.LngLatBounds(journeyLine.coordinates[0], journeyLine.coordinates[0]),
        );
        map.fitBounds(bounds, {
          padding: compact
            ? { top: 70, right: 50, bottom: 300, left: 50 }
            : { top: 90, right: 80, bottom: 190, left: 410 },
          maxZoom: 5.4,
          duration: 650,
        });
      } else if (selectedLine?.coordinates.length) {
        const bounds = selectedLine.coordinates.reduce(
          (current, coordinates) => current.extend(coordinates),
          new maplibregl.LngLatBounds(selectedLine.coordinates[0], selectedLine.coordinates[0]),
        );
        map.fitBounds(bounds, { padding: 52, maxZoom: 12.2, duration: 650 });
      } else if (selected) {
        map.easeTo({
          center: selected.coordinates,
          zoom: mode === "detail" ? 10.8 : Math.max(map.getZoom(), 4.35),
          duration: 650,
          offset: mode === "explore" ? [120, 0] : [0, 0],
        });
      }
    } else if (markers.length > 1) {
      const bounds = markers.reduce(
        (current, marker) => current.extend(marker.coordinates),
        new maplibregl.LngLatBounds(markers[0].coordinates, markers[0].coordinates),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 4.2, duration: 500 });
    } else if (markers.length === 1) {
      map.easeTo({ center: markers[0].coordinates, zoom: mode === "detail" ? 10.8 : 5.1, duration: 500 });
    }
  }, [lines, markers, mode, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("trail-lines") as GeoJSONSource | undefined;
      source?.setData(lineFeatureCollection(lines, selectedId));
    };
    update();
    map.on("load", update);
    return () => {
      map.off("load", update);
    };
  }, [lines, selectedId]);

  return <div className="size-full" ref={containerRef} />;
}
