import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`focus-ring min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ${props.className ?? ''}`} />;
}
