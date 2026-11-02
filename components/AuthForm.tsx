"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";
import { Notice } from "./ui";

type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string };

export function ActionForm({
  action,
  fields,
  submit,
  className = "",
  children,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={`space-y-4 ${className}`}>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.ok && <Notice kind="ok">{state.ok}</Notice>}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="label">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required={f.required} defaultValue={f.defaultValue} className="field" />
        </div>
      ))}
      {children}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Memproses…" : submit}</button>
    </form>
  );
}
