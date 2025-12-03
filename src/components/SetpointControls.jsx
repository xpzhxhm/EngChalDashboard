const CONTROL_CONFIG = {
  temp: {
    label: 'Temperature Setpoint',
    unit: '°C',
    min: 28,
    max: 34,
    step: 0.1
  },
  rpm: {
    label: 'RPM Setpoint',
    unit: 'RPM',
    min: 900,
    max: 1100,
    step: 10
  },
  pH: {
    label: 'pH Setpoint',
    unit: 'pH',
    min: 3,
    max: 7,
    step: 0.1
  }
};

export default function SetpointControls({ setpoints, onChange }) {
  const handleChange = (key) => (event) => {
    const raw = event.target.value;
    const parsed = parseFloat(raw);
    onChange(key, Number.isNaN(parsed) ? CONTROL_CONFIG[key].min : parsed);
  };

  return (
    <div className="card setpoint-controls">
      <div className="card-header">
        <h3>Control Setpoints</h3>
        <span className="subdued">Adjust desired targets within safe ranges</span>
      </div>
      <div className="setpoint-list">
        {Object.entries(CONTROL_CONFIG).map(([key, config]) => (
          <div key={key} className="setpoint-row">
            <div className="setpoint-header">
              <div className="setpoint-label">{config.label}</div>
              <div className="setpoint-value">
                {setpoints[key]?.toFixed ? setpoints[key].toFixed(2) : setpoints[key]} {config.unit}
              </div>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={setpoints[key] ?? config.min}
              onChange={handleChange(key)}
              className="setpoint-slider"
            />
            <div className="setpoint-range">
              <span>{config.min}{config.unit}</span>
              <span>{config.max}{config.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
