import { useState, type InputHTMLAttributes } from 'react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function PasswordInput({
  label,
  error,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label className="label" htmlFor={props.id ?? props.name}>
        <span>{label}</span>
        <button
          type="button"
          className="text-button"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </label>
      <input
        className={`text-input ${error ? 'input-error' : ''}`}
        id={props.id ?? props.name}
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        {...props}
      />
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}
