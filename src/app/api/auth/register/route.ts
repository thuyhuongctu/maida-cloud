import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  orgName: z.string().min(1).max(160),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 422 });
  }
  const { name, email, password, orgName } = body.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, email, passwordHash } });
    const org = await tx.organization.create({ data: { name: orgName } });
    await tx.membership.create({ data: { userId: created.id, organizationId: org.id, role: "OWNER" } });
    await tx.project.create({ data: { name: "Default project", organizationId: org.id } });
    return created;
  });

  const token = await signSession(user.id);
  const res = NextResponse.json({ data: { email: user.email, name: user.name } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
