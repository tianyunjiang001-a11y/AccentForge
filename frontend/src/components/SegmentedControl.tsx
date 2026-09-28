interface SegmentedControlProps<T extends string> {
  disabled?: boolean;
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T | null;
}

export function SegmentedControl<T extends string>({
  disabled = false,
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="segmented-field" disabled={disabled}>
      <legend>{label}</legend>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            aria-pressed={value === option}
            className={value === option ? "is-selected" : undefined}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
