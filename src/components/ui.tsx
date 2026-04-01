"use client";
import { ReactNode, CSSProperties } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "orange" | "outline" | "ghost" | "danger" | "success";

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: BtnVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
}

const variantStyles: Record<BtnVariant, CSSProperties> = {
  orange:  { background: "var(--orange)", color: "white", border: "none", boxShadow: "0 2px 12px rgba(245,98,15,0.3)" },
  outline: { background: "transparent", color: "var(--text2)", border: "1px solid var(--border)" },
  ghost:   { background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" },
  danger:  { background: "rgba(239,68,68,0.1)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)" },
  success: { background: "rgba(34,197,94,0.1)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)" },
};

export function Btn({ children, onClick, type = "button", variant = "ghost", size = "md", disabled, style, title }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: size === "sm" ? "6px 12px" : "9px 18px",
        borderRadius: 8, fontSize: size === "sm" ? 12 : 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
        opacity: disabled ? 0.5 : 1,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── FormGroup ────────────────────────────────────────────────────────────────
interface FGProps {
  label: string;
  children: ReactNode;
  full?: boolean;
}
export function FormGroup({ label, children, full }: FGProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1/-1" : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text2)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Field styles (use on inputs/selects/textareas) ───────────────────────────
export const fieldStyle: CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text)", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
  padding: "10px 14px", width: "100%", transition: "all .2s",
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, variant }: { label: string; variant: string }) {
  return <span className={`badge ${variant}`}>{label}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  accent?: string; // CSS color
}
export function StatCard({ label, value, sub, icon, accent = "var(--orange)" }: StatCardProps) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden", transition: "transform .2s" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "none")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text2)", marginBottom: 10 }}>{label}</div>
      <div className="font-bebas" style={{ fontSize: 42, letterSpacing: 1, lineHeight: 1, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>{sub}</div>}
      <div style={{ position: "absolute", right: 18, top: 16, fontSize: 28, opacity: 0.12 }}>{icon}</div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text2)" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.35 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>{title}</h3>
      {sub && <p style={{ fontSize: 13 }}>{sub}</p>}
    </div>
  );
}
