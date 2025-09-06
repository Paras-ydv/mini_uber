import { useState, useEffect } from "react";
import { getQueue, bookRide, nextRide } from "./api";

function App() {
  const [queue, setQueue] = useState([]);
  const [userId, setUserId] = useState("");
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    const data = await getQueue();
    setQueue(data);
  }

  async function handleBookRide() {
    if (!userId || !start || !destination) return alert("Fill all fields!");
    await bookRide(userId, start, destination);
    setUserId("");
    setStart("");
    setDestination("");
    loadQueue();
  }

  async function handleNextRide() {
    const res = await nextRide();
    alert(JSON.stringify(res, null, 2));
    loadQueue();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Mini-Uber Client</h1>

      <div style={{ marginBottom: 12 }}>
        <input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <input placeholder="Start (e.g. Jayanagar)" value={start} onChange={e => setStart(e.target.value)} />
        <input placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} />
        <button onClick={handleBookRide}>Book Ride</button>
      </div>

      <h3>Queue</h3>
      <ul>
        {queue.map(r => (
          <li key={r.id}>#{r.id} — {r.start} → {r.destination} — {r.status}</li>
        ))}
      </ul>

      <button onClick={handleNextRide}>Get next pending ride</button>
    </div>
  );
}

export default App;
