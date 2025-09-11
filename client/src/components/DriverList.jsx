export default function DriverList({ drivers }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">🚗 Available Drivers</h2>
      <ul className="space-y-1">
        {drivers.map((driver) => (
          <li
            key={driver.id}
            className="border rounded p-2 black flex justify-between"
          >
            <span>
              {driver.name} @ {driver.location}
            </span>
            <span
              className={`font-bold ${
                driver.status === "online"
                  ? "text-green-600"
                  : driver.status === "on_trip"
                  ? "text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              {driver.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
