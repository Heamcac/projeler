import { ButtonHTMLAttributes } from 'react';

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-hospital px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${props.className ?? ''}`}
    />
  );
}
