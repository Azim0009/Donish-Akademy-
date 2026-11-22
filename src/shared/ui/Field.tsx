import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

const control =
  'w-full rounded-ctl border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

/** Обёртка поля: подпись + контрол + подсказка/ошибка */
export function Field({ label, hint, error, className, children, htmlFor }: FieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-[13px] text-danger">{error}</span>
      ) : (
        hint && <span className="text-[13px] text-muted">{hint}</span>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string; leftIcon?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, hint, error, leftIcon, id, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} className={className}>
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</span>}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={clsx(control, 'h-10', leftIcon && 'pl-9', error && 'border-danger focus:border-danger focus:ring-danger/20')}
          {...props}
        />
      </div>
    </Field>
  );
});
Input.displayName = 'Input';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, error, id, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} className={className}>
      <textarea id={inputId} ref={ref} className={clsx(control, 'min-h-[110px] py-2.5 leading-6', error && 'border-danger')} {...props} />
    </Field>
  );
});
Textarea.displayName = 'Textarea';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <Field label={label} hint={hint} error={error} htmlFor={inputId} className={className}>
        <select id={inputId} ref={ref} className={clsx(control, 'h-10 cursor-pointer pr-8', error && 'border-danger')} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  },
);
Select.displayName = 'Select';

/** Переключатель on/off */
export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-[13px] text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  );
}
