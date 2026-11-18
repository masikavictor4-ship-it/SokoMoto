"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type OrderTrackingMapProps = {
  deliveryLatitude: number;
  deliveryLongitude: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
};

export default function OrderTrackingMap({
  deliveryLatitude,
  deliveryLongitude,
  currentLatitude,
  currentLongitude,
}: OrderTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [deliveryLatitude, deliveryLongitude],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    const markers = markersRef.current;

    if (!map || !markers) {
      return;
    }

    markers.clearLayers();

    if (routeRef.current) {
      routeRef.current.removeFrom(map);
      routeRef.current = null;
    }

    const deliveryIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,.3);
        ">
          🏠
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    const courierIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,.3);
        ">
          🚚
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    const deliveryMarker = L.marker(
      [deliveryLatitude, deliveryLongitude],
      {
        icon: deliveryIcon,
      }
    )
      .bindPopup("<strong>Delivery destination</strong>")
      .addTo(markers);

    const hasCourierLocation =
      typeof currentLatitude === "number" &&
      typeof currentLongitude === "number";

    if (hasCourierLocation) {
      const courierMarker = L.marker(
        [currentLatitude, currentLongitude],
        {
          icon: courierIcon,
        }
      )
        .bindPopup("<strong>Current order location</strong>")
        .addTo(markers);

      const routePoints: L.LatLngExpression[] = [
        [currentLatitude, currentLongitude],
        [deliveryLatitude, deliveryLongitude],
      ];

      routeRef.current = L.polyline(routePoints, {
        dashArray: "8 8",
        weight: 4,
      }).addTo(map);

      map.fitBounds(
        L.latLngBounds([
          [currentLatitude, currentLongitude],
          [deliveryLatitude, deliveryLongitude],
        ]),
        {
          padding: [50, 50],
        }
      );

      courierMarker.openPopup();
    } else {
      map.setView(
        [deliveryLatitude, deliveryLongitude],
        14
      );

      deliveryMarker.openPopup();
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      // Keep the map instance alive between coordinate updates.
    };
  }, [
    deliveryLatitude,
    deliveryLongitude,
    currentLatitude,
    currentLongitude,
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markersRef.current = null;
      routeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="h-[450px] w-full overflow-hidden rounded-2xl"
    />
  );
}
