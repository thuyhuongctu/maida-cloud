import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: ctx.user, org: ctx.org });
}
