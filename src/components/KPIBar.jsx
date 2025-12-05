import DialGauge from './DialGauge.jsx';
import MetricCard from './MetricCard.jsx';

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', options).format(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString([], { hour12: false });
};

export default function KPIBar({ current, metrics, lastUpdated, setpoints, tolerances }) {
  return (
    <div className="card kpi-bar">
      <div className="card-header">
        <h3>Live KPIs</h3>
        <span className="subdued">Last update: {formatTime(lastUpdated)}</span>
      </div>
      <div className="dial-grid">
        <DialGauge
          label="Temperature"
          value={current?.temp}
          unit="°C"
          min={28}
          max={34}
          setpoint={setpoints?.temp}
          tolerance={tolerances?.temp}
        />
        <DialGauge
          label="pH"
          value={current?.pH}
          min={3}
          max={7}
          setpoint={setpoints?.pH}
          tolerance={tolerances?.pH}
        />
        <DialGauge
          label="RPM"
          value={current?.rpm}
          min={900}
          max={1100}
          setpoint={setpoints?.rpm}
          tolerance={tolerances?.rpm}
        />
      </div>
      <div className="metric-grid compact">
        <MetricCard label="Temperature" value={formatNumber(current?.temp, { maximumFractionDigits: 1 })} unit="°C" />
        <MetricCard label="pH" value={formatNumber(current?.pH, { maximumFractionDigits: 2 })} />
        <MetricCard label="RPM" value={formatNumber(current?.rpm)} />
        <div className="abnormal-warning-card">
          <div className="abnormal-warning-header">
            <div className="metric-label">Abnormal warning</div>
            <span className="badge-soft">Model health</span>
          </div>
          <div className="abnormal-warning-grid">
            <div className="abnormal-metric">
              <span className="abnormal-metric-label">Accuracy</span>
              <span className="abnormal-metric-value">{formatPercent(metrics?.accuracy)}</span>
            </div>
            <div className="abnormal-metric">
              <span className="abnormal-metric-label">Precision</span>
              <span className="abnormal-metric-value">{formatPercent(metrics?.precision)}</span>
            </div>
            <div className="abnormal-metric">
              <span className="abnormal-metric-label">Recall</span>
              <span className="abnormal-metric-value">{formatPercent(metrics?.recall)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
