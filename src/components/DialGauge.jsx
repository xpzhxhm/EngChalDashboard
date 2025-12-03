const clamp = (value, min, max) => {
  if (value === null || value === undefined || Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const formatNumber = (value, fractionDigits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(fractionDigits);
};

const polarToCartesian = (cx, cy, radius, angleRad) => ({
  x: cx + radius * Math.cos(angleRad),
  y: cy - radius * Math.sin(angleRad)
});

const describeArc = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= Math.PI ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const GAUGE = {
  // slightly reduced size to fit multiple dials on one row
  width: 180,
  height: 120,
  cx: 90,
  cy: 100,
  radius: 76,
  startAngle: Math.PI,
  endAngle: 0
};

export default function DialGauge({
  label,
  value,
  unit = '',
  min = 0,
  max = 100,
  setpoint,
  tolerance
}) {
  const displayValue = value ?? '—';
  const safeValue = clamp(value, min, max);
  const normalized = (safeValue - min) / (max - min || 1);
  const valueAngle = GAUGE.startAngle - normalized * Math.PI;
  const delta =
    value !== null && value !== undefined && setpoint !== null && setpoint !== undefined
      ? value - setpoint
      : null;
  const withinTolerance =
    delta !== null && typeof tolerance === 'number' ? Math.abs(delta) <= tolerance : null;

  const pointerInner = { x: GAUGE.cx, y: GAUGE.cy };
  const pointerOuter = polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius - 14, valueAngle);
  const pointerTip = polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius - 6, valueAngle);
  const setpointAngle =
    setpoint !== undefined && setpoint !== null
      ? GAUGE.startAngle - ((clamp(setpoint, min, max) - min) / (max - min || 1)) * Math.PI
      : null;

  const ticks = Array.from({ length: 6 }, (_, idx) => idx / 5);

  return (
    <div className="dial-card">
      <div className="dial-label">{label}</div>
  <svg viewBox="0 0 180 120" className="dial-svg" role="img" aria-label={`${label} gauge`}>
        <path
          className="dial-arc-bg"
          d={describeArc(GAUGE.cx, GAUGE.cy, GAUGE.radius, GAUGE.startAngle, GAUGE.endAngle)}
        />
        {ticks.map((tick, idx) => {
          const angle = GAUGE.startAngle - tick * Math.PI;
          const start = polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius - 5, angle);
          const end = polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius + 5, angle);
          const labelPos = polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius + 18, angle);
          const rawValue = min + (max - min) * tick;
          const step = unit === 'RPM' ? 1 : 1;
          const labelValue = Math.round(rawValue / step) * step;
          return (
            <g key={`tick-${idx}`}>
              <line className="dial-tick" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
              <text className="dial-tick-label" x={labelPos.x} y={labelPos.y}>
                {labelValue}
              </text>
            </g>
          );
        })}
        {setpointAngle !== null && (
          <line
            className="dial-setpoint-tick"
            x1={polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius - 16, setpointAngle).x}
            y1={polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius - 16, setpointAngle).y}
            x2={polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius + 6, setpointAngle).x}
            y2={polarToCartesian(GAUGE.cx, GAUGE.cy, GAUGE.radius + 6, setpointAngle).y}
          />
        )}
        <line
          className="dial-pointer"
          x1={pointerInner.x}
          y1={pointerInner.y}
          x2={pointerOuter.x}
          y2={pointerOuter.y}
        />
        <circle className="dial-pointer-tip" cx={pointerTip.x} cy={pointerTip.y} r="4" />
        <circle className="dial-pointer-base" cx={GAUGE.cx} cy={GAUGE.cy} r="6" />
      </svg>
      <div className="dial-value">
        {displayValue}
        {unit ? <span className="dial-unit">{unit}</span> : null}
      </div>
      {(setpoint !== undefined || withinTolerance !== null) && (
        <div className="dial-status">
          {setpoint !== undefined && (
            <span className="dial-setpoint">
              Setpoint {formatNumber(setpoint, unit === 'RPM' ? 0 : 1)}
              {unit ? ` ${unit}` : ''}
              {typeof tolerance === 'number' ? ` ±${tolerance}${unit}` : ''}
            </span>
          )}
          {withinTolerance !== null && (
            <span className={withinTolerance ? 'status-ok' : 'status-alert'}>
              {withinTolerance ? 'Within spec' : `Δ ${formatNumber(delta)}${unit}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
