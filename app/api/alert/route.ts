import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter: 30 req / IP / 10 min
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

function getRecommendation(
  priority: "P1" | "P2" | "P3",
  alertType: string
): string {
  if (priority === "P1") {
    return "Immediate failover required — human approval needed";
  }
  if (priority === "P2") {
    if (alertType === "memory_usage") return "Auto-restart service";
    if (alertType === "disk_usage") return "Auto-clean temp files";
    return "Auto-remediate";
  }
  return "Log and monitor";
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 10 minutes." },
      { status: 429 }
    );
  }

  let body: {
    server?: string;
    alert_type?: string;
    metric?: string;
    value?: number;
    threshold?: number;
    service?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { server, alert_type, metric, value, threshold, service } = body;

  if (!server || !alert_type || value === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: server, alert_type, value" },
      { status: 400 }
    );
  }

  // Priority logic
  let priority: "P1" | "P2" | "P3";
  if (alert_type === "database_connection") {
    priority = "P1";
  } else if (value >= 85) {
    priority = "P2";
  } else {
    priority = "P3";
  }

  const alertId =
    "ITA-" +
    Math.random().toString(16).slice(2, 10).toUpperCase();

  const recommendation = getRecommendation(priority, alert_type);

  let status: string;
  if (priority === "P1") {
    status = "AWAITING_APPROVAL";
  } else if (priority === "P2") {
    status = "AUTO_REMEDIATING";
  } else {
    status = "LOGGED";
  }

  return NextResponse.json({
    alertId,
    priority,
    status,
    recommendation,
    server,
    alert_type,
    metric,
    value,
    threshold,
    service,
    timestamp: new Date().toISOString(),
  });
}
