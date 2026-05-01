
import { useState, useEffect } from "react";
 
export function NotificationBanner({ notifState, isSupported, requestPermission }) {
  const [dismissed, setDismissed] = useState(false);
 
  useEffect(() => {
    // Don't show again if user already dismissed it
    const wasDismissed = localStorage.getItem("splurge_notif_dismissed") === "true";
    setDismissed(wasDismissed);
  }, []);
 
  // Hide banner if: already granted, denied, dismissed, or unsupported
  if (!isSupported || notifState === "granted" || notifState === "denied" || dismissed) {
    return null;
  }
 
  const handleEnable = async () => {
    await requestPermission();
  };
 
  const handleDismiss = () => {
    localStorage.setItem("splurge_notif_dismissed", "true");
    setDismissed(true);
  };
 
  return (
    <div style={styles.banner}>
      <div style={styles.left}>
        <span style={styles.icon}>🔔</span>
        <div>
          <div style={styles.title}>Never forget to log your spends</div>
          <div style={styles.subtitle}>Get a daily reminder at 9 PM + budget alerts</div>
        </div>
      </div>
      <div style={styles.actions}>
        <button style={styles.enableBtn} onClick={handleEnable}>
          Enable
        </button>
        <button style={styles.dismissBtn} onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
 
// ─── Inline styles matching Splurge's vibe ────────────────────────────────────
const styles = {
  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    border: "1px solid rgba(99, 102, 241, 0.4)",
    borderRadius: "12px",
    padding: "14px 18px",
    marginBottom: "16px",
    gap: "12px",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  icon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  title: {
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "2px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  enableBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  dismissBtn: {
    background: "transparent",
    color: "#64748b",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    lineHeight: 1,
  },
};