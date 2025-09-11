import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function RideForm({ fetchRides, fetchDrivers }) {
  const [form, setForm] = useState({
    user_id: "",
    start: "",
    destination: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE_URL}/book-ride`, {
        user_id: parseInt(form.user_id),
        start: form.start,
        destination: form.destination
      });

      console.log("Ride booked:", res.data);

      setForm({ user_id: "", start: "", destination: "" }); // reset form
      fetchRides();
      fetchDrivers();
    } catch (err) {
      console.error("Error booking ride:", err.response ? err.response.data : err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="number"
        name="user_id"
        placeholder="User ID"
        value={form.user_id}
        onChange={handleChange}
        className="border rounded px-2 py-1"
        required
      />
      <input
        type="text"
        name="start"
        placeholder="Start Location"
        value={form.start}
        onChange={handleChange}
        className="border rounded px-2 py-1"
        required
      />
      <input
        type="text"
        name="destination"
        placeholder="Destination"
        value={form.destination}
        onChange={handleChange}
        className="border rounded px-2 py-1"
        required
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
      >
        Book Ride
      </button>
    </form>
  );
}
