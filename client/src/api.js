const API_URL = "http://127.0.0.1:8000";

export async function getQueue() {
  const res = await fetch(`${API_URL}/queue`);
  return res.json();
}

export async function bookRide(userId, start, destination) {
  const res = await fetch(`${API_URL}/book-ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: Number(userId), start, destination })
  });
  return res.json();
}

export async function nextRide() {
  const res = await fetch(`${API_URL}/next-ride`);
  return res.json();
}
