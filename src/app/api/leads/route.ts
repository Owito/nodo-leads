import { NextResponse } from "next/server";
import { listarLeads, modoAlmacenamiento } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fuente del dashboard en vivo. */
export async function GET() {
  try {
    const leads = await listarLeads(50);
    return NextResponse.json({ ok: true, modo: modoAlmacenamiento(), leads });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, modo: modoAlmacenamiento(), leads: [] },
      { status: 500 },
    );
  }
}
