export default function RideList({ rides }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">📋 Current Rides</h2>
      <ul className="space-y-1">
        {rides.map((ride) => (
          <li
            key={ride.id}
            className="border rounded p-2 bg-gray-50 flex justify-between"
          >
            <span>
              Ride #{ride.id}: User {ride.user_id} — {ride.start} → {ride.destination}
            </span>
            <span className="font-bold text-blue-600">{ride.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
