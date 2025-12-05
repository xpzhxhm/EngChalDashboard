import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';

const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour12: false });

const renderSmallCircle = ({ cx, cy, fill }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={3} fill={fill} />;
};

const sortDataByTimestamp = (points) => {
  if (!Array.isArray(points)) return [];
  return [...points].sort((a, b) => {
    if (a.timestamp === b.timestamp) return 0;
    return a.timestamp > b.timestamp ? 1 : -1;
  });
};

export default function TimeSeriesChart({ data, dataKey, label }) {
  const normalizedData = sortDataByTimestamp(data);

  return (
    <div className="chart-card">
      <div className="chart-title">{label}</div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart data={normalizedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            type="number"
            dataKey="timestamp"
            tickFormatter={formatTime}
            minTickGap={40}
            stroke="#94a3b8"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis type="number" dataKey={dataKey} stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
            labelFormatter={(value) => formatTime(value)}
          />
          <Scatter
            data={normalizedData}
            dataKey={dataKey}
            fill="#60a5fa"
            shape={renderSmallCircle}
            line={{ stroke: '#60a5fa', strokeWidth: 2, strokeOpacity: 0.7 }}
            lineJointType="monotoneX"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
