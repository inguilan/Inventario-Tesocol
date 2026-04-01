"use client";
import { useStore, getStockStatus } from "@/store/useStore";
import { StatCard, Badge } from "@/components/ui";

export default function DashboardPage() {
  const inventory  = useStore((s) => s.inventory);
  const projects   = useStore((s) => s.projects);
  const movements  = useStore((s) => s.movements);

  const total   = inventory.length;
  const ok      = inventory.filter((i) => getStockStatus(i).key === "normal").length;
  const low     = inventory.filter((i) => getStockStatus(i).key !== "normal").length;
  const active  = projects.filter((p) => p.status === "activo").length;
  const critical = inventory.filter((i) => getStockStatus(i).key !== "normal");
  const recent   = [...movements].reverse().slice(0, 6);

  return (
    <div className="animate-fadein">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Materiales"  value={total}  sub="Referencias en bodega"      icon="📦" accent="var(--orange)" />
        <StatCard label="Stock Normal"      value={ok}     sub="Con stock suficiente"        icon="✅" accent="var(--green)"  />
        <StatCard label="Stock Crítico"     value={low}    sub="Requieren reposición"        icon="⚠️" accent="var(--yellow)" />
        <StatCard label="Proyectos Activos" value={active} sub="Obras en curso"              icon="📁" accent="var(--blue)"  />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent movements */}
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚡</span>
            <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Últimos Movimientos</span>
          </div>
          <table style={{ width: "100%" }} className="tbl">
            <thead><tr><th>Material</th><th>Tipo</th><th>Cant.</th><th>Fecha</th></tr></thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>Sin movimientos</td></tr>
              ) : recent.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13 }}>{m.item}</td>
                  <td><Badge label={m.tipo} variant={m.tipo === "Entrada" ? "badge-green" : m.tipo === "Despacho" ? "badge-orange" : "badge-blue"} /></td>
                  <td style={{ fontWeight: 600 }}>{m.qty}</td>
                  <td style={{ color: "var(--text3)", fontSize: 12 }}>{m.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Critical stock */}
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔴</span>
            <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Stock Crítico</span>
          </div>
          <table style={{ width: "100%" }} className="tbl">
            <thead><tr><th>Material</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr></thead>
            <tbody>
              {critical.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>Sin alertas ✅</td></tr>
              ) : critical.map((item) => {
                const s = getStockStatus(item);
                return (
                  <tr key={item.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{item.nombre}</td>
                    <td style={{ fontWeight: 700 }}>{item.stock}</td>
                    <td style={{ color: "var(--text2)" }}>{item.stockMin}</td>
                    <td><Badge label={s.label} variant={s.badge} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
