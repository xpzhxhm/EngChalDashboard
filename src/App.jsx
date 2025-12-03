// src/App.jsx
import React, { useEffect, useState } from "react";

import SetpointControls from "./components/SetpointControls.jsx";
import KPIBar from "./components/KPIBar.jsx";
import ChartsPanel from "./components/ChartsPanel.jsx";
// HardwareConnectionTester removed

import { useHardwareBioreactorStream } from "./hooks/useHardwareBioreactorStream.js";
import "./styles.css";

const statusMap = {
  disconnected: "status-pill closed",
  reconnecting: "status-pill connecting",
  connected: "status-pill open",
  error: "status-pill error",
};

export default function App() {
  // Local setpoints state for the dashboard controls
  const [setpoints, setSetpoints] = useState({
    temp: 30,
    rpm: 1000,
    pH: 5,
  });

  // Hook that talks to the simulator / MQTT stream
  // Hook that talks to the hardware stream
  const { telemetry, lastSetpoints, sendSetpoints, connectionStatus } =
    useHardwareBioreactorStream();

  // Maintain a short history of telemetry for charts
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!telemetry) return;
    setHistory((prev) => {
      const next = [...prev, telemetry];
      // keep last 200 points
      return next.slice(-200);
    });
  }, [telemetry]);

  const handleSetpointChange = (key, value) => {
    setSetpoints((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendSetpoints = () => {
    // send current setpoints to the backend/simulator
    sendSetpoints(setpoints);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ENGF0001 Bioreactor Anomaly Dashboard</h1>
        <div className={statusMap[connectionStatus] || statusMap.disconnected}>
          {connectionStatus ?? "disconnected"}
        </div>
      </header>

      <main className="app-main">
        {/* Top row: dials (left) and setpoint controls (right) - 50/50 */}
        <div className="top-row" style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <KPIBar
              current={telemetry}
              lastUpdated={telemetry?.time ?? telemetry?.timestamp}
              setpoints={setpoints}
            />
          </div>

          <div style={{ flex: 1 }}>
            <SetpointControls
              setpoints={setpoints}
              onChange={handleSetpointChange}
            />
            <div style={{ padding: 12 }}>
              <button type="button" onClick={handleSendSetpoints}>
                Send setpoints
              </button>
            </div>
          </div>
        </div>

        {/* Charts below span full width */}
        <div style={{ marginTop: 16 }}>
          <ChartsPanel history={history} />
        </div>
      </main>

        {/* Event log removed until anomaly detection is reintroduced */}
      
        {/* <section className="event-log-section">
          <EventLog events={[]} />
        </section> */}

      {/* HardwareConnectionTester removed */}
    </div>
  );
}
