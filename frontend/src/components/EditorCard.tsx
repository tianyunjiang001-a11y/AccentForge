interface EditorCardProps {
  actionSecurity?: React.ReactNode;
  actionDisabled?: boolean;
  actionLabel: string;
  actionLoading?: boolean;
  count?: string;
  description: string;
  id: string;
  label: string;
  onAction?: () => void;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  status?: string;
  textareaReadOnly?: boolean;
  value: string;
}

export function EditorCard({
  actionSecurity,
  actionDisabled = false,
  actionLabel,
  actionLoading = false,
  count,
  description,
  id,
  label,
  onAction,
  onChange,
  placeholder,
  readOnly = false,
  status,
  textareaReadOnly = false,
  value,
}: EditorCardProps) {
  return (
    <article className="editor-card" aria-busy={actionLoading}>
      <div className="editor-card__heading">
        <div>
          <label htmlFor={id}>{label}</label>
          <p>{description}</p>
        </div>
        {status ? <span className="status-label">{status}</span> : null}
      </div>

      <div className="editor-field">
        <textarea
          id={id}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly || textareaReadOnly}
          value={value}
        />
        {count ? <span className="character-count">{count}</span> : null}
      </div>

      <button
        className="primary-button"
        disabled={actionDisabled}
        onClick={onAction}
        type="button"
      >
        {actionLoading ? <span aria-hidden="true" className="spinner" /> : null}
        {actionLabel}
      </button>
      {actionSecurity}
    </article>
  );
}
