import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function DriverLogin({ fetchDrivers }) {
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState("offline");

  const goOnline = async () => {
    await axios.post(`${API_BASE_URL}/go-online?driver_id=${driverId}`);
    setStatus("online");
    fetchDrivers();
  };

  const goOffline = async () => {
    await axios.post(`${API_BASE_URL}/go-offline?driver_id=${driverId}`);
    setStatus("offline");
    fetchDrivers();
  };

  return (
    <div className="border p-4 rounded bg-white shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">👨‍✈️ Driver Panel</h2>
      <input
        type="number"
        placeholder="Driver ID"
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="border rounded px-2 py-1 mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={goOnline}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        >
          Go Online
        </button>
        <button
          onClick={goOffline}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Go Offline
        </button>
      </div>
      <p className="mt-2">Current Status: <b>{status}</b></p>
    </div>
  );
}
