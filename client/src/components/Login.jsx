import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("user");
  const [formData, setFormData] = useState({
    name: "",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      // Get user's current position with high precision
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0  // Always get fresh location
        });
      });

      const { latitude, longitude } = position.coords;

      // Use OpenStreetMap Nominatim for detailed street-level address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Mini-Uber-App'
            }
          }
        );
        const data = await response.json();
        
        console.log('Geocoding response:', data); // Debug log
        
        if (data && data.address) {
          const addr = data.address;
          let detailedAddress = [];
          
          // Build detailed address from most specific to general
          if (addr.house_number && addr.road) {
            detailedAddress.push(`${addr.house_number} ${addr.road}`);
          } else if (addr.road) {
            detailedAddress.push(addr.road);
          }
          
          if (addr.neighbourhood) {
            detailedAddress.push(addr.neighbourhood);
          } else if (addr.suburb) {
            detailedAddress.push(addr.suburb);
          }
          
          if (addr.city_district && addr.city_district !== addr.neighbourhood) {
            detailedAddress.push(addr.city_district);
          }
          
          if (addr.city || addr.town || addr.village) {
            detailedAddress.push(addr.city || addr.town || addr.village);
          }
          
          if (addr.state) {
            detailedAddress.push(addr.state);
          }
          
          const finalAddress = detailedAddress.join(', ');
          
          if (finalAddress && finalAddress.length > 5) {
            setFormData(prev => ({ ...prev, location: finalAddress }));
          } else {
            // Use display_name as fallback
            setFormData(prev => ({ ...prev, location: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          }
        } else {
          // Fallback to coordinates
          setFormData(prev => ({ 
            ...prev, 
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          }));
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Final fallback to coordinates
        setFormData(prev => ({ 
          ...prev, 
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please enter it manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (userType === "driver") {
        const response = await axios.post(`${API_BASE_URL}/register-driver`, null, {
          params: {
            name: formData.name,
            location: formData.location
          }
        });
        
        await axios.post(`${API_BASE_URL}/go-online`, null, {
          params: { driver_id: response.data.driver_id }
        });
        
        const userData = {
          type: "driver",
          id: response.data.driver_id,
          name: formData.name,
          location: formData.location
        };
        onLogin(userData);
        navigate('/driver');
      } else {
        const userData = {
          type: "user",
          id: Date.now(),
          name: formData.name
        };
        onLogin(userData);
        navigate('/user');
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden" style={{minWidth: '100vw'}}>
      {/* Professional 3D Background Elements */}
      <div className="absolute inset-0">
        {/* 3D Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {Array.from({length: 144}).map((_, i) => (
              <div key={i} className="border border-white/20"></div>
            ))}
          </div>
        </div>
        
        {/* Floating 3D Geometric Shapes */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg transform rotate-45 animate-spin shadow-2xl" style={{animationDuration: '20s'}}></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse shadow-2xl" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 transform rotate-12 animate-bounce shadow-2xl" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-20 right-20 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg transform -rotate-45 animate-pulse shadow-2xl" style={{animationDelay: '3s'}}></div>
        
        {/* Professional Car Icons */}
        <div className="absolute top-32 left-1/4 text-4xl opacity-30 animate-float" style={{animationDelay: '0s'}}>🚗</div>
        <div className="absolute bottom-40 right-1/4 text-3xl opacity-30 animate-float" style={{animationDelay: '2s'}}>🚕</div>
        <div className="absolute top-1/2 left-16 text-2xl opacity-30 animate-float" style={{animationDelay: '4s'}}>🚙</div>
        
        {/* 3D Orbs with Professional Colors */}
        <div className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-cyan-600/30 rounded-full blur-xl animate-pulse shadow-2xl"></div>
        <div className="absolute bottom-16 left-16 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-xl animate-pulse shadow-2xl" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-green-500/25 to-teal-600/25 rounded-full blur-xl animate-pulse shadow-2xl" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Professional Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-8 shadow-2xl transform hover:scale-110 transition-all duration-300">
              <div className="text-4xl">🚖</div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-4 drop-shadow-2xl">
              Mini-Uber
            </h1>
            <p className="text-white/80 text-xl font-light tracking-wide">
              Professional Transportation Platform
            </p>
          </div>

          {/* Professional Login Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20 transform hover:scale-105 transition-all duration-500" 
               style={{boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'}}>
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Welcome</h2>
              <p className="text-white/70 text-lg">Select your role to continue</p>
            </div>

            {/* Professional Role Selector */}
            <div className="mb-10">
              <div className="grid grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => setUserType("user")}
                  className={`relative p-8 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 ${
                    userType === "user"
                      ? "border-blue-400 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 shadow-2xl scale-105"
                      : "border-white/20 bg-white/5 hover:border-blue-400/50 hover:bg-blue-500/10"
                  }`}
                  style={{
                    boxShadow: userType === "user" 
                      ? '0 25px 50px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : '0 15px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4 transform hover:scale-110 transition-transform duration-300">👤</div>
                    <div className={`font-bold text-xl mb-2 ${
                      userType === "user" ? "text-blue-300" : "text-white"
                    }`}>
                      Passenger
                    </div>
                    <div className="text-white/60 text-sm">
                      Book premium rides
                    </div>
                  </div>
                  {userType === "user" && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <span className="text-white font-bold">✓</span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUserType("driver")}
                  className={`relative p-8 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 ${
                    userType === "driver"
                      ? "border-green-400 bg-gradient-to-br from-green-500/20 to-emerald-600/20 shadow-2xl scale-105"
                      : "border-white/20 bg-white/5 hover:border-green-400/50 hover:bg-green-500/10"
                  }`}
                  style={{
                    boxShadow: userType === "driver" 
                      ? '0 25px 50px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : '0 15px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4 transform hover:scale-110 transition-transform duration-300">🚗</div>
                    <div className={`font-bold text-xl mb-2 ${
                      userType === "driver" ? "text-green-300" : "text-white"
                    }`}>
                      Driver
                    </div>
                    <div className="text-white/60 text-sm">
                      Start earning today
                    </div>
                  </div>
                  {userType === "driver" && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <span className="text-white font-bold">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Professional Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-white font-semibold mb-4 text-lg">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-lg text-white placeholder-white/50 backdrop-blur-sm"
                  style={{boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'}}
                  placeholder="Enter your full name"
                />
              </div>

              {userType === "driver" && (
                <div className="animate-fadeIn">
                  <label className="block text-white font-semibold mb-4 text-lg">
                    Current Location
                  </label>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 text-lg text-white placeholder-white/50 backdrop-blur-sm"
                        style={{boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'}}
                        placeholder="Enter your current location"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="w-full py-3 px-6 bg-white/10 border border-white/20 rounded-xl text-white font-semibold transition-all duration-300 hover:bg-white/20 hover:scale-105 disabled:opacity-50 disabled:scale-100 backdrop-blur-sm"
                      style={{boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'}}
                    >
                      {isGettingLocation ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Getting Location...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>📍</span>
                          <span>Use Current Location</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 px-8 rounded-xl font-bold text-xl text-white transition-all duration-500 transform hover:scale-105 disabled:scale-100 disabled:opacity-70 ${
                  userType === "driver"
                    ? "bg-gradient-to-r from-green-500 via-green-600 to-emerald-700 hover:from-green-600 hover:to-emerald-800"
                    : "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-700 hover:from-blue-600 hover:to-cyan-800"
                }`}
                style={{
                  boxShadow: userType === "driver" 
                    ? '0 20px 40px rgba(34, 197, 94, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                    : '0 20px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Initializing...</span>
                  </div>
                ) : (
                  <span>{userType === "driver" ? "🚗 Begin Driving" : "🚖 Start Journey"}</span>
                )}
              </button>
            </form>

            <div className="text-center mt-8">
              <p className="text-white/50 text-sm">
                Secure • Professional • Trusted Platform
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}