"use client";

import { useState, useEffect, useCallback } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Polygon } from "./components/polygon";

// Inner component to handle map interactions
function MapContent({
  polygon,
  setShowInfo,
  isPolygonActive,
  setIsPolygonActive,
  handlePolygonClick,
  setMap,
}: {
  polygon: { lat: number; lng: number }[];
  setShowInfo: (show: boolean) => void;
  isPolygonActive: boolean;
  setIsPolygonActive: (active: boolean) => void;
  handlePolygonClick: () => void;
  setMap: (map: google.maps.Map | null) => void;
}) {
  const map = useMap();

  // Set the map reference when it becomes available
  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);

  // Handle map click (outside polygon)
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      // Check if click is inside polygon
      const clickPoint = e.latLng;
      if (!clickPoint) return;

      let isInsidePolygon = false;
      if (window.google && window.google.maps && window.google.maps.geometry) {
        const polygonPath = new google.maps.Polygon({ paths: polygon });
        isInsidePolygon = google.maps.geometry.poly.containsLocation(
          clickPoint,
          polygonPath
        );
      }

      // If click is outside polygon, close info panel and reset state
      if (!isInsidePolygon) {
        setShowInfo(false);
        setIsPolygonActive(false);
      }
    },
    [polygon, setShowInfo, setIsPolygonActive]
  );

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener("click", handleMapClick);

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, handleMapClick]);

  return (
    <Polygon
      paths={polygon}
      fillColor={isPolygonActive ? "#4CAF50" : "#FF0000"}
      fillOpacity={0.35}
      strokeColor={isPolygonActive ? "#4CAF50" : "#FF0000"}
      strokeOpacity={0.8}
      strokeWeight={2}
      onClick={handlePolygonClick}
      onMouseOver={(e) => console.log("Mouse over polygon", e)}
      onMouseOut={(e) => console.log("Mouse out of polygon", e)}
    />
  );
}

export default function Home() {
  const [showInfo, setShowInfo] = useState(false);
  const [isPolygonActive, setIsPolygonActive] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const position = { lat: 44.65107, lng: -63.582687 };
  const polygon = [
    { lat: 44.650843, lng: -63.578641 },
    { lat: 44.643615, lng: -63.574845 },
    { lat: 44.644731, lng: -63.568322 },
    { lat: 44.650807, lng: -63.572888 },
    { lat: 44.651605, lng: -63.576761 },
  ];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Calculate polygon center for camera movement
  const getPolygonCenter = () => {
    const latSum = polygon.reduce((sum, point) => sum + point.lat, 0);
    const lngSum = polygon.reduce((sum, point) => sum + point.lng, 0);
    return {
      lat: latSum / polygon.length,
      lng: lngSum / polygon.length,
    };
  };

  // Handle polygon click
  const handlePolygonClick = () => {
    setShowInfo(true);
    setIsPolygonActive(true);

    // Move camera to polygon center
    if (map) {
      const center = getPolygonCenter();
      map.panTo(center);
      map.setZoom(16); // Zoom in closer to the polygon
    }
  };

  // Handle map click (outside polygon) - this will be handled in MapContent component

  if (!apiKey) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <p>Google Maps API key is not configured</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* Sticky Header */}
      <header className="sticky-header">
        <h1>Urban life lens</h1>
      </header>

      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={position}
          defaultZoom={14}
          mapId="44d22d5444b61e6544960686"
          disableDefaultUI
          colorScheme="DARK"
          className="map-full"
        >
          <MapContent
            polygon={polygon}
            setShowInfo={setShowInfo}
            isPolygonActive={isPolygonActive}
            setIsPolygonActive={setIsPolygonActive}
            handlePolygonClick={handlePolygonClick}
            setMap={setMap}
          />
        </Map>
      </APIProvider>

      {/* Info Panel */}
      {showInfo && (
        <div
          className="info-panel"
          style={{
            width: window.innerWidth <= 768 ? "90%" : "50%",
            maxWidth: window.innerWidth <= 768 ? "none" : "350px",
            zIndex: 1000,
          }}
        >
          <div className="info-header">
            <h2>Area Information</h2>
            <button
              className="close-button"
              onClick={() => setShowInfo(false)}
              aria-label="Close info panel"
            >
              ×
            </button>
          </div>
          <div className="info-content">
            <h3>Downtown Halifax District</h3>
            <div className="info-section">
              <h4>📍 Location</h4>
              <p>Downtown Halifax, Nova Scotia, Canada</p>
            </div>
            <div className="info-section">
              <h4>🏢 Area Type</h4>
              <p>Urban Commercial District</p>
            </div>
            <div className="info-section">
              <h4>📊 Population</h4>
              <p>Approximately 2,500 residents</p>
            </div>
            <div className="info-section">
              <h4>🏬 Key Features</h4>
              <ul>
                <li>Halifax Waterfront Boardwalk</li>
                <li>Historic Properties</li>
                <li>Business and Financial District</li>
                <li>Shopping and Entertainment</li>
                <li>Government Buildings</li>
              </ul>
            </div>
            <div className="info-section">
              <h4>🚌 Transportation</h4>
              <p>
                Major transit hub with bus routes, ferry connections, and
                walkable infrastructure
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
