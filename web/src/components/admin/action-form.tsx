"use client";

import {
  createContext,
  startTransition,
  use,
  useActionState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/types";
import { useToast } from "./toast";
import { btn } from "./styles";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const INITIAL: ActionState = { ok: true };

const PendingContext = createContext(false);

/** Reports each new action result as a toast. */
function useReport(state: ActionState, onSuccess?: () => void) {
  const toast = useToast();
  const last = useRef(state.at);
  useEffect(() => {
    if (!state.at || state.at === last.current) return;
    last.current = state.at;
    if (state.error) toast(false, state.error);
    else if (state.message) toast(true, state.message);
    if (state.ok) onSuccess?.();
  }, [state, toast, onSuccess]);
}

/**
 * A form posting to an admin Server Action. Errors show inline and as a toast;
 * the fields keep what the editor typed.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const form = useRef<HTMLFormElement>(null);
  useReport(state, () => {
    if (resetOnSuccess) form.current?.reset();
    onSuccess?.();
  });
  return (
    <form
      ref={form}
      action={formAction}
      className={className}
      // React resets uncontrolled fields after an action, which would wipe the
      // editor's input on a validation error. Submit manually to keep it.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(fd));
      }}
    >
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}
      <PendingContext value={pending}>{children}</PendingContext>
    </form>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  name,
  value,
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof btn;
  name?: string;
  value?: string;
  className?: string;
}) {
  const formPending = use(PendingContext);
  const { pending: nativePending } = useFormStatus();
  const pending = formPending || nativePending;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={`${btn[variant]} ${className}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/** One-click action (publish, reorder, delete) with optional confirmation. */
export function ActionButton({
  action,
  children,
  variant = "secondary",
  confirm,
  label,
  className = "",
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  variant?: keyof typeof btn;
  confirm?: string;
  /** Accessible name for icon-only buttons. */
  label?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(async () => action(), INITIAL);
  useReport(state);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline"
    >
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        title={label}
        className={`${btn[variant]} ${className}`}
      >
        {children}
      </button>
    </form>
  );
}
