"use client";

import { Box } from "@mantine/core";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
};

export function ListingMap({ lat, lng, zoom = 15 }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [lng, lat],
      zoom: zoom,
      pitch: 60,
      bearing: -20,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Add 3D buildings layer
      map.current.addLayer({
        id: "3d-buildings",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0,
            "#f2f2f2",
            50,
            "#e0e0e0",
            100,
            "#bebebe",
          ],
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-opacity": 0.8,
        },
      });

      // Add lighting to make it look more 3D
      map.current.setLight({
        anchor: "viewport",
        color: "white",
        intensity: 0.4,
        position: [1, 200, 30],
      });

      // Add marker
      new maplibregl.Marker({ color: "#1754D8" }).setLngLat([lng, lat]).addTo(map.current);
    });

    return () => {
      map.current?.remove();
    };
  }, [lat, lng, zoom]);

  return (
    <Box
      ref={mapContainer}
      style={{
        width: "100%",
        height: "250px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #E5E5E5",
      }}
    />
  );
}
