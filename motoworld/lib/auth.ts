import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { adminEntry, bookingReturnHeader } from "./admin-links";

const cookieName = "motoworld-admin";
const lifetime = 8 * 60 * 60;
const dummyHash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxKFNRJDi2en3j5P9Hxg1WbeAO.";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export const getAdmin = cache(async () => {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: digest(token), expiresAt: { gt: new Date() } },
    select: { admin: { select: { id: true, email: true, passwordChangeRequired: true } } },
  });
  return session?.admin ?? null;
});

export async function requireAdmin({ allowPasswordChange = false } = {}) {
  const admin = await getAdmin();
  if (!admin || (admin.passwordChangeRequired && !allowPasswordChange)) {
    const requestedBooking = (await headers()).get(bookingReturnHeader);
    redirect(adminEntry(admin ? "/admin/hesap" : "/admin/giris", requestedBooking));
  }
  return admin;
}

export async function signIn(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email } });
  const matches = await compare(password, admin?.passwordHash ?? dummyHash);
  if (!matches || !admin) return false;

  const store = await cookies();
  const current = store.get(cookieName)?.value;
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const created = await db.$transaction(async (tx) => {
    const currentUser = await tx.adminUser.updateMany({
      where: { id: admin.id, passwordHash: admin.passwordHash },
      data: { passwordHash: admin.passwordHash },
    });
    if (!currentUser.count) return false;
    await tx.adminSession.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { tokenHash: digest(current ?? "") }] },
    });
    await tx.adminSession.create({
      data: { adminId: admin.id, tokenHash: digest(token), expiresAt: new Date(now.valueOf() + lifetime * 1000) },
    });
    return true;
  });
  if (!created) return false;
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: lifetime,
  });
  return true;
}

export async function changePassword(adminId: string, current: string, next: string) {
  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  if (!admin || !await compare(current, admin.passwordHash)) return false;
  const passwordHash = await hash(next, 12);
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.adminUser.updateMany({
      where: { id: adminId, passwordHash: admin.passwordHash }, data: { passwordHash, passwordChangeRequired: false },
    });
    if (!result.count) return false;
    await tx.adminSession.deleteMany({ where: { adminId } });
    return true;
  });
  if (changed) (await cookies()).delete(cookieName);
  return changed;
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: digest(token) } });
  store.delete(cookieName);
}
