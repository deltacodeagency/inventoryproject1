import React, { useEffect, useMemo, useRef, useState } from 'react';

type SelectEvent = { target: { value: string } };

type AppSelectProps = {
  value: string;
  onChange: (event: SelectEvent) => void;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
};

export const AppSelect: React.FC<AppSelectProps> = ({
  value,
  onChange,
  children,
  className = '',
  required,
  disabled,
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => {
    const flattenOptions = (nodes: React.ReactNode): Array<{ value: string; label: React.ReactNode; disabled: boolean }> => (
      React.Children.toArray(nodes).flatMap((child) => {
        if (!React.isValidElement(child)) return [];
        if (child.type === React.Fragment) {
          return flattenOptions((child.props as { children?: React.ReactNode }).children);
        }
        const option = child as React.ReactElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }>;
        return [{
          value: String(option.props.value ?? ''),
          label: option.props.children,
          disabled: Boolean(option.props.disabled),
        }];
      })
    );
    return flattenOptions(children);
  }, [children]);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`app-select ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="app-select-trigger"
      >
        <span className="app-select-value">{selected?.label ?? ''}</span>
        <span className={`app-select-chevron ${open ? 'app-select-chevron-open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="app-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              disabled={option.disabled}
              onClick={() => {
                if (option.disabled) return;
                onChange({ target: { value: option.value } });
                setOpen(false);
              }}
              className={`app-select-option ${option.value === value ? 'app-select-option-selected' : ''}`}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="app-select-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
      {required && !value && <input required tabIndex={-1} aria-hidden="true" className="app-select-required" value="" readOnly />}
    </div>
  );
};
