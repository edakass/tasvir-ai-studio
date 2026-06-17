import "./StatusState.css";

function StatusState({
  icon = "ti-alert-circle",
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <section className="status-state" role="status">
      <div className="status-state-icon">
        <i className={`ti ${icon}`} aria-hidden="true" />
      </div>
      <h1>{title}</h1>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          <i className="ti ti-refresh" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export default StatusState;
