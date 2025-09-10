import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";

export default function App() {
  const [rides, setRides] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    start: "",
    destination: ""
  });

  // ✅ Fetch rides
  const fetchRides = async () => {
    const res = await axios.get(`${API_BASE_URL}/queue`);
    setRides(res.data);
  };

  useEffect(() => {
    fetchRides();
  }, []);

  // ✅ Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE_URL}/book-ride`, {
      user_id: parseInt(form.user_id),
      start: form.start,
      destination: form.destination
    });
    setForm({ user_id: "", start: "", destination: "" });
    fetchRides();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🚖 Mini-Uber</h1>

      {/* Ride booking form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="number"
          name="user_id"
          placeholder="User ID"
          value={form.user_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="start"
          placeholder="Start Location"
          value={form.start}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="destination"
          placeholder="Destination"
          value={form.destination}
          onChange={handleChange}
          required
        />
        <button type="submit">Book Ride</button>
      </form>

      {/* Show queue */}
      <h2>📋 Current Queue</h2>
      <ul>
        {rides.map((ride) => (
          <li key={ride.id}>
            Ride #{ride.id}: User {ride.user_id} from {ride.start} → {ride.destination} (
            {ride.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
