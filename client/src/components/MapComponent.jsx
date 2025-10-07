import { useEffect, useRef, useState } from "react";

export default function MapComponent({ rides = [], drivers = [], center = { lat: 28.6139, lng: 77.2090 } }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        setMapError(false);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) {
      initializeMap();
    } else {
      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval);
          initializeMap();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        if (!mapLoaded) {
          setMapError(true);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);

  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      setMapError(true);
      return;
    }

    try {
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
      return;
    }
  };

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    updateMarkers();
  }, [rides, drivers, mapLoaded]);

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    if (mapInstanceRef.current.markers) {
      mapInstanceRef.current.markers.forEach(marker => marker.setMap(null));
    }
    mapInstanceRef.current.markers = [];

    // Add driver markers
    drivers.forEach((driver, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: center.lat + (Math.random() - 0.5) * 0.1, lng: center.lng + (Math.random() - 0.5) * 0.1 },
        map: mapInstanceRef.current,
        title: `Driver: ${driver.name}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#10B981" stroke="white" stroke-width="2"/>
              <text x="15" y="20" text-anchor="middle" fill="white" font-size="14">🚗</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #10B981;">🚗 ${driver.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Status: ${driver.status}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Location: ${driver.location}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      mapInstanceRef.current.markers.push(marker);
    });

    // Add ride markers
    rides.forEach((ride, index) => {
      if (ride.status === "pending") {
        const marker = new window.google.maps.Marker({
          position: { lat: center.lat + (Math.random() - 0.5) * 0.1, lng: center.lng + (Math.random() - 0.5) * 0.1 },
          map: mapInstanceRef.current,
          title: `Ride Request: ${ride.start} to ${ride.destination}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="12" fill="#F59E0B" stroke="white" stroke-width="2"/>
                <text x="15" y="20" text-anchor="middle" fill="white" font-size="14">👤</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #F59E0B;">👤 Ride Request</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">From: ${ride.start}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">To: ${ride.destination}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Status: ${ride.status}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        mapInstanceRef.current.markers.push(marker);
      }
    });
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300">
      {mapError ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-gray-600">Map temporarily unavailable</p>
            <p className="text-sm text-gray-500 mt-2">
              Showing {drivers.length} drivers and {rides.length} rides
            </p>
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {drivers.map((driver, i) => (
                <div key={i} className="text-sm bg-green-100 px-3 py-1 rounded">
                  🚗 {driver.name} - {driver.location}
                </div>
              ))}
              {rides.map((ride, i) => (
                <div key={i} className="text-sm bg-yellow-100 px-3 py-1 rounded">
                  👤 {ride.start} → {ride.destination}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : mapLoaded ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-gray-600">Loading map...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}