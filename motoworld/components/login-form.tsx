"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import { Button } from "./ui";

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return <form action={action} className="space-y-4">
    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
    <label className="field">E-posta
      <input className="input" name="email" type="email" required maxLength={254} autoComplete="username" />
    </label>
    <label className="field">Şifre
      <input className="input" name="password" type="password" required maxLength={72} autoComplete="current-password" />
    </label>
    {state.error && <p role="alert" className="error">{state.error}</p>}
    <Button className="w-full" type="submit" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</Button>
  </form>;
}
