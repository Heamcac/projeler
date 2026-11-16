import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const buttonClass = (variant: "primary" | "secondary") =>
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${variant === "primary"
    ? "bg-action text-ink hover:bg-spark"
    : "border border-line bg-surface/70 text-paper hover:border-spark"}`;

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return <button {...props} className={`${buttonClass(variant)} ${className}`} />;
}

export function ButtonLink({ href, children, variant = "primary", target }: {
  href: string; children: ReactNode; variant?: "primary" | "secondary"; target?: "_blank";
}) {
  return <Link href={href} target={target} rel={target ? "noopener noreferrer" : undefined}
    className={buttonClass(variant)}>{children}</Link>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="field"><span>{title}</span>{children}</label>;
}

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return <header className="mb-8 max-w-2xl">
    <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
    <p className="mt-4 text-pretty leading-relaxed text-muted">{children}</p>
  </header>;
}
