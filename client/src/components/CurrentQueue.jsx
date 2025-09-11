import React from "react";

export default function CurrentQueue({ rides }) {
  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">📋 Current Queue</h2>
      {rides.length === 0 ? (
        <p className="text-gray-500">No rides in queue</p>
      ) : (
        <ul className="space-y-2">
          {rides.map((ride) => (
            <li
              key={ride.id}
              className="border rounded p-2 bg-black flex justify-between items-center"
            >
              <div>
                <span className="font-semibold">Ride #{ride.id}</span>: User {ride.user_id} — {ride.start} → {ride.destination}
              </div>
              <div>
                {ride.status === "pending" && <span className="text-yellow-600 font-bold">Pending</span>}
                {ride.status === "assigned" && <span className="text-blue-600 font-bold">Assigned</span>}
                {ride.status === "completed" && <span className="text-green-600 font-bold">Completed</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
