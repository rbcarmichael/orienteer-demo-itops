"use client";

import { useState, useCallback, useRef } from "react";

interface Incident {
  server: string;
  alert_type: string;
  metric: string;
  value: number;
  threshold: number;
  service: string;
  delay: number;
  description: string;
}

interface AlertResult {
  alertId: string;
  priority: "P1" | "P2" | "P3";
  status: string;
  recommendation?: string;
}

interface AlertEntry {
  incident: Incident;
  result: AlertResult;
  timestamp: string;
  actionStatus: "pending" | "approved" | "rejected" | "auto";
}

interface ActionEntry {
  id: string;
  server: string;
  action: string;
  approver: string;
  timestamp: string;
}

const INCIDENT_SEQUENCE: Incident[] = [
  {
    server: "web-prod-01",
    alert_type: "disk_usage",
    metric: "Disk Usage",
    value: 75,
    threshold: 80,
    service: "nginx",
    delay: 0,
    description: "Disk space filling up",
  },
  {
    server: "web-prod-01",
    alert_type: "disk_usage",
    metric: "Disk Usage",
    value: 88,
    threshold: 80,
    service: "nginx",
    delay: 3000,
    description: "Disk critical - cleaning temp files",
  },
  {
    server: "api-prod-02",
    alert_type: "memory_usage",
    metric: "Memory",
    value: 82,
    threshold: 80,
    service: "node-api",
    delay: 3000,
    description: "Memory spike - auto-restart service",
  },
  {
    server: "db-prod-01",
    alert_type: "database_connection",
    metric: "DB Connections",
    value: 100,
    threshold: 0,
    service: "postgresql",
    delay: 3000,
    description: "Database unresponsive - FAILOVER REQUIRED",
  },
];

function getProgressClass(value: number): string {
  if (value >= 90) return "critical";
  if (value >= 80) return "warning";
  return "ok";
}

function genActionId(): string {
  return "ACT-" + Date.now().toString().slice(-6);
}

