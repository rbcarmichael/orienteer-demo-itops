import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: {
    alert_id?: string;
    action?: string;
    approved_by?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { alert_id, action, approved_by } = body;

  if (!alert_id || !action) {
    return NextResponse.json(
      { error: "Missing required fields: alert_id, action" },
      { status: 400 }
    );
  }

  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json(
      { error: "action must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    alert_id,
    action,
    approved_by: approved_by || "unknown",
    timestamp: new Date().toISOString(),
    message:
      action === "APPROVED"
        ? "Failover approved and executing"
        : "Action cancelled — manual intervention required",
  });
}
