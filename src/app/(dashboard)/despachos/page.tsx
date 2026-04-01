"use client";
import { Download } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Btn, Badge, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function DespachosPage() {
  const dispatches = useStore((s) => s.dispatches);
  const { toast } = useToast();

  function exportExcel() {
    import("xlsx").then(({ utils, writeFile }) => {
      const data = [...dispatches].reverse().map((d) => ({
        Proyecto: d.projectNombre, Material: d.itemNombre, Referencia: d.itemRef,
        Cantidad: d.qty, Unidad: d.unidad, Tipo: d.tipo,
        Responsable: d.responsable, Observaciones: d.obs, Fecha: d.fecha,
      }));
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Despachos");
      writeFile(wb, `TESOCOL_Despachos_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
      toast("Excel exportado", "success");
    });
  }

  return (
    <div className="animate-fadein">
      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
          <span>🚚</span>
          <span className="font-bebas" style={{ fontSize:18, letterSpacing:1.5 }}>Registro de Despachos</span>
          <div style={{ marginLeft:"auto" }}>
            <Btn variant="ghost" size="sm" onClick={exportExcel}><Download size={14}/> Excel</Btn>
          </div>
        </div>
        {dispatches.length === 0 ? (
          <EmptyState icon="🚚" title="Sin despachos registrados" sub="Los despachos aparecen cuando entregas material a un proyecto" />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%" }} className="tbl">
              <thead>
                <tr><th>Proyecto</th><th>Material</th><th>Ref.</th><th>Cantidad</th><th>Responsable</th><th>Fecha</th><th>Tipo</th></tr>
              </thead>
              <tbody>
                {[...dispatches].reverse().map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontSize:13, fontWeight:500 }}>{d.projectNombre}</td>
                    <td style={{ fontSize:13 }}>{d.itemNombre}</td>
                    <td><code style={{ background:"var(--bg3)", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{d.itemRef||"—"}</code></td>
                    <td><strong>{d.qty}</strong> <span style={{ fontSize:11, color:"var(--text2)" }}>{d.unidad}</span></td>
                    <td style={{ color:"var(--text2)", fontSize:12 }}>{d.responsable||"—"}</td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{d.fecha}</td>
                    <td><Badge label={d.tipo==="despacho"?"🚚 Salida":"↩️ Retorno"} variant={d.tipo==="despacho"?"badge-orange":"badge-green"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
