import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { classNames } from "../../lib/utils";

/** Animated field-error text, shared by TextField/TextareaField so validation
 * messages fade+slide in and out instead of popping. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          id={id}
          className="field-error"
          role="alert"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.18 }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, required, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    return (
      <div>
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={classNames("input", error && "border-danger-500 focus:ring-danger-500/30", className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          required={required}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-ink-400">
            {hint}
          </p>
        )}
        <FieldError id={errorId} message={error} />
      </div>
    );
  }
);
TextField.displayName = "TextField";

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, required, rows = 5, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    return (
      <div>
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={classNames("input", "resize-y", error && "border-danger-500 focus:ring-danger-500/30", className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          required={required}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-ink-400">
            {hint}
          </p>
        )}
        <FieldError id={errorId} message={error} />
      </div>
    );
  }
);
TextareaField.displayName = "TextareaField";

/** Visually hidden honeypot input — real users never see it; bots that
 * auto-fill every field will, and the submission is silently dropped. */
export function HoneypotField({ registerProps }: { registerProps: InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
      <label htmlFor="hp_field">Leave this field empty</label>
      <input id="hp_field" type="text" tabIndex={-1} autoComplete="off" {...registerProps} />
    </div>
  );
}
