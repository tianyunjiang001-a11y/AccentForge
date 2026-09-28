interface EditorCardProps {
  actionLabel: string;
  count?: string;
  description: string;
  id: string;
  label: string;
  onAction?: () => void;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  value: string;
}

export function EditorCard({
  actionLabel,
  count,
  description,
  id,
  label,
  onAction,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: EditorCardProps) {
  return (
    <article className="editor-card">
      <div className="editor-card__heading">
        <div>
          <label htmlFor={id}>{label}</label>
          <p>{description}</p>
        </div>
      </div>

      <div className="editor-field">
        <textarea
          id={id}
          maxLength={readOnly ? undefined : 1000}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
        />
        {count ? <span className="character-count">{count}</span> : null}
      </div>

      <button className="primary-button" onClick={onAction} type="button">
        {actionLabel}
      </button>
    </article>
  );
}
