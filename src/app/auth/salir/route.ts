import { NextResponse } from "next/server";
import { supabaseSesion } from "@/lib/sesion";

export async function POST(req: Request) {
  const sb = await supabaseSesion();
  await sb?.auth.signOut();
  return NextResponse.redirect(new URL("/", new URL(req.url).origin), { status: 303 });
}
