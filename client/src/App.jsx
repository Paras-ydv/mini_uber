import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import DriverDashboard from "./components/DriverDashboard";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
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
