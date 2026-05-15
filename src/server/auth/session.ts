import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Not authenticated");
  if (user.role !== "ADMIN") throw new ForbiddenError("Admin role required");
  return user;
}

export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Not authenticated");
  return user;
}
