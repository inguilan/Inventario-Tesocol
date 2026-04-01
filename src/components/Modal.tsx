"use client";
import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, icon, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        className="animate-modal"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: wide ? 820 : 580, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
          <h2 className="font-bebas" style={{ fontSize: 22, letterSpacing: 1.5 }}>{title}</h2>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 7, background: "var(--bg3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", transition: "all .15s" }}>
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "22px 24px" }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
