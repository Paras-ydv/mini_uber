import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import MapComponent from "./MapComponent";

export default function UserDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [currentRide, setCurrentRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  const fetchRides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/queue`);
      const userRides = response.data.filter(ride => ride.user_id === user.id);
      setRides(userRides);
      
      // Check if user has an active ride
      const activeRide = userRides.find(ride => 
        ride.status === "pending" || ride.status === "assigned"
      );
      setCurrentRide(activeRide);
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
  };

  const fetchNearbyDrivers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/available-drivers`);
      setNearbyDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const bookRide = async (e) => {
    e.preventDefault();
    
    if (nearbyDrivers.length === 0) {
      alert("❌ No drivers available at the moment. Please try again later.");
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/book-ride`, {
        user_id: user.id,
        start: pickup,
        destination: destination
      });
      
      const { ride_id, ride_port, ride_url, driver } = response.data;
      
      setPickup("");
      setDestination("");
      fetchRides();
      
      // Show ride details with URL
      const message = `
        🎉 Ride booked successfully!
        
        🎯 Ride ID: #${ride_id}
        🐈 Container Port: ${ride_port}
        🌐 Ride URL: ${ride_url}
        ${driver ? `🚗 Driver: ${driver}` : '🔍 Finding driver...'}
        
        Click OK to view your ride details!
      `;
      
      if (confirm(message)) {
        window.open(ride_url, '_blank');
      }
    } catch (error) {
      console.error("Error booking ride:", error);
      alert("Failed to book ride. Please try again.");
    }
  };

  useEffect(() => {
    fetchRides();
    fetchNearbyDrivers();
    const interval = setInterval(() => {
      fetchRides();
      fetchNearbyDrivers();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome, {user.name}! 👤
            </h1>
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

          {!currentRide ? (
            <form onSubmit={bookRide} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Book a Ride</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Enter pickup location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Enter destination"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🚖 Book Ride
              </button>
            </form>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Current Ride Status
              </h2>
              <div className="space-y-2">
                <p><strong>From:</strong> {currentRide.start}</p>
                <p><strong>To:</strong> {currentRide.destination}</p>
                <p><strong>Ride ID:</strong> #{currentRide.id}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    currentRide.status === "pending" 
                      ? "bg-yellow-200 text-yellow-800"
                      : currentRide.status === "assigned"
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-800"
                  }`}>
                    {currentRide.status === "pending" ? "🔍 Finding Driver..." : 
                     currentRide.status === "assigned" ? "🚗 Driver Assigned" : 
                     currentRide.status}
                  </span>
                </p>
                {currentRide.status === "assigned" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      🐈 Your Ride Container:
                    </p>
                    <p className="text-sm text-blue-600">
                      Port: <code className="bg-blue-100 px-2 py-1 rounded">700{currentRide.id}</code>
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Container: ride-{currentRide.id}
                    </p>
                    <div className="mt-3">
                      <a 
                        href={`http://localhost:700${currentRide.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        🌐 View Ride Details
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Driver Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              🚗 Driver Status
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  {nearbyDrivers.length} Drivers Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🗺️ Nearby Drivers ({nearbyDrivers.length} available)
          </h2>
          <MapComponent 
            rides={[]} 
            drivers={nearbyDrivers} 
            center={{ lat: 28.6139, lng: 77.2090 }} 
          />
        </div>

        {rides.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ride History</h2>
            <div className="space-y-3">
              {rides.map((ride) => (
                <div key={ride.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{ride.start} → {ride.destination}</p>
                      <p className="text-sm text-gray-600">Ride #{ride.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ride.status === "completed" ? "bg-green-100 text-green-800" :
                      ride.status === "assigned" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {ride.status}
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