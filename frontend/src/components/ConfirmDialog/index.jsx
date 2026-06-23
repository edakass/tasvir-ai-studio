import "./ConfirmDialog.css";

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
  error = "",
}) {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-icon">
          <i className="ti ti-trash" />
        </div>
        <div className="confirm-dialog-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          {message && <p>{message}</p>}
        </div>

        {error && <div className="confirm-dialog-error">{error}</div>}

        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className="confirm-dialog-delete"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <i className="ti ti-loader-2 spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
