"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type DeliveryLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type DeliveryLocationPickerProps = {
  value: DeliveryLocation;
  onChange: (location: DeliveryLocation) => void;
};

const DEFAULT_LATITUDE = -1.286389;
const DEFAULT_LONGITUDE = 36.817223;

export default function DeliveryLocationPicker({
  value,
  onChange,
}: DeliveryLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const valueRef = useRef(value);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapSelected, setMapSelected] = useState(
    typeof value.latitude === "number" &&
      typeof value.longitude === "number"
  );

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function updateLocation(
    latitude: number,
    longitude: number
  ) {
    const currentValue = valueRef.current;

    const newLocation = {
      address: currentValue.address,
      latitude,
      longitude,
    };

    valueRef.current = newLocation;
    onChange(newLocation);
    setMapSelected(true);
    setLocationError("");
  }

  function createMarker(
    map: L.Map,
    latitude: number,
    longitude: number
  ) {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const deliveryIcon = L.divIcon({
      className: "delivery-location-marker",
      html:
        '<div style="width:46px;height:46px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;color:white;font-size:23px;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.35);">🏠</div>',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    const marker = L.marker(
      [latitude, longitude],
      {
        icon: deliveryIcon,
        draggable: true,
      }
    )
      .bindPopup(
        "<strong>Delivery location</strong><br/>Drag this marker to adjust."
      )
      .addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();

      updateLocation(
        position.lat,
        position.lng
      );
    });

    markerRef.current = marker;
  }

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const initialLatitude =
      typeof value.latitude === "number"
        ? value.latitude
        : DEFAULT_LATITUDE;

    const initialLongitude =
      typeof value.longitude === "number"
        ? value.longitude
        : DEFAULT_LONGITUDE;

    const map = L.map(
      mapContainerRef.current,
      {
        center: [
          initialLatitude,
          initialLongitude,
        ],
        zoom:
          typeof value.latitude === "number" &&
          typeof value.longitude === "number"
            ? 15
            : 11,
        zoomControl: true,
      }
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    map.on(
      "click",
      (event: L.LeafletMouseEvent) => {
        updateLocation(
          event.latlng.lat,
          event.latlng.lng
        );

        map.setView(
          [
            event.latlng.lat,
            event.latlng.lng,
          ],
          Math.max(map.getZoom(), 15)
        );
      }
    );

    mapRef.current = map;

    if (
      typeof value.latitude === "number" &&
      typeof value.longitude === "number"
    ) {
      createMarker(
        map,
        value.latitude,
        value.longitude
      );
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (
      typeof value.latitude === "number" &&
      typeof value.longitude === "number"
    ) {
      createMarker(
        map,
        value.latitude,
        value.longitude
      );

      setMapSelected(true);
    }
  }, [
    value.latitude,
    value.longitude,
  ]);

  function useCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location services. Please select your delivery point directly on the map."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        updateLocation(
          latitude,
          longitude
        );

        if (mapRef.current) {
          mapRef.current.setView(
            [latitude, longitude],
            16
          );
        }

        setLocating(false);
      },
      (error) => {
        console.warn(
          "Location unavailable:",
          error.code
        );

        let message =
          "We couldn't access your current location. Please select your delivery point directly on the map.";

        if (error.code === 1) {
          message =
            "Location permission is unavailable. Please select your delivery point directly on the map.";
        }

        if (error.code === 2) {
          message =
            "Your current location could not be determined. Please select your delivery point directly on the map.";
        }

        if (error.code === 3) {
          message =
            "The location request timed out. Please select your delivery point directly on the map.";
        }

        setLocationError(message);
        setLocating(false);

        if (mapRef.current) {
          mapRef.current.setView(
            [
              DEFAULT_LATITUDE,
              DEFAULT_LONGITUDE,
            ],
            11
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  const hasCoordinates =
    typeof value.latitude === "number" &&
    typeof value.longitude === "number";

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-xl text-white shadow-lg">
            📍
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              Delivery location
            </h3>

            <p className="text-xs text-slate-500">
              Choose exactly where you want your
              order delivered.
            </p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Delivery address
        </span>

        <textarea
          value={value.address}
          onChange={(event) => {
            const updated = {
              address: event.target.value,
              latitude: value.latitude,
              longitude: value.longitude,
            };

            valueRef.current = updated;
            onChange(updated);
          }}
          placeholder="Example: Nairobi, Westlands, near Sarit Centre"
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />

        <span className="mt-2 block text-xs text-slate-400">
          Include a building, estate, road, landmark,
          or other recognizable delivery information.
        </span>
      </label>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {locating
          ? "Locating you..."
          : "📍 Use my current location"}
      </button>

      {locationError && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-800">
            Location unavailable
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            {locationError}
          </p>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          ref={mapContainerRef}
          className="h-[320px] w-full"
        />
      </div>

      <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
          How to choose your location
        </p>

        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>
            <strong>1.</strong> Click your delivery
            point on the map.
          </p>

          <p>
            <strong>2.</strong> Or use the button above
            if location access is available.
          </p>

          <p>
            <strong>3.</strong> Drag the 🏠 marker to
            fine-tune the position.
          </p>
        </div>
      </div>

      {mapSelected && hasCoordinates ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-black text-emerald-800">
            ✓ Delivery location selected
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Latitude
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-emerald-900">
                {value.latitude!.toFixed(6)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Longitude
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-emerald-900">
                {value.longitude!.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-bold text-red-700">
            Please select your delivery location on
            the map before paying.
          </p>
        </div>
      )}
    </div>
  );
}
