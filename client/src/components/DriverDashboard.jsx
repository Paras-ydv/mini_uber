import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import MapComponent from "./MapComponent";

export default function DriverDashboard({ driver, onLogout }) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [availableRides, setAvailableRides] = useState([]);
  const [assignedRides, setAssignedRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);

  const fetchRides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/queue`);
      const rides = response.data;
      
      setAvailableRides(rides.filter(ride => ride.status === "pending"));
      setAssignedRides(rides.filter(ride => 
        ride.status === "assigned" && ride.driver_id === driver.id
      ));
      setCompletedRides(rides.filter(ride => 
        ride.status === "completed" && ride.driver_id === driver.id
      ));
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      if (isOnline) {
        await axios.post(`${API_BASE_URL}/go-offline`, null, {
          params: { driver_id: driver.id }
        });
        setIsOnline(false);
      } else {
        await axios.post(`${API_BASE_URL}/go-online`, null, {
          params: { driver_id: driver.id }
        });
        setIsOnline(true);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const sendHeartbeat = async () => {
    if (isOnline) {
      try {
        await axios.post(`${API_BASE_URL}/heartbeat`, null, {
          params: { driver_id: driver.id }
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }
  };

  useEffect(() => {
    fetchRides();
    const ridesInterval = setInterval(fetchRides, 3000);
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    return () => {
      clearInterval(ridesInterval);
      clearInterval(heartbeatInterval);
    };
  }, [isOnline]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Driver Dashboard - {driver.name} 🚗
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={toggleOnlineStatus}
                className={`px-4 py-2 rounded-md font-medium ${
                  isOnline
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {isOnline ? "🟢 Online" : "🔴 Offline"}
              </button>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Available Rides</h3>
              <p className="text-2xl font-bold text-blue-600">{availableRides.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Assigned Rides</h3>
              <p className="text-2xl font-bold text-green-600">{assignedRides.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Completed Today</h3>
              <p className="text-2xl font-bold text-purple-600">{completedRides.length}</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🗺️ Live Map - Nearby Rides & Drivers
          </h2>
          <MapComponent 
            rides={availableRides} 
            drivers={[]} 
            center={{ lat: 28.6139, lng: 77.2090 }} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Rides */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Available Rides ({availableRides.length})
            </h2>
            {availableRides.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No rides available at the moment
              </p>
            ) : (
              <div className="space-y-3">
                {availableRides.map((ride) => (
                  <div key={ride.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">User #{ride.user_id}</p>
                        <p className="text-sm text-gray-600">
                          📍 {ride.start} → 🎯 {ride.destination}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ride #{ride.id}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Rides */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              🚗 Your Assigned Rides ({assignedRides.length})
            </h2>
            {assignedRides.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No assigned rides
              </p>
            ) : (
              <div className="space-y-3">
                {assignedRides.map((ride) => (
                  <div key={ride.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">User #{ride.user_id}</p>
                        <p className="text-sm text-gray-600">
                          📍 {ride.start} → 🎯 {ride.destination}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ride #{ride.id}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Assigned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completed Rides */}
        {completedRides.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ✅ Completed Rides Today ({completedRides.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedRides.slice(0, 6).map((ride) => (
                <div key={ride.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">User #{ride.user_id}</p>
                      <p className="text-xs text-gray-600">
                        {ride.start} → {ride.destination}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}