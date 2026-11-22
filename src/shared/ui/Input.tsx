import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className="rounded border border-gray-400 bg-transparent px-2 py-1"
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
