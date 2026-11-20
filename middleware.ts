import { NextResponse } from "next/server";

// Local-first mode: authentication will be restored when Supabase is connected.
export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
