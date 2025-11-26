import { useState } from 'react';
import SetpointControls from './components/SetpointControls.jsx';
import KPIBar from './components/KPIBar.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import EventLog from './components/EventLog.jsx';
import { useBioreactorStream } from './hooks/useBioreactorStream.js';

const statusMap = {
  idle: 'status-pill idle',
  connecting: 'status-pill connecting',
  open: 'status-pill open',
  error: 'status-pill error',
  closed: 'status-pill closed'
};

export default function App() {
  const [setpoints, setSetpoints] = useState({
    temp: 30,
    rpm: 1000,
    pH: 5
  });

  const tolerances = {
    temp: 0.5, // Spec: maintain 30°C ±0.5°C
    rpm: 20,   // Spec: regulate 1000 RPM ±20 RPM
    pH: 0.1    // Operational tolerance inside broader 3-7 sensing range
  };

  const handleSetpointChange = (key, value) => {
    setSetpoints((prev) => ({ ...prev, [key]: value }));
  };

  // If your hook still expects a default stream, keep 'nofaults' here:
  const {
    connectionStatus,
    current,
    history,
    metrics,
    events,
    lastUpdated
  } = useBioreactorStream('nofaults');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">ENGF0001</p>
          <h1>Bioreactor Dashboard</h1>
          <p className="subtitle">Anomaly detection (z-score) &amp; live telemetry</p>
        </div>
        <div className={statusMap[connectionStatus] ?? 'status-pill'}>{connectionStatus}</div>
      </header>

      <main className="app-content">
        <section className="responsive-grid two-col">
          <SetpointControls setpoints={setpoints} onChange={handleSetpointChange} />
        </section>

        <section>
          <KPIBar
            current={current}
            metrics={metrics}
            lastUpdated={lastUpdated}
            setpoints={setpoints}
            tolerances={tolerances}
          />
        </section>

        <section>
          <ChartsPanel history={history} />
        </section>

        <section>
          <EventLog events={events} />
        </section>
      </main>
    </div>
  );
}
