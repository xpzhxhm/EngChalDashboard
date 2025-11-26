export default function EventLog({ events }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Event log</h2>
      </div>

      {!events || events.length === 0 ? (
        <p className="muted">No events yet.</p>
      ) : (
        <table className="event-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Signal</th>
              <th>Value</th>
              <th>z-score</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt, idx) => (
              <tr key={idx}>
                <td>{evt.time}</td>
                <td>{evt.signal}</td>
                <td>{evt.value}</td>
                <td>
                  {typeof evt.zScore === 'number'
                    ? evt.zScore.toFixed(2)
                    : evt.zScore}
                </td>
                <td>{evt.classification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
