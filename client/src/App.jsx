import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import DriverDashboard from "./components/DriverDashboard";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="w-full min-h-screen" style={{width: '100vw', minHeight: '100vh'}}>
        <Routes>
          <Route 
            path="/" 
            element={
              !currentUser ? (
                <Login onLogin={handleLogin} />
              ) : currentUser.type === "user" ? (
                <Navigate to="/user" replace />
              ) : (
                <Navigate to="/driver" replace />
              )
            } 
          />
          <Route 
            path="/user" 
            element={
              currentUser && currentUser.type === "user" ? (
                <UserDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/driver" 
            element={
              currentUser && currentUser.type === "driver" ? (
                <DriverDashboard driver={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
