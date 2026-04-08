"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FolderOpen, Truck, FileText, Download, Sun } from "lucide-react";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",       icon: LayoutDashboard, section: "Principal" },
  { href: "/inventario",  label: "Inventario",       icon: Package },
  { href: "/proyectos",   label: "Proyectos / Obras",icon: FolderOpen },
  { href: "/despachos",   label: "Despachos",        icon: Truck },
  { href: "/reportes",    label: "Reportes PDF",     icon: FileText,  section: "Reportes" },
  { href: "/exportar",    label: "Exportar Excel",   icon: Download },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const path = usePathname();

  return (
    <aside
      className={`sidebar-desktop ${isOpen ? "sidebar-open" : ""}`}
      style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 240,
        background: "var(--bg2)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", zIndex: 100,
        transition: "transform 0.25s ease",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,var(--orange-dark),var(--orange))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(245,98,15,0.35)" }}>
          <Sun size={20} color="white" strokeWidth={2} />
        </div>
        <div>
          <div className="font-bebas" style={{ fontSize: 22, letterSpacing: 3, color: "var(--orange)", lineHeight: 1 }}>TESOCOL</div>
          <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1.5 }}>Inventarios</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {item.section && (
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "var(--text3)", padding: "14px 10px 6px", fontWeight: 600 }}>
                  {item.section}
                </div>
              )}
              <Link href={item.href} style={{ textDecoration: "none" }} onClick={onClose}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, cursor: "pointer", marginBottom: 2, transition: "all .15s",
                  background: active ? "var(--orange-glow)" : "transparent",
                  color: active ? "var(--orange)" : "var(--text2)",
                  border: `1px solid ${active ? "rgba(245,98,15,0.25)" : "transparent"}`,
                  fontWeight: 500, fontSize: 14,
                }}>
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 10px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "var(--bg3)" }}>
          <div style={{ width: 32, height: 32, background: "var(--orange)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>TC</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Admin Tesocol</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Bodega Principal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
