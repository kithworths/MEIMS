import { type ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export default function LoadingButton({
  children,
  isLoading = false,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className="loading-button"
      disabled={isLoading || disabled}
      type="submit"
      {...props}
    >
      {isLoading ? (
        <span className="loading-spinner" aria-live="polite">
          Loading…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
