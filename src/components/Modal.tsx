"use client";
import { useEffect, ReactNode, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", zIndex: 1000, overflowY: "auto", padding: 20 }}
    >
      <div style={{ minHeight: "calc(100vh - 40px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="animate-modal"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: wide ? 820 : 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}
        >
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
            <h2 className="font-bebas" style={{ fontSize: 22, letterSpacing: 1.5 }}>{title}</h2>
            <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 7, background: "var(--bg3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", transition: "all .15s" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: "22px 24px" }}>{children}</div>
          {footer && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
