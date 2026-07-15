import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMarker, TrailLine } from "@/features/maps/TrailMap";

const styleUrl = "https://tiles.openfreemap.org/styles/liberty";

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
  selectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [8.5, 54.5],
      zoom: mode === "explore" ? 3.1 : 10.5,
      attributionControl: false,
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: "Planning estimates" }),
      "bottom-right",
    );
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    const resizeTimer = window.setTimeout(() => map.resize(), 550);
    map.on("load", () => {
      map.addSource("trail-lines", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "trail-lines-shadow",
        type: "line",
        source: "trail-lines",
        paint: { "line-color": "#fff8e7", "line-width": 5, "line-opacity": 0.72 },
      });
      map.addLayer({
        id: "trail-lines",
        type: "line",
        source: "trail-lines",
        paint: {
          "line-color": "#b54831",
          "line-width": 2.4,
          "line-dasharray": [1.4, 1.8],
          "line-opacity": 0.88,
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
      const selected = markers.find((marker) => marker.id === selectedId);
      if (selected) {
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
  }, [markers, mode, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("trail-lines") as GeoJSONSource | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: lines.map((line) => ({
          type: "Feature",
          properties: { id: line.id, label: line.label ?? "" },
          geometry: { type: "LineString", coordinates: line.coordinates },
        })),
      });
    };
    if (map.isStyleLoaded()) update();
    else map.once("load", update);
  }, [lines]);

  return <div className="size-full" ref={containerRef} />;
}
