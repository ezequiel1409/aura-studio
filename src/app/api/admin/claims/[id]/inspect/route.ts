import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { inspectOrderClaim } from "../../../../../../services/claim.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const claimId = resolvedParams.id;
    if (!claimId) {
      return NextResponse.json({ ok: false, error: "ID de solicitud inválido." }, { status: 400 });
    }

    const body = await req.json();
    const { decision, rejectionReason, adminNotes } = body;

    if (decision !== "APPROVE_RESTOCK" && decision !== "REJECT_CONDITION") {
      return NextResponse.json(
        { ok: false, error: "Decisión de inspección inválida (debe ser APPROVE_RESTOCK o REJECT_CONDITION)." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await inspectOrderClaim(
      claimId,
      {
        decision,
        rejectionReason,
        adminNotes,
      },
      deps
    );

    return NextResponse.json({ ok: true, claim: result.claim });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la inspección.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
