import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import RideForm from "./components/RideForm";
import DriverList from "./components/DriverList";
import DriverLogin from "./components/DriverLogin";
import CurrentQueue from "./components/CurrentQueue";

export default function App() {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const fetchRides = async () => {
    const res = await axios.get(`${API_BASE_URL}/queue`);
    setRides(res.data);
  };

  const fetchDrivers = async () => {
    const res = await axios.get(`${API_BASE_URL}/available-drivers`);
    setDrivers(res.data);
  };

  useEffect(() => {
    fetchRides();
    fetchDrivers();
    const interval = setInterval(() => {
      fetchDrivers();
      fetchRides();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">🚖 Mini-Uber</h1>

      <RideForm fetchRides={fetchRides} fetchDrivers={fetchDrivers} />
      <DriverLogin fetchDrivers={fetchDrivers} />
      <CurrentQueue rides={rides} />
      <DriverList drivers={drivers} />
    </div>
  );
}