export default function Home() {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [running, setRunning] = useState(false);
  const alertsRef = useRef<AlertEntry[]>([]);

  const addAction = useCallback((entry: ActionEntry) => {
    setActions((prev) => [entry, ...prev]);
  }, []);

  const handleApprove = useCallback(
    async (alertId: string, server: string) => {
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) =>
          a.result.alertId === alertId
            ? { ...a, actionStatus: "approved" as const }
            : a
        )
      );

      try {
        await fetch("/api/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alert_id: alertId,
            action: "APPROVED",
            approved_by: "SRE Engineer",
          }),
        });
      } catch {
        // fire-and-forget — UI already updated
      }

      addAction({
        id: genActionId(),
        server,
        action: "Failover executed",
        approver: "SRE Engineer",
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [addAction]
  );

  const handleReject = useCallback(async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.result.alertId === alertId
          ? { ...a, actionStatus: "rejected" as const }
          : a
      )
    );

    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          action: "REJECTED",
          approved_by: "SRE Engineer",
        }),
      });
    } catch {
      // fire-and-forget
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setActions([]);
    alertsRef.current = [];
  }, []);

  const startSimulation = useCallback(async () => {
    setRunning(true);
    clearAlerts();

    for (const incident of INCIDENT_SEQUENCE) {
      if (incident.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, incident.delay));
      }

      let result: AlertResult;
      try {
        const res = await fetch("/api/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            server: incident.server,
            alert_type: incident.alert_type,
            metric: incident.metric,
            value: incident.value,
            threshold: incident.threshold,
            service: incident.service,
          }),
        });
        result = await res.json();
      } catch {
        const priority: "P1" | "P2" | "P3" =
          incident.alert_type === "database_connection"
            ? "P1"
            : incident.value >= 85
            ? "P2"
            : "P3";
        result = {
          alertId: "ITA-" + Date.now().toString(36).toUpperCase(),
          priority,
          status: "PROCESSED",
          recommendation:
            priority === "P2" ? "Auto-remediate" : "Log only",
        };
      }

      const entry: AlertEntry = {
        incident,
        result,
        timestamp: new Date().toLocaleTimeString(),
        actionStatus: result.priority === "P1" ? "pending" : "auto",
      };

      setAlerts((prev) => [entry, ...prev]);
      alertsRef.current = [entry, ...alertsRef.current];

      // Auto-actions for P2/P3
      if (result.priority !== "P1") {
        setTimeout(() => {
          addAction({
            id: genActionId(),
            server: incident.server,
            action:
              result.recommendation ||
              (result.priority === "P2" ? "Auto-remediate" : "Log only"),
            approver: "SYSTEM",
            timestamp: new Date().toLocaleTimeString(),
          });
        }, 500);
      }
    }

    setRunning(false);
  }, [clearAlerts, addAction]);

  return (
    <div className="container">
      <header>
        <div className="logo">
          <span className="logo-icon">🖥️</span>
          <div>
            <h1>IT Operations Center</h1>
            <p className="subtitle">
              AI-Powered Auto-Remediation with Human Guardrails
            </p>
          </div>
        </div>
        <span className="status-badge">● All Systems Monitored</span>
      </header>

      <div className="stats-banner">
        <div style={{ flex: 1 }}>
          <strong>Intelligent Auto-Remediation</strong>
          <p
            style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}
          >
            Safe actions auto-execute • Risky actions require approval • All
            actions logged
          </p>
        </div>
        <div className="stat">
          <div className="stat-number">85%</div>
          <div className="stat-label">Auto-remediated</div>
        </div>
        <div className="stat">
          <div className="stat-number">15%</div>
          <div className="stat-label">Human approved</div>
        </div>
        <div className="stat">
          <div className="stat-number">&lt;30s</div>
          <div className="stat-label">Avg. response</div>
        </div>
      </div>

      <div className="controls">
        <button
          className="btn-primary"
          onClick={startSimulation}
          disabled={running}
        >
          {running ? "⏳ Simulation Running..." : "▶ Start Incident Simulation"}
        </button>
        <button className="btn-secondary" onClick={clearAlerts}>
          Clear Alerts
        </button>
      </div>

      <div className="grid">
        {/* Left panel: Alerts */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              🚨 Infrastructure Alerts
              <span className="count-badge">{alerts.length}</span>
            </span>
          </div>
          <div className="alert-feed">
            {alerts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <p>No alerts. Start the incident simulation.</p>
              </div>
            ) : (
              alerts.map((entry) => (
                <AlertCard
                  key={entry.result.alertId}
                  entry={entry}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel: Actions */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              ⚙️ Actions Taken
              <span className="count-badge">{actions.length}</span>
            </span>
          </div>
          <div className="action-list">
            {actions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>Remediation actions will appear here.</p>
              </div>
            ) : (
              actions.map((action, i) => (
                <div className="action-item" key={i}>
                  <div>
                    <span className="action-id">{action.id}</span>
                    <span
                      className="server-badge"
                      style={{ marginLeft: "8px" }}
                    >
                      {action.server}
                    </span>
                  </div>
                  <div className="action-info">
                    {action.action} • by {action.approver}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  entry,
  onApprove,
  onReject,
}: {
  entry: AlertEntry;
  onApprove: (alertId: string, server: string) => void;
  onReject: (alertId: string) => void;
}) {
  const { incident, result, timestamp, actionStatus } = entry;
  const priority = result.priority.toLowerCase();
  const progressClass = getProgressClass(incident.value);
  const autoAction =
    result.recommendation ||
    (result.priority === "P2" ? "Auto-remediate" : "Log only");

  return (
    <div className={`alert-item ${priority}`}>
      <div className="alert-header">
        <span className={`priority-badge ${priority}`}>{result.priority}</span>
        <span className="alert-time">{timestamp}</span>
      </div>

      <div className="alert-details">
        <span className="metric-value">{incident.value}%</span>{" "}
        <span className="metric-label">{incident.metric}</span>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-fill ${progressClass}`}
          style={{ width: `${incident.value}%` }}
        />
      </div>

      <div className="alert-meta">
        <span>
          Server:{" "}
          <span className="server-badge">{incident.server}</span>
        </span>
        <span>Service: {incident.service}</span>
      </div>

      {result.priority === "P1" ? (
        <>
          <div className="critical-indicator">
            <strong>🚨 Critical Action Required:</strong> {incident.description}
          </div>
          {actionStatus === "pending" && (
            <div className="alert-actions">
              <button
                className="btn-success"
                onClick={() => onApprove(result.alertId, incident.server)}
              >
                ✓ APPROVE FAILOVER
              </button>
              <button
                className="btn-danger"
                onClick={() => onReject(result.alertId)}
              >
                ✗ CANCEL
              </button>
            </div>
          )}
          {actionStatus === "approved" && (
            <span className="status-text status-approved">
              ✓ FAILOVER COMPLETE - Traffic redirected
            </span>
          )}
          {actionStatus === "rejected" && (
            <span className="status-text status-rejected">
              ✗ CANCELLED - Manual intervention required
            </span>
          )}
        </>
      ) : (
        <div className="status-text status-auto">
          {result.priority === "P2"
            ? `⚙️ ${autoAction}`
            : "📝 Logged and monitoring"}
        </div>
      )}
    </div>
  );
}
