"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; msg: string; type: ToastType; }

interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }
const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);

  const icons = { success: <CheckCircle size={16} color="var(--green)" />, error: <XCircle size={16} color="var(--red)" />, info: <Info size={16} color="var(--orange)" /> };
  const borders = { success: "var(--green)", error: "var(--red)", info: "var(--orange)" };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map((t) => (
          <div key={t.id} className="animate-slide" style={{ background: "var(--bg2)", border: `1px solid var(--border)`, borderLeft: `3px solid ${borders[t.type]}`, borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 260 }}>
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: 2 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
